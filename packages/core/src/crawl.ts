import { parse, type HTMLElement, type Node } from "node-html-parser";
import { fetchPage } from "./http";

/** One block of a page: a heading followed by the text, list items and images under it, in page order. */
export interface SiteSection {
  heading: string;
  paragraphs: string[];
  items: string[];
  images: string[];
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

const MAX_PAGES = 8;
const BLOCK_TAGS = new Set([
  "div", "p", "table", "tbody", "tr", "td", "th", "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6",
  "section", "article", "header", "footer", "nav", "blockquote", "form", "main", "aside", "dl", "dd", "dt", "figure",
]);
const SKIP_TAGS = new Set(["script", "style", "noscript", "svg", "form", "iframe", "select", "button", "template", "head"]);
const SKIP_IMG = /spacer|pixel|blank|1x1|counter|tracking|\/icons?\/|facebook|twitter|instagram|whatsapp|linkedin|youtube|valid|w3c|flag|arrow|bullet|loading|ajax-loader/i;
const SKIP_LINK = /\.(pdf|jpe?g|png|gif|zip|docx?|xlsx?|mp3|mp4|webp)$/i;
const LOW_VALUE = /datenschutz|privacy|cookie|agb|terms|login|wp-admin|sitemap|feed|cart|warenkorb|basket|checkout/i;

/** Crawl the start page plus up to 7 internal pages linked from it. Uses at most 8 requests. */
export async function crawlSite(startUrl: string): Promise<SiteSnapshot | null> {
  const home = await fetchPage(startUrl);
  if (!home) return null;
  const homeRoot = prep(home.html);
  const links = internalLinks(homeRoot, home.url).slice(0, MAX_PAGES - 1);
  const pages: SitePage[] = [extractPage(homeRoot, home.url, "home", "Home")];

  const fetched = await Promise.all(links.map((l) => fetchPage(l.url)));
  const seenSlugs = new Set(["home"]);
  fetched.forEach((page, i) => {
    if (!page) return;
    let slug = slugFor(page.url);
    while (seenSlugs.has(slug)) slug += "-2";
    seenSlugs.add(slug);
    const p = extractPage(prep(page.html), page.url, slug, links[i].label);
    if (p.sections.some((s) => s.paragraphs.length || s.items.length || s.images.length)) pages.push(p);
  });
  return { crawledAt: new Date().toISOString(), pages: removeChrome(pages) };
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
  return raw.slice(-48) || "home";
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
      }
      return;
    }
    const hasBlockChild = el.childNodes.some((c) => c.nodeType === 1 && BLOCK_TAGS.has((c as HTMLElement).tagName?.toLowerCase()));
    if (!hasBlockChild && (BLOCK_TAGS.has(tag) || tag === "span" || tag === "font" || tag === "center")) {
      for (const img of el.querySelectorAll("img")) walk(img);
      const lines = el.text.split(/\n+/).map(clean).filter((t) => t.length >= 2);
      for (const line of lines) {
        if (seenText.has(line) || /^(©|copyright)/i.test(line)) continue;
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
  const src = img.getAttribute("src") ?? img.getAttribute("data-src") ?? img.getAttribute("data-lazy-src") ?? "";
  const w = Number(img.getAttribute("width") ?? 0);
  const h = Number(img.getAttribute("height") ?? 0);
  if (!src || src.startsWith("data:") || SKIP_IMG.test(src) || (w && w < 80) || (h && h < 60)) return undefined;
  try {
    const u = new URL(src, base);
    return /^https?:$/.test(u.protocol) ? u.href : undefined;
  } catch {
    return undefined;
  }
}

function clean(s: string): string {
  return s.replace(/[ \t\r\f\v ]+/g, " ").replace(/\s*\n\s*/g, " ").trim();
}

function titleCase(s: string): string {
  return s.length && s === s.toLowerCase() ? s[0].toUpperCase() + s.slice(1) : s;
}
