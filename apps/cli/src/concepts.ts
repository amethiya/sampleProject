/**
 * Design concepts: 3-4 home pages for one lead, each in a different creative direction, so the owner can choose a
 * direction before the whole site is built.
 *
 *   RR_URL=... npm run concepts -- --lead unionoysterhouse.com --directions editorial-magazine,craft-heritage,luxe-minimal
 *   npm run concepts -- --lead unionoysterhouse.com --serve        show the concepts at http://localhost:4400/
 *
 * Each concept goes through the same preparation as a job (research once, Inspo references, creative brief, skill)
 * and Claude Code builds only site/index.html, then the browser QA checks it. Output: out/concepts/<lead>/<direction>/.
 * The lead's crawled content is read from D1 with wrangler (this machine's Cloudflare login), so no job is claimed.
 * Then queue the full site with the chosen direction: npm run job -- fetch --lead <id> --direction <id> or the portal;
 * prepare.ts hands the approved concept to Claude as concept/index.html.
 */
import { execFileSync, spawn } from "node:child_process";
import { createServer } from "node:http";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { RUNNER_PROMPT, directionById, type Lead, type SiteSnapshot } from "@rr/core";
import { closeBrowser } from "./browser";
import { prepareJob } from "./prepare";
import { runQa } from "./qa";
import { research } from "./research";

const repoRoot = resolve(fileURLToPath(import.meta.url), "../../../..");
const { values: args } = parseArgs({
  options: {
    lead: { type: "string" },
    directions: { type: "string" },
    concurrency: { type: "string", default: "2" },
    timeout: { type: "string", default: "40" },
    serve: { type: "boolean", default: false },
    port: { type: "string", default: "4400" },
  },
});
if (!args.lead) {
  console.error("Usage: npm run concepts -- --lead <domain> --directions a,b,c [--concurrency 2] | --lead <domain> --serve");
  process.exit(1);
}
const leadId = args.lead.replace(/[^a-z0-9.-]/gi, "");
const outRoot = join(repoRoot, "out", "concepts", leadId);

export const CONCEPT_PROMPT = `${RUNNER_PROMPT} THIS IS A DESIGN CONCEPT: build ONLY ./site/index.html (the home page), complete and at full production quality, with every section of the home page's content, the navigation linking to every page in content.json (using their link values) and the footer. Do not write the other pages. It is one of several concepts the owner will compare, so make this direction unmistakable.`;

/** The lead and its crawled site from D1 (wrangler, run in apps/worker). Images go through the Worker's HTTPS proxy. */
function loadFromD1(): { lead: Lead; site: SiteSnapshot } {
  const out = execFileSync("npx", ["wrangler", "d1", "execute", "revamp-radar", "--remote", "--json", "--command", `SELECT lead, site FROM sites WHERE id = '${leadId}'`], { cwd: join(repoRoot, "apps/worker"), encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const rows = JSON.parse(out.slice(out.indexOf("["), out.lastIndexOf("]") + 1)) as { results: { lead: string; site: string | null }[] }[];
  const row = rows[0]?.results[0];
  if (!row?.site) throw new Error(`No crawled site for ${leadId} (open its Redesign tab once, or re-read the website).`);
  const base = (process.env.RR_URL ?? "https://revamp-radar.amethiyavivek.workers.dev").replace(/\/$/, "");
  const site = JSON.parse(row.site) as SiteSnapshot;
  const proxy = (u: string) => `${base}/img?u=${encodeURIComponent(u)}`;
  return { lead: JSON.parse(row.lead) as Lead, site: { ...site, pages: site.pages.map((p) => ({ ...p, sections: p.sections.map((x) => ({ ...x, images: x.images.map(proxy) })) })) } };
}

function claude(cwd: string): Promise<{ ok: boolean; usage: number; note: string }> {
  return new Promise((done) => {
    const child = spawn("claude", ["-p", CONCEPT_PROMPT, "--output-format", "json", "--permission-mode", "acceptEdits", "--disallowedTools", "Bash,WebFetch,WebSearch", "--allowedTools", "Read,Write,Edit,Skill"], { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let out = "", err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    const timer = setTimeout(() => child.kill("SIGTERM"), Number(args.timeout) * 60_000);
    child.on("close", (code) => {
      clearTimeout(timer);
      try {
        const r = JSON.parse(out.slice(out.indexOf("{"))) as { result?: string; total_cost_usd?: number; is_error?: boolean };
        done({ ok: code === 0 && !r.is_error, usage: r.total_cost_usd ?? 0, note: (r.result ?? "").slice(-300) });
      } catch {
        done({ ok: false, usage: 0, note: (err || out).slice(-300) || `exit ${code}` });
      }
    });
  });
}

async function build() {
  const ids = (args.directions ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const bad = ids.filter((d) => !directionById(d));
  if (!ids.length || bad.length) throw new Error(`Pass --directions with ids from the skill's directions.md${bad.length ? ` (unknown: ${bad.join(", ")})` : ""}.`);
  const { lead, site } = loadFromD1();
  console.log(`${lead.name}: ${site.pages.length} pages. Building ${ids.length} home-page concepts: ${ids.map((d) => directionById(d)!.name).join(", ")}.`);
  await mkdir(outRoot, { recursive: true });
  const shared = join(outRoot, "_research");
  const found = await research(lead.website, shared, (m) => console.log(`  research: ${m}`)).catch(() => null);

  const results: Record<string, unknown>[] = [];
  const queue = [...ids];
  const worker = async () => {
    for (let id = queue.shift(); id; id = queue.shift()) {
      const dir = join(outRoot, id);
      const t0 = Date.now();
      const job = { id: 0, leadId, style: null, mode: "fresh", direction: id, theme: null };
      const prep = await prepareJob(repoRoot, dir, { job, lead, site, avoid: [], recentDirections: [] }, { research: false, reuseResearch: found, log: (m) => console.log(`  [${id}] ${m}`) });
      if (existsSync(join(shared, "research"))) await cp(join(shared, "research"), join(dir, "research"), { recursive: true });
      console.log(`  [${id}] designing (${prep.content.designDirection.creative.typography.display} + ${prep.content.designDirection.creative.typography.body}; ${prep.inspiration?.count ?? 0} Inspo references)…`);
      const run = await claude(dir);
      let qa = null;
      if (existsSync(join(dir, "site", "index.html"))) {
        try { qa = (await runQa(dir, null, () => {}, ["home"])).scorecard; } catch (e) { console.log(`  [${id}] QA skipped: ${(e as Error).message}`); }
      }
      const r = { direction: id, name: directionById(id)!.name, built: existsSync(join(dir, "site", "index.html")), minutes: Math.round((Date.now() - t0) / 60_000), usage: run.usage, qa: qa ? { overall: qa.overall, critical: qa.critical } : null, note: run.ok ? "" : run.note };
      results.push(r);
      console.log(`  [${id}] ${r.built ? "built" : "FAILED"} in ${r.minutes} min, usage ≈ $${run.usage.toFixed(2)} (estimate, not a charge)${qa ? `, QA ${qa.overall}/10${qa.critical.length ? `, critical: ${qa.critical.join(" ")}` : ""}` : ""}`);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(4, Number(args.concurrency) || 2)) }, worker));
  await writeFile(join(outRoot, "concepts.json"), JSON.stringify({ lead: lead.name, leadId, results }, null, 2));
  await closeBrowser();
  console.log(`\nDone. See them with: npm run concepts -- --lead ${leadId} --serve`);
}

/** A local gallery of the concepts (desktop + phone screenshots, links to each live page). */
async function serve() {
  const meta = JSON.parse(await readFile(join(outRoot, "concepts.json"), "utf8")) as { lead: string; results: { direction: string; name: string; built: boolean; qa: { overall: number } | null }[] };
  const built = meta.results.filter((r) => r.built);
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  const gallery = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(meta.lead)}: design concepts</title>
<style>body{margin:0;font:15px/1.5 system-ui,sans-serif;background:#f4f4f2;color:#111}main{max-width:1280px;margin:0 auto;padding:32px 20px}h1{font-size:28px;margin:0 0 4px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(520px,1fr));gap:28px;margin-top:24px}.c{background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08)}.c header{display:flex;justify-content:space-between;align-items:baseline;padding:14px 18px}.c h2{font-size:18px;margin:0}.shots{display:grid;grid-template-columns:3fr 1fr;gap:8px;padding:0 18px 18px}.shots img{width:100%;border:1px solid #e5e5e5;border-radius:8px;display:block}a.btn{display:inline-block;margin:0 18px 18px;padding:8px 14px;border-radius:8px;background:#111;color:#fff;text-decoration:none}@media(max-width:600px){.grid{grid-template-columns:1fr}}</style>
<main><h1>${esc(meta.lead)}: ${built.length} design concepts</h1><p>Each is a complete home page in a different creative direction. Open one to scroll and try it; the other pages are built after you choose.</p><div class="grid">
${built.map((r, i) => `<section class="c"><header><h2>Option ${i + 1}: ${esc(r.name)}</h2><span>${r.qa ? `QA ${r.qa.overall}/10` : ""}</span></header>
<div class="shots"><img src="/${r.direction}/qa/home-desktop.jpg" alt="${esc(r.name)} on desktop"><img src="/${r.direction}/qa/home-mobile.jpg" alt="${esc(r.name)} on a phone"></div>
<a class="btn" href="/${r.direction}/">Open option ${i + 1}</a></section>`).join("\n")}
</div></main>`;
  const types: Record<string, string> = { html: "text/html; charset=utf-8", jpg: "image/jpeg", png: "image/png", webp: "image/webp" };
  createServer(async (req, res) => {
    const path = decodeURIComponent((req.url ?? "/").split("?")[0]);
    if (path === "/" || path === "/index.html") return res.writeHead(200, { "content-type": types.html }).end(gallery);
    const m = path.match(/^\/([a-z0-9-]+)\/(?:(qa\/[a-z0-9-]+\.jpg)|([a-z0-9_-]*))\/?$/i);
    if (!m || !meta.results.some((r) => r.direction === m[1])) return res.writeHead(404).end("Not found");
    const file = m[2] ? join(outRoot, m[1], m[2]) : join(outRoot, m[1], "site", `${m[3] ? m[3] : "index"}.html`);
    try {
      res.writeHead(200, { "content-type": types[file.split(".").pop()!] ?? "application/octet-stream" }).end(await readFile(file));
    } catch {
      res.writeHead(404, { "content-type": types.html }).end("<p>Only the home page exists in a concept. The other pages are built after you choose a direction.</p>");
    }
  }).listen(Number(args.port), "127.0.0.1", () => console.log(`Concepts for ${meta.lead}: http://localhost:${args.port}/  (Ctrl+C to stop)`));
}

try {
  if (args.serve) await serve();
  else await build();
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}
