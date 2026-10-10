/**
 * Runs "Redesign with Claude" jobs on this machine using Claude Code (your Claude subscription), as a staged pipeline:
 *
 *   A/B research   inspect the original site in a real browser (screenshots, measured brand, UX audit)
 *   C/D design     the job's creative direction, palette from the brand, written into content.json
 *   E   build      Claude Code writes every page into ./site/
 *   F/G qa         render every page at desktop, tablet and phone; measure; score (apps/cli/src/qa.ts)
 *   H   refine     Claude reviews the screenshots + QA report, fixes what it finds and scores the design
 *   I   validate   QA again; a pass is published as done, anything else goes to the owner as "needs review"
 *
 *   RR_URL=https://revamp-radar.<you>.workers.dev RR_TOKEN=<RUNNER_TOKEN or ADMIN_TOKEN> npm run redesign-runner
 *   ... -- --concurrency 2  jobs in parallel (default 1; each runs its own Claude Code; one shared browser)
 *   ... -- --passes 2       review/refine passes per job (default 2; the second only runs if the first didn't pass)
 *   ... -- --budget 6       stop refining once a job's reported Claude cost reaches this many USD (default 6)
 *   ... -- --once           process one job per worker (if any) and exit
 *   ... -- --interval 30    seconds between checks for new jobs (default 20)
 *   ... -- --timeout 30     minutes per Claude run before it is stopped (default 30)
 *   ... -- --no-research / --no-qa   skip the browser stages (the job then always needs review)
 *   ... -- --keep           keep the working folder for inspection
 *
 * Claude Code runs headless in a fresh temp folder with only Read/Write/Edit/Skill allowed (no shell, no web). Every
 * stage reports progress to the Worker, which doubles as a heartbeat: a runner that disappears has its job handed
 * back automatically. Ctrl+C stops Claude and hands the job back for a retry.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { hostname, tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { DIRECTIONS, REVIEW_PROMPT, RUNNER_PROMPT, type Scorecard } from "@rr/core";
import { closeBrowser } from "./browser";
import { prepareJob, type NextJob } from "./prepare";
import { readReview, runQa } from "./qa";

const repoRoot = resolve(fileURLToPath(import.meta.url), "../../../..");

const { values: args } = parseArgs({
  options: {
    once: { type: "boolean", default: false },
    interval: { type: "string", default: "20" },
    timeout: { type: "string", default: "30" },
    concurrency: { type: "string", default: "1" },
    passes: { type: "string", default: "2" },
    budget: { type: "string", default: "6" },
    model: { type: "string" },
    keep: { type: "boolean", default: false },
    "no-research": { type: "boolean", default: false },
    "no-qa": { type: "boolean", default: false },
  },
});

const base = process.env.RR_URL?.replace(/\/$/, "");
const token = process.env.RR_TOKEN;
if (!base || !token) {
  console.error("Set RR_URL (your Worker URL) and RR_TOKEN (the RUNNER_TOKEN or ADMIN_TOKEN secret).");
  process.exit(1);
}
const concurrency = Math.max(1, Math.min(4, Number(args.concurrency) || 1));
const passes = Math.max(0, Math.min(4, Number(args.passes) || 0));
const budget = Number(args.budget) || 0;

async function call<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(base + path, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) throw new Error(`${path} → ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

class Stopped extends Error {}
class Unreachable extends Error {}

interface Active { jobId: number; child: ChildProcess | null; stopped: boolean }
const active = new Set<Active>();

interface ClaudeRun { result: string; sessionId: string | null; costUsd: number; isError: boolean }

/** Claude Code headless; streams tool use so progress can be reported. Resolves with the final message and cost. */
function runClaude(cwd: string, prompt: string, a: Active, opts: { resume?: string | null; say(msg: string): void; onWrite(file: string, first: boolean): void }): Promise<ClaudeRun> {
  const cliArgs = [
    "-p", prompt,
    "--output-format", "stream-json", "--verbose",
    "--permission-mode", "acceptEdits",
    "--disallowedTools", "Bash,WebFetch,WebSearch",
    "--allowedTools", "Read,Write,Edit,Skill",
    ...(opts.resume ? ["--resume", opts.resume] : []),
    ...(args.model ? ["--model", args.model] : []),
  ];
  return new Promise((resolvePromise, reject) => {
    const child = spawn("claude", cliArgs, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    a.child = child;
    const written = new Set<string>();
    const seen = new Set<string>();
    let buf = "", err = "";
    const out: ClaudeRun = { result: "", sessionId: null, costUsd: 0, isError: false };
    // Paths relative to the job folder (macOS may report /private/var/... for /var/...).
    const tag = `/${basename(cwd)}/`;
    const rel = (f: string) => (f.includes(tag) ? f.slice(f.indexOf(tag) + tag.length) : f);
    type Ev = { type?: string; result?: string; session_id?: string; total_cost_usd?: number; is_error?: boolean; message?: { content?: { type: string; name?: string; input?: { file_path?: string; skill?: string } }[] } };
    const onEvent = (ev: Ev) => {
      if (ev.session_id) out.sessionId = ev.session_id;
      if (ev.type === "result") {
        out.result = ev.result ?? "";
        out.costUsd = ev.total_cost_usd ?? 0;
        out.isError = !!ev.is_error;
      }
      if (ev.type !== "assistant") return;
      for (const c of ev.message?.content ?? []) {
        if (c.type !== "tool_use") continue;
        const file = c.input?.file_path ? rel(c.input.file_path) : "";
        if (c.name === "Skill") opts.say(`using the ${c.input?.skill ?? "website-redesign"} skill`);
        else if ((c.name === "Write" || c.name === "Edit") && file.startsWith("site/")) {
          const first = !written.has(file);
          written.add(file);
          opts.onWrite(file, first);
        } else if (c.name === "Read" && file && !seen.has(file)) {
          seen.add(file);
          if (/^(BRIEF\.md|content\.json|uiux\.md|skill\/SKILL\.md|research\/|qa\/report\.md|previous\/)/.test(file)) opts.say(`reading ${file}`);
        }
      }
    };
    child.stdout.on("data", (d) => {
      buf += d;
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (line) try { onEvent(JSON.parse(line)); } catch { /* not JSON */ }
      }
    });
    child.stderr.on("data", (d) => (err += d));
    const timer = setTimeout(() => child.kill("SIGTERM"), Number(args.timeout) * 60_000);
    child.on("error", (e) => reject(new Error(`Could not start Claude Code (is it installed and signed in?): ${e.message}`)));
    child.on("close", (code) => {
      clearTimeout(timer);
      a.child = null;
      if (a.stopped) reject(new Stopped("stopped"));
      else if (code === 0) resolvePromise(out);
      else reject(new Error(`Claude Code exited with ${code}: ${(err || out.result).slice(-800)}`));
    });
  });
}

async function collectPages(dir: string, allowed: Set<string>) {
  const files = (await readdir(join(dir, "site")).catch(() => [] as string[])).filter((f) => f.endsWith(".html"));
  const pages: { slug: string; html: string }[] = [];
  for (const f of files) {
    const slug = f === "index.html" ? "home" : f.replace(/\.html$/, "");
    if (allowed.has(slug)) pages.push({ slug, html: await readFile(join(dir, "site", f), "utf8") });
  }
  return pages;
}

async function processJob(next: NextJob, worker: string) {
  const { job, lead, site } = next;
  if (!job || !lead || !site) return;
  const a: Active = { jobId: job.id, child: null, stopped: false };
  active.add(a);
  const started = Date.now();
  const mins = () => Math.round((Date.now() - started) / 60_000);
  const log = (msg: string) => console.log(`  [${worker} #${job.id}] ${String(mins()).padStart(2)}m  ${msg}`);
  // Progress doubles as the heartbeat; the Worker answers "stop" when the job was cancelled or reclaimed.
  const report = async (stage: string | null, message: string, level: "info" | "warn" = "info") => {
    log(message);
    const r = await call<{ stop?: boolean }>(`/api/redesign-jobs/${job.id}/progress`, { stage, message, level }).catch(() => ({ stop: false }));
    if (r.stop) {
      a.stopped = true;
      a.child?.kill("SIGTERM");
      throw new Stopped("The job was cancelled or handed to another runner.");
    }
  };
  let beatStage: string | null = "researching";
  const beat = setInterval(() => {
    call<{ stop?: boolean }>(`/api/redesign-jobs/${job.id}/progress`, { stage: beatStage }).then((r) => {
      if (r.stop) { a.stopped = true; a.child?.kill("SIGTERM"); }
    }).catch(() => {});
  }, 60_000);

  console.log(`\n▶ Job ${job.id} (attempt ${job.attempts ?? 1}/${job.maxAttempts ?? 3}): ${lead.name}, ${site.pages.length} pages, ${lead.website}`);
  const dir = await mkdtemp(join(tmpdir(), `rr-${job.id}-`));
  let cost = 0;
  try {
    await report("researching", `Researching ${lead.website}${args["no-research"] ? " (browser research off)" : " in a real browser"}…`);
    const prep = await prepareJob(repoRoot, dir, { ...next, job, lead, site }, { research: !args["no-research"], log });
    const r = prep.research;
    const hasContent = site.pages.some((p) => p.sections.some((s) => s.paragraphs.length || s.items.length));
    if (r && !r.ok) {
      if (!hasContent) throw new Unreachable(`The website could not be loaded (${r.reason}) and the crawl found no content.`);
      await report("researching", `Could not inspect the site in a browser (${r.reason}); designing from the crawled content only.`, "warn");
    } else if (r) {
      await report("researching", `Inspected the original site at desktop and phone width; brand colours ${r.brand?.colors.slice(0, 3).join(", ") || "not found"}, fonts ${r.brand?.fonts.slice(0, 2).join(", ") || "unknown"}; ${r.findings.length} measured problems.`);
    }

    const c = prep.content.designDirection.creative;
    beatStage = "designing";
    await report("designing", `Direction: ${c.name}. Palette ${c.palette.name}; type ${c.typography.display} + ${c.typography.body}; 3D ${c.threeD}. Claude is designing ${prep.pageFiles.length} pages.`);
    const say = (msg: string) => log(msg);
    let building = false;
    const onWrite = (file: string, first: boolean) => {
      if (!building) {
        building = true;
        beatStage = "building";
        report("building", `Building: wrote ${file}`).catch(() => {});
      } else log(`${first ? "wrote" : "edited"} ${file}`);
    };
    const build = await runClaude(dir, RUNNER_PROMPT, a, { say, onWrite });
    cost += build.costUsd;
    let session = build.sessionId;
    const allowed = new Set(site.pages.map((p) => p.slug));
    if (!(await collectPages(dir, allowed)).some((p) => p.slug === "home")) throw new Error(`No site/index.html was written. Claude said: ${build.result.slice(-300)}`);

    let scorecard: Scorecard | null = null;
    if (!args["no-qa"]) {
      try {
        beatStage = "qa";
        await report("qa", "Rendering every page at desktop, tablet and phone width…");
        let qa = await runQa(dir, null, log);
        await report("qa", qaLine(qa.scorecard));
        for (let pass = 1; pass <= passes; pass++) {
          if (pass > 1 && qa.scorecard.pass) break;
          if (budget && cost >= budget) {
            await report("refining", `Stopped refining: reported Claude cost $${cost.toFixed(2)} reached the $${budget} budget.`, "warn");
            break;
          }
          beatStage = "refining";
          await report("refining", `Design review and refinement pass ${pass}: ${qa.scorecard.critical.length} critical defects, ${qa.scorecard.warnings.length} warnings to address.`);
          const fix = await runClaude(dir, REVIEW_PROMPT, a, { resume: session, say, onWrite: (f, first) => log(`${first ? "revised" : "edited"} ${f}`) });
          cost += fix.costUsd;
          session = fix.sessionId ?? session;
          const review = await readReview(dir);
          if (!review) await report("refining", "Claude did not write a valid qa/review.json; design quality stays unjudged.", "warn");
          beatStage = "qa";
          qa = await runQa(dir, review, log);
          await report("qa", qaLine(qa.scorecard));
        }
        scorecard = qa.scorecard;
      } catch (e) {
        if (e instanceof Stopped) throw e;
        await report("qa", `Browser QA could not run (${(e as Error).message.split("\n")[0]}); the redesign will need your review.`, "warn");
      }
    }

    beatStage = "uploading";
    await report("uploading", "Uploading pages…");
    const pages = await collectPages(dir, allowed);
    const res = await call<{ pages: number; status: string }>(`/api/redesign-jobs/${job.id}/complete`, {
      pages, qa: scorecard, qaScore: scorecard?.overall, pass: scorecard?.pass ?? false, costUsd: cost,
    });
    console.log(`  ✓ #${job.id} ${res.status === "done" ? "passed QA" : "needs review"}: ${res.pages} pages in ${mins()} min, Claude cost $${cost.toFixed(2)} → ${base}/preview/${encodeURIComponent(job.leadId)}/`);
  } catch (e) {
    if (e instanceof Stopped || a.stopped) {
      console.log(`  ■ #${job.id} stopped: ${(e as Error).message}`);
    } else {
      const msg = (e as Error).message;
      console.error(`  ✗ #${job.id} ${msg}`);
      await call(`/api/redesign-jobs/${job.id}/fail`, { error: msg, kind: e instanceof Unreachable ? "unreachable" : "technical" }).catch(() => {});
    }
  } finally {
    clearInterval(beat);
    active.delete(a);
    if (args.keep) console.log(`  files kept in ${dir}`);
    else await rm(dir, { recursive: true, force: true });
  }
}

function qaLine(s: Scorecard): string {
  const cats = s.categories.filter((c) => c.score !== null && c.id !== "readiness").map((c) => `${c.id} ${c.score}`).join(", ");
  return `QA ${s.pass ? "passed" : "not passed"}: ${s.overall}/10 (${cats})${s.critical.length ? `; critical: ${s.critical.slice(0, 2).join(" ")}` : ""}`;
}

// Ctrl+C: stop Claude and hand every job in progress back for an automatic retry, then exit.
let stopping = false;
const stop = async () => {
  if (stopping) process.exit(1);
  stopping = true;
  console.log(`\nStopping: handing ${active.size} job(s) back for a retry…`);
  await Promise.all([...active].map(async (a) => {
    a.stopped = true;
    a.child?.kill("SIGTERM");
    await call(`/api/redesign-jobs/${a.jobId}/fail`, { error: "The runner was stopped before it finished.", kind: "technical" }).catch(() => {});
  }));
  await closeBrowser();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

async function workerLoop(i: number) {
  const name = `${hostname().split(".")[0]}#${process.pid}/w${i}`;
  for (;;) {
    if (stopping) return;
    try {
      const next = await call<NextJob>("/api/redesign-jobs/next", { runner: name });
      if (next.job) {
        await processJob(next, `w${i}`);
        if (args.once) return;
        continue;
      }
    } catch (e) {
      console.error((e as Error).message);
    }
    if (args.once) return;
    await new Promise((r) => setTimeout(r, Number(args.interval) * 1000 + i * 1500));
  }
}

console.log(`Redesign runner connected to ${base}: ${concurrency} worker(s), ${passes} review pass(es), budget $${budget || "∞"} per job. Waiting for jobs… (Ctrl+C to stop)`);
console.log(`${DIRECTIONS.length} creative directions: ${DIRECTIONS.map((d) => d.name).join(", ")}.`);
await Promise.all(Array.from({ length: concurrency }, (_, i) => workerLoop(i + 1)));
await closeBrowser();
