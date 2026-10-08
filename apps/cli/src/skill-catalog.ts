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
const motionText: Record<string, string> = {
  explode: "parts pull apart from the centre and come back",
  stack: "layers lift apart along one axis, one caption per layer, then lock back",
  orbit: "the camera circles the object; particles form a ring",
  turntable: "the name is split in giant type with the object turning between the halves",
};

let md = `# Scene blueprints

Generated from \`packages/core/src/redesign/blueprints.ts\` by \`npm run skill:catalog\`. Do not edit by hand.

Every redesign is assigned one blueprint in \`content.json → designDirection.blueprint\` (chosen from the business's
category and words in its content, e.g. pizza, burger, saree, dental, and rotated so consecutive redesigns differ).
Build its **signature moment** as the home page's centrepiece and follow its **storyboard**, filling every beat with
the site's own content. Recipe numbers refer to [motion-recipes.md](motion-recipes.md).

Chapter motions: ${Object.entries(motionText).map(([k, v]) => `**${k}**: ${v}`).join("; ")}.

`;
for (const [cat, label] of Object.entries(SECTIONS)) {
  const list = BLUEPRINTS.filter((b) => b.categories[0] === cat);
  if (!list.length) continue;
  md += `## ${label}\n\n`;
  for (const b of list) {
    md += `### ${b.name} (\`${b.id}\`)\n`;
    md += `- **For:** ${b.categories.join(", ")}${b.keywords.length ? `; picked first when the site mentions ${b.keywords.map((k) => `"${k}"`).join(", ")}` : ""}\n`;
    md += `- **Object and motion:** ${b.object}, ${b.motion}\n`;
    md += `- **Signature moment:** ${b.signature}\n`;
    md += `- **Storyboard:** ${b.beats.map((x, i) => `${i + 1}. ${x}`).join(" ")}\n`;
    md += `- **Recipes:** ${b.recipes.join(", ")}\n\n`;
  }
}
writeFileSync(resolve(root, SKILL_DIR, "references/blueprints.md"), md);
console.log(`Wrote ${BLUEPRINTS.length} blueprints to ${SKILL_DIR}/references/blueprints.md`);
