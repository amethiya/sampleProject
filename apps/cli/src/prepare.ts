/**
 * Prepares a job folder for Claude (shared by the background runner and `npm run job` for cloud sessions):
 * the skill, BRIEF.md, research/ (real-browser inspection of the original site), content.json with the creative
 * direction, uiux.md and the starter pages.
 */
import { appendFile, cp, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { SKILL_DIR, briefContent, dnaFromKey, jobBrief, lookById, makeDna, writeStarter, type BriefContent, type Lead, type SiteSnapshot } from "@rr/core";
import { writeInspiration, type Inspiration } from "./inspiration";
import { research, type Research } from "./research";
import { writeUiux } from "./uiux";

export interface NextJob {
  job: { id: number; leadId: string; style: string | null; notes?: string | null; mode?: string; direction?: string | null; theme?: string | null; attempts?: number; maxAttempts?: number } | null;
  lead?: Lead;
  site?: SiteSnapshot;
  avoid?: string[];
  recentDirections?: string[];
  previous?: { slug: string; html: string }[];
}

export interface Prepared {
  content: BriefContent;
  pageFiles: string[];
  research: Research | null;
  inspiration: Inspiration | null;
}

export async function prepareJob(repoRoot: string, dir: string, next: Required<Pick<NextJob, "job" | "lead" | "site">> & NextJob, opts: { research: boolean; log(msg: string): void; reuseResearch?: Research | null }): Promise<Prepared> {
  const { job, lead, site } = next;
  if (!job) throw new Error("No job");
  await mkdir(join(dir, "site"), { recursive: true });
  const skillSource = join(repoRoot, SKILL_DIR);
  // Every redesign uses the website-redesign skill: as files (./skill) and as a project skill.
  await cp(skillSource, join(dir, "skill"), { recursive: true });
  await cp(skillSource, join(dir, SKILL_DIR), { recursive: true });

  // A revision starts from the previous Claude pages; the owner's notes go into BRIEF.md.
  const previous = next.previous ?? [];
  const prevFiles = previous.map((p) => (p.slug === "home" ? "index.html" : `${p.slug}.html`));
  if (previous.length) {
    await mkdir(join(dir, "previous"), { recursive: true });
    await Promise.all(previous.map((p, i) => writeFile(join(dir, "previous", prevFiles[i]), p.html)));
    // A revision starts with the previous pages already in place, so Claude edits only what the notes concern instead
    // of rewriting every page (which cost ~$20 of usage to fix one page on Union Oyster House).
    const current = new Set(site.pages.map((p) => p.slug));
    await mkdir(join(dir, "site"), { recursive: true });
    await Promise.all(previous.filter((p) => current.has(p.slug)).map((p) => writeFile(join(dir, "site", p.slug === "home" ? "index.html" : `${p.slug}.html`), p.html)));
  }
  await writeFile(join(dir, "BRIEF.md"), jobBrief(job, prevFiles));

  // An approved design concept for this direction (npm run concepts) becomes the home page to build from.
  const concept = join(repoRoot, "out", "concepts", job.leadId, job.direction ?? "", "site", "index.html");
  if (job.direction && existsSync(concept) && !dir.startsWith(join(repoRoot, "out", "concepts"))) {
    await mkdir(join(dir, "concept"), { recursive: true });
    await cp(concept, join(dir, "concept", "index.html"));
    await appendFile(join(dir, "BRIEF.md"), `\n## Approved concept\n\nThe owner compared several design concepts and chose this one: ./concept/index.html is the approved home page. Use it as the home page (keep its design; fix only what is broken or missing) and build every other page in exactly the same design system: its fonts, colours, components, spacing, navigation, footer and motion. This takes precedence over any palette or typography in content.json that differs from it.\n`);
    opts.log("using the owner's approved concept for the home page");
  }

  // Stage A/B: look at the real site before designing anything.
  let found: Research | null = opts.reuseResearch ?? null;
  if (opts.research && !found) {
    try {
      found = await research(lead.website, dir, opts.log);
    } catch (e) {
      opts.log(`research skipped: ${(e as Error).message.split("\n")[0]}`);
    }
  }

  // Stage C/D: the creative direction (chosen at claim time), its palette from the measured brand.
  const dna = job.style ? dnaFromKey(job.style) ?? undefined : undefined;
  const content = briefContent(lead, site, dna, next.avoid ?? [], {
    direction: job.direction,
    forcedLook: lookById(job.theme ?? undefined) ?? null,
    brand: found?.brand ?? null,
    recentDirections: next.recentDirections ?? [],
    seed: `${job.leadId}:${job.id}`,
  });
  // A revision keeps its look: carry the previous version's fonts into content.json so nothing points Claude elsewhere.
  if (previous.length) {
    const home = previous.find((p) => p.slug === "home") ?? previous[0];
    const fonts = home.html.match(/https:\/\/fonts\.googleapis\.com\/css2\?[^"'\s)]+/)?.[0]?.replace(/&amp;/g, "&");
    if (fonts) {
      const families = [...fonts.matchAll(/family=([^:&]+)/g)].map((m) => decodeURIComponent(m[1].replace(/\+/g, " ")));
      const t = content.designDirection.creative.typography;
      content.designDirection.creative.typography = { ...t, googleFontsUrl: fonts, query: fonts.split("?")[1], display: families[0] ?? t.display, body: families[1] ?? families[0] ?? t.body, note: "Kept from the previous version (this is a revision)." };
    }
    content.designDirection.creative.palette = { ...content.designDirection.creative.palette, name: `${content.designDirection.creative.palette.name} (a revision: keep the previous version's colours unless the notes change them)` };
  }
  await writeFile(join(dir, "content.json"), JSON.stringify(content, null, 2));

  // Real reference sites for this trade and direction (Inspo); skipped when unreachable.
  const c = content.designDirection.creative;
  const inspiration = await writeInspiration(dir, {
    trade: content.designDirection.trade.id, tradeLabel: content.designDirection.trade.label,
    direction: { name: c.name, concept: c.concept, dark: c.palette.dark }, city: lead.city,
    brandColor: c.palette.fromBrand ? c.palette.accent : null, log: opts.log,
  }).catch(() => null);

  // UI UX Pro Max guidance for this trade (uiux.md); skipped when python3 is missing.
  if (!(await writeUiux(repoRoot, dir, content.designDirection.trade.label, writeFile))) opts.log("UI UX Pro Max guidance skipped (needs python3).");

  // Starter pages: every page already rendered in the house design system, in this job's theme.
  const forced = lookById(job.theme ?? undefined);
  const starterDna = forced ? makeDna(forced, content.designDirection.trade.id) : dna;
  await mkdir(join(dir, "starter"), { recursive: true });
  for (const f of writeStarter(lead, site, starterDna)) await writeFile(join(dir, "starter", f.file), f.html);

  return { content, pageFiles: site.pages.map((p) => (p.slug === "home" ? "index.html" : `${p.slug}.html`)), research: found, inspiration };
}
