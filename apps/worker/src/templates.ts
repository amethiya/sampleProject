import { LOOKS, THEMES, makeDna, renderSitePage, type Lead, type Look, type SiteSnapshot } from "@rr/core";
import { TEMPLATE_CSP, html } from "./redesign";

const GALLERY_CSP =
  "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'self'";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** GET /themes (gallery) and /themes/<id>/ (a live demo of one theme). /templates redirects here. Public, noindex. */
export function templates(url: URL): Response {
  if (url.pathname.startsWith("/templates")) return Response.redirect(`${url.origin}/themes`, 301);
  const [, , rawId = "", ...rest] = url.pathname.split("/");
  if (!rawId) return gallery(url.origin);
  const look = LOOKS.find((l) => l.id === rawId);
  if (!look || rest.filter(Boolean).length) return new Response("Theme not found", { status: 404 });
  if (!url.pathname.endsWith("/")) return Response.redirect(`${url.origin}/themes/${rawId}/`, 301);
  return html(demo(look, url.origin), TEMPLATE_CSP);
}

/** Sample content that describes the theme itself, so nothing pretends to be a real business. */
function demo(look: Look, origin: string): string {
  const lead = {
    id: `theme-${look.id}`, name: look.name, website: `${origin}/themes`, category: "restaurant", city: "your city", country: "US",
    address: "Sample content: a theme demo", openingHours: "Mo-Su 08:00-22:00",
    contacts: { emails: ["hello@example.com"], phones: ["+1 555 0100"] }, audit: { score: 0, issues: [] },
    content: { title: look.name, description: "", headings: [], paragraphs: [], images: [] },
  } as unknown as Lead;
  const site: SiteSnapshot = {
    crawledAt: "",
    pages: [{
      slug: "home", url: `${origin}/themes`, label: "Home", title: look.name,
      description: "A theme of the Revamp Radar design system. Every redesign uses the same structure, components and motion, dressed in one of these themes.",
      sections: [
        { heading: "How a redesign is built", paragraphs: ["Each section is filled with the business's own words and photos: its story, what it offers with real prices, its locations and opening hours. Nothing is invented."], items: [], images: [] },
        { heading: "Signature offer", paragraphs: ["Shown in a zigzag with round cut-out photos that spin into place inside a dust splash."], items: ["Starter 9.50", "Main course 18.00", "Dessert 7.50"], images: [] },
        { heading: "Motion", paragraphs: ["A loader counter, headings that collapse from outlined echoes, a cloud reveal onto a full-screen photo, photos that open up as you scroll, and curtain page transitions."], items: [], images: [] },
      ],
    }],
  };
  return renderSitePage(lead, site, "home", { dna: makeDna(look, "restaurant") });
}

function gallery(origin: string): Response {
  const card = (l: Look) => `<a class="card" href="${origin}/themes/${l.id}/" target="_blank" rel="noopener">
  <span class="sw" style="background:${l.bg}"><i style="background:${l.accent}"></i><b style="color:${l.text};font-family:${esc(l.display)}">Aa</b></span>
  <strong>${esc(l.name)}</strong>
  <span class="meta">${l.dark ? "Dark" : "Light"} · ${esc(l.display.split(",")[0].replace(/'/g, ""))} with ${esc(l.body.split(",")[0].replace(/'/g, ""))}</span>
  <span class="open">Open live demo</span>
</a>`;
  const fonts = [...new Set(LOOKS.map((l) => l.fonts))].map((f) => `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${f}&display=swap">`).join("");
  const body = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Redesign themes · Revamp Radar</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap">${fonts}
<style>
:root{--bg:#fff;--ink:#0a0a0a;--muted:#6b6b6b;--line:#e6e6e6;--card:#fafafa}
@media (prefers-color-scheme:dark){:root{--bg:#000;--ink:#f5f5f5;--muted:#9a9a9a;--line:#262626;--card:#0d0d0d}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.55 Geist,system-ui,sans-serif}
main{max-width:1200px;margin:0 auto;padding:48px 16px 80px}
h1{font-size:clamp(2rem,5vw,3.2rem);line-height:1.05;letter-spacing:-.03em;margin:0 0 12px;font-weight:600}
.lead{color:var(--muted);max-width:64ch;margin:0 0 36px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}
.card{display:grid;gap:10px;padding:14px 14px 18px;border:1px solid var(--line);border-radius:12px;background:var(--card);color:inherit;text-decoration:none;transition:border-color .15s}
.card:hover,.card:focus-visible{border-color:var(--ink);outline:none}
.sw{position:relative;height:150px;border-radius:8px;display:flex;align-items:center;justify-content:center;overflow:hidden}
.sw i{position:absolute;left:18px;right:18px;bottom:22px;height:2px;opacity:.9}
.sw b{font-size:3.4rem;font-weight:400}
.card strong{font-size:1.1rem;font-weight:600}
.meta{color:var(--muted);font-size:14px}
.open{font-weight:500;font-size:14px;text-decoration:underline;text-underline-offset:3px}
</style>
</head>
<body>
<main>
<h1>Redesign themes</h1>
<p class="lead">Every redesign is built on one design system: the structure, components and motion of the approved Rise &amp; Shine redesign. Each site gets one of these ${LOOKS.length} themes, chosen for its trade (navy leads for most) and rotated so neighbouring redesigns look different. Open a demo and scroll to see the motion.</p>
<div class="grid">${LOOKS.map(card).join("")}</div>
</main>
</body>
</html>`;
  void THEMES;
  return html(body, GALLERY_CSP);
}
