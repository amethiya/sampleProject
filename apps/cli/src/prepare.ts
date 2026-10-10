/**
 * Prepares a job folder for Claude (shared by the background runner and `npm run job` for cloud sessions):
 * the skill, BRIEF.md, research/ (real-browser inspection of the original site), content.json with the creative
 * direction, uiux.md and the starter pages.
 */
import { cp, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { SKILL_DIR, briefContent, dnaFromKey, jobBrief, lookById, writeStarter, type BriefContent, type Lead, type SiteSnapshot } from "@rr/core";
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
}

export async function prepareJob(repoRoot: string, dir: string, next: Required<Pick<NextJob, "job" | "lead" | "site">> & NextJob, opts: { research: boolean; log(msg: string): void }): Promise<Prepared> {
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
  }
  await writeFile(join(dir, "BRIEF.md"), jobBrief(job, prevFiles));

  // Stage A/B: look at the real site before designing anything.
  let found: Research | null = null;
  if (opts.research) {
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
  await writeFile(join(dir, "content.json"), JSON.stringify(content, null, 2));

  // UI UX Pro Max guidance for this trade (uiux.md); skipped when python3 is missing.
  if (!(await writeUiux(repoRoot, dir, content.designDirection.trade.label, writeFile))) opts.log("UI UX Pro Max guidance skipped (needs python3).");

  // The instant renderer's version of every page: a content map (and the layout, for Cinematic Hospitality).
  await mkdir(join(dir, "starter"), { recursive: true });
  for (const f of writeStarter(lead, site, dna)) await writeFile(join(dir, "starter", f.file), f.html);

  return { content, pageFiles: site.pages.map((p) => (p.slug === "home" ? "index.html" : `${p.slug}.html`)), research: found };
}
