import { countryName } from "../categories";
import type { SitePage, SiteSection, SiteSnapshot } from "../crawl";
import type { CategoryId, Lead } from "../types";
import { makeDna, tradeFor, type DesignDna } from "./styles";
import { HEAD_JS, SYSTEM_BASE_JS, SYSTEM_CSS, SYSTEM_LIBRARIES, SYSTEM_MOTION_JS, lookVars, pickLook } from "./system";
import { THEMES, photoUrl } from "./themes";
import { UI_KIT_CSS, UI_KIT_JS } from "./ui-kit";

export type RedesignInput = Pick<
  Lead,
  "name" | "category" | "city" | "country" | "website" | "address" | "openingHours" | "contacts" | "content" | "lat" | "lon"
>;

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const safeUrl = (u: string | undefined) => (u && /^https?:\/\//i.test(u) ? esc(u) : "");

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
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

function pageHref(slug: string): string {
  return slug === "home" ? "./" : `./${encodeURIComponent(slug)}`;
}

/** The trade a site is designed for (the business name wins over a mis-filed category). */
export function themeCategory(category: CategoryId, dna?: DesignDna): CategoryId {
  return dna?.trade ?? category;
}

export interface RenderOptions {
  /** Rewrites the business's own image URLs, e.g. through an HTTPS proxy. */
  image?: (url: string) => string;
  /** This site's design DNA (look + trade). Picked from the trade when absent. */
  dna?: DesignDna;
}

const ICON = {
  pin: '<svg viewBox="0 0 24 24"><path d="M12 21s-6.5-6.2-6.5-11.2A6.5 6.5 0 0 1 18.5 9.8C18.5 14.8 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.4"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  phone: '<svg viewBox="0 0 24 24"><path d="M6.6 3.5h3l1.5 4-2 1.3a10 10 0 0 0 5.1 5.1l1.3-2 4 1.5v3a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z"/></svg>',
  mail: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5.5" width="17" height="13" rx="1"/><path d="M4 6.5l8 6 8-6"/></svg>',
  arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
};

/** Render one page of the redesigned site from the crawled page's own text and images. */
export function renderSitePage(lead: RedesignInput, site: SiteSnapshot, slug: string, opts: RenderOptions = {}): string {
  const trade = opts.dna?.trade ?? tradeFor(lead.category, lead.name);
  const dna = opts.dna ?? makeDna(pickLook(trade), trade);
  const look = dna.look;
  const t = THEMES[trade];
  const img = opts.image ?? ((u: string) => u);
  const page = site.pages.find((p) => p.slug === slug) ?? site.pages[0];
  const isHome = page.slug === site.pages[0].slug;
  const domain = domainOf(lead.website);
  const seed = hash(domain);
  const stock = (i: number, w = 1600) => photoUrl(t.photos[(seed + i) % t.photos.length], w);
  const name = esc(lead.name);

  // The site's own photos, in page order; stock photography of the trade fills any gaps.
  const pagePhotos = page.sections.flatMap((s) => s.images).filter((u) => /^https?:/.test(u)).map((u) => safeUrl(img(u)));
  let photoIdx = 0;
  const nextPhoto = (stockIdx: number, w = 1200) => ({ src: pagePhotos[photoIdx++] || stock(stockIdx, w), fallback: stock(stockIdx, w) });
  const imgTag = (p: { src: string; fallback: string }, alt: string, cls = "") =>
    `<img${cls ? ` class="${cls}"` : ""} src="${p.src}" data-fallback="${p.fallback}" alt="${esc(alt)}" loading="lazy" referrerpolicy="no-referrer">`;

  const phone = lead.contacts.phones[0];
  const tel = phone ? esc(phone.replace(/[^\d+]/g, "")) : "";
  const email = lead.contacts.emails[0];
  const hours = (lead.openingHours ?? "").split(";").map((s) => s.trim()).filter(Boolean);
  const where = lead.address || [lead.city, countryName(lead.country)].filter(Boolean).join(", ");
  const osm = `https://www.openstreetmap.org/search?query=${encodeURIComponent([lead.name, lead.address, lead.city].filter(Boolean).join(", "))}`;
  const primaryHref = phone ? `tel:${tel}` : email ? `mailto:${esc(email)}` : "#visit";
  const others = site.pages.filter((p) => p.slug !== page.slug);
  const navLink = (p: SitePage) => `<a href="${pageHref(p.slug)}"${p.slug === page.slug ? ' aria-current="page"' : ""}>${esc(p.label)}</a>`;
  const nav = site.pages.map(navLink).join("");
  // The header holds the main pages; everything is in the mobile menu and the footer.
  const maxTop = lead.name.length > 24 ? 4 : 6;
  const topNav = (site.pages.length > maxTop + 1 ? [...site.pages.slice(0, maxTop), ...(site.pages.slice(maxTop).some((p) => p.slug === page.slug) ? [page] : [])] : site.pages).map(navLink).join("");

  // A lead line must read like a sentence; dish names, prices and addresses don't qualify.
  const sentence = (p: SitePage) => p.sections.flatMap((s) => s.paragraphs).find((x) => x.length >= 60 && /[.!?]/.test(x) && (x.match(/\d/g) ?? []).length / x.length < 0.05) ?? "";
  const lead1 = isHome ? (page.description && page.description.length >= 30 ? page.description : sentence(page)) : sentence(page);

  const sections = normalize(page.sections);
  const used = new Set<number>();
  const take = (pred: (s: SiteSection) => boolean) => { const i = sections.findIndex((s, k) => !used.has(k) && pred(s)); if (i >= 0) used.add(i); return i >= 0 ? sections[i] : null; };
  const lines = (s: SiteSection) => [...s.paragraphs, ...s.items];

  const echo = (text: string, tag = "h2", attrs = "") => `<${tag} class="echo"${attrs}>${text}</${tag}>`;
  const disc = (text: string, center = false) => `<p class="disc"${center ? ' style="justify-content:center"' : ""}><span class="mu-shiny">${esc(text)}</span></p>`;
  const priceLine = (l: string) => {
    const m = l.match(/^(.*?)[\s.·…-]*((?:[$€£]\s?)?\d{1,4}(?:[.,]\d{2})?\s?(?:¢|€|\$|kr|zł|Kč|CHF)?)$/);
    return m && m[1].length > 1 && m[1].length < 80
      ? `<li><span class="n">${esc(m[1].trim())}</span><span class="p">${esc(m[2])}</span></li>`
      : `<li><span class="n">${esc(l)}</span></li>`;
  };
  const sectionBody = (s: SiteSection, story = false) =>
    `${s.paragraphs.map((p, i) => `<p class="muted"${story && i === 0 ? " data-su-scroll-reveal" : ""}>${esc(p)}</p>`).join("")}${s.items.length ? `<ul class="price-list${s.items.length > 8 ? " list-cols" : ""}">${s.items.map(priceLine).join("")}</ul>` : ""}`;

  /** Every remaining section of the page, shaped by its content. */
  const renderRest = () => {
    let flip = false;
    return sections.map((s, k) => {
      if (used.has(k)) return "";
      used.add(k);
      const head = s.heading ? `${disc("Discover")}${echo(esc(s.heading))}` : "";
      const ls = lines(s);
      if (!ls.length && s.images.length) {
        return `<section style="padding-top:0"><div class="wrap">${head}<div class="gallery">${s.images.map((u, i) => `<figure data-mu-blur-fade data-delay="${(i % 4) * 0.08}">${imgTag({ src: safeUrl(img(u)), fallback: stock(k) }, s.heading || lead.name)}</figure>`).join("")}</div></div></section>`;
      }
      if (s.images.length) {
        flip = !flip;
        const [first, ...more] = s.images;
        return `<section style="padding-top:0"><div class="wrap"><div class="story"${flip ? ' style="direction:rtl"' : ""}>
  <div style="direction:ltr">${head}${sectionBody(s)}</div>
  <div class="ph" style="direction:ltr">${imgTag({ src: safeUrl(img(first)), fallback: stock(k) }, s.heading || lead.name)}</div>
</div>${more.length ? `<div class="gallery">${more.map((u, i) => `<figure data-mu-blur-fade data-delay="${(i % 4) * 0.08}">${imgTag({ src: safeUrl(img(u)), fallback: stock(k + 1) }, s.heading || lead.name)}</figure>`).join("")}</div>` : ""}</div></section>`;
      }
      const long = s.items.length > 5;
      return `<section style="padding-top:0"><div class="wrap"><div class="${long ? "" : "prose-block"}" data-mu-blur-fade>${head}${sectionBody(s)}</div></div></section>`;
    }).join("\n");
  };

  // Info strip: the facts a visitor needs, with glowing line icons.
  const info = `<div class="info mu-beam">
  <div>${ICON.pin}<div><b>Locate us</b><span><a href="${esc(osm)}" target="_blank" rel="noopener">${esc(where)}</a></span></div></div>
  <div>${ICON.clock}<div><b>Open hours</b><span>${hours.length ? hours.map(esc).join(" · ") : esc(t.label)}</span></div></div>
  <div>${phone ? ICON.phone : ICON.mail}<div><b>${phone ? "Call us" : "Write to us"}</b><span>${phone ? `<a href="tel:${tel}">${esc(phone)}</a>` : ""}${email ? `${phone ? " · " : ""}<a href="mailto:${esc(email)}">${esc(email)}</a>` : ""}</span></div></div>
</div>`;

  let main = "";
  if (isHome) {
    const words = lead.name.split(/\s+/);
    const longName = lead.name.length > 24;
    const h1 = words.length > 2 && !longName ? `<span class="nw">${esc(words.slice(0, Math.ceil(words.length / 2)).join(" "))}</span><br><span class="nw">${esc(words.slice(Math.ceil(words.length / 2)).join(" "))}</span>` : name;
    const second = others[0];
    const heroPhoto = nextPhoto(0, 1000);
    const revealTitle = sections.find((s) => s.heading && s.heading.length <= 60 && s.heading.toLowerCase() !== lead.name.toLowerCase())?.heading || `${t.label} in ${lead.city}`;
    // The business's own photos from every page, for the photo marquee.
    const ownPhotos = [...new Set(site.pages.flatMap((p) => p.sections.flatMap((s) => s.images)))];
    const storySec = take((s) => s.paragraphs.some((p) => p.length >= 80));
    const offers = [0, 1, 2].map(() => take((s) => lines(s).length >= 2)).filter(Boolean) as SiteSection[];
    main += `
<section class="hero"><div class="wrap">
  <div>
    ${disc("Welcome to")}
    ${echo(h1, "h1", longName ? ' data-long=""' : "")}
    <p class="sub">${esc(t.label)} in ${esc(lead.city)}</p>
    ${lead1 ? `<p class="muted">${esc(firstSentences(lead1, 220))}</p>` : ""}
    <div class="ctas"><a class="btn gold mu-shimmer" data-su-magnetic href="${primaryHref}">${esc(t.cta)} ${ICON.arrow}</a>${second ? `<a class="btn" href="${pageHref(second.slug)}">${esc(second.label)}</a>` : `<a class="btn" href="#visit">Visit us</a>`}</div>
  </div>
  <div class="plate-stage"><div class="dust"></div>${imgTag(heroPhoto, lead.name, "plate round")}</div>
</div></section>

<section class="cloud-reveal" aria-label="${esc(revealTitle)}">
  <img src="${stock(1, 2200)}" alt="" loading="lazy">
  <div class="clouds" aria-hidden="true"></div>
  <div class="title"><p>${name}</p><h2>${esc(revealTitle)}</h2></div>
</section>

<section><div class="wrap">
  <div class="story">
    <div>${disc("Discover")}${echo(esc(storySec?.heading || "Our story"))}${storySec ? sectionBody(storySec, true) : lead1 ? `<p class="muted">${esc(lead1)}</p>` : ""}${second ? `<a class="ulink" href="${pageHref(second.slug)}">${esc(second.label)}</a>` : ""}</div>
    <div class="ph">${imgTag(storySec?.images[0] ? { src: safeUrl(img(storySec.images[0])), fallback: stock(2) } : nextPhoto(2), lead.name)}</div>
  </div>
  ${info}
</div></section>
${offers.length ? `<section style="padding-top:0"><div class="wrap">
  <div class="menu-head"><div>${disc("Discover")}${echo("What we offer")}</div>${lead1 ? `<p class="muted small">${esc(firstSentences(lead1, 160))}</p>` : ""}</div>
  ${offers.map((s, i) => `<div class="zig${i % 2 ? " flip" : ""}">
  <div class="zig-img"><div class="dust"></div>${imgTag(s.images[0] ? { src: safeUrl(img(s.images[0])), fallback: stock(3 + i, 900) } : { src: stock(3 + i, 900), fallback: stock(3 + i, 900) }, s.heading || lead.name, "round")}</div>
  <div class="zig-txt">${s.heading ? `<h3>${esc(s.heading)}</h3>` : ""}${s.paragraphs.map((p) => `<p class="muted small">${esc(p)}</p>`).join("")}${s.items.length ? `<ul>${s.items.map((x) => { const m = x.match(/^(.*?)[\s.·…-]*((?:[$€£]\s?)?\d{1,4}(?:[.,]\d{2})?\s?(?:¢|€|\$)?)$/); return m && m[1].length > 1 ? `<li><span>${esc(m[1].trim())}</span><span>${esc(m[2])}</span></li>` : `<li><span>${esc(x)}</span><span></span></li>`; }).join("")}</ul>` : ""}<a class="btn" href="${primaryHref}">${esc(t.cta)} ${ICON.arrow}</a></div>
</div>`).join("")}
</div></section>` : ""}
${renderRest()}
${ownPhotos.length >= 4 ? `<section style="padding-top:0" aria-label="${esc(lead.name)} photos"><div class="mu-marquee" style="--duration:60s">
  <div class="mu-marquee-track">${ownPhotos.slice(0, 10).map((u, i) => imgTag({ src: safeUrl(img(u)), fallback: stock(6 + i, 900) }, lead.name)).join("")}</div>
</div></section>` : ""}
${others.length ? `<section style="padding-top:0"><div class="wrap"><div class="framed">
  ${disc("Discover")}${echo("Explore")}
  <div class="cards" data-su-glow>${others.slice(0, 6).map((p, i) => { const ph = p.sections.flatMap((s) => s.images)[0]; const line = p.sections.flatMap((s) => [...s.paragraphs, ...s.items]).find((x) => x.length > 30) ?? p.title; return `<a class="dish-card mu-spotlight" href="${pageHref(p.slug)}" style="text-decoration:none"><div class="ph">${imgTag(ph ? { src: safeUrl(img(ph)), fallback: stock(4 + i, 900) } : { src: stock(4 + i, 900), fallback: stock(4 + i, 900) }, p.label)}</div><div class="row"><h3>${esc(p.label)}</h3><span class="p">${ICON.arrow}</span></div><p>${esc(firstSentences(line, 110))}</p></a>`; }).join("")}</div>
</div></div></section>` : ""}`;
  } else {
    const side = nextPhoto(1, 900);
    main += `<section class="page-top"><div class="wrap">
  <div>${disc(lead.name)}${echo(esc(page.label), "h1")}${lead1 ? `<p class="muted">${esc(firstSentences(lead1, 220))}</p>` : ""}</div>
  <div class="plate-stage"><div class="dust"></div>${imgTag(side, page.label, "plate round")}</div>
</div></section>
${renderRest()}`;
  }

  // Visit / call to action over a dark photo.
  main += `
<section class="order" id="visit"><img src="${stock(isHome ? 5 : 2, 2000)}" alt="" loading="lazy"><div class="wrap">
  ${disc("Visit us", true)}
  ${echo(name)}
  <p class="muted">${esc(where)}${hours.length ? ` · ${hours.map(esc).join(" · ")}` : ""}</p>
  <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap"><a class="btn gold mu-shimmer" data-su-magnetic href="${primaryHref}">${esc(t.cta)} ${ICON.arrow}</a><a class="btn" href="${esc(osm)}" target="_blank" rel="noopener">Directions</a>${email ? `<a class="btn" href="mailto:${esc(email)}">${esc(email)}</a>` : ""}</div>
</div></section>`;

  const half = Math.ceil(site.pages.length / 2);
  const footer = `<footer class="site">
  <div class="wrap">
    <div class="foot-cta">
      <div>${disc(hours.length ? "Open hours" : "Get in touch")}<p class="big">${hours.length ? esc(hours.join(" · ")) : name}</p></div>
      <div class="foot-cta-btns"><a class="btn gold" href="${primaryHref}">${esc(t.cta)} ${ICON.arrow}</a><a class="btn" href="${esc(osm)}" target="_blank" rel="noopener">Directions</a></div>
    </div>
    <div class="foot-grid">
      <div class="foot-brand"><a class="logo-text" href="./">${name}</a>${lead1 ? `<p>${esc(firstSentences(lead1, 180))}</p>` : ""}${email ? `<a class="ulink" href="mailto:${esc(email)}">${esc(email)}</a>` : ""}</div>
      <nav aria-label="Explore"><h4>Explore</h4>${site.pages.slice(0, half).map(navLink).join("")}</nav>
      <nav aria-label="More"><h4>More</h4>${site.pages.slice(half).map(navLink).join("")}</nav>
      <div class="foot-locs"><h4>Contact</h4><div class="fl"><b>${name}</b><span>${esc(where)}</span>${phone ? `<span><a href="tel:${tel}">${esc(phone)}</a></span>` : ""}${hours.length ? `<span>${hours.map(esc).join(" · ")}</span>` : ""}<span class="fl-links"><a href="${esc(osm)}" target="_blank" rel="noopener">Map</a>${email ? `<a href="mailto:${esc(email)}">Email</a>` : ""}</span></div></div>
    </div>
    <div class="wordmark" aria-hidden="true">${name}</div>
    <div class="foot-bottom"><span>${esc(domain)}</span><span>Concept redesign by Revamp Radar. Not the official website. Photography: the business's own where available, otherwise Unsplash.</span><a class="totop" href="#top">Back to top <span aria-hidden="true">&uarr;</span></a></div>
  </div>
</footer>`;

  return `<!doctype html>
<html lang="en">
<head>
<script>${HEAD_JS}</script>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${isHome ? name : `${esc(page.label)} · ${name}`} · Concept redesign</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${look.fonts}&display=swap">
<style>${lookVars(look)}${SYSTEM_CSS}${UI_KIT_CSS}</style>
</head>
<body id="top" data-look="${look.id}">
<div class="mu-progress" aria-hidden="true"></div>
<div class="curtain" aria-hidden="true"><span class="logo-text">${name}</span><span class="count">0</span><span class="bar-line"><i></i></span></div>
<div class="concept">Concept redesign of ${esc(domain)}, built from its own text and photos. Not the official website. <a href="${safeUrl(page.url)}" target="_blank" rel="noopener nofollow">View the original page</a></div>
<header class="site">
  <div class="wrap bar">
    <a class="logo-text" href="./">${name}</a>
    <nav class="links" aria-label="Pages">${topNav}</nav>
    <a class="btn gold" href="${primaryHref}">${esc(t.cta)}</a>
    <button class="menu-toggle" aria-expanded="false" aria-controls="mobile-menu">Menu</button>
  </div>
  <nav class="mobile" id="mobile-menu" aria-label="Pages">${nav}<a class="btn gold" href="${primaryHref}">${esc(t.cta)}</a></nav>
</header>
<main>
${main}
</main>
${footer}
<script>${SYSTEM_BASE_JS}</script>
<script>${UI_KIT_JS}</script>
${SYSTEM_LIBRARIES.map((u) => `<script src="${u}"></script>`).join("\n")}
<script>${SYSTEM_MOTION_JS}</script>
</body>
</html>`;
}

/** Every page of a site rendered on the design system: the starter a Claude redesign builds on. */
export function writeStarter(lead: RedesignInput, site: SiteSnapshot, dna?: DesignDna): { file: string; html: string }[] {
  return site.pages.map((p) => ({ file: p.slug === "home" ? "index.html" : `${p.slug}.html`, html: renderSitePage(lead, site, p.slug, { dna }) }));
}
