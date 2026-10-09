/**
 * Writes the skill's design-system references from packages/core/src/redesign/system.ts: `npm run skill:catalog`.
 * themes.md, trades.md, system.css, base.js and motion.js are generated; never edit them by hand.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { LOOKS, SKILL_DIR, SYSTEM_BASE_JS, SYSTEM_CSS, SYSTEM_MOTION_JS, TRADE_PROMPTS, lookVars } from "@rr/core";

const root = resolve(fileURLToPath(import.meta.url), "../../../..");
const ref = (f: string) => resolve(root, SKILL_DIR, "references", f);
const note = "Generated from packages/core/src/redesign/system.ts by `npm run skill:catalog`. Do not edit by hand.";

let themes = `# Themes\n\n${note}\n\nEvery site gets one theme in \`content.json → designDirection.theme\`. Use its colours and fonts exactly; the\nstarter pages already contain its CSS variables. Navy leads for most trades; themes rotate so neighbours differ.\n\n`;
themes += "| Theme | Mode | Background | Text | Accent | Fonts |\n|---|---|---|---|---|---|\n";
for (const l of LOOKS) themes += `| ${l.name} (\`${l.id}\`) | ${l.dark ? "dark" : "light"} | ${l.bg} | ${l.text} | ${l.accent} / ${l.accent2} | ${l.display.split(",")[0]} + ${l.body.split(",")[0]} |\n`;
themes += "\n## CSS variables per theme\n\n";
for (const l of LOOKS) themes += `### ${l.name}\n\n\`\`\`css\n${lookVars(l).replace(/;/g, ";\n  ").replace("{", "{\n  ")}\n\`\`\`\n\n`;
writeFileSync(ref("themes.md"), themes);

let trades = `# Trade prompts\n\n${note}\n\n\`content.json → designDirection.trade\` carries the prompt for this business. Follow it for the hero image,\nimagery, how the content maps onto the sections, and tone.\n\n`;
for (const [id, p] of Object.entries(TRADE_PROMPTS)) {
  trades += `## ${id.replace("_", " ")}\n\n- **Hero:** ${p.hero}\n- **Imagery:** ${p.imagery}\n- **Sections:** ${p.sections}\n- **Tone:** ${p.tone}\n\n`;
}
writeFileSync(ref("trades.md"), trades);
writeFileSync(ref("system.css"), `/* ${note} Theme variables (:root) come first; see themes.md. */\n${SYSTEM_CSS}`);
writeFileSync(ref("base.js"), `// ${note}\n${SYSTEM_BASE_JS}\n`);
writeFileSync(ref("motion.js"), `// ${note}\n${SYSTEM_MOTION_JS}\n`);
console.log(`Wrote themes.md (${LOOKS.length} themes), trades.md, system.css, base.js, motion.js to ${SKILL_DIR}/references`);
