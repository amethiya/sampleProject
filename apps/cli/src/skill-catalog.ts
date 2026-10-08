/** Writes the skill's blueprint catalogue from packages/core/src/redesign/blueprints.ts: `npm run skill:catalog`. */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BLUEPRINTS, SKILL_DIR } from "@rr/core";

const SECTIONS: Record<string, string> = {
  restaurant: "Restaurants", cafe: "Cafés and bakeries", gym: "Gyms and studios", salon: "Salons and beauty",
  clothing: "Clothing and fashion", retail: "Retail shops", healthcare: "Healthcare", accounting: "Accounting and finance",
  import_export: "Import and export", services: "Local services",
};

const root = resolve(fileURLToPath(import.meta.url), "../../../..");
let md = `# Layout templates

Generated from \`packages/core/src/redesign/blueprints.ts\` by \`npm run skill:catalog\`. Do not edit by hand.

Every redesign is assigned one template in \`content.json → designDirection.layoutTemplate\`, chosen from the
business's category and words in its name and content (pizza, dental, barber…) and rotated so consecutive
redesigns differ. Follow its hero layout, mood and home-page sections, filling every section with the site's own
content. Pattern numbers refer to [patterns.md](patterns.md).

`;
for (const [cat, label] of Object.entries(SECTIONS)) {
  const list = BLUEPRINTS.filter((b) => b.categories[0] === cat);
  if (!list.length) continue;
  md += `## ${label}\n\n`;
  for (const b of list) {
    md += `### ${b.name} (\`${b.id}\`)\n`;
    md += `- **For:** ${b.categories.join(", ")}${b.keywords.length ? `; picked first when the site mentions ${b.keywords.map((k) => `"${k}"`).join(", ")}` : ""}\n`;
    md += `- **Hero and mood:** ${b.hero}, ${b.mood}\n`;
    md += `- **First impression:** ${b.signature}\n`;
    md += `- **Home page:** ${b.beats.map((x, i) => `${i + 1}. ${x}`).join(" ")}\n`;
    md += `- **Patterns:** ${b.patterns.join(", ")}\n\n`;
  }
}
writeFileSync(resolve(root, SKILL_DIR, "references/blueprints.md"), md);
console.log(`Wrote ${BLUEPRINTS.length} blueprints to ${SKILL_DIR}/references/blueprints.md`);
