import {
  BLUEPRINTS, CONCEPTS, FONT_PAIRS, PALETTES, THEMES, dnaFromKey, renderSitePage, type Blueprint, type Lead, type SiteSnapshot,
} from "@rr/core";
import { TEMPLATE_CSP, html } from "./redesign";

const GALLERY_CSP =
  "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'self'";

const HEROES = ["fullbleed", "split", "editorial", "centered"];
const CORNERS = ["sharp", "soft", "round"];
const MOTION: Record<string, string> = {
  explode: "Pulls apart",
  stack: "Layers lift apart",
  orbit: "Camera orbit",
  turntable: "Turntable between split name",
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** GET /templates (gallery) and /templates/<id>/ (a live demo of one blueprint). Public, noindex. */
export function templates(url: URL): Response {
  const [, , rawId = "", ...rest] = url.pathname.split("/");
  if (!rawId) return gallery(url.origin);
  const i = BLUEPRINTS.findIndex((b) => b.id === rawId);
  if (i < 0 || rest.filter(Boolean).length) return new Response("Template not found", { status: 404 });
  if (!url.pathname.endsWith("/")) return Response.redirect(`${url.origin}/templates/${rawId}/`, 301);
  return html(demo(BLUEPRINTS[i], i, url.origin), TEMPLATE_CSP);
}

/** Each demo gets its own palette, type and concept so the gallery shows the range, not one look. */
function demoKey(b: Blueprint, i: number): string {
  return [PALETTES[i % PALETTES.length].id, FONT_PAIRS[(i * 5) % FONT_PAIRS.length].id, HEROES[i % 4], CORNERS[i % 3], CONCEPTS[(i * 3) % CONCEPTS.length].id, b.id].join("|");
}

function demo(b: Blueprint, i: number, origin: string): string {
  const category = b.categories[0];
  // Sample content describes the template itself, so nothing pretends to be a real business.
  const lead = {
    id: `template-${b.id}`,
    name: b.name,
    website: `${origin}/templates`,
    category,
    city: "Sample city",
    country: "US",
    address: "Sample content: this is a template demo",
    contacts: { emails: ["hello@example.com"], phones: [] },
    audit: { score: 0, issues: [] },
    content: { title: b.name, description: b.signature, headings: [], paragraphs: [], images: [] },
  } as unknown as Lead;
  const site: SiteSnapshot = {
    crawledAt: "",
    pages: [{
      slug: "home",
      url: `${origin}/templates`,
      label: "Home",
      title: b.name,
      description: b.signature,
      sections: [
        { heading: "The signature moment", paragraphs: [b.signature], items: [], images: [] },
        { heading: "Storyboard", paragraphs: ["Each beat is filled with the business's own content when a real site is redesigned."], items: b.beats, images: [] },
        { heading: "Used for", paragraphs: [`${b.categories.map((c) => THEMES[c].label).join(", ")}.${b.keywords.length ? ` Picked first when a site mentions ${b.keywords.slice(0, 6).join(", ")}.` : ""}`], items: [], images: [] },
      ],
    }],
  };
  return renderSitePage(lead, site, "home", { dna: dnaFromKey(demoKey(b, i))! });
}

function gallery(origin: string): Response {
  const groups = new Map<string, Blueprint[]>();
  for (const b of BLUEPRINTS) {
    const label = THEMES[b.categories[0]].label;
    groups.set(label, [...(groups.get(label) ?? []), b]);
  }
  const card = (b: Blueprint) => `<a class="card" href="${origin}/templates/${b.id}/" target="_blank" rel="noopener">
  <span class="tags"><span>${esc(b.object)}</span><span>${esc(MOTION[b.motion])}</span></span>
  <strong>${esc(b.name)}</strong>
  <span class="sig">${esc(b.signature)}</span>
  <span class="open">Open live demo</span>
</a>`;
  const body = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Redesign templates · Revamp Radar</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap">
<style>
:root{--bg:#fff;--ink:#0a0a0a;--muted:#6b6b6b;--line:#e6e6e6;--card:#fafafa}
@media (prefers-color-scheme:dark){:root{--bg:#000;--ink:#f5f5f5;--muted:#9a9a9a;--line:#262626;--card:#0d0d0d}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.55 Geist,system-ui,sans-serif}
main{max-width:1200px;margin:0 auto;padding:48px 16px 80px}
h1{font-size:clamp(2rem,5vw,3.2rem);line-height:1.05;letter-spacing:-.03em;margin:0 0 12px;font-weight:600}
.lead{color:var(--muted);max-width:62ch;margin:0 0 40px}
h2{font-size:1.1rem;font-weight:600;margin:40px 0 14px;padding-top:20px;border-top:1px solid var(--line)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px}
.card{display:grid;gap:10px;align-content:start;padding:18px;border:1px solid var(--line);border-radius:12px;background:var(--card);color:inherit;text-decoration:none;transition:border-color .15s}
.card:hover,.card:focus-visible{border-color:var(--ink);outline:none}
.card strong{font-size:1.15rem;font-weight:600;letter-spacing:-.01em}
.sig{color:var(--muted);font-size:14px}
.tags{display:flex;gap:6px;flex-wrap:wrap}.tags span{font-size:12px;border:1px solid var(--line);border-radius:99px;padding:2px 9px}
.open{font-weight:500;font-size:14px;text-decoration:underline;text-underline-offset:3px}
</style>
</head>
<body>
<main>
<h1>Redesign templates</h1>
<p class="lead">All ${BLUEPRINTS.length} scene templates. Each redesign is given one automatically, based on the business's category and the words on its website, and consecutive redesigns get different ones. Each demo below uses sample text that describes the template; scroll the demo to see the 3D chapter.</p>
${[...groups].map(([label, list]) => `<h2>${esc(label)} <span class="sig">(${list.length})</span></h2>\n<div class="grid">${list.map(card).join("")}</div>`).join("\n")}
</main>
</body>
</html>`;
  return html(body, GALLERY_CSP);
}
