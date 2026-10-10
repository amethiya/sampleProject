/**
 * Writes the skill's design-system references from packages/core/src/redesign/system.ts: `npm run skill:catalog`.
 * directions.md, themes.md, trades.md, system.css, base.js, motion.js and the ui-kit files are generated; never edit them by hand.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DIRECTIONS, LOOKS, SKILL_DIR, SYSTEM_BASE_JS, SYSTEM_CSS, SYSTEM_MOTION_JS, TRADE_PROMPTS, UI_KIT, UI_KIT_CSS, UI_KIT_JS, lookVars } from "@rr/core";

const root = resolve(fileURLToPath(import.meta.url), "../../../..");
const ref = (f: string) => resolve(root, SKILL_DIR, "references", f);
const note = "Generated from packages/core/src/redesign/system.ts by `npm run skill:catalog`. Do not edit by hand.";
const kitNote = "Generated from packages/core/src/redesign/ui-kit.ts by `npm run skill:catalog`. Do not edit by hand.";

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
const dirNote = "Generated from packages/core/src/redesign/directions.ts by `npm run skill:catalog`. Do not edit by hand.";
let dirs = `# Creative directions\n\n${dirNote}\n\nEach job gets one direction in \`content.json → designDirection.creative\`, chosen from the business's trade, its\nmaterial (photos, price lists) and brand, and never the same as the two most recent redesigns. The palette and fonts in\ncontent.json are the ones picked for this business (brand accent applied, contrast checked); the options below show the\nrange. Build the direction faithfully: it is what makes each redesign look made for its business.\n\n`;
dirs += "| Direction | Made for | Also fits | Photos | 3D |\n|---|---|---|---|---|\n";
for (const d of DIRECTIONS) dirs += `| ${d.name} (\`${d.id}\`) | ${d.primary.join(", ")} | ${d.secondary.join(", ")} | ${d.wantsPhotos} | ${d.threeD} |\n`;
for (const d of DIRECTIONS) {
  dirs += `\n## ${d.name} (\`${d.id}\`)\n\n${d.concept}\n\n- **Hero:** ${d.hero}\n- **Sequence:** ${d.sequence.join(" → ")}\n- **Grid:** ${d.grid}\n- **Type:** ${d.typeScale} Pairings: ${d.fonts.map((f) => `${f.display} + ${f.body} (${f.note})`).join("; ")}\n`;
  dirs += `- **Palettes:** ${d.palettes.map((p) => `${p.name} (${p.dark ? "dark" : "light"}: bg ${p.bg}, text ${p.text}, accent ${p.accent})`).join("; ")}\n- **Imagery:** ${d.imagery}\n- **Signature components:** ${d.components.join(", ")}\n- **Motion:** ${d.motion}\n`;
  dirs += `- **3D:** ${d.threeD}${d.threeDIdea ? `: ${d.threeDIdea}` : ""}\n- **Conversion:** ${d.conversion}\n- **Avoid:** ${d.avoid.join("; ")}\n`;
}
writeFileSync(ref("directions.md"), dirs);
writeFileSync(ref("system.css"), `/* ${note} Theme variables (:root) come first; see themes.md. */\n${SYSTEM_CSS}`);
writeFileSync(ref("base.js"), `// ${note}\n${SYSTEM_BASE_JS}\n`);
writeFileSync(ref("motion.js"), `// ${note}\n${SYSTEM_MOTION_JS}\n`);
let kit = `# UI kit\n\n${kitNote}\n\nComponents from Magic UI (magicui.design) and Smooth UI (smoothui.dev), both MIT, ported from React + Tailwind\n+ Motion to plain CSS and JavaScript, plus effects after popular 21st.dev community components, so they run in the static, CSP-locked redesign pages. Every starter page already\nincludes ui-kit.css (in its <style>) and ui-kit.js (an inline <script> after the base script): keep both, and add a\ncomponent by putting its class or data attribute on your markup. Never load React, Tailwind or the libraries.\n\nRules: colours come from the theme variables; a few effects per page, where they serve the content; never on text the\nmotion script already animates (.hero / .page-top content, .echo, .zig, .info); never invent content for them (the\nticker only animates a number already in the text). Everything respects prefers-reduced-motion; hover effects only\nrun on fine pointers.\n\n`;
for (const lib of ["Magic UI", "Smooth UI", "21st.dev"] as const) {
  kit += `## ${lib}\n\n`;
  for (const c of UI_KIT.filter((k) => k.library === lib)) kit += `### ${c.name} (\`${c.id}\`)\n\n${c.use}\n\n\`\`\`html\n${c.markup}\n\`\`\`\n\n`;
}
writeFileSync(ref("ui-kit.md"), kit);
writeFileSync(ref("ui-kit.css"), `/* ${kitNote} */${UI_KIT_CSS}`);
writeFileSync(ref("ui-kit.js"), `// ${kitNote}\n${UI_KIT_JS}\n`);
console.log(`Wrote directions.md (${DIRECTIONS.length} directions), themes.md (${LOOKS.length} themes), trades.md, system.css, base.js, motion.js, ui-kit.md (${UI_KIT.length} components), ui-kit.css, ui-kit.js to ${SKILL_DIR}/references`);
