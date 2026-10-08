import { countryName } from "../categories";
import type { SitePage, SiteSection, SiteSnapshot } from "../crawl";
import type { CategoryId, Lead } from "../types";
import type { DesignDna } from "./styles";
import { THEMES, photoUrl, type Theme } from "./themes";

export type RedesignInput = Pick<
  Lead,
  "name" | "category" | "city" | "country" | "website" | "address" | "openingHours" | "contacts" | "content" | "lat" | "lon"
>;

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const safeUrl = (u: string | undefined) => (u && /^https?:\/\//i.test(u) ? esc(u) : "");
const cssUrl = (u: string) => u.replace(/['"()\\\s<>]/g, (ch) => "%" + ch.charCodeAt(0).toString(16).padStart(2, "0"));

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function initials(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w && !/^(dr|med|univ|und|and|the|of|mudr|ing)$/i.test(w));
  return (words.slice(0, 2).map((w) => w[0]).join("") || name[0] || "?").toUpperCase();
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function firstSentences(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  return end > 60 ? cut.slice(0, end + 1) : cut.slice(0, cut.lastIndexOf(" ")) + "…";
}

/** A one-page snapshot from the homepage content captured at audit time (used before a full crawl exists). */
export function snapshotFromLead(lead: RedesignInput): SiteSnapshot {
  const c = lead.content;
  return {
    crawledAt: "",
    pages: [{
      slug: "home",
      url: lead.website,
      label: "Home",
      title: c.title,
      description: c.description,
      sections: [{ heading: c.headings[0] ?? "", paragraphs: c.paragraphs, items: [], images: c.images }],
    }],
  };
}

/** Single-page render from audit-time content. */
export function renderRedesign(lead: RedesignInput): string {
  return renderSitePage(lead, snapshotFromLead(lead), "home");
}

type Block =
  | { kind: "statement"; text: string }
  | { kind: "split"; section: SiteSection; flip: boolean }
  | { kind: "gallery"; heading: string; images: string[] }
  | { kind: "list"; heading: string; lines: string[]; images: string[] }
  | { kind: "prose"; heading: string; paragraphs: string[] };

/** Merge heading-only sections into the next one and tidy headings ("Menu:" → "Menu"). */
function normalize(sections: SiteSection[]): SiteSection[] {
  const out: SiteSection[] = [];
  let pending = "";
  for (const s of sections) {
    const heading = s.heading.replace(/[:\s]+$/, "");
    if (!s.paragraphs.length && !s.items.length && !s.images.length) {
      pending = pending ? `${pending}, ${heading}` : heading;
      continue;
    }
    out.push({ ...s, heading: heading || pending });
    pending = "";
  }
  if (pending && out.length) out[out.length - 1].paragraphs.push(pending);
  return out;
}

function toBlocks(sections: SiteSection[], isHome: boolean): Block[] {
  const blocks: Block[] = [];
  let statementUsed = !isHome;
  let flip = false;
  for (const s of normalize(sections)) {
    const lines = [...s.paragraphs, ...s.items];
    const short = lines.filter((l) => l.length < 90).length;
    if (!statementUsed && !s.images.length && !s.items.length && s.paragraphs.length === 1 && s.paragraphs[0].length >= 60 && s.paragraphs[0].length <= 280) {
      blocks.push({ kind: "statement", text: s.paragraphs[0] });
      statementUsed = true;
    } else if (!lines.length) {
      blocks.push({ kind: "gallery", heading: s.heading, images: s.images });
    } else if (lines.length >= 4 && short / lines.length > 0.7) {
      blocks.push({ kind: "list", heading: s.heading, lines, images: s.images });
    } else if (s.images.length) {
      blocks.push({ kind: "split", section: s, flip });
      flip = !flip;
    } else {
      blocks.push({ kind: "prose", heading: s.heading, paragraphs: lines });
    }
  }
  return blocks;
}

function pageHref(slug: string): string {
  return slug === "home" ? "./" : `./${encodeURIComponent(slug)}`;
}

/** Render one page of the redesigned site from the crawled page's own text and images. */
export interface RenderOptions {
  /** Rewrites the business's own image URLs, e.g. through an HTTPS proxy. */
  image?: (url: string) => string;
  /** This site's design DNA (palette, type, hero layout, corners). Category defaults when absent. */
  dna?: DesignDna;
}

/** Category theme (photos, 3D subject, copy) dressed in the site's own palette and type. */
/** Photos and wording follow the template's trade when it overrides a mis-filed category. */
export function themeCategory(category: CategoryId, dna?: DesignDna): CategoryId {
  const b = dna?.blueprint;
  return b && !b.categories.includes(category) ? b.categories[0] : category;
}

export function applyDna(base: Theme, dna?: DesignDna): Theme {
  if (!dna) return base;
  const { palette: p, fonts: f } = dna;
  return {
    ...base,
    fonts: f.fonts, display: f.display, body: f.body, displayWeight: f.weight, displayTracking: f.tracking,
    dark: p.dark, bg: p.bg, surface: p.surface, ink: p.ink, muted: p.muted, line: p.line, accent: p.accent, accentInk: p.accentInk,
  };
}

export function renderSitePage(lead: RedesignInput, site: SiteSnapshot, slug: string, opts: RenderOptions = {}): string {
  const t = applyDna(THEMES[themeCategory(lead.category, opts.dna)], opts.dna);
  const bodyClass = [
    t.dark ? "dark" : "light",
    `hero-${opts.dna?.blueprint?.hero ?? opts.dna?.hero ?? "fullbleed"}`,
    `corners-${opts.dna?.corners ?? "soft"}`,
    opts.dna?.fonts.upper ? "upper" : "",
  ].filter(Boolean).join(" ");
  imageMap = opts.image ?? ((u) => u);
  const page = site.pages.find((p) => p.slug === slug) ?? site.pages[0];
  const isHome = page.slug === site.pages[0].slug;
  const domain = domainOf(lead.website);
  const seed = hash(domain + page.slug);
  const photos = t.photos.map((_, i) => t.photos[(i + seed) % t.photos.length]);
  const stockHero = photoUrl(photos[0], 1920);

  const name = esc(lead.name);
  const mono = esc(initials(lead.name));
  // A hero line must read like a sentence; dish names, prices and addresses don't qualify.
  const firstText = page.sections.flatMap((s) => s.paragraphs).find((p) => p.length >= 70 && /[.!?]/.test(p) && (p.match(/\d/g) ?? []).length / p.length < 0.05) ?? "";
  const heroTitle = isHome ? lead.name : page.label;
  const heroSub = isHome
    ? page.description && page.description.length >= 30 ? page.description : firstText ? firstSentences(firstText, 200) : t.tagline
    : firstText ? firstSentences(firstText, 180) : "";
  const siteImages = page.sections.flatMap((s) => s.images).filter((u) => /^https?:/.test(u)).slice(0, 6).map((u) => cssUrl(imageMap(u)));
  const blocks = toBlocks(page.sections, isHome);

  const phone = lead.contacts.phones[0];
  const tel = phone ? esc(phone.replace(/[^\d+]/g, "")) : "";
  const email = lead.contacts.emails[0];
  const hours = (lead.openingHours ?? "").split(";").map((s) => s.trim()).filter(Boolean);
  const primaryHref = phone ? `tel:${tel}` : email ? `mailto:${esc(email)}` : "#visit";
  const where = lead.address || `${lead.city}, ${countryName(lead.country)}`;
  const mapQ = encodeURIComponent([lead.name, lead.address, lead.city].filter(Boolean).join(", "));
  const hasMap = typeof lead.lat === "number" && typeof lead.lon === "number";
  const mapSrc = hasMap
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lead.lon! - 0.006},${lead.lat! - 0.003},${lead.lon! + 0.006},${lead.lat! + 0.003}&layer=mapnik&marker=${lead.lat},${lead.lon}`
    : "";
  const others = site.pages.filter((p) => p.slug !== page.slug);
  const link = (p: SitePage) => `<a href="${pageHref(p.slug)}"${p.slug === page.slug ? ' aria-current="page"' : ""}>${esc(p.label)}</a>`;
  const headerLinks = site.pages.slice(0, 5).map(link).join("");
  const moreMenu = site.pages.length > 5;
  const navLinks = site.pages
    .map((p) => `<a href="${pageHref(p.slug)}"${p.slug === page.slug ? ' aria-current="page"' : ""}>${esc(p.label)}</a>`)
    .join("");

  // Highlight captions come from the site itself: section headings with their first line, else plain facts.
  const caps: { k: string; t: string }[] = [];
  for (const sec of normalize(page.sections)) {
    const line = [...sec.paragraphs, ...sec.items].find((x) => x.length >= 25);
    if (sec.heading && sec.heading.toLowerCase() !== lead.name.toLowerCase() && line && sec.heading.length <= 50) caps.push({ k: sec.heading, t: firstSentences(line, 120) });
    if (caps.length === 3) break;
  }
  for (const p of others) {
    if (caps.length === 3) break;
    const line = p.sections.flatMap((x) => [...x.paragraphs, ...x.items]).find((x) => x.length >= 25);
    if (line) caps.push({ k: p.label, t: firstSentences(line, 120) });
  }
  const facts = [{ k: "Location", t: where }, ...(hours[0] ? [{ k: "Hours", t: hours[0] }] : []), ...(phone ? [{ k: "Call", t: phone }] : email ? [{ k: "Email", t: email }] : [])];
  while (caps.length < 3 && facts.length) caps.push(facts.shift()!);
  // Highlights: three real facts from the site, each with a photograph (the site's own, else category photography).
  const ownPhotos = page.sections.flatMap((x) => x.images).filter((u) => /^https?:/.test(u)).map((u) => safeUrl(imageMap(u))).filter(Boolean);
  const highlightPhotos = [0, 1, 2].map((i) => ownPhotos[i + 1] ?? photoUrl(photos[(i + 1) % photos.length], 900));
  const chapter = isHome && caps.length
    ? `<section class="highlights" aria-label="Highlights">
  ${caps.map((c, i) => `<article class="hl rv">
    <figure class="hl-media"><img src="${highlightPhotos[i]}" alt="" loading="lazy" referrerpolicy="no-referrer"></figure>
    <h3>${esc(c.k)}</h3>
    <p>${esc(c.t)}</p>
  </article>`).join("")}
</section>`
    : "";

  const explore = isHome
    ? others.length
      ? `<section class="explore" aria-label="Explore">
  <div class="explore-list">
    <h2 class="section-title">Explore</h2>
    ${others.map((p) => `<a class="explore-item rv" href="${pageHref(p.slug)}">
      <span class="explore-label">${esc(p.label)}</span>
      <span class="explore-text">${esc(firstSentences(p.sections.flatMap((s) => [...s.paragraphs, ...s.items]).find((x) => x.length > 30) ?? p.title, 110))}</span>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6l-6 6"/></svg>
    </a>`).join("")}
  </div>
</section>`
      : ""
    : "";

  return `<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${isHome ? name : `${esc(page.label)} · ${name}`} · Concept redesign</title>
<script>document.documentElement.className='js';</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://images.unsplash.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${t.fonts}&display=swap">
<style>${css(t)}</style>
</head>
<body class="${bodyClass}${isHome ? " is-home" : ""}">

<div class="concept">Concept redesign of ${esc(domain)}, built from its own text and photos. Not the official website. <a href="${safeUrl(page.url)}" target="_blank" rel="noopener nofollow">View the current page</a></div>

<header class="nav${moreMenu ? " more" : ""}">
  <a class="brand" href="./"><span class="mono">${mono}</span><span class="brand-name">${name}</span></a>
  <nav class="nav-links" aria-label="Pages">${headerLinks}</nav>
  <a class="btn btn-sm nav-cta" href="${primaryHref}">${esc(t.cta)}</a>
  <button class="menu-btn" aria-expanded="false" aria-controls="menu" aria-label="Menu"><span></span><span></span></button>
</header>
<div class="menu" id="menu" hidden>
  <nav aria-label="Pages">${navLinks}</nav>
  <a class="btn" href="${primaryHref}">${esc(t.cta)}</a>
</div>

<main>
<section class="hero${isHome ? "" : " hero-sub-page"}" id="top">
  <div class="hero-media" style="background-image:url('${stockHero}')" data-candidates="${esc(JSON.stringify(siteImages))}"></div>
  <div class="hero-shade"></div>
  <div class="hero-inner">
    <p class="hero-kicker rv">${isHome ? `${esc(t.label)} in ${esc(lead.city)}` : name}</p>
    <h1 class="hero-title">${esc(heroTitle)}</h1>
    ${heroSub ? `<p class="hero-sub rv">${esc(heroSub)}</p>` : ""}
    <div class="hero-cta rv">
      <a class="btn" href="${primaryHref}">${esc(t.cta)}</a>
      <a class="btn btn-ghost" href="#content" data-scroll>Read more</a>
    </div>
  </div>
  ${isHome ? `<dl class="hero-facts">
    <div class="rv"><dt>Location</dt><dd>${esc(where)}</dd></div>
    ${hours.length ? `<div class="rv"><dt>Hours</dt><dd>${esc(hours[0])}</dd></div>` : ""}
    ${phone ? `<div class="rv"><dt>Phone</dt><dd><a href="tel:${tel}">${esc(phone)}</a></dd></div>` : email ? `<div class="rv"><dt>Email</dt><dd><a href="mailto:${esc(email)}">${esc(email)}</a></dd></div>` : ""}
  </dl>` : ""}
</section>

<div id="content">
${blocks.slice(0, 1).map(renderBlock).join("\n")}
${chapter}
${blocks.slice(1).map(renderBlock).join("\n")}
</div>

${explore}

<section class="visit" id="visit">
  <div class="visit-map">${hasMap
    ? `<iframe title="Map showing ${name}" src="${esc(mapSrc)}" loading="lazy"></iframe>`
    : `<img src="${photoUrl(photos[1] ?? photos[0], 1200)}" alt="" loading="lazy">`}</div>
  <div class="visit-card">
    <h2 class="section-title">Visit us</h2>
    <p class="visit-addr">${esc(where)}</p>
    <div class="visit-actions">
      <a class="btn" href="https://www.openstreetmap.org/search?query=${mapQ}" target="_blank" rel="noopener">Get directions</a>
      ${phone ? `<a class="btn btn-ghost" href="tel:${tel}">Call ${esc(phone)}</a>` : ""}
    </div>
    ${email ? `<p class="visit-mail"><a href="mailto:${esc(email)}">${esc(email)}</a></p>` : ""}
    ${hours.length ? `<div class="hours"><h3>Opening hours</h3><ul>${hours.map((h) => `<li>${esc(h)}</li>`).join("")}</ul></div>` : ""}
  </div>
</section>

<section class="cta-band" aria-label="${esc(t.cta)}">
  <h2 class="cta-title">${name}</h2>
  <a class="btn btn-lg" href="${primaryHref}">${esc(t.cta)}</a>
</section>
</main>

<footer class="foot">
  <div class="foot-brand"><span class="mono">${mono}</span><span>${name}</span></div>
  <nav aria-label="Footer">${navLinks}</nav>
  <span class="foot-note">© ${new Date().getFullYear()} ${name}. Concept by Revamp Radar.</span>
</footer>

<script>${clientScript()}</script>
</body>
</html>`;
}

let imageMap: (u: string) => string = (u) => u;

function img(src: string, alt: string, cls = ""): string {
  const u = safeUrl(/^https?:\/\//i.test(src) ? imageMap(src) : "");
  return u ? `<figure class="site-img ${cls}"><img src="${u}" alt="${esc(alt)}" loading="lazy" referrerpolicy="no-referrer"></figure>` : "";
}

function renderBlock(b: Block): string {
  switch (b.kind) {
    case "statement":
      return `<section class="statement"><p class="statement-text rv">${esc(b.text)}</p></section>`;
    case "split": {
      const s = b.section;
      const [first, ...rest] = s.images;
      return `<section class="split${b.flip ? " flip" : ""}">
  <div class="split-media">${img(first, s.heading || "Photo", "clip")}</div>
  <div class="split-copy">
    ${s.heading ? `<h2 class="section-title rv">${esc(s.heading)}</h2>` : ""}
    ${s.paragraphs.map((p) => `<p class="rv">${esc(p)}</p>`).join("")}
    ${s.items.length ? `<ul class="ticks">${s.items.map((x) => `<li class="rv">${esc(x)}</li>`).join("")}</ul>` : ""}
  </div>
  ${rest.length ? `<div class="split-more">${rest.map((r) => img(r, s.heading || "Photo")).join("")}</div>` : ""}
</section>`;
    }
    case "gallery":
      return `<section class="gallery" aria-label="${esc(b.heading || "Gallery")}">
  ${b.heading ? `<h2 class="section-title gallery-title">${esc(b.heading)}</h2>` : ""}
  <div class="g-track">${b.images.map((src, k) => img(src, `${b.heading || "Gallery"} ${k + 1}`, "g-item")).join("")}</div>
</section>`;
    case "list":
      return `<section class="listing">
  <div class="listing-head">${b.heading ? `<h2 class="section-title">${esc(b.heading)}</h2>` : ""}${b.images[0] ? img(b.images[0], b.heading || "Photo", "clip") : ""}</div>
  <ul class="listing-lines">${b.lines.map((l) => `<li class="rv">${esc(l)}</li>`).join("")}</ul>
</section>`;
    case "prose":
      return `<section class="prose">
  <div class="prose-head">${b.heading ? `<h2 class="section-title rv">${esc(b.heading)}</h2>` : ""}</div>
  <div class="prose-body">${b.paragraphs.map((p) => `<p class="rv">${esc(p)}</p>`).join("")}</div>
</section>`;
  }
}

function css(t: Theme): string {
  return `
:root{--bg:${t.bg};--surface:${t.surface};--ink:${t.ink};--muted:${t.muted};--line:${t.line};--accent:${t.accent};--accent-ink:${t.accentInk};--display:${t.display};--body:${t.body};--pad:clamp(20px,5vw,72px)}
*,*::before,*::after{box-sizing:border-box;margin:0}
html{-webkit-text-size-adjust:100%}
body{background:var(--bg);color:var(--ink);font:400 17px/1.7 var(--body);-webkit-font-smoothing:antialiased;overflow-x:hidden}
img{display:block;max-width:100%}
a{color:inherit}
h1,h2,h3{font-family:var(--display);font-weight:${t.displayWeight};letter-spacing:${t.displayTracking};line-height:1.04;overflow-wrap:anywhere}
:focus-visible{outline:2px solid var(--accent);outline-offset:3px}


.concept{position:relative;z-index:30;background:var(--accent);color:var(--accent-ink);font-size:13px;line-height:1.4;text-align:center;padding:8px 16px}
.concept a{font-weight:600}

.nav{position:fixed;top:36px;left:0;right:0;z-index:40;display:flex;align-items:center;gap:24px;padding:14px var(--pad);transition:background .4s,top .4s,border-color .4s,color .4s;border-bottom:1px solid transparent;color:#fff}
.nav.solid{top:0;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom-color:var(--line);color:var(--ink)}
.brand{display:flex;align-items:center;gap:12px;text-decoration:none;margin-right:auto;min-width:0}
.mono{width:38px;height:38px;flex:none;border-radius:50%;display:grid;place-items:center;background:var(--accent);color:var(--accent-ink);font:700 14px/1 var(--body);letter-spacing:.02em}
.brand-name{font:${t.displayWeight} 20px/1.1 var(--display);letter-spacing:${t.displayTracking};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:30vw}
.nav-links{display:flex;gap:22px;overflow:hidden}
.nav-links a{text-decoration:none;opacity:.8;font-size:15px;font-weight:500;white-space:nowrap;transition:opacity .2s,color .2s}
.nav-links a:hover,.nav-links a[aria-current]{opacity:1}
.nav-links a[aria-current]{text-decoration:underline;text-decoration-thickness:1.5px;text-underline-offset:6px}
.menu-btn{display:none;width:44px;height:44px;border:0;background:transparent;color:inherit;cursor:pointer;position:relative;flex:none}
.menu-btn span{position:absolute;left:11px;right:11px;height:2px;background:currentColor;transition:transform .3s}
.menu-btn span:first-child{top:17px}.menu-btn span:last-child{top:25px}
.menu-btn[aria-expanded="true"] span:first-child{transform:translateY(4px) rotate(45deg)}
.menu-btn[aria-expanded="true"] span:last-child{transform:translateY(-4px) rotate(-45deg)}
.menu{position:fixed;inset:0;z-index:39;background:var(--bg);padding:130px var(--pad) 40px;display:flex;flex-direction:column;gap:28px;overflow-y:auto}
.menu[hidden]{display:none}
.menu nav{display:flex;flex-direction:column;gap:8px}
.menu nav a{font:${t.displayWeight} clamp(1.8rem,7vw,3rem)/1.2 var(--display);letter-spacing:${t.displayTracking};text-decoration:none}
.menu nav a[aria-current]{color:var(--accent)}

.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:50px;padding:0 28px;border-radius:var(--rb);background:var(--accent);color:var(--accent-ink);font:600 15px/1 var(--body);text-decoration:none;border:0;cursor:pointer;transition:background .25s,color .25s;will-change:transform;text-align:center}
.btn:hover{background:color-mix(in srgb,var(--accent) 85%,#fff)}
.btn-sm{min-height:42px;padding:0 20px;font-size:14px;white-space:nowrap}
.nav.more .menu-btn{display:block}
.btn-lg{min-height:64px;padding:0 40px;font-size:17px}
.btn-ghost{background:transparent;color:inherit;box-shadow:inset 0 0 0 1.5px currentColor}
.btn-ghost:hover{background:var(--ink);color:var(--bg);box-shadow:none}
.hero .btn-ghost:hover{background:#fff;color:#111}

.hero{position:relative;min-height:100svh;display:flex;flex-direction:column;justify-content:flex-end;padding:160px var(--pad) 40px;overflow:hidden;color:#fff;isolation:isolate}
.hero-sub-page{min-height:76svh}
.hero-media{position:absolute;inset:-4%;background-size:cover;background-position:center;z-index:-3;}
.hero-shade{position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,rgba(0,0,0,.6) 0%,rgba(0,0,0,.2) 32%,rgba(0,0,0,.42) 60%,rgba(0,0,0,.86) 100%)}
.hero-inner{max-width:1100px}
.hero-kicker{font-size:15px;font-weight:500;color:rgba(255,255,255,.8);margin-bottom:18px}
.hero-title{font-size:clamp(2.8rem,8.6vw,8rem);line-height:.96;margin-bottom:26px;text-wrap:balance}
.hero-sub-page .hero-title{font-size:clamp(2.6rem,7vw,6.2rem)}
.hero-title .w{display:inline-block;overflow:hidden;vertical-align:top;padding-bottom:.08em}
.hero-title .w>span{display:inline-block}
.hero-sub{font-size:clamp(1.05rem,1.8vw,1.28rem);line-height:1.55;color:rgba(255,255,255,.88);max-width:38em;margin-bottom:34px}
.hero-cta{display:flex;gap:12px;flex-wrap:wrap}
.hero-facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:24px;margin-top:64px;padding-top:24px;border-top:1px solid rgba(255,255,255,.22)}
.hero-facts dt{font-size:13px;color:rgba(255,255,255,.62);margin-bottom:4px}
.hero-facts dd{font-size:15px;font-weight:500;margin:0}
.hero-facts a{text-decoration:none}

.section-title{font-size:clamp(2rem,4.4vw,3.6rem);margin-bottom:28px;text-wrap:balance}
#content>section{padding:clamp(80px,11vw,150px) var(--pad) 0;max-width:1440px;margin:0 auto}
#content>section:last-child{padding-bottom:clamp(80px,11vw,150px)}

.statement-text{font:${t.displayWeight} clamp(1.8rem,4.2vw,3.8rem)/1.16 var(--display);letter-spacing:${t.displayTracking};max-width:24em;text-wrap:pretty}

.split{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(32px,6vw,96px);align-items:center}
.split.flip .split-media{order:2}
.split.text-only{grid-template-columns:minmax(0,1fr)}
.split-copy p{color:var(--muted);font-size:1.08rem;margin-bottom:16px;max-width:36em}
.split-more{grid-column:1/-1;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px}
.site-img{border-radius:var(--r);overflow:hidden;background:var(--surface)}
.site-img img{width:100%;height:100%;object-fit:cover}
.split-media .site-img{aspect-ratio:4/5}
.split-more .site-img{aspect-ratio:4/3}

.ticks{list-style:none;padding:0;display:grid;gap:10px;margin-top:8px}
.ticks li{position:relative;padding-left:28px}
.ticks li::before{content:"";position:absolute;left:0;top:.55em;width:14px;height:8px;border-left:2px solid var(--accent);border-bottom:2px solid var(--accent);transform:rotate(-45deg)}

.listing{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:clamp(32px,6vw,96px);align-items:start}
.listing-head{position:sticky;top:110px;display:grid;gap:24px}
.listing-head .site-img{aspect-ratio:4/3}
.listing-lines{list-style:none;padding:0;columns:2 280px;column-gap:48px}
.listing-lines li{break-inside:avoid;padding:14px 0;border-bottom:1px solid var(--line)}

.prose{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:clamp(32px,6vw,96px);align-items:start}
.prose-head{position:sticky;top:110px}
.prose-body p{color:var(--muted);font-size:1.08rem;margin-bottom:18px;max-width:38em}
.prose-body p:first-child{color:var(--ink);font-size:1.22rem}

#content>.gallery{max-width:none;padding-left:0;padding-right:0;overflow:hidden}
.gallery-title{padding:0 var(--pad)}
.g-track{display:flex;gap:20px;padding:0 var(--pad);width:max-content}
.g-item{width:clamp(260px,32vw,500px);aspect-ratio:4/5;flex:none}
.g-item:nth-child(even){aspect-ratio:4/3;align-self:center}
.gallery:not(.pinned) .g-track{width:auto;flex-wrap:wrap;max-width:1440px;margin:0 auto}
.gallery:not(.pinned) .g-item{width:calc((100% - 40px)/3);min-width:240px}

.explore{display:grid;grid-template-columns:minmax(0,1fr);gap:clamp(32px,6vw,96px);padding:clamp(60px,9vw,130px) var(--pad);max-width:1440px;margin:0 auto;align-items:start}
.explore.solo{grid-template-columns:1fr}
.explore-visual{position:sticky;top:12vh;height:72vh;border-radius:var(--r);overflow:hidden;background:radial-gradient(120% 90% at 30% 20%,color-mix(in srgb,var(--accent) 22%,var(--surface)) 0%,var(--surface) 62%)}
.explore.solo .explore-visual{position:relative;top:0;height:60vh}
.explore-item{display:grid;grid-template-columns:1fr auto;gap:4px 20px;padding:26px 0;border-top:1px solid var(--line);text-decoration:none;transition:padding .35s cubic-bezier(.2,.8,.2,1)}
.explore-item:last-child{border-bottom:1px solid var(--line)}
.explore-item:hover{padding-left:12px}
.explore-label{font:${t.displayWeight} clamp(1.4rem,2.4vw,2rem)/1.15 var(--display);letter-spacing:${t.displayTracking}}
.explore-text{grid-column:1;color:var(--muted);font-size:.98rem}
.explore-item svg{grid-row:1/3;grid-column:2;align-self:center;width:28px;height:28px;fill:none;stroke:var(--accent);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;transition:transform .3s}
.explore-item:hover svg{transform:translateX(6px)}

.visit{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);margin:clamp(40px,6vw,80px) var(--pad) clamp(100px,12vw,160px);border-radius:var(--r);overflow:hidden;background:var(--surface);border:1px solid var(--line)}
.visit-map{min-height:440px;background:var(--bg)}
.visit-map iframe,.visit-map img{width:100%;height:100%;min-height:440px;border:0;object-fit:cover;display:block;filter:${t.dark ? "grayscale(.5) contrast(1.05)" : "saturate(.85)"}}
.visit-card{padding:clamp(28px,4vw,56px)}
.visit-card .section-title{margin-bottom:18px}
.visit-addr{font-size:1.2rem;margin-bottom:26px}
.visit-actions{display:flex;flex-wrap:wrap;gap:12px}
.visit-mail{margin-top:20px}.visit-mail a{color:var(--accent);font-weight:600}
.hours{margin-top:34px;padding-top:26px;border-top:1px solid var(--line)}
.hours h3{font:600 15px/1.2 var(--body);letter-spacing:0;margin-bottom:12px}
.hours ul{list-style:none;padding:0;display:grid;gap:8px;color:var(--muted)}

.cta-band{display:flex;flex-direction:column;align-items:center;gap:40px;padding:clamp(60px,8vw,110px) 0 clamp(90px,10vw,140px);overflow:hidden;border-top:1px solid var(--line)}

.foot{display:grid;grid-template-columns:auto 1fr auto;gap:24px;align-items:center;padding:32px var(--pad);border-top:1px solid var(--line);color:var(--muted);font-size:14px}
.foot-brand{display:flex;align-items:center;gap:12px;color:var(--ink);font-weight:600}
.foot nav{display:flex;flex-wrap:wrap;gap:8px 20px;justify-content:center}
.foot nav a{text-decoration:none}.foot nav a:hover{color:var(--accent)}


.js .rv{opacity:0;transform:translateY(12px);transition:opacity .7s ease,transform .7s ease}
.js .rv.in{opacity:1;transform:none}

body{--r:14px;--rb:8px}
body.corners-sharp{--r:2px;--rb:2px}
body.corners-round{--r:20px;--rb:999px}
body.upper h1,body.upper h2,body.upper .explore-label,body.upper .brand-name{text-transform:uppercase}

/* Hero layouts */
body.hero-split .nav:not(.solid),body.hero-editorial .nav:not(.solid){color:var(--ink)}
body.hero-split .hero,body.hero-editorial .hero{color:var(--ink)}
body.hero-split .hero-shade,body.hero-split #hero-gl,body.hero-editorial .hero-shade,body.hero-editorial #hero-gl{display:none}
body.hero-split .hero-kicker,body.hero-split .hero-sub,body.hero-split .hero-facts dt,
body.hero-editorial .hero-kicker,body.hero-editorial .hero-sub,body.hero-editorial .hero-facts dt{color:var(--muted)}
body.hero-split .hero-facts,body.hero-editorial .hero-facts{border-top-color:var(--line)}
body.hero-split .hero .btn-ghost:hover,body.hero-editorial .hero .btn-ghost:hover{background:var(--ink);color:var(--bg)}
body.hero-split .hero{padding-right:calc(50% + 24px)}
body.hero-split .hero-title{font-size:clamp(2.6rem,5.4vw,5.6rem)}
body.hero-split .hero-media{inset:auto;left:52%;right:var(--pad);top:130px;bottom:40px;border-radius:var(--r);animation:none}
body.hero-editorial .hero{justify-content:flex-start;padding-top:170px;min-height:auto}
body.hero-editorial .hero-title{font-size:clamp(3.2rem,11vw,10.5rem);line-height:.9}
body.hero-editorial .hero-inner{max-width:none;order:1}
body.hero-editorial .hero-media{position:relative;inset:auto;order:2;height:58vh;margin:48px 0 0;border-radius:var(--r);animation:none}
body.hero-editorial .hero-facts{order:3;margin-top:32px}
body.hero-centered .hero{justify-content:center;align-items:center;text-align:center}
body.hero-centered .hero-inner{margin:0 auto;display:flex;flex-direction:column;align-items:center}
body.hero-centered .hero-sub{margin-left:auto;margin-right:auto}
body.hero-centered .hero-cta{justify-content:center}
body.hero-centered .hero-facts{width:100%;text-align:left}

@media (max-width:1100px){.nav-links{display:none}.menu-btn{display:block}}
@media (max-width:900px){
  .split,.listing,.prose,.explore,.visit{grid-template-columns:1fr}
  .split.flip .split-media{order:0}
  .listing-head,.prose-head{position:static}
  .gallery .g-track{overflow-x:auto;width:auto;flex-wrap:nowrap!important;scroll-snap-type:x mandatory;padding-bottom:12px}
  .g-item{scroll-snap-align:center;width:78vw!important}
  .visit-map,.visit-map iframe,.visit-map img{min-height:300px}
  .foot{grid-template-columns:1fr;justify-items:start}
  .foot nav{justify-content:flex-start}
  body.hero-split .hero{padding-right:var(--pad);padding-top:130px;min-height:auto}
  body.hero-split .hero-media{position:relative;left:auto;right:auto;top:auto;bottom:auto;height:44vh;order:-1;margin-bottom:28px}
}
@media (max-width:560px){.nav-cta{display:none}.nav{gap:12px;top:52px}.nav.solid{top:0}.hero{padding-top:140px}.concept{font-size:12px}.brand-name{max-width:52vw}}
@media (prefers-reduced-motion:reduce){
}
.highlights{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(20px,3vw,40px);padding:clamp(56px,8vw,112px) var(--pad);max-width:1320px;margin:0 auto}
.hl{display:grid;gap:12px;align-content:start}
.hl-media{margin:0 0 6px;aspect-ratio:4/5;overflow:hidden;border-radius:var(--r);background:var(--surface)}
.hl-media img{width:100%;height:100%;object-fit:cover;display:block}
.hl-media.empty{display:none}
.hl h3{font:${t.displayWeight} clamp(1.25rem,1.8vw,1.6rem)/1.2 var(--display);letter-spacing:${t.displayTracking};margin:0}
.hl p{margin:0;color:var(--muted);max-width:42ch}
.cta-title{font:${t.displayWeight} clamp(2rem,5vw,4rem)/1.05 var(--display);letter-spacing:${t.displayTracking};margin:0 0 28px}
@media (max-width:900px){.highlights{grid-template-columns:1fr}.hl-media{aspect-ratio:16/10}}
`;
}

/**
 * Deliberately quiet: no loaders, cursors, WebGL or scroll hijacking. Content fades in once as it enters the view,
 * the header turns solid on scroll, and the business's own photos are used when they are good enough.
 */
function clientScript(): string {
  return `
(function(){
  function $(s,r){return (r||document).querySelector(s)}
  function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Keep the site's own photos, but drop ones too small or broken to look good at the new size.
  $$('.site-img img, .hl-media img').forEach(function(img){
    function drop(){
      var f = img.closest('figure'), split = img.closest('.split');
      if (img.closest('.hl-media')) { f.classList.add('empty'); return; }
      if (f) f.remove();
      if (split && !split.querySelector('.split-media figure')) split.classList.add('text-only');
    }
    // Too small, a logo, or a wide banner graphic: not a photograph worth showing large.
    function check(){ var w = img.naturalWidth, h = img.naturalHeight || 1; if (w < 240 || w / h > 2.6 || /logo|icon|favicon|banner|header/i.test(img.currentSrc || img.src)) drop(); }
    img.addEventListener('error', drop);
    if (img.complete) check(); else img.addEventListener('load', check);
  });

  // Hero: the business's own large landscape photo when it has one; otherwise the category photograph.
  var media = $('.hero-media');
  try {
    var cands = JSON.parse(media.getAttribute('data-candidates') || '[]');
    (function tryNext(i){
      if (i >= cands.length) return;
      var im = new Image(); im.referrerPolicy = 'no-referrer';
      im.onload = function(){
        if (im.naturalWidth >= 1100 && im.naturalWidth >= im.naturalHeight && im.naturalWidth / im.naturalHeight < 2.6 && !/logo|icon|banner/i.test(cands[i])) media.style.backgroundImage = 'url("' + cands[i] + '")';
        else tryNext(i + 1);
      };
      im.onerror = function(){ tryNext(i + 1); };
      im.src = cands[i];
    })(0);
  } catch (e) {}

  var nav = $('.nav'), btn = $('.menu-btn'), menu = $('#menu');
  function onScroll(){ nav.classList.toggle('solid', scrollY > 30 || btn.getAttribute('aria-expanded') === 'true'); }
  onScroll(); addEventListener('scroll', onScroll, { passive: true });
  btn.addEventListener('click', function(){
    var open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open)); menu.hidden = !open; onScroll();
    document.body.style.overflow = open ? 'hidden' : '';
  });
  $$('[data-scroll]').forEach(function(a){
    a.addEventListener('click', function(e){
      var el = $(a.getAttribute('href')); if (!el) return;
      e.preventDefault(); el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  // One gentle fade as content first comes into view.
  var items = $$('.rv');
  if (reduce || !('IntersectionObserver' in window)) { items.forEach(function(el){ el.classList.add('in'); }); return; }
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' });
  items.forEach(function(el){ io.observe(el); });
  requestAnimationFrame(function(){ $$('.hero .rv').forEach(function(el){ el.classList.add('in'); }); });
})();`;
}
