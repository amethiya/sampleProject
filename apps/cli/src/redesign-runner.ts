/**
 * Runs "Redesign with Claude" jobs on this machine using Claude Code (your Claude subscription).
 *
 *   RR_URL=https://revamp-radar.<you>.workers.dev RR_TOKEN=<ADMIN_TOKEN> npm run redesign-runner
 *   ... -- --once          process one job (if any) and exit
 *   ... -- --interval 30   seconds between checks for new jobs (default 20)
 *   ... -- --timeout 30    minutes before a job is abandoned (default 30)
 *   ... -- --keep          keep the working folder for inspection
 *
 * Claude Code runs headless in a fresh temp folder with only Read/Write/Edit allowed, builds the site into
 * ./site/, and the runner uploads the pages to the Worker. Progress (pages written) prints as it goes;
 * Ctrl+C stops Claude and hands the job back so it can be started again from the portal.
 */
import { spawn } from "node:child_process";
import { cp, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { writeUiux } from "./uiux";
import { RUNNER_PROMPT, SKILL_DIR, briefContent, jobBrief, dnaFromKey, writeStarter, type Lead, type SiteSnapshot } from "@rr/core";

const repoRoot = resolve(fileURLToPath(import.meta.url), "../../../..");
const skillSource = resolve(repoRoot, SKILL_DIR);

const { values: args } = parseArgs({
  options: {
    once: { type: "boolean", default: false },
    interval: { type: "string", default: "20" },
    timeout: { type: "string", default: "30" },
    model: { type: "string" },
    keep: { type: "boolean", default: false },
  },
});

const base = process.env.RR_URL?.replace(/\/$/, "");
const token = process.env.RR_TOKEN;
if (!base || !token) {
  console.error("Set RR_URL (your Worker URL) and RR_TOKEN (the ADMIN_TOKEN secret).");
  process.exit(1);
}

async function call<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(base + path, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) throw new Error(`${path} → ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

interface NextJob {
  job: { id: number; leadId: string; style: string | null; notes?: string | null; mode?: string } | null;
  lead?: Lead;
  site?: SiteSnapshot;
  avoid?: string[];
  previous?: { slug: string; html: string }[];
}

/** The Claude Code process for the job in progress, so Ctrl+C can stop it and hand the job back. */
let current: { jobId: number; child: ReturnType<typeof spawn> | null } | null = null;

/**
 * Runs Claude Code headless and prints what it is doing as it goes (files it reads and writes), plus a heartbeat
 * every minute. Resolves with Claude's final message.
 */
function runClaude(cwd: string, timeoutMin: number, pageFiles: string[]): Promise<string> {
  const cliArgs = [
    "-p", RUNNER_PROMPT,
    "--output-format", "stream-json", "--verbose",
    "--permission-mode", "acceptEdits",
    "--disallowedTools", "Bash,WebFetch,WebSearch",
    ...(args.model ? ["--model", args.model] : []),
    "--allowedTools", "Read,Write,Edit,Skill",
  ];
  return new Promise((resolve, reject) => {
    const child = spawn("claude", cliArgs, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    if (current) current.child = child;
    const started = Date.now();
    const written = new Set<string>();
    const seen = new Set<string>();
    let buf = "";
    let result = "";
    let err = "";
    const mins = () => Math.round((Date.now() - started) / 60_000);
    const say = (msg: string) => console.log(`  ${String(mins()).padStart(2)}m  ${msg}`);
    // Paths relative to the job folder (macOS may report /private/var/... for /var/...).
    const tag = `/${basename(cwd)}/`;
    const rel = (f: string) => (f.includes(tag) ? f.slice(f.indexOf(tag) + tag.length) : f);
    const onEvent = (ev: { type?: string; result?: string; message?: { content?: { type: string; name?: string; input?: { file_path?: string; skill?: string } }[] } }) => {
      if (ev.type === "result") result = ev.result ?? "";
      if (ev.type !== "assistant") return;
      for (const c of ev.message?.content ?? []) {
        if (c.type !== "tool_use") continue;
        const file = c.input?.file_path ? rel(c.input.file_path) : "";
        if (c.name === "Skill") say(`using the ${c.input?.skill ?? "website-redesign"} skill`);
        else if ((c.name === "Write" || c.name === "Edit") && file.startsWith("site/")) {
          const first = !written.has(file);
          written.add(file);
          say(`${first ? "wrote" : "edited"} ${file}  (${written.size}/${pageFiles.length} pages)`);
        } else if (c.name === "Read" && file && !seen.has(file)) {
          seen.add(file);
          if (/^(BRIEF\.md|content\.json|uiux\.md|skill\/SKILL\.md|previous\/)/.test(file)) say(`reading ${file}`);
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
    const beat = setInterval(() => say(`still working… ${written.size}/${pageFiles.length} pages written`), 60_000);
    const timer = setTimeout(() => child.kill("SIGTERM"), timeoutMin * 60_000);
    child.on("error", (e) => reject(new Error(`Could not start Claude Code (is it installed and signed in?): ${e.message}`)));
    child.on("close", (code) => {
      clearTimeout(timer);
      clearInterval(beat);
      if (code === 0) resolve(result);
      else reject(new Error(`Claude Code exited with ${code}: ${(err || result).slice(-800)}`));
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

async function processJob({ job, lead, site, avoid = [], previous = [] }: NextJob) {
  if (!job || !lead || !site) return;
  const started = Date.now();
  const dna = job.style ? dnaFromKey(job.style) ?? undefined : undefined;
  console.log(`\n▶ Job ${job.id}: ${lead.name} (${site.pages.length} pages)${dna ? `, ${dna.look.name} theme, designed as ${dna.trade}` : ""}`);
  const dir = await mkdtemp(join(tmpdir(), `rr-${job.id}-`));
  try {
    // Every redesign uses the website-redesign skill: give it to Claude both as files and as a project skill.
    await cp(skillSource, join(dir, "skill"), { recursive: true });
    await cp(skillSource, join(dir, SKILL_DIR), { recursive: true });
    // A revision starts from the previous Claude pages; the owner's notes go into BRIEF.md.
    const prevFiles = previous.map((p) => (p.slug === "home" ? "index.html" : `${p.slug}.html`));
    if (previous.length) {
      await mkdir(join(dir, "previous"), { recursive: true });
      await Promise.all(previous.map((p, i) => writeFile(join(dir, "previous", prevFiles[i]), p.html)));
    }
    await writeFile(join(dir, "BRIEF.md"), jobBrief(job, prevFiles));
    // The design-system version of every page: Claude starts from it and makes it better.
    await mkdir(join(dir, "starter"), { recursive: true });
    for (const f of writeStarter(lead, site, dna)) await writeFile(join(dir, "starter", f.file), f.html);
    if (job.notes || previous.length) console.log(`  ${previous.length ? "Revising the previous version" : "New design"}${job.notes ? `; notes: ${job.notes.slice(0, 200)}` : ""}`);
    const content = briefContent(lead, site, dna, avoid);
    await writeFile(join(dir, "content.json"), JSON.stringify(content, null, 2));
    // UI UX Pro Max guidance for this trade (uiux.md); Claude has no shell here, so the search runs now.
    if (!(await writeUiux(repoRoot, dir, content.designDirection.trade.label, writeFile))) console.log("  UI UX Pro Max guidance skipped (needs python3).");
    current = { jobId: job.id, child: null };
    const pageFiles = site.pages.map((p) => (p.slug === "home" ? "index.html" : `${p.slug}.html`));
    console.log(`  Claude is designing ${pageFiles.length} pages; progress appears below (usually 10–15 minutes).`);
    const summary = (await runClaude(dir, Number(args.timeout), pageFiles)).slice(-300);
    const pages = await collectPages(dir, new Set(site.pages.map((p) => p.slug)));
    if (!pages.some((p) => p.slug === "home")) throw new Error(`No site/index.html was written. Claude said: ${summary}`);
    const r = await call<{ pages: number }>(`/api/redesign-jobs/${job.id}/complete`, { pages });
    console.log(`  ✓ uploaded ${r.pages} pages in ${Math.round((Date.now() - started) / 1000)}s → ${base}/preview/${encodeURIComponent(job.leadId)}/`);
  } catch (e) {
    const msg = (e as Error).message;
    console.error(`  ✗ ${msg}`);
    await call(`/api/redesign-jobs/${job.id}/fail`, { error: msg }).catch(() => {});
  } finally {
    current = null;
    if (args.keep) console.log(`  files kept in ${dir}`);
    else await rm(dir, { recursive: true, force: true });
  }
}

// Ctrl+C: stop Claude and hand the job back as failed (so it isn't stuck as "running"), then exit.
let stopping = false;
const stop = async () => {
  if (stopping) process.exit(1);
  stopping = true;
  if (current) {
    console.log(`\nStopping: giving job ${current.jobId} back so you can start it again from the portal…`);
    current.child?.kill("SIGTERM");
    await call(`/api/redesign-jobs/${current.jobId}/fail`, { error: "The runner was stopped before it finished. Click Redesign again." }).catch(() => {});
  }
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

console.log(`Redesign runner connected to ${base}. Waiting for jobs… (checks every ${args.interval}s; Ctrl+C to stop)`);
for (;;) {
  try {
    const next = await call<NextJob>("/api/redesign-jobs/next");
    if (next.job) {
      await processJob(next);
      if (args.once) break;
      continue;
    }
  } catch (e) {
    console.error((e as Error).message);
  }
  if (args.once) break;
  await new Promise((r) => setTimeout(r, Number(args.interval) * 1000));
}
