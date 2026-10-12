import { countryName } from "../categories";
import type { SitePage, SiteSection, SiteSnapshot } from "../crawl";
import type { CategoryId, Lead } from "../types";
import { makeDna, tradeFor, type DesignDna } from "./styles";
import { HEAD_JS, SYSTEM_BASE_JS, SYSTEM_CSS, SYSTEM_LIBRARIES, SYSTEM_MOTION_JS, lookVars, pickLook, themeChooser, themePicker } from "./system";
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

/** The first sentence of a paragraph and the rest (so a statement and its follow-on together keep every word). */
function splitFirstSentence(p: string): [string, string] {
  const m = p.match(/^(.{40,260}?[.!?])\s+(.+)$/s);
  return m ? [m[1], m[2]] : [p, ""];
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
  /** This site's design DNA (theme + trade). Picked from the trade when absent. */
  dna?: DesignDna;
}

const ICON = {
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-6.2-6.5-11.2A6.5 6.5 0 0 1 18.5 9.8C18.5 14.8 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.4"/></svg>',
  clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.5h3l1.5 4-2 1.3a10 10 0 0 0 5.1 5.1l1.3-2 4 1.5v3a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="1"/><path d="M4 6.5l8 6 8-6"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9"/></svg>',
  down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
  star: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0 9.6 6.4 16 8 9.6 9.6 8 16 6.4 9.6 0 8 6.4 6.4Z"/></svg>',
};

const PRICE_LINE = /^(.*?)[\s.·…-]*((?:[$€£]\s?)?\d{1,4}(?:[.,]\d{2})?\s?(?:¢|€|\$|kr|zł|Kč|CHF)?)$/;
const FOUNDED = /\b(?:since|est\.?|established|founded)\s+(?:in\s+)?((?:1[6-9]|20)\d\d)\b/i;

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
  const own = (u: string, stockIdx: number, w = 1200) => ({ src: safeUrl(img(u)) || stock(stockIdx, w), fallback: stock(stockIdx, w) });
  const imgTag = (p: { src: string; fallback: string }, alt: string, cls = "", eager = false) =>
    `<img${cls ? ` class="${cls}"` : ""} src="${p.src}" data-fallback="${p.fallback}" alt="${esc(alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} referrerpolicy="no-referrer">`;
  const photo = (p: { src: string; fallback: string }, alt: string, cls = "", amount = 8) =>
    `<figure class="ph${cls ? ` ${cls}` : ""}" data-parallax="${amount}">${imgTag(p, alt)}</figure>`;

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
  const maxTop = lead.name.length > 24 ? 4 : 5;
  const topNav = (site.pages.length > maxTop + 1 ? [...site.pages.slice(0, maxTop), ...(site.pages.slice(maxTop).some((p) => p.slug === page.slug) ? [page] : [])] : site.pages).map(navLink).join("");

  // A lead line must read like a sentence; dish names, prices and addresses don't qualify.
  const sentence = (p: SitePage) => p.sections.flatMap((s) => s.paragraphs).find((x) => x.length >= 60 && /[.!?]/.test(x) && (x.match(/\d/g) ?? []).length / x.length < 0.05) ?? "";
  const lead1 = isHome ? (page.description && page.description.length >= 30 ? page.description : sentence(page)) : sentence(page);
  const allText = site.pages.flatMap((p) => [p.description, ...p.sections.flatMap((s) => [...s.paragraphs, ...s.items])]).join(" ");
  const founded = allText.match(FOUNDED)?.[1];

  const sections = normalize(page.sections);
  const used = new Set<number>();
  const take = (pred: (s: SiteSection) => boolean) => { const i = sections.findIndex((s, k) => !used.has(k) && pred(s)); if (i >= 0) used.add(i); return i >= 0 ? sections[i] : null; };
  const lines = (s: SiteSection) => [...s.paragraphs, ...s.items];
  const size = (s: SiteSection) => lines(s).join(" ").length;

  // Section heads are numbered in page order once the page is assembled (see NO below).
  const NO = "\u0000no\u0000";
  const head = (label: string) => `<div class="head"><span class="no">No. ${NO}</span><span class="eyebrow">${esc(label)}</span></div>`;
  const maskH = (html: string, tag = "h2") => `<${tag}><span class="line"><span>${html}</span></span></${tag}>`;
  const priceLine = (l: string) => {
    const m = l.match(PRICE_LINE);
    return m && m[1].length > 1 && m[1].length < 80
      ? `<li><span class="n">${esc(m[1].trim())}</span><span class="p">${esc(m[2])}</span></li>`
      : `<li><span class="n">${esc(l)}</span></li>`;
  };
  const body = (s: SiteSection, skipFirst = false) =>
    `${s.paragraphs.slice(skipFirst ? 1 : 0).map((p) => `<p>${esc(p)}</p>`).join("")}${s.items.length ? `<ul class="price-list${s.items.length > 8 ? " list-cols" : ""}">${s.items.map(priceLine).join("")}</ul>` : ""}`;

  /** A content section in the house layout: numbered head, masked heading, text, and its own photos. */
  let flip = false;
  const block = (s: SiteSection, k: number) => {
    const label = s.heading || page.label;
    const title = s.heading ? maskH(esc(s.heading)) : "";
    if (!lines(s).length && s.images.length) {
      return `<section><div class="wrap">${head(label)}${title}<ul class="bento">${s.images.slice(0, 10).map((u, i) => `<li>${imgTag(own(u, k + i), s.heading || lead.name)}</li>`).join("")}</ul></div></section>`;
    }
    if (s.images.length) {
      flip = !flip;
      const [first, ...more] = s.images;
      return `<section><div class="wrap">${head(label)}<div class="block with-ph${flip ? " flip" : ""}"><div class="prose rise">${title}${body(s)}</div>${photo(own(first, k), s.heading || lead.name)}</div>${more.length ? `<ul class="bento">${more.slice(0, 10).map((u, i) => `<li>${imgTag(own(u, k + 1 + i), s.heading || lead.name)}</li>`).join("")}</ul>` : ""}</div></section>`;
    }
    return `<section><div class="wrap">${head(label)}${title}<div class="${s.items.length > 5 ? "" : "prose "}rise">${body(s)}</div></div></section>`;
  };
  const renderRest = () => sections.map((s, k) => (used.has(k) ? "" : (used.add(k), block(s, k)))).join("\n");

  // Contact band (inverse colours), on every page.
  const visit = `<section class="inverse" id="visit"><div class="wrap">
  ${head("Visit")}${maskH(name)}
  <div class="visit">
    <div class="rise">
      <address class="addr">${esc(where)}</address>
      ${phone ? `<p style="margin-top:20px"><a class="ulink" href="tel:${tel}">${esc(phone)}</a></p>` : ""}
      <div class="ctas"><a class="btn" data-su-magnetic href="${primaryHref}">${esc(t.cta)} ${ICON.arrow}</a><a class="btn ghost" href="${esc(osm)}" target="_blank" rel="noopener">Directions ${ICON.arrow}</a></div>
    </div>
    <div class="facts-list rise">
      <div>${ICON.pin}<div><b>Address</b><span><a href="${esc(osm)}" target="_blank" rel="noopener">${esc(where)}</a></span></div></div>
      ${hours.length ? `<div>${ICON.clock}<div><b>Opening hours</b>${hours.map((h) => `<span>${esc(h)}</span>`).join("")}</div></div>` : ""}
      ${phone ? `<div>${ICON.phone}<div><b>Telephone</b><span><a href="tel:${tel}">${esc(phone)}</a></span></div></div>` : ""}
      ${email ? `<div>${ICON.mail}<div><b>Email</b><span><a href="mailto:${esc(email)}">${esc(email)}</a></span></div></div>` : ""}
    </div>
  </div>
</div></section>`;

  let main = "";
  if (isHome) {
    // Headline: the business name over two masked lines, its last word in the italic accent.
    const words = lead.name.trim().split(/\s+/);
    const cut = words.length > 1 ? Math.ceil(words.length / 2) : 1;
    const l1 = words.slice(0, cut), l2 = words.slice(cut);
    const withEm = (ws: string[]) => ws.length ? `${esc(ws.slice(0, -1).join(" "))}${ws.length > 1 ? " " : ""}<em>${esc(ws[ws.length - 1])}</em>` : "";
    const longest = Math.max(l1.join(" ").length, l2.join(" ").length);
    const h1 = `<h1 id="hero-title"${longest > 14 ? ' data-long=""' : ""}><span class="line"><span>${l2.length ? esc(l1.join(" ")) : withEm(l1)}</span></span>${l2.length ? `<span class="line"><span>${withEm(l2)}</span></span>` : ""}</h1>`;
    const second = others[0];
    const heroPhoto = nextPhoto(0, 2000);
    // The caption is built from facts the site states: what it is, where, and since when.
    const revealTitle = `${t.label} in ${lead.city}${founded ? ` since ${founded}` : ""}.`;
    const facts = [
      founded ? `<div><dt class="sr-only">Established</dt><dd class="f" data-roll>${esc(founded)}</dd><dd class="l">Established</dd></div>` : "",
      phone ? `<div><dt class="sr-only">Telephone</dt><dd class="f"><a href="tel:${tel}">${esc(phone)}</a></dd><dd class="l">Call</dd></div>` : "",
      hours.length ? `<div><dt class="sr-only">Opening hours</dt><dd class="f">${esc(hours[0])}</dd><dd class="l">Open</dd></div>` : "",
    ].filter(Boolean);
    const ribbonItems = [lead.name, t.label, lead.city, founded ? `Est. ${founded}` : "", lead.address ?? "", hours[0] ?? ""].filter((x) => x && x.length < 60);
    const ribbonRow = (hidden: boolean) => `<div class="ribbon-row"${hidden ? ' aria-hidden="true"' : ""}>${ribbonItems.map((x) => `<span>${esc(x)}</span>${ICON.star}`).join("")}</div>`;

    // Story: its first sentence becomes the statement; the rest of its words follow beside two photographs.
    const storySec = take((s) => s.paragraphs.some((p) => p.length >= 80));
    const storyPara = storySec ? storySec.paragraphs.find((p) => p.length >= 80)! : lead1;
    const [statement, restOfFirst] = storyPara ? splitFirstSentence(storyPara) : ["", ""];
    const storyRest = storySec ? [restOfFirst, ...storySec.paragraphs.filter((p) => p !== storyPara)].filter(Boolean) : restOfFirst ? [restOfFirst] : [];
    const storyImgs = storySec?.images ?? [];

    // Offers: short sections become panels on the horizontal track (three or more), longer ones stay as blocks.
    const offers: SiteSection[] = [];
    for (let i = 0; i < 6; i++) { const s = take((x) => lines(x).length >= 1 && size(x) <= 480 && !!x.heading); if (!s) break; offers.push(s); }
    const track = offers.length >= 3 ? `<section class="track" aria-labelledby="track-title"><div class="track-stick">
  <div class="wrap track-top"><div>${head("What we offer")}<h2 id="track-title"><span class="line"><span>${esc(t.label)}, <em>in ${esc(lead.city)}</em></span></span></h2></div><div class="track-count" aria-hidden="true"><b>01</b> / ${String(offers.length).padStart(2, "0")}<div class="track-bar"><i></i></div></div></div>
  <ol class="track-list">${offers.map((s, i) => `<li class="panel"><p class="pn" aria-hidden="true">${String(i + 1).padStart(2, "0")}</p><div><h3>${esc(s.heading)}</h3>${body(s)}${s.images[0] ? `<figure class="ph" style="aspect-ratio:5/4;max-width:11rem;margin-top:20px">${imgTag(own(s.images[0], 3 + i, 600), s.heading)}</figure>` : ""}</div></li>`).join("")}</ol>
</div></section>` : offers.map((s, i) => block(s, 3 + i)).join("\n");

    // The business's own photos from every page, for the bento.
    const ownPhotos = [...new Set(site.pages.flatMap((p) => p.sections.flatMap((s) => s.images)))].filter((u) => u !== storyImgs[0] && u !== storyImgs[1]);

    main += `
<section class="hero-x" style="padding:0" aria-labelledby="hero-title">
  <div class="hx"><div class="wrap">
    <div class="hx-top"><p class="eyebrow">${esc(t.label)} · ${esc(lead.city)}</p>${phone ? `<a class="eyebrow" href="tel:${tel}">${esc(phone)}</a>` : ""}</div>
    <div class="hx-body${longest > 12 ? " hx-stack" : ""}">
      ${h1}
      <div class="hx-side rise">
        ${lead1 ? `<p>${esc(firstSentences(lead1, 220))}</p>` : ""}
        <div class="ctas"><a class="btn" data-su-magnetic href="${primaryHref}">${esc(t.cta)} ${ICON.arrow}</a>${second ? `<a class="btn ghost" href="${pageHref(second.slug)}">${esc(second.label)}</a>` : `<a class="btn ghost" href="#visit">Visit us ${ICON.down}</a>`}</div>
      </div>
    </div>
  </div></div>
  <div class="xp"><div class="xp-stick"><div class="xp-frame">
    ${imgTag(heroPhoto, lead.name, "xp-img", true)}
    <div class="xp-shade" aria-hidden="true"></div>
    <div class="xp-cap"><div class="wrap">
      <div><p class="eyebrow">${esc(where)}</p><p class="big">${esc(revealTitle)}</p></div>
      ${facts.length ? `<dl class="facts">${facts.join("")}</dl>` : ""}
    </div></div>
    <div class="seal" aria-hidden="true"><svg viewBox="0 0 120 120"><defs><path id="seal-path" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0"/></defs><text font-size="9" letter-spacing="2.6" fill="currentColor" style="font-family:var(--body);font-weight:600"><textPath href="#seal-path">${esc(`${lead.name} · ${lead.city} ·`.toUpperCase().slice(0, 48))}</textPath></text><text x="60" y="${founded ? 58 : 66}" text-anchor="middle" font-size="11" fill="currentColor" style="font-family:var(--serif);font-style:italic">${founded ? "est." : esc(t.label.toLowerCase())}</text>${founded ? `<text x="60" y="77" text-anchor="middle" font-size="21" fill="currentColor" style="font-family:var(--display)">${esc(founded)}</text>` : ""}</svg></div>
  </div></div></div>
</section>
${ribbonItems.length >= 3 ? `<div class="ribbon" aria-label="${esc(lead.name)}"><div class="ribbon-track">${ribbonRow(false)}${ribbonRow(true)}</div></div>` : ""}
${statement ? `<section><div class="wrap">
  ${head(storySec?.heading || "Our story")}
  <p class="statement" data-su-scroll-reveal>${esc(statement)}</p>
  <div class="split">
    <div class="txt rise">${storyRest.map((p) => `<p>${esc(p)}</p>`).join("")}${storySec ? body({ ...storySec, paragraphs: [] }) : ""}${second ? `<p><a class="ulink" href="${pageHref(second.slug)}">${esc(second.label)} ${ICON.arrow}</a></p>` : ""}</div>
    <div class="pics">${photo(storyImgs[0] ? own(storyImgs[0], 2, 1600) : nextPhoto(2, 1600), storySec?.heading || lead.name, "a", 7)}${photo(storyImgs[1] ? own(storyImgs[1], 4) : nextPhoto(4), lead.name, "b", 12)}</div>
  </div>
</div></section>` : ""}
${track}
${renderRest()}
${ownPhotos.length >= 5 ? `<section style="padding-top:0"><div class="wrap">${head("In pictures")}${maskH(`${name}, <em>in pictures</em>`)}<ul class="bento">${ownPhotos.slice(0, 5).map((u, i) => `<li>${imgTag(own(u, 6 + i), lead.name)}</li>`).join("")}</ul></div></section>` : ""}
${others.length ? `<section><div class="wrap">${head("Explore")}${maskH("Explore the <em>site</em>")}
  <ul class="index" data-previews>${others.map((p, i) => { const ph = p.sections.flatMap((s) => s.images)[0]; const line = p.sections.flatMap((s) => [...s.paragraphs, ...s.items]).find((x) => x.length > 20) ?? p.title; return `<li><a href="${pageHref(p.slug)}" data-preview="${ph ? safeUrl(img(ph)) || stock(4 + i, 600) : stock(4 + i, 600)}"><span class="i">${String(i + 1).padStart(2, "0")}</span><span class="t">${esc(p.label)}</span><span class="d">${esc(firstSentences(line ?? "", 90))}</span><span class="go">View ${ICON.arrow}</span></a></li>`; }).join("")}</ul>
</div></section>` : ""}`;
  } else {
    const side = nextPhoto(1, 1200);
    main += `<section class="page-top"><div class="wrap">
  <div><p class="eyebrow">${name}</p>${maskH(esc(page.label), "h1")}${lead1 ? `<p class="muted rise">${esc(firstSentences(lead1, 220))}</p>` : ""}</div>
  ${photo(side, page.label, "", 8)}
</div></section>
${renderRest()}`;
  }

  // Every home page lets the client compare the seven themes and send us their favourite.
  if (isHome) main += themeChooser(NO);
  main += visit;
  let no = 0;
  main = main.split(NO).reduce((acc, part, i) => (i === 0 ? part : `${acc}${String(++no).padStart(2, "0")}${part}`), "");

  const picker = themePicker();
  const half = Math.ceil(site.pages.length / 2);
  const footer = `<footer class="site">
  <div class="wrap">
    <div class="foot-top">
      <div><p class="wordmark"><span class="line"><span>${name}</span></span></p><p class="foot-tag">${esc(t.label)} · ${esc(lead.city)}</p><a class="btn" href="${primaryHref}">${esc(t.cta)} ${ICON.arrow}</a></div>
      <div class="foot-cols">
        <div><h4>Visit</h4><p>${esc(where)}</p>${phone ? `<a href="tel:${tel}">${esc(phone)}</a>` : ""}${email ? `<a href="mailto:${esc(email)}">${esc(email)}</a>` : ""}<a href="${esc(osm)}" target="_blank" rel="noopener">Map</a></div>
        <nav aria-label="Pages"><h4>Pages</h4>${site.pages.slice(0, half).map(navLink).join("")}</nav>
        ${site.pages.length > 1 ? `<nav aria-label="More pages"><h4>More</h4>${site.pages.slice(half).map(navLink).join("")}</nav>` : hours.length ? `<div><h4>Hours</h4>${hours.map((h) => `<p>${esc(h)}</p>`).join("")}</div>` : ""}
      </div>
    </div>
    <div class="foot-bottom"><span>${esc(domain)} · Concept redesign by Revamp Radar. Not the official website. Photography: the business's own where available, otherwise Unsplash.</span><a href="#top">Back to top &uarr;</a></div>
  </div>
</footer>`;

  return `<!doctype html>
<html lang="en" data-theme="${look.id}" data-site="${esc(domain)}">
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
<div class="intro" aria-hidden="true"><span class="s">${esc(t.label)} · ${esc(lead.city)}</span><span class="n">${name}</span><span class="r"></span></div>
<div class="concept">Concept redesign of ${esc(domain)}, built from its own text and photos. Not the official website. <a href="${safeUrl(page.url)}" target="_blank" rel="noopener nofollow">View the original page</a></div>
<header class="site">
  <div class="wrap bar">
    <a class="logo-text" href="./">${name}</a>
    <nav class="links" aria-label="Pages">${topNav}</nav>
    <div class="tools">${picker.button}<a class="btn" href="${primaryHref}">${esc(t.cta)}</a><button class="menu-toggle" aria-expanded="false" aria-controls="mobile-menu">Menu</button></div>
  </div>
  <nav class="mobile" id="mobile-menu" aria-label="Pages">${nav}<a class="btn" href="${primaryHref}">${esc(t.cta)}</a></nav>
</header>
${picker.panel}
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
