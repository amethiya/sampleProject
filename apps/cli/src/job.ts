/**
 * Redesign jobs for Claude cloud sessions (or any Claude Code session): the session itself does the design work.
 *
 *   npm run job -- fetch --url example.com --category restaurant [--city Vienna]   add a website and claim its job
 *   npm run job -- fetch --lead example.com                                          claim the job for a known lead
 *        [--notes "what to change"] [--revise] [--theme midnight-navy]           (with --lead or --url)
 *   npm run job -- fetch                                                             claim the oldest queued job
 *   npm run job -- upload jobs/<id>                                                  upload jobs/<id>/site/*.html
 *   npm run job -- fail jobs/<id> --reason "..."                                     give the job back as failed
 *
 * Needs RR_URL and RR_TOKEN (the limited RUNNER_TOKEN is enough). Job folders live in ./jobs (git-ignored).
 */
import { cp, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { writeUiux } from "./uiux";
import { SKILL_DIR, briefContent, jobBrief, dnaFromKey, writeStarter, type Lead, type SiteSnapshot } from "@rr/core";

const { values: args, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    url: { type: "string" },
    category: { type: "string", default: "restaurant" },
    city: { type: "string" },
    lead: { type: "string" },
    reason: { type: "string", default: "Abandoned" },
    notes: { type: "string" },
    revise: { type: "boolean", default: false },
    theme: { type: "string" },
  },
});

const base = process.env.RR_URL?.replace(/\/$/, "");
const token = process.env.RR_TOKEN;
if (!base || !token) {
  console.error("Set RR_URL (the Worker URL) and RR_TOKEN (RUNNER_TOKEN or ADMIN_TOKEN).");
  process.exit(1);
}
const root = resolve(process.env.INIT_CWD ?? process.cwd(), "jobs");

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

async function fetchJob() {
  let leadId = args.lead;
  if (args.url) {
    const added = await call<{ id: string; name: string }>("/api/leads/add", { url: args.url, category: args.category, city: args.city });
    console.log(`Added ${added.name} (${added.id}).`);
    leadId = added.id;
  }
  if (leadId) {
    // Queue a job (ignored when one is already queued, e.g. from the admin portal with its own notes).
    await call(`/api/leads/${encodeURIComponent(leadId)}/redesign`, { notes: args.notes, mode: args.revise ? "revise" : "fresh", theme: args.theme })
      .catch((e: Error) => { if (!/ 409 /.test(e.message)) throw e; });
  }
  const next = await call<NextJob>("/api/redesign-jobs/next", leadId ? { leadId } : {});
  if (!next.job || !next.lead || !next.site) {
    console.log(leadId ? `No queued job for ${leadId} (it may already be running or done).` : "No queued redesign jobs.");
    return;
  }
  const dir = join(root, String(next.job.id));
  await mkdir(join(dir, "site"), { recursive: true });
  const dna = next.job.style ? dnaFromKey(next.job.style) ?? undefined : undefined;
  await cp(resolve(process.env.INIT_CWD ?? process.cwd(), SKILL_DIR), join(dir, "skill"), { recursive: true });
  const previous = await writePrevious(dir, next.previous ?? []);
  await writeFile(join(dir, "BRIEF.md"), jobBrief(next.job, previous));
  const content = briefContent(next.lead, next.site, dna, next.avoid ?? []);
  await writeFile(join(dir, "content.json"), JSON.stringify(content, null, 2));
  // UI UX Pro Max guidance for this trade (uiux.md); skipped when python3 is missing.
  if (!(await writeUiux(resolve(process.env.INIT_CWD ?? process.cwd()), dir, content.designDirection.trade.label, writeFile))) console.log("UI UX Pro Max guidance skipped (needs python3).");
  // The design-system version of every page: Claude starts from it and makes it better.
  await mkdir(join(dir, "starter"), { recursive: true });
  for (const f of writeStarter(next.lead, next.site, dna)) await writeFile(join(dir, "starter", f.file), f.html);
  if (next.job.notes) console.log(`Owner's notes: ${next.job.notes}`);
  await writeFile(join(dir, "job.json"), JSON.stringify({ id: next.job.id, leadId: next.job.leadId, preview: `${base}/preview/${encodeURIComponent(next.job.leadId)}/` }, null, 2));
  console.log(`Job ${next.job.id}: ${next.lead.name}, ${next.site.pages.length} pages${dna ? `, ${dna.look.name} theme` : ""}.`);
  console.log(`Next: use the website-redesign skill (${dir}/skill/SKILL.md), read BRIEF.md, content.json, uiux.md and the pages in starter/, write the pages into ${dir}/site/, then run`);
  console.log(`  npm run job -- upload jobs/${next.job.id}`);
}

/** A revision starts from the previous Claude pages: write them to ./previous/. */
async function writePrevious(dir: string, pages: { slug: string; html: string }[]): Promise<string[]> {
  if (!pages.length) return [];
  await mkdir(join(dir, "previous"), { recursive: true });
  const files = pages.map((p) => (p.slug === "home" ? "index.html" : `${p.slug}.html`));
  await Promise.all(pages.map((p, i) => writeFile(join(dir, "previous", files[i]), p.html)));
  return files;
}

async function jobInfo(dirArg: string | undefined) {
  if (!dirArg) throw new Error("Pass the job folder, e.g. jobs/12");
  const dir = resolve(process.env.INIT_CWD ?? process.cwd(), dirArg);
  return { dir, job: JSON.parse(await readFile(join(dir, "job.json"), "utf8")) as { id: number; leadId: string; preview: string } };
}

async function upload(dirArg: string | undefined) {
  const { dir, job } = await jobInfo(dirArg);
  const files = (await readdir(join(dir, "site"))).filter((f) => f.endsWith(".html"));
  const pages = await Promise.all(files.map(async (f) => ({ slug: f === "index.html" ? "home" : f.replace(/\.html$/, ""), html: await readFile(join(dir, "site", f), "utf8") })));
  if (!pages.some((p) => p.slug === "home")) throw new Error("site/index.html is missing.");
  const r = await call<{ pages: number }>(`/api/redesign-jobs/${job.id}/complete`, { pages });
  console.log(`Uploaded ${r.pages} pages. Live at ${job.preview}`);
}

async function fail(dirArg: string | undefined) {
  const { job } = await jobInfo(dirArg);
  await call(`/api/redesign-jobs/${job.id}/fail`, { error: args.reason });
  console.log(`Job ${job.id} marked as failed.`);
}

const [cmd, target] = positionals;
try {
  if (cmd === "fetch") await fetchJob();
  else if (cmd === "upload") await upload(target);
  else if (cmd === "fail") await fail(target);
  else console.log("Usage: npm run job -- fetch [--url <site> --category <cat>] [--lead <id>] | upload jobs/<id> | fail jobs/<id>");
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}
