/**
 * Local discovery run, no Cloudflare needed:
 *   npm run discover -- --target 10 [--category gym] [--city berlin] [--min-score 35]
 * Writes out/leads-<date>.csv, out/leads-<date>.json and out/previews/<host>.html
 *
 * Feed the deployed Worker's queue instead (discovery only, the Worker audits):
 *   RR_URL=https://… RR_TOKEN=… npm run discover -- --push --slices 6
 * Or audit locally and upload the qualified leads (previews then go live):
 *   RR_URL=https://… RR_TOKEN=… npm run discover -- --target 10 --upload
 */
import { mkdir, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import {
  CATEGORIES, CITIES, DEFAULT_MIN_SCORE, SHEET_HEADERS, auditCandidate, categoryById, cityById,
  discoverCandidates, leadToRow, renderRedesign, type Lead,
} from "@rr/core";

const { values: args } = parseArgs({
  options: {
    target: { type: "string", default: "10" },
    category: { type: "string" },
    city: { type: "string" },
    "min-score": { type: "string", default: String(DEFAULT_MIN_SCORE) },
    "max-per-slice": { type: "string", default: "15" },
    out: { type: "string", default: "out" },
    push: { type: "boolean", default: false },
    upload: { type: "boolean", default: false },
    slices: { type: "string", default: "5" },
  },
});

if (args.push) {
  const base = process.env.RR_URL, token = process.env.RR_TOKEN;
  if (!base || !token) throw new Error("--push needs RR_URL and RR_TOKEN");
  let pushed = 0;
  for (let i = 0; i < Number(args.slices); i++) {
    const category = args.category ? categoryById(args.category)! : CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const city = args.city ? cityById(args.city)! : CITIES[Math.floor(Math.random() * CITIES.length)];
    try {
      const cands = await discoverCandidates(category, city);
      const res = await fetch(`${base}/api/candidates`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify(cands),
      });
      console.log(`${category.label} in ${city.name}: ${cands.length} found → ${res.status} ${await res.text()}`);
      pushed += cands.length;
    } catch (e) {
      console.warn(`${category.label} in ${city.name}: ${(e as Error).message}`);
    }
    await sleep(1500);
  }
  console.log(`Pushed ${pushed} candidates`);
  process.exit(0);
}

const target = Number(args.target);
const minScore = Number(args["min-score"]);
const perSlice = Number(args["max-per-slice"]);
const cats = args.category ? [categoryById(args.category)!].filter(Boolean) : shuffle([...CATEGORIES]);
const cities = args.city ? [cityById(args.city)!].filter(Boolean) : shuffle([...CITIES]);
if (!cats.length || !cities.length) throw new Error("Unknown --category or --city");

const leads: Lead[] = [];
const seen = new Set<string>();

outer: for (const city of cities) {
  for (const category of cats) {
    console.log(`\n▶ ${category.label} in ${city.name}`);
    let cands;
    try {
      cands = await discoverCandidates(category, city);
    } catch (e) {
      console.warn(`  Overpass failed: ${(e as Error).message}`);
      await sleep(5000);
      continue;
    }
    console.log(`  ${cands.length} businesses with websites`);
    const batch = shuffle(cands.filter((c) => !seen.has(c.id))).slice(0, perSlice);
    const results = await pool(batch, 5, (c) => auditCandidate(c, minScore));
    for (const lead of results) {
      if (!lead) continue;
      seen.add(lead.id);
      const mark = lead.qualified ? "✅" : "  ";
      console.log(`  ${mark} ${String(lead.audit.score).padStart(3)}  ${lead.name}  ${lead.website}  ${lead.contacts.emails[0] ?? ""}`);
      if (lead.qualified) leads.push(lead);
      if (leads.length >= target) break outer;
    }
    await sleep(1500); // be polite to the public Overpass instance
  }
}

const date = new Date().toISOString().slice(0, 10);
await mkdir(`${args.out}/previews`, { recursive: true });
for (const l of leads) await writeFile(`${args.out}/previews/${l.id}.html`, renderRedesign(l));
const remote = process.env.RR_URL;
if (args.upload) {
  if (!remote || !process.env.RR_TOKEN) throw new Error("--upload needs RR_URL and RR_TOKEN");
  const res = await fetch(`${remote}/api/import`, {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.RR_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify(leads),
  });
  console.log(`Upload → ${res.status} ${await res.text()}`);
}
const previewUrl = (id: string) => (args.upload && remote ? `${remote}/preview/${id}` : `previews/${id}.html`);
const rows = [SHEET_HEADERS, ...leads.map((l) => leadToRow(l, previewUrl(l.id)))];
await writeFile(`${args.out}/leads-${date}.csv`, rows.map((r) => r.map(csvCell).join(",")).join("\n") + "\n");
await writeFile(`${args.out}/leads-${date}.json`, JSON.stringify(leads, null, 2));
console.log(`\n${leads.length} qualified leads → ${args.out}/leads-${date}.csv (previews in ${args.out}/previews/)`);

function csvCell(s: string): string {
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function shuffle<T>(xs: T[]): T[] {
  for (let i = xs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [xs[i], xs[j]] = [xs[j], xs[i]];
  }
  return xs;
}
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
async function pool<T, R>(items: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k]); }
  }));
  return out;
}
