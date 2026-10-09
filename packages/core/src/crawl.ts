import { parse, type HTMLElement, type Node } from "node-html-parser";
import { fetchPage } from "./http";

/** One block of a page: a heading followed by the text, list items and images under it, in page order. */
export interface SiteSection {
  heading: string;
  paragraphs: string[];
  items: string[];
  images: string[];
  /** Links in this block (buttons, "order online", PDFs): the visible text and where it goes. */
  links?: { text: string; href: string }[];
}

export interface SitePage {
  slug: string; // "home" for the start page
  url: string;
  label: string; // link text used in navigation
  title: string;
  description: string;
  sections: SiteSection[];
}

export interface SiteSnapshot {
  crawledAt: string;
  pages: SitePage[];
}

const MAX_PAGES = 25;
const BLOCK_TAGS = new Set([
  "div", "p", "table", "tbody", "tr", "td", "th", "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6",
  "section", "article", "header", "footer", "nav", "blockquote", "form", "main", "aside", "dl", "dd", "dt", "figure",
]);
const SKIP_TAGS = new Set(["script", "style", "noscript", "svg", "form", "iframe", "select", "template", "head"]);
/** Button labels that are interface, not content (FAQ toggles and the like are kept). */
const UI_TEXT = /^(submit|send|search|close|menu|open menu|toggle navigation|back to top|next|previous|prev|play|pause|ok|cancel|accept|decline|×|✕)$/i;
const SKIP_IMG = /spacer|pixel|blank|1x1|counter|tracking|\/icons?\/|facebook|twitter|instagram|whatsapp|linkedin|youtube|valid|w3c|flag|arrow|bullet|loading|ajax-loader/i;
const SKIP_LINK = /\.(pdf|jpe?g|png|gif|zip|docx?|xlsx?|mp3|mp4|webp)$/i;
const LOW_VALUE = /\/(author|tag|category|feed|wp-json)(\/|$)|datenschutz|privacy|cookie|agb|terms|login|wp-admin|sitemap|feed|cart|warenkorb|basket|checkout/i;

/**
 * Crawl the whole site, up to 25 pages: the start page, every page in its sitemap, and pages linked from the pages
 * fetched (two rounds). Uses at most ~27 requests, inside a Worker's subrequest budget.
 */
export async function crawlSite(startUrl: string): Promise<SiteSnapshot | null> {
  const home = await fetchPage(startUrl);
  if (!home) return null;
  const homeRoot = prep(home.html);
  const queue = new Map<string, { url: string; label: string }>();
  const add = (l: { url: string; label: string }) => {
    const key = canonical(l.url);
    if (key !== canonical(home.url) && slugFor(l.url) !== "home" && !queue.has(key)) queue.set(key, l);
  };
  internalLinks(homeRoot, home.url).forEach(add);
  (await sitemapLinks(home.url)).forEach(add);
  const pages: SitePage[] = [extractPage(homeRoot, home.url, "home", "Home")];
  const done = new Set<string>([canonical(home.url)]);
  const seenSlugs = new Set(["home"]);

  for (let round = 0; round < 2 && pages.length < MAX_PAGES; round++) {
    const batch = [...queue.values()].filter((l) => !done.has(canonical(l.url))).slice(0, MAX_PAGES - pages.length);
    if (!batch.length) break;
    const fetched = await Promise.all(batch.map((l) => fetchPage(l.url)));
    fetched.forEach((page, i) => {
      done.add(canonical(batch[i].url));
      if (!page || done.has(canonical(page.url)) && canonical(page.url) !== canonical(batch[i].url)) return;
      done.add(canonical(page.url));
      const root = prep(page.html);
      internalLinks(root, page.url).forEach(add);
      let slug = slugFor(page.url);
      while (seenSlugs.has(slug)) slug += "-2";
      seenSlugs.add(slug);
      const label = batch[i].label || titleCase(clean(root.querySelector("title")?.text ?? "").split(/[|\-–—]/)[0].trim()) || slug;
      const p = extractPage(root, page.url, slug, label);
      if (p.sections.some((s) => s.paragraphs.length || s.items.length || s.images.length)) pages.push(p);
    });
  }
  return { crawledAt: new Date().toISOString(), pages: removeChrome(pages) };
}

function canonical(url: string): string {
  const u = new URL(url);
  return (u.hostname.replace(/^www\./, "") + u.pathname.replace(/\/(index|default|home)\.(html?|php|aspx?)$/i, "/").replace(/\/$/, "") + u.search).toLowerCase();
}

/** Pages listed in /sitemap.xml (one level of sitemap index followed). Labels come from the page later. */
async function sitemapLinks(base: string): Promise<{ url: string; label: string }[]> {
  const host = new URL(base).hostname.replace(/^www\./, "");
  const locs = async (u: string) => {
    const r = await fetchPage(u, 8_000, "xml").catch(() => null);
    return r ? [...r.html.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1].replace(/&amp;/g, "&")) : [];
  };
  let urls = await locs(new URL("/sitemap.xml", base).href);
  const nested = urls.filter((u) => /\.xml($|\?)/i.test(u)).slice(0, 2);
  if (nested.length) urls = [...urls.filter((u) => !/\.xml($|\?)/i.test(u)), ...(await Promise.all(nested.map(locs))).flat()];
  return urls
    .filter((u) => { try { const x = new URL(u); return x.hostname.replace(/^www\./, "") === host && !SKIP_LINK.test(x.pathname) && !LOW_VALUE.test(x.pathname); } catch { return false; } })
    .slice(0, 40)
    .map((url) => ({ url, label: "" }));
}

/**
 * Text and images repeated on most pages are site chrome (logos, menus, banners): keep them on the
 * home page only. Pages whose remaining content duplicates the home page are dropped.
 */
function removeChrome(pages: SitePage[]): SitePage[] {
  if (pages.length < 3) return pages;
  const textCount = new Map<string, number>();
  const imgCount = new Map<string, number>();
  for (const p of pages) {
    const texts = new Set(p.sections.flatMap((s) => [s.heading, ...s.paragraphs, ...s.items]));
    texts.forEach((t) => textCount.set(t, (textCount.get(t) ?? 0) + 1));
    new Set(p.sections.flatMap((s) => s.images)).forEach((i) => imgCount.set(i, (imgCount.get(i) ?? 0) + 1));
  }
  const limit = Math.max(2, Math.ceil(pages.length * 0.6));
  const isChromeText = (t: string) => (textCount.get(t) ?? 0) >= limit;
  const isChromeImg = (i: string) => (imgCount.get(i) ?? 0) >= limit;
  const homeSig = pages[0].sections.flatMap((s) => s.paragraphs).filter((t) => !isChromeText(t)).slice(0, 6).join("|");

  return pages.filter((p, idx) => {
    if (idx === 0) return true;
    p.sections = p.sections
      .map((s) => ({
        heading: isChromeText(s.heading) ? "" : s.heading,
        paragraphs: s.paragraphs.filter((t) => !isChromeText(t)),
        items: s.items.filter((t) => !isChromeText(t)),
        images: s.images.filter((i) => !isChromeImg(i)),
        links: s.links?.filter((l) => !isChromeText(l.text)),
      }))
      .filter((s) => s.heading || s.paragraphs.length || s.items.length || s.images.length);
    return p.sections.length > 0 && signature(p) !== homeSig;
  });
}

function signature(p: SitePage): string {
  return p.sections.flatMap((s) => s.paragraphs).slice(0, 6).join("|");
}

/** Parse with <br> turned into newlines so old table layouts keep their paragraph breaks. */
function prep(html: string): HTMLElement {
  return parse(html.replace(/<br\s*\/?>/gi, "\n"), { comment: false, blockTextElements: { script: false, style: false, noscript: false } });
}

export function slugFor(url: string): string {
  const u = new URL(url);
  const raw = (u.pathname.replace(/\/(index|default|home)\.(html?|php|aspx?)$/i, "/") + u.search)
    .replace(/\.(html?|php|aspx?)$/i, "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (raw.length <= 48) return raw || "home";
  // Long nested paths: keep the most specific part, cut at a word boundary.
  const last = raw.split("-").reduceRight((acc, w) => (acc.length + w.length + 1 <= 48 ? (acc ? `${w}-${acc}` : w) : acc), "");
  return last || raw.slice(0, 48);
}

function internalLinks(root: HTMLElement, base: string): { url: string; label: string }[] {
  const baseUrl = new URL(base);
  const host = baseUrl.hostname.replace(/^www\./, "");
  const out = new Map<string, { url: string; label: string; score: number }>();
  const navAnchors = new Set(root.querySelectorAll("nav a, header a, #menu a, .menu a, #nav a, .nav a, #navigation a, td a"));
  for (const a of root.querySelectorAll("a[href]")) {
    const href = a.getAttribute("href") ?? "";
    if (/^(mailto|tel|javascript):|^#/i.test(href)) continue;
    let u: URL;
    try {
      u = new URL(href, baseUrl);
    } catch {
      continue;
    }
    if (!/^https?:$/.test(u.protocol) || u.hostname.replace(/^www\./, "") !== host || SKIP_LINK.test(u.pathname)) continue;
    u.hash = "";
    if (slugFor(u.href) === "home") continue;
    const label = clean(a.text) || clean(a.getAttribute("title") ?? "") || slugFor(u.href).replace(/-/g, " ");
    if (label.length > 40) continue;
    const score = (navAnchors.has(a) ? 10 : 0) - (LOW_VALUE.test(u.href + label) ? 20 : 0) - u.pathname.split("/").length;
    const prev = out.get(u.href);
    if (!prev || prev.score < score) out.set(u.href, { url: u.href, label: titleCase(label), score });
  }
  return [...out.values()].sort((a, b) => b.score - a.score).filter((l) => l.score > -15);
}

function extractPage(root: HTMLElement, url: string, slug: string, label: string): SitePage {
  const title = clean(root.querySelector("title")?.text ?? "");
  const description = root.querySelector('meta[name="description"]')?.getAttribute("content")?.trim() ?? "";
  const body = root.querySelector("body") ?? root;
  for (const el of body.querySelectorAll("nav, footer, script, style, noscript, form")) el.remove();

  const sections: SiteSection[] = [{ heading: "", paragraphs: [], items: [], images: [] }];
  const seenText = new Set<string>();
  const seenImg = new Set<string>();
  let chars = 0;

  const current = () => sections[sections.length - 1];
  const walk = (node: Node) => {
    if (sections.length > 30 || chars > 30_000) return;
    if (node.nodeType !== 1) return;
    const el = node as HTMLElement;
    const tag = el.tagName?.toLowerCase() ?? "";
    if (SKIP_TAGS.has(tag)) return;

    if (/^h[1-4]$/.test(tag)) {
      const h = clean(el.text);
      if (h && h.length <= 120 && !seenText.has(h)) {
        seenText.add(h);
        sections.push({ heading: h, paragraphs: [], items: [], images: [] });
      }
      return;
    }
    if (tag === "img") {
      const src = imageSrc(el, url);
      if (src && !seenImg.has(src)) {
        seenImg.add(src);
        if (current().images.length < 12) current().images.push(src);
        // An image that is itself a link (gift card, order button) keeps its target.
        const a = el.closest("a");
        const href = a?.getAttribute("href") ?? "";
        if (href && !/^(javascript:|#)/i.test(href)) {
          try {
            const links = (current().links ??= []);
            const u = new URL(href, url).href;
            if (links.length < 20 && !links.some((l) => l.href === u)) links.push({ text: clean(el.getAttribute("alt") ?? "") || "Image link", href: u });
          } catch { /* bad URL */ }
        }
      }
      return;
    }
    const hasBlockChild = el.childNodes.some((c) => c.nodeType === 1 && BLOCK_TAGS.has((c as HTMLElement).tagName?.toLowerCase()));
    if (!hasBlockChild && (BLOCK_TAGS.has(tag) || tag === "span" || tag === "font" || tag === "center" || tag === "button" || tag === "label" || tag === "a")) {
      for (const img of el.querySelectorAll("img")) walk(img);
      const outer = tag === "a" ? null : el.closest("a");
      for (const a of tag === "a" ? [el] : outer ? [outer] : el.querySelectorAll("a[href]")) {
        const text = clean(a.text);
        const href = a.getAttribute("href") ?? "";
        if (!text || text.length > 80 || /^(javascript:|#)/i.test(href)) continue;
        try {
          const u = new URL(href, url).href;
          const links = (current().links ??= []);
          if (!links.some((l) => l.href === u && l.text === text) && links.length < 20) links.push({ text, href: u });
        } catch { /* bad URL */ }
      }
      const lines = el.text.split(/\n+/).map(clean).filter((t) => t.length >= 2);
      for (const line of lines) {
        if (seenText.has(line) || /^(©|copyright)/i.test(line) || (tag === "button" && UI_TEXT.test(line))) continue;
        seenText.add(line);
        chars += line.length;
        if (tag === "li" || tag === "dd" || tag === "dt") current().items.push(line);
        else current().paragraphs.push(line);
      }
      return;
    }
    for (const child of el.childNodes) walk(child);
  };
  walk(body);

  return {
    slug,
    url,
    label,
    title,
    description,
    sections: sections.filter((s) => s.heading || s.paragraphs.length || s.items.length || s.images.length),
  };
}

function imageSrc(img: HTMLElement, base: string): string | undefined {
  const srcset = img.getAttribute("srcset") ?? img.getAttribute("data-srcset") ?? "";
  const src = largestFromSrcset(srcset) ?? img.getAttribute("data-src") ?? img.getAttribute("data-lazy-src") ?? img.getAttribute("data-image") ?? img.getAttribute("src") ?? "";
  const w = Number(img.getAttribute("width") ?? 0);
  const h = Number(img.getAttribute("height") ?? 0);
  if (!src || src.startsWith("data:") || SKIP_IMG.test(src) || (w && w < 80) || (h && h < 60)) return undefined;
  try {
    const u = new URL(src, base);
    return /^https?:$/.test(u.protocol) ? highestResolution(u).href : undefined;
  } catch {
    return undefined;
  }
}

/** The widest candidate in a srcset ("a.jpg 300w, b.jpg 1200w"). */
function largestFromSrcset(srcset: string): string | undefined {
  const parts = srcset.split(/,\s+/).map((c) => c.trim().split(/\s+/)).filter((c) => c[0]);
  if (!parts.length) return undefined;
  const size = (d?: string) => (d ? parseFloat(d) * (d.endsWith("x") ? 1000 : 1) : 0);
  return parts.sort((a, b) => size(b[1]) - size(a[1]))[0][0];
}

/**
 * Ask the site's own image service for the original or a large size: Squarespace (?format=2500w), WordPress
 * thumbnails (photo-300x200.jpg → photo.jpg), Wix (/v1/fill/w_300…), Shopify (_300x.jpg). Same image, more pixels.
 */
export function highestResolution(u: URL): URL {
  const out = new URL(u.href);
  if (/squarespace-cdn\.com|sqspcdn\.com|static1\.squarespace/.test(out.hostname)) out.searchParams.set("format", "2500w");
  else if (/\/wp-content\/uploads\//.test(out.pathname)) out.pathname = out.pathname.replace(/-\d{2,4}x\d{2,4}(?=\.(jpe?g|png|webp)$)/i, "");
  else if (/wixstatic\.com/.test(out.hostname)) out.pathname = out.pathname.replace(/\/v1\/.*$/, "");
  else if (/cdn\.shopify\.com|\/cdn\/shop\//.test(out.href)) { out.pathname = out.pathname.replace(/_(\d+x\d*|\d*x\d+|small|medium|large|grande|compact)(?=\.(jpe?g|png|webp)$)/i, ""); out.searchParams.delete("width"); }
  return out;
}

function clean(s: string): string {
  return s.replace(/[ \t\r\f\v ]+/g, " ").replace(/\s*\n\s*/g, " ").trim();
}

function titleCase(s: string): string {
  return s.length && s === s.toLowerCase() ? s[0].toUpperCase() + s.slice(1) : s;
}
