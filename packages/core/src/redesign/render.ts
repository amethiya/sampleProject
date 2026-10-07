import { countryName } from "../categories";
import type { SitePage, SiteSection, SiteSnapshot } from "../crawl";
import type { Lead } from "../types";
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
}

export function renderSitePage(lead: RedesignInput, site: SiteSnapshot, slug: string, opts: RenderOptions = {}): string {
  const t = THEMES[lead.category];
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

  const explore = isHome
    ? others.length
      ? `<section class="explore" aria-label="Explore">
  <div class="explore-visual"><canvas id="obj-gl" aria-hidden="true"></canvas></div>
  <div class="explore-list">
    <h2 class="section-title">Explore</h2>
    ${others.map((p) => `<a class="explore-item rv" href="${pageHref(p.slug)}">
      <span class="explore-label">${esc(p.label)}</span>
      <span class="explore-text">${esc(firstSentences(p.sections.flatMap((s) => [...s.paragraphs, ...s.items]).find((x) => x.length > 30) ?? p.title, 110))}</span>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6l-6 6"/></svg>
    </a>`).join("")}
  </div>
</section>`
      : `<section class="explore solo" aria-hidden="true"><div class="explore-visual"><canvas id="obj-gl"></canvas></div></section>`
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
<body class="${t.dark ? "dark" : "light"}${isHome ? " is-home" : ""}">

<div class="loader" aria-hidden="true"><div class="loader-mark">${mono}</div><div class="loader-bar"><i></i></div></div>

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
  <canvas id="hero-gl" aria-hidden="true"></canvas>
  <div class="hero-shade"></div>
  <div class="hero-inner">
    <p class="hero-kicker rv">${isHome ? `${esc(t.label)} in ${esc(lead.city)}` : name}</p>
    <h1 class="hero-title">${heroTitle.split(/\s+/).filter(Boolean).map((w) => `<span class="w"><span>${esc(w)}</span></span>`).join(" ")}</h1>
    ${heroSub ? `<p class="hero-sub rv">${esc(heroSub)}</p>` : ""}
    <div class="hero-cta rv">
      <a class="btn magnetic" href="${primaryHref}">${esc(t.cta)}</a>
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
${blocks.map(renderBlock).join("\n")}
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
  <div class="marquee" aria-hidden="true"><div class="marquee-inner">${`<span>${esc(t.cta)}</span><span class="dot"></span>`.repeat(6)}</div></div>
  <a class="btn btn-lg magnetic" href="${primaryHref}">${esc(t.cta)}</a>
</section>
</main>

<footer class="foot">
  <div class="foot-brand"><span class="mono">${mono}</span><span>${name}</span></div>
  <nav aria-label="Footer">${navLinks}</nav>
  <span class="foot-note">© ${new Date().getFullYear()} ${name}. Concept by Revamp Radar.</span>
</footer>

<div class="cursor" aria-hidden="true"></div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>${clientScript(t, stockHero)}</script>
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
      return `<section class="statement"><p class="statement-text">${b.text.split(/\s+/).map((w) => `<span class="sw">${esc(w)}</span>`).join(" ")}</p></section>`;
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
      return `<section class="gallery${b.images.length >= 4 ? " pinned" : ""}" aria-label="${esc(b.heading || "Gallery")}">
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
html.lenis,html.lenis body{height:auto}
.lenis.lenis-smooth{scroll-behavior:auto!important}
body{background:var(--bg);color:var(--ink);font:400 17px/1.7 var(--body);-webkit-font-smoothing:antialiased;overflow-x:hidden}
img{display:block;max-width:100%}
a{color:inherit}
h1,h2,h3{font-family:var(--display);font-weight:${t.displayWeight};letter-spacing:${t.displayTracking};line-height:1.04;overflow-wrap:anywhere}
:focus-visible{outline:2px solid var(--accent);outline-offset:3px}

.loader{position:fixed;inset:0;z-index:100;background:var(--bg);display:grid;place-items:center;align-content:center;gap:22px}
.loader-mark{font:${t.displayWeight} clamp(40px,8vw,72px)/1 var(--display);letter-spacing:${t.displayTracking};color:var(--accent)}
.loader-bar{width:160px;height:2px;background:var(--line);overflow:hidden}
.loader-bar i{display:block;height:100%;width:100%;background:var(--accent);transform:scaleX(0);transform-origin:left}
.no-js .loader{display:none}

.concept{position:relative;z-index:30;background:var(--accent);color:var(--accent-ink);font-size:13px;line-height:1.4;text-align:center;padding:8px 16px}
.concept a{font-weight:600}

.nav{position:fixed;top:36px;left:0;right:0;z-index:40;display:flex;align-items:center;gap:24px;padding:14px var(--pad);transition:background .4s,top .4s,border-color .4s,color .4s;border-bottom:1px solid transparent;color:#fff}
.nav.solid{top:0;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom-color:var(--line);color:var(--ink)}
.brand{display:flex;align-items:center;gap:12px;text-decoration:none;margin-right:auto;min-width:0}
.mono{width:38px;height:38px;flex:none;border-radius:50%;display:grid;place-items:center;background:var(--accent);color:var(--accent-ink);font:700 14px/1 var(--body);letter-spacing:.02em}
.brand-name{font:${t.displayWeight} 20px/1.1 var(--display);letter-spacing:${t.displayTracking};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:30vw}
.nav-links{display:flex;gap:22px;overflow:hidden}
.nav-links a{text-decoration:none;opacity:.8;font-size:15px;font-weight:500;white-space:nowrap;transition:opacity .2s,color .2s}
.nav-links a:hover,.nav-links a[aria-current]{opacity:1;color:var(--accent)}
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

.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:50px;padding:0 28px;border-radius:999px;background:var(--accent);color:var(--accent-ink);font:600 15px/1 var(--body);text-decoration:none;border:0;cursor:pointer;transition:background .25s,color .25s;will-change:transform;text-align:center}
.btn:hover{background:color-mix(in srgb,var(--accent) 85%,#fff)}
.btn-sm{min-height:42px;padding:0 20px;font-size:14px;white-space:nowrap}
.nav.more .menu-btn{display:block}
.btn-lg{min-height:64px;padding:0 40px;font-size:17px}
.btn-ghost{background:transparent;color:inherit;box-shadow:inset 0 0 0 1.5px currentColor}
.btn-ghost:hover{background:var(--ink);color:var(--bg);box-shadow:none}
.hero .btn-ghost:hover{background:#fff;color:#111}

.hero{position:relative;min-height:100svh;display:flex;flex-direction:column;justify-content:flex-end;padding:160px var(--pad) 40px;overflow:hidden;color:#fff;isolation:isolate}
.hero-sub-page{min-height:76svh}
.hero-media{position:absolute;inset:-4%;background-size:cover;background-position:center;z-index:-3;animation:kb 26s ease-in-out infinite alternate}
@keyframes kb{to{transform:scale(1.08) translate(-1.5%,-1%)}}
#hero-gl{position:absolute;inset:0;width:100%;height:100%;z-index:-2;opacity:0;transition:opacity 1.2s}
#hero-gl.on{opacity:1}
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
.site-img{border-radius:22px;overflow:hidden;background:var(--surface)}
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

.explore{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(32px,6vw,96px);padding:clamp(60px,9vw,130px) var(--pad);max-width:1440px;margin:0 auto;align-items:start}
.explore.solo{grid-template-columns:1fr}
.explore-visual{position:sticky;top:12vh;height:72vh;border-radius:28px;overflow:hidden;background:radial-gradient(120% 90% at 30% 20%,color-mix(in srgb,var(--accent) 22%,var(--surface)) 0%,var(--surface) 62%)}
.explore.solo .explore-visual{position:relative;top:0;height:60vh}
#obj-gl{width:100%;height:100%;display:block}
.explore-item{display:grid;grid-template-columns:1fr auto;gap:4px 20px;padding:26px 0;border-top:1px solid var(--line);text-decoration:none;transition:padding .35s cubic-bezier(.2,.8,.2,1)}
.explore-item:last-child{border-bottom:1px solid var(--line)}
.explore-item:hover{padding-left:12px}
.explore-label{font:${t.displayWeight} clamp(1.4rem,2.4vw,2rem)/1.15 var(--display);letter-spacing:${t.displayTracking}}
.explore-text{grid-column:1;color:var(--muted);font-size:.98rem}
.explore-item svg{grid-row:1/3;grid-column:2;align-self:center;width:28px;height:28px;fill:none;stroke:var(--accent);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;transition:transform .3s}
.explore-item:hover svg{transform:translateX(6px)}

.visit{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);margin:clamp(40px,6vw,80px) var(--pad) clamp(100px,12vw,160px);border-radius:28px;overflow:hidden;background:var(--surface);border:1px solid var(--line)}
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
.marquee{width:100%;overflow:hidden}
.marquee-inner{display:flex;align-items:center;gap:48px;width:max-content;font:${t.displayWeight} clamp(3rem,10vw,9rem)/1.1 var(--display);letter-spacing:${t.displayTracking};white-space:nowrap;animation:mq 30s linear infinite}
.marquee-inner .dot{width:.24em;height:.24em;border-radius:50%;background:var(--accent);flex:none}
@keyframes mq{to{transform:translateX(-50%)}}

.foot{display:grid;grid-template-columns:auto 1fr auto;gap:24px;align-items:center;padding:32px var(--pad);border-top:1px solid var(--line);color:var(--muted);font-size:14px}
.foot-brand{display:flex;align-items:center;gap:12px;color:var(--ink);font-weight:600}
.foot nav{display:flex;flex-wrap:wrap;gap:8px 20px;justify-content:center}
.foot nav a{text-decoration:none}.foot nav a:hover{color:var(--accent)}

.cursor{position:fixed;left:0;top:0;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;background:var(--accent);pointer-events:none;z-index:90;transition:width .25s,height .25s,margin .25s,opacity .25s;opacity:0}
.cursor.big{width:54px;height:54px;margin:-27px 0 0 -27px;opacity:.3!important}
@media (hover:none),(pointer:coarse){.cursor{display:none}}

.js .hero-title .w>span{transform:translateY(108%)}
.js .rv{opacity:0;transform:translateY(26px)}
.js .sw{opacity:.16}

@media (max-width:1100px){.nav-links{display:none}.menu-btn{display:block}}
@media (max-width:900px){
  .split,.listing,.prose,.explore,.visit{grid-template-columns:1fr}
  .split.flip .split-media{order:0}
  .listing-head,.prose-head{position:static}
  .explore-visual{position:relative;top:0;height:52vh}
  .gallery .g-track{overflow-x:auto;width:auto;flex-wrap:nowrap!important;scroll-snap-type:x mandatory;padding-bottom:12px}
  .g-item{scroll-snap-align:center;width:78vw!important}
  .visit-map,.visit-map iframe,.visit-map img{min-height:300px}
  .foot{grid-template-columns:1fr;justify-items:start}
  .foot nav{justify-content:flex-start}
}
@media (max-width:560px){.nav-cta{display:none}.nav{gap:12px;top:52px}.nav.solid{top:0}.hero{padding-top:140px}.concept{font-size:12px}.brand-name{max-width:52vw}}
@media (prefers-reduced-motion:reduce){
  .hero-media,.marquee-inner{animation:none}
  .js .hero-title .w>span,.js .rv{transform:none;opacity:1}.js .sw{opacity:1}
}
`;
}

function clientScript(t: Theme, stockHero: string): string {
  return `
(function(){
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var loader = document.querySelector('.loader');
  function $(s,r){return (r||document).querySelector(s)}
  function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
  function refresh(){ if (hasGsap) ScrollTrigger.refresh(); }

  // Keep the site's own photos, but drop ones too small or broken to look good at the new size.
  $$('.site-img img').forEach(function(img){
    function drop(){
      var f = img.closest('figure'), split = img.closest('.split');
      if (f) f.remove();
      if (split && !split.querySelector('.split-media figure')) split.classList.add('text-only');
      refresh();
    }
    function check(){ if (img.naturalWidth < 240) drop(); }
    img.addEventListener('error', drop);
    if (img.complete) check(); else img.addEventListener('load', check);
  });

  // Hero: the business's own large photo when it has one; otherwise the category photo with the WebGL effect.
  var media = $('.hero-media'), siteHero = false;
  try {
    var cands = JSON.parse(media.getAttribute('data-candidates') || '[]');
    (function tryNext(i){
      if (i >= cands.length) return;
      var im = new Image(); im.referrerPolicy = 'no-referrer';
      im.onload = function(){
        if (im.naturalWidth >= 1100 && im.naturalWidth >= im.naturalHeight) {
          siteHero = true; media.style.backgroundImage = 'url("' + cands[i] + '")';
          var c = $('#hero-gl'); if (c) c.remove();
        } else tryNext(i + 1);
      };
      im.onerror = function(){ tryNext(i + 1); };
      im.src = cands[i];
    })(0);
  } catch (e) {}

  var nav = $('.nav'), btn = $('.menu-btn'), menu = $('#menu');
  function onScroll(y){ nav.classList.toggle('solid', y > 30 || btn.getAttribute('aria-expanded') === 'true'); }
  onScroll(scrollY);
  btn.addEventListener('click', function(){
    var open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open)); menu.hidden = !open; onScroll(scrollY);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  if (!hasGsap) {
    document.documentElement.className = 'no-js';
    addEventListener('scroll', function(){ onScroll(scrollY); }, { passive: true });
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  var lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: .09 });
    lenis.on('scroll', function(e){ ScrollTrigger.update(); onScroll(e.scroll); });
    gsap.ticker.add(function(time){ lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  } else {
    addEventListener('scroll', function(){ onScroll(scrollY); }, { passive: true });
  }
  $$('[data-scroll]').forEach(function(a){
    a.addEventListener('click', function(e){
      var el = $(a.getAttribute('href')); if (!el) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(el, { offset: -70 }); else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  if (reduce) { loader.remove(); initGL(true); return; }

  // One orchestrated entrance, shorter on inner pages so moving between pages stays quick.
  var inner = !document.body.classList.contains('is-home');
  gsap.timeline()
    .to('.loader-bar i', { scaleX: 1, duration: inner ? .35 : .9, ease: 'power2.inOut' })
    .to('.loader-mark', { y: -20, opacity: 0, duration: .3, ease: 'power2.in' }, '-=.1')
    .to(loader, { yPercent: -100, duration: inner ? .6 : .9, ease: 'expo.inOut', onComplete: function(){ loader.remove(); } }, '-=.1')
    .to('.hero-title .w>span', { y: 0, duration: 1.1, ease: 'expo.out', stagger: .08 }, '-=.45')
    .to('.hero .rv', { opacity: 1, y: 0, duration: .9, ease: 'power3.out', stagger: .08 }, '-=.8');

  $$('.statement').forEach(function(s){
    gsap.to($$('.sw', s), { opacity: 1, stagger: .5, ease: 'none', scrollTrigger: { trigger: s, start: 'top 75%', end: 'bottom 55%', scrub: true } });
  });
  $$('main .rv').forEach(function(el){
    if (el.closest('.hero')) return;
    gsap.to(el, { opacity: 1, y: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%' } });
  });
  gsap.to('.hero-inner', { yPercent: -16, opacity: .25, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // Photos reveal through a widening mask and settle as you scroll.
  $$('.site-img.clip').forEach(function(f){
    gsap.fromTo(f, { clipPath: 'inset(14% 10% 14% 10% round 22px)' }, { clipPath: 'inset(0% 0% 0% 0% round 22px)', ease: 'none', scrollTrigger: { trigger: f, start: 'top 92%', end: 'center 60%', scrub: true } });
    var im = $('img', f);
    if (im) gsap.fromTo(im, { scale: 1.2 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  $$('.split-more .site-img, .gallery:not(.pinned) .site-img').forEach(function(f, i){
    gsap.from(f, { opacity: 0, y: 40, duration: 1, ease: 'power3.out', delay: (i % 3) * .08, scrollTrigger: { trigger: f, start: 'top 94%' } });
  });

  var mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', function(){
    $$('.gallery.pinned').forEach(function(g){
      var track = $('.g-track', g);
      function dist(){ return Math.max(0, track.scrollWidth - innerWidth); }
      gsap.to(track, { x: function(){ return -dist(); }, ease: 'none',
        scrollTrigger: { trigger: g, start: 'top top', end: function(){ return '+=' + dist(); }, pin: true, scrub: 1, invalidateOnRefresh: true } });
    });
  });

  var skew = gsap.quickTo('.marquee-inner', 'skewX', { duration: .4, ease: 'power3' });
  ScrollTrigger.create({ onUpdate: function(s){ skew(gsap.utils.clamp(-8, 8, s.getVelocity() / -300)); } });

  if (matchMedia('(pointer: fine)').matches) {
    var cur = $('.cursor');
    var cx = gsap.quickTo(cur, 'x', { duration: .25, ease: 'power3' }), cy = gsap.quickTo(cur, 'y', { duration: .25, ease: 'power3' });
    addEventListener('pointermove', function(e){ cur.style.opacity = 1; cx(e.clientX); cy(e.clientY); });
    $$('a,button').forEach(function(el){
      el.addEventListener('pointerenter', function(){ cur.classList.add('big'); });
      el.addEventListener('pointerleave', function(){ cur.classList.remove('big'); });
    });
    $$('.magnetic').forEach(function(b){
      b.addEventListener('pointermove', function(e){ var r = b.getBoundingClientRect(); gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .3, y: (e.clientY - r.top - r.height / 2) * .4, duration: .4, ease: 'power3' }); });
      b.addEventListener('pointerleave', function(){ gsap.to(b, { x: 0, y: 0, duration: .7, ease: 'elastic.out(1,.4)' }); });
    });
  }

  setTimeout(refresh, 1500);
  initGL(false);

  function initGL(still){
    if (!window.THREE) return;
    if ($('#hero-gl')) { try { heroGL(still); } catch (e) {} }
    if ($('#obj-gl')) { try { objectGL(still); } catch (e) {} }
  }

  function visibleLoop(el, fn){
    var on = true;
    new IntersectionObserver(function(es){ on = es[0].isIntersecting; }).observe(el);
    (function tick(){ if (!document.body.contains(el)) return; requestAnimationFrame(tick); if (on) fn(); })();
  }

  function heroGL(still){
    var T = THREE, canvas = $('#hero-gl'), hero = $('.hero');
    var r = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    r.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    var scene = new T.Scene(), cam = new T.PerspectiveCamera(40, 1, .1, 10); cam.position.z = 2;
    var uni = { uTex: { value: null }, uTime: { value: 0 }, uMouse: { value: new T.Vector2(0, 0) }, uRes: { value: new T.Vector2(1, 1) }, uImg: { value: new T.Vector2(1, 1) }, uScroll: { value: 0 } };
    var mat = new T.ShaderMaterial({ uniforms: uni,
      vertexShader: 'uniform float uTime;uniform vec2 uMouse;varying vec2 vUv;void main(){vUv=uv;vec3 p=position;float d=distance(uv,uMouse*.5+.5);p.z+=sin(p.x*2.2+uTime*.5)*.035+cos(p.y*2.8+uTime*.35)*.03+(1.-smoothstep(0.,.42,d))*.12;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
      fragmentShader: 'uniform sampler2D uTex;uniform vec2 uRes;uniform vec2 uImg;uniform vec2 uMouse;uniform float uScroll;varying vec2 vUv;vec2 cover(vec2 uv){float rs=uRes.x/uRes.y,ri=uImg.x/uImg.y;vec2 s=rs<ri?vec2(rs/ri,1.):vec2(1.,ri/rs);return (uv-.5)*s+.5;}void main(){vec2 m=uMouse*.5+.5;float d=distance(vUv,m);float f=1.-smoothstep(0.,.42,d);vec2 uv=cover(vUv);uv=(uv-.5)*(.94-uScroll*.08)+.5;uv+=normalize(vUv-m+1e-4)*.008*f;float k=.0012*f;vec3 c=vec3(texture2D(uTex,uv+vec2(k,0.)).r,texture2D(uTex,uv).g,texture2D(uTex,uv-vec2(k,0.)).b);gl_FragColor=vec4(c,1.);}' });
    var mesh = new T.Mesh(new T.PlaneGeometry(1, 1, 96, 96), mat); scene.add(mesh);
    function size(){
      var w = hero.clientWidth, h = hero.clientHeight; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
      var vh = 2 * Math.tan(cam.fov * Math.PI / 360) * cam.position.z; mesh.scale.set(vh * cam.aspect * 1.12, vh * 1.12, 1); uni.uRes.value.set(w, h);
    }
    size(); addEventListener('resize', size);
    var target = new T.Vector2(0, 0);
    addEventListener('pointermove', function(e){ target.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight * 2 - 1)); });
    if (window.ScrollTrigger) ScrollTrigger.create({ trigger: hero, start: 'top top', end: 'bottom top', onUpdate: function(s){ uni.uScroll.value = s.progress; } });
    var tl = new T.TextureLoader(); tl.setCrossOrigin('anonymous');
    tl.load(${JSON.stringify(stockHero)}, function(tex){
      if (siteHero || !document.body.contains(canvas)) return;
      tex.minFilter = T.LinearFilter; uni.uTex.value = tex; uni.uImg.value.set(tex.image.width, tex.image.height); canvas.classList.add('on');
      var clock = new T.Clock();
      if (still) { r.render(scene, cam); return; }
      visibleLoop(canvas, function(){
        uni.uTime.value = clock.getElapsedTime(); uni.uMouse.value.lerp(target, .06);
        mesh.rotation.y = uni.uMouse.value.x * .06; mesh.rotation.x = -uni.uMouse.value.y * .05;
        r.render(scene, cam);
      });
    });
  }

  // A category object built from primitives, lit like product photography; turns as you scroll.
  function objectGL(still){
    var T = THREE, canvas = $('#obj-gl'), box = canvas.parentElement;
    var r = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    r.outputEncoding = T.sRGBEncoding;
    var scene = new T.Scene(), cam = new T.PerspectiveCamera(35, 1, .1, 50); cam.position.set(0, .4, 8.5);
    var accent = new T.Color('${t.accent}');
    scene.add(new T.HemisphereLight(0xffffff, ${t.dark ? "0x202020" : "0xb8c4cc"}, ${t.dark ? ".6" : ".9"}));
    var key = new T.DirectionalLight(0xffffff, 1.3); key.position.set(4, 6, 5); scene.add(key);
    var rim = new T.PointLight(accent, 2.2, 20); rim.position.set(-5, 2, -3); scene.add(rim);
    var fill = new T.PointLight(0xffffff, .6, 20); fill.position.set(0, -4, 4); scene.add(fill);
    function M(color, metal, rough){ return new T.MeshPhysicalMaterial({ color: color, metalness: metal, roughness: rough, clearcoat: 1, clearcoatRoughness: .2 }); }
    var g = new T.Group(); scene.add(g); var floaters = [];
    var kind = '${t.object}';
    if (kind === 'rings') {
      var brass = M(accent, .85, .22);
      for (var i = 0; i < 3; i++) { var ring = new T.Mesh(new T.TorusGeometry(1.55 - i * .32, .07, 32, 180), brass); ring.rotation.set(i * .9, i * .6, 0); ring.userData.s = .003 + i * .002; floaters.push(ring); g.add(ring); }
      g.add(new T.Mesh(new T.SphereGeometry(.42, 64, 64), M(0xf4ede3, .1, .15)));
    }
    if (kind === 'dumbbell') {
      var steel = M(0xbfc4cc, .9, .28), rubber = M(0x1c1d21, .2, .55), band = M(accent, .3, .35);
      g.add(new T.Mesh(new T.CylinderGeometry(.11, .11, 3.6, 48), steel));
      [-1, 1].forEach(function(s){
        [[.95, .34, 1.15], [.75, .28, 1.48]].forEach(function(p){
          var plate = new T.Mesh(new T.CylinderGeometry(p[0], p[0], p[1], 72), rubber); plate.position.y = s * p[2]; g.add(plate);
          var lip = new T.Mesh(new T.TorusGeometry(p[0] - .02, .035, 16, 96), band); lip.rotation.x = Math.PI / 2; lip.position.y = s * (p[2] + p[1] / 2); g.add(lip);
        });
        var cap = new T.Mesh(new T.CylinderGeometry(.2, .2, .18, 32), steel); cap.position.y = s * 1.75; g.add(cap);
      });
      g.rotation.z = Math.PI / 2.6;
    }
    if (kind === 'capsules') {
      var white = M(0xffffff, 0, .18), tint = M(accent, .1, .2);
      var capsule = function(){
        var c = new T.Group();
        var a = new T.Mesh(new T.CylinderGeometry(.32, .32, .55, 48), white); a.position.y = .275;
        var b = new T.Mesh(new T.CylinderGeometry(.32, .32, .55, 48), tint); b.position.y = -.275;
        var ta = new T.Mesh(new T.SphereGeometry(.32, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), white); ta.position.y = .55;
        var tb = new T.Mesh(new T.SphereGeometry(.32, 48, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), tint); tb.position.y = -.55;
        c.add(a, b, ta, tb); return c;
      };
      var cross = new T.Group(); cross.add(new T.Mesh(new T.BoxGeometry(.7, 2.1, .7), tint), new T.Mesh(new T.BoxGeometry(2.1, .7, .7), tint)); g.add(cross);
      for (var j = 0; j < 5; j++) { var cp = capsule(); var a2 = j / 5 * Math.PI * 2; cp.position.set(Math.cos(a2) * 2.3, Math.sin(a2) * 1.6, Math.sin(a2 * 2) * .6); cp.rotation.set(a2, a2 * .5, a2); cp.userData.o = a2; floaters.push(cp); g.add(cp); }
    }
    if (kind === 'coins') {
      var gold = M(0xd2b26a, .9, .25), green = M(accent, .2, .3);
      [[-1.25, 7], [0, 11], [1.25, 5]].forEach(function(st){
        for (var k = 0; k < st[1]; k++) {
          var coin = new T.Mesh(new T.CylinderGeometry(.58, .58, .12, 72), gold); coin.position.set(st[0] + (Math.random() - .5) * .05, -1.6 + k * .13, (Math.random() - .5) * .05); g.add(coin);
          var edge = new T.Mesh(new T.TorusGeometry(.58, .02, 8, 72), green); edge.rotation.x = Math.PI / 2; edge.position.copy(coin.position); g.add(edge);
        }
      });
      var top = new T.Mesh(new T.CylinderGeometry(.58, .58, .12, 72), gold); top.position.set(.4, 1.1, .8); top.rotation.set(1.1, 0, .4); top.userData.o = 0; floaters.push(top); g.add(top);
      g.rotation.x = .25;
    }
    if (kind === 'globe') {
      g.add(new T.Mesh(new T.SphereGeometry(1.5, 64, 64), M(0x0e2340, .2, .5)));
      g.add(new T.Mesh(new T.SphereGeometry(1.52, 36, 18), new T.MeshBasicMaterial({ color: accent, wireframe: true, transparent: true, opacity: .35 })));
      var colors = [accent, new T.Color(0xf28c28), new T.Color(0xe6edf5)];
      for (var q = 0; q < 7; q++) {
        var orbit = new T.Group(); var ct = new T.Mesh(new T.BoxGeometry(.5, .24, .24), M(colors[q % 3], .3, .4)); ct.position.x = 2.1 + (q % 3) * .25; orbit.add(ct);
        orbit.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0); orbit.userData.s = .004 + Math.random() * .006; floaters.push(orbit); g.add(orbit);
      }
    }
    function size(){ var w = box.clientWidth, h = box.clientHeight; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); cam.position.z = w < h ? 10.5 : 8.5; }
    size(); addEventListener('resize', size);
    var prog = 0, mx = 0, my = 0;
    if (window.ScrollTrigger) ScrollTrigger.create({ trigger: box, start: 'top bottom', end: 'bottom top', onUpdate: function(s){ prog = s.progress; } });
    addEventListener('pointermove', function(e){ mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
    var clock = new T.Clock(), baseX = g.rotation.x;
    function frame(){
      var t2 = clock.getElapsedTime();
      g.rotation.y += ((prog * Math.PI * 2 + mx * .6) - g.rotation.y) * .06; g.rotation.x = baseX + my * .3;
      g.position.y = Math.sin(t2 * .8) * .08;
      floaters.forEach(function(f){
        if (f.userData.s) { f.rotation.y += f.userData.s; f.rotation.x += f.userData.s * .5; }
        if (f.userData.o !== undefined) { f.position.y += Math.sin(t2 + f.userData.o) * .002; f.rotation.z += .004; }
      });
      r.render(scene, cam);
    }
    if (still) { frame(); return; }
    visibleLoop(canvas, frame);
  }
})();`;
}
