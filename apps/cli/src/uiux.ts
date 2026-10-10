/**
 * UI UX Pro Max guidance for a redesign job (`uiux.md`). The runner's Claude has no shell, so the skill's local
 * search runs here when the job is prepared. Its output is advisory: the brief, the theme and the website-redesign
 * skill win wherever they disagree.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { cp } from "node:fs/promises";
import { join } from "node:path";

export const UIUX_SKILL_DIR = ".claude/skills/ui-ux-pro-max";

const HEADER = `# UI/UX guidance (UI UX Pro Max)

Generated for this business's trade by the ui-ux-pro-max skill's search. Use it to check and raise the UX,
accessibility, layout and polish of the redesign. **BRIEF.md, content.json and the website-redesign skill win
wherever they disagree.** In particular:

- Keep the theme's colours and fonts from \`designDirection.theme\`; ignore the palette and fonts suggested below.
- Never add a section the site has no content for (testimonials, statistics, problem statements, pricing).
- Keep native scrolling: no smooth-scroll CSS, no scroll-jacking.
- Motion uses the Motion library in \`content.json → libraries\` (Framer Motion's engine), not GSAP; ignore GSAP snippets.
`;

const run = (repoRoot: string, args: string[]): string => {
  const r = spawnSync("python3", [join(repoRoot, UIUX_SKILL_DIR, "scripts/search.py"), ...args], { encoding: "utf8", timeout: 60_000 });
  return r.status === 0 ? r.stdout.trim() : "";
};

/** The guide's markdown for a trade label (e.g. "Healthcare"), or null when python3 or the skill is missing. */
export function uiuxGuide(repoRoot: string, tradeLabel: string): string | null {
  if (!existsSync(join(repoRoot, UIUX_SKILL_DIR, "scripts/search.py"))) return null;
  const system = run(repoRoot, [`${tradeLabel} small business website`, "--design-system", "--format", "markdown"]);
  if (!system) return null;
  const ux = [
    ["Accessibility", "accessibility contrast focus keyboard"],
    ["Motion", "animation reduced motion duration"],
    ["Mobile and touch", "touch target mobile responsive"],
    ["Images and performance", "image lazy loading layout shift"],
  ].map(([title, q]) => `## ${title}\n\n${run(repoRoot, [q, "--domain", "ux", "-n", "4"]).replace(/^## .*\n/, "")}`);
  return `${HEADER}\n## Recommended direction for this trade\n\n${system}\n\n${ux.join("\n\n")}\n`;
}

/** Copy the skill into a job folder (so Claude can read its references) and write uiux.md. */
export async function writeUiux(repoRoot: string, dir: string, tradeLabel: string, write: (file: string, text: string) => Promise<void>): Promise<boolean> {
  const guide = uiuxGuide(repoRoot, tradeLabel);
  if (!guide) return false;
  await cp(join(repoRoot, UIUX_SKILL_DIR), join(dir, UIUX_SKILL_DIR), { recursive: true });
  await write(join(dir, "uiux.md"), guide);
  return true;
}
