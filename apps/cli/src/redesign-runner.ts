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
 * ./site/, and the runner uploads the pages to the Worker.
 */
import { spawn } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { BRIEF, RUNNER_PROMPT, briefContent, dnaFromKey, type Lead, type SiteSnapshot } from "@rr/core";

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
  job: { id: number; leadId: string; style: string | null } | null;
  lead?: Lead;
  site?: SiteSnapshot;
  avoid?: string[];
}

function runClaude(cwd: string, timeoutMin: number): Promise<string> {
  const cliArgs = [
    "-p", RUNNER_PROMPT,
    "--output-format", "json",
    "--permission-mode", "acceptEdits",
    "--disallowedTools", "Bash,WebFetch,WebSearch",
    ...(args.model ? ["--model", args.model] : []),
    "--allowedTools", "Read,Write,Edit",
  ];
  return new Promise((resolve, reject) => {
    const child = spawn("claude", cliArgs, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    const timer = setTimeout(() => child.kill("SIGTERM"), timeoutMin * 60_000);
    child.on("error", (e) => reject(new Error(`Could not start Claude Code (is it installed and signed in?): ${e.message}`)));
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(out);
      else reject(new Error(`Claude Code exited with ${code}: ${(err || out).slice(-800)}`));
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

async function processJob({ job, lead, site, avoid = [] }: NextJob) {
  if (!job || !lead || !site) return;
  const started = Date.now();
  const dna = job.style ? dnaFromKey(job.style) ?? undefined : undefined;
  console.log(`\n▶ Job ${job.id}: ${lead.name} (${site.pages.length} pages)${dna ? `, ${dna.concept.name} / ${dna.palette.id} / ${dna.fonts.id}` : ""}`);
  const dir = await mkdtemp(join(tmpdir(), `rr-${job.id}-`));
  try {
    await writeFile(join(dir, "BRIEF.md"), BRIEF);
    await writeFile(join(dir, "content.json"), JSON.stringify(briefContent(lead, site, dna, avoid), null, 2));
    const result = await runClaude(dir, Number(args.timeout));
    let summary = result.slice(-300);
    try {
      summary = JSON.parse(result).result;
    } catch {
      /* plain output */
    }
    const pages = await collectPages(dir, new Set(site.pages.map((p) => p.slug)));
    if (!pages.some((p) => p.slug === "home")) throw new Error(`No site/index.html was written. Claude said: ${summary}`);
    const r = await call<{ pages: number }>(`/api/redesign-jobs/${job.id}/complete`, { pages });
    console.log(`  ✓ uploaded ${r.pages} pages in ${Math.round((Date.now() - started) / 1000)}s → ${base}/preview/${encodeURIComponent(job.leadId)}/`);
  } catch (e) {
    const msg = (e as Error).message;
    console.error(`  ✗ ${msg}`);
    await call(`/api/redesign-jobs/${job.id}/fail`, { error: msg }).catch(() => {});
  } finally {
    if (args.keep) console.log(`  files kept in ${dir}`);
    else await rm(dir, { recursive: true, force: true });
  }
}

console.log(`Redesign runner connected to ${base}. Waiting for jobs…`);
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
