/**
 * Redesign jobs for Claude cloud sessions (or any Claude Code session): the session itself does the design work.
 *
 *   npm run job -- fetch --url example.com --category restaurant [--city Vienna]   add a website and claim its job
 *   npm run job -- fetch --lead example.com                                          claim the job for a known lead
 *        [--notes "what to change"] [--revise] [--theme midnight-navy] [--direction editorial-magazine]
 *   npm run job -- fetch                                                             claim the oldest queued job
 *   npm run job -- qa jobs/<id>                                                      browser QA → jobs/<id>/qa/report.md
 *   npm run job -- upload jobs/<id>                                                  QA (when possible) + upload site/*.html
 *   npm run job -- fail jobs/<id> --reason "..."                                     give the job back as failed
 *
 * `fetch` inspects the original site in a browser (research/) when Chrome is available. `upload` runs the browser
 * QA and sends the scorecard: a pass is published as done, anything else (or no QA) as "needs review".
 * Needs RR_URL and RR_TOKEN (the limited RUNNER_TOKEN is enough). Job folders live in ./jobs (git-ignored).
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import type { Scorecard } from "@rr/core";
import { closeBrowser } from "./browser";
import { prepareJob, type NextJob } from "./prepare";
import { readReview, runQa } from "./qa";

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
    direction: { type: "string" },
    "no-research": { type: "boolean", default: false },
    "no-qa": { type: "boolean", default: false },
  },
});

const base = process.env.RR_URL?.replace(/\/$/, "");
const token = process.env.RR_TOKEN;
const cwd = resolve(process.env.INIT_CWD ?? process.cwd());
const root = join(cwd, "jobs");

async function call<T>(path: string, body?: unknown): Promise<T> {
  if (!base || !token) throw new Error("Set RR_URL (the Worker URL) and RR_TOKEN (RUNNER_TOKEN or ADMIN_TOKEN).");
  const res = await fetch(base + path, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) throw new Error(`${path} → ${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
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
    await call(`/api/leads/${encodeURIComponent(leadId)}/redesign`, { notes: args.notes, mode: args.revise ? "revise" : "fresh", theme: args.theme, direction: args.direction })
      .catch((e: Error) => { if (!/ 409 /.test(e.message)) throw e; });
  }
  const next = await call<NextJob>("/api/redesign-jobs/next", { ...(leadId ? { leadId } : {}), runner: "cloud-session" });
  if (!next.job || !next.lead || !next.site) {
    console.log(leadId ? `No queued job for ${leadId} (it may already be running or done).` : "No queued redesign jobs.");
    return;
  }
  const dir = join(root, String(next.job.id));
  const progress = (stage: string, message: string, level = "info") => call(`/api/redesign-jobs/${next.job!.id}/progress`, { stage, message, level }).catch(() => {});
  await progress("researching", "Preparing the job folder in a Claude Code session.");
  const prep = await prepareJob(cwd, dir, { ...next, job: next.job, lead: next.lead, site: next.site }, { research: !args["no-research"], log: (m) => console.log(`  ${m}`) });
  if (prep.research && !prep.research.ok) await progress("researching", `Could not inspect the site in a browser (${prep.research.reason}).`, "warn");
  const c = prep.content.designDirection.creative;
  await progress("designing", `Direction: ${c.name}. Palette ${c.palette.name}; type ${c.typography.display} + ${c.typography.body}.`);
  if (next.job.notes) console.log(`Owner's notes: ${next.job.notes}`);
  await writeFile(join(dir, "job.json"), JSON.stringify({ id: next.job.id, leadId: next.job.leadId, preview: `${base}/preview/${encodeURIComponent(next.job.leadId)}/` }, null, 2));
  console.log(`Job ${next.job.id}: ${next.lead.name}, ${next.site.pages.length} pages. Creative direction: ${c.name}.`);
  console.log(`Research: ${prep.research ? (prep.research.ok ? "screenshots and brand in research/" : `not available (${prep.research.reason})`) : "skipped"}.`);
  console.log(`Next: use the website-redesign skill (${dir}/skill/SKILL.md), read BRIEF.md, content.json, research/, uiux.md and starter/, write the pages into ${dir}/site/, then run`);
  console.log(`  npm run job -- qa jobs/${next.job.id}       (look at qa/report.md and the screenshots, fix, write qa/review.json)`);
  console.log(`  npm run job -- upload jobs/${next.job.id}`);
}

async function jobInfo(dirArg: string | undefined) {
  if (!dirArg) throw new Error("Pass the job folder, e.g. jobs/12");
  const dir = resolve(cwd, dirArg);
  return { dir, job: JSON.parse(await readFile(join(dir, "job.json"), "utf8")) as { id: number; leadId: string; preview: string } };
}

async function qa(dirArg: string | undefined): Promise<Scorecard> {
  const { dir } = await jobInfo(dirArg);
  const r = await runQa(dir, await readReview(dir), (m) => console.log(`  ${m}`));
  console.log(`QA ${r.scorecard.pass ? "PASSED" : "not passed"}: ${r.scorecard.overall}/10. Report: ${join(dir, "qa/report.md")}`);
  for (const c of r.scorecard.critical) console.log(`  critical: ${c}`);
  for (const w of r.scorecard.warnings) console.log(`  warning: ${w}`);
  return r.scorecard;
}

async function upload(dirArg: string | undefined) {
  const { dir, job } = await jobInfo(dirArg);
  const files = (await readdir(join(dir, "site"))).filter((f) => f.endsWith(".html"));
  const pages = await Promise.all(files.map(async (f) => ({ slug: f === "index.html" ? "home" : f.replace(/\.html$/, ""), html: await readFile(join(dir, "site", f), "utf8") })));
  if (!pages.some((p) => p.slug === "home")) throw new Error("site/index.html is missing.");
  let scorecard: Scorecard | null = null;
  if (!args["no-qa"]) {
    try {
      scorecard = await qa(dirArg);
    } catch (e) {
      console.log(`Browser QA could not run here (${(e as Error).message.split("\n")[0]}); the redesign will need review in the portal.`);
    }
  }
  const r = await call<{ pages: number; status: string }>(`/api/redesign-jobs/${job.id}/complete`, { pages, qa: scorecard, qaScore: scorecard?.overall, pass: scorecard?.pass ?? false });
  console.log(`Uploaded ${r.pages} pages (${r.status === "done" ? "passed QA" : "needs review"}). Live at ${job.preview}`);
}

async function fail(dirArg: string | undefined) {
  const { job } = await jobInfo(dirArg);
  await call(`/api/redesign-jobs/${job.id}/fail`, { error: args.reason, kind: /unreachable|could not (be )?(reach|load)/i.test(args.reason ?? "") ? "unreachable" : "technical" });
  console.log(`Job ${job.id} marked as failed.`);
}

const [cmd, target] = positionals;
try {
  if (cmd === "fetch") await fetchJob();
  else if (cmd === "qa") await qa(target);
  else if (cmd === "upload") await upload(target);
  else if (cmd === "fail") await fail(target);
  else console.log("Usage: npm run job -- fetch [--url <site> --category <cat>] [--lead <id>] [--direction <id>] | qa jobs/<id> | upload jobs/<id> | fail jobs/<id>");
} catch (e) {
  console.error((e as Error).message);
  process.exitCode = 1;
} finally {
  await closeBrowser();
}
