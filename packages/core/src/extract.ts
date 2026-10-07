import { parse, type HTMLElement } from "node-html-parser";
import type { Contacts, SiteContent } from "./types";

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,24}/gi;
const EMAIL_ONE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,24}$/i;
const JUNK_EMAIL = /\.(png|jpe?g|gif|svg|webp|css|js)$|example\.|sentry|wixpress|domain\.com|yourdomain|email\.com|godaddy|@2x/i;
const CONTACT_LINK = /contact|kontakt|contacto|contatti|impressum|imprint|mentions|about|ueber-uns|uber-uns/i;

export function parseHtml(html: string): HTMLElement {
  return parse(html, { comment: false, blockTextElements: { script: false, style: false, noscript: false } });
}

/** Cloudflare "email protection" obfuscation: hex string XOR'd with its first byte. */
export function decodeCfEmail(hex: string): string {
  const key = parseInt(hex.slice(0, 2), 16);
  let out = "";
  for (let i = 2; i < hex.length; i += 2) out += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16) ^ key);
  return out;
}

export function extractContacts(root: HTMLElement, rawHtml: string, baseUrl: string): Contacts {
  const emails = new Set<string>();
  const phones = new Set<string>();

  for (const a of root.querySelectorAll("a[href]")) {
    const href = a.getAttribute("href") ?? "";
    if (/^mailto:/i.test(href)) emails.add(decodeURIComponent(href.slice(7).split("?")[0]));
    if (/^tel:/i.test(href)) phones.add(decodeURIComponent(href.slice(4)).replace(/[^\d+]/g, ""));
  }
  for (const el of root.querySelectorAll("[data-cfemail]")) emails.add(decodeCfEmail(el.getAttribute("data-cfemail") ?? ""));
  for (const m of rawHtml.replace(/\s*(\[at\]|\(at\))\s*/gi, "@").matchAll(EMAIL_RE)) emails.add(m[0]);

  const clean = [...emails]
    .map((e) => e.trim().toLowerCase())
    .filter((e) => EMAIL_ONE.test(e) && !JUNK_EMAIL.test(e));

  const host = safeHost(baseUrl);
  clean.sort((a, b) => Number(b.endsWith("@" + host)) - Number(a.endsWith("@" + host)));

  return {
    emails: [...new Set(clean)].slice(0, 5),
    phones: [...phones].filter((p) => p.replace(/\D/g, "").length >= 7).slice(0, 3),
    contactPage: findContactPage(root, baseUrl),
  };
}

function findContactPage(root: HTMLElement, baseUrl: string): string | undefined {
  const base = new URL(baseUrl);
  for (const a of root.querySelectorAll("a[href]")) {
    const href = a.getAttribute("href") ?? "";
    if (!CONTACT_LINK.test(href) && !CONTACT_LINK.test(a.text)) continue;
    try {
      const u = new URL(href, base);
      if (u.hostname === base.hostname && /^https?:$/.test(u.protocol) && u.href !== base.href) return u.href;
    } catch {
      /* ignore bad hrefs */
    }
  }
  return undefined;
}

export function extractContent(root: HTMLElement, baseUrl: string): SiteContent {
  const text = (el: HTMLElement | null) => (el?.text ?? "").replace(/\s+/g, " ").trim();
  const meta = (sel: string) => root.querySelector(sel)?.getAttribute("content")?.trim() ?? "";

  for (const el of root.querySelectorAll("script,style,noscript,svg")) el.remove();

  const headings = uniq(root.querySelectorAll("h1,h2,h3").map(text)).filter((h) => h.length > 2 && h.length < 90);

  const paragraphs = uniq(
    root
      .querySelectorAll("p,td,li,div")
      .filter((el) => !el.querySelector("p,div,table,ul"))
      .map(text)
      .filter((t) => t.length >= 60 && t.length <= 700 && !/cookie|javascript|©|copyright/i.test(t)),
  )
    .sort((a, b) => b.length - a.length)
    .slice(0, 8);

  const images: string[] = [];
  let logo: string | undefined;
  for (const img of root.querySelectorAll("img")) {
    const src = img.getAttribute("src") ?? img.getAttribute("data-src") ?? "";
    const abs = absolutize(src, baseUrl);
    if (!abs || /\.gif$|spacer|pixel|icon|blank|1x1|counter/i.test(abs)) continue;
    const hint = `${src} ${img.getAttribute("alt") ?? ""} ${img.getAttribute("class") ?? ""} ${img.getAttribute("id") ?? ""}`;
    if (!logo && /logo/i.test(hint)) logo = abs;
    else images.push(abs);
  }
  const ogImage = absolutize(meta('meta[property="og:image"]'), baseUrl);
  if (ogImage) images.unshift(ogImage);

  const navLinks = uniq(root.querySelectorAll("nav a, header a, #menu a, .menu a").map(text)).filter(
    (t) => t.length > 1 && t.length < 30,
  );

  return {
    title: text(root.querySelector("title")),
    description: meta('meta[name="description"]') || meta('meta[property="og:description"]'),
    headings: headings.slice(0, 12),
    paragraphs,
    images: uniq(images).slice(0, 12),
    logo,
    navLinks: navLinks.slice(0, 8),
  };
}

function absolutize(src: string, base: string): string | undefined {
  if (!src || src.startsWith("data:")) return undefined;
  try {
    const u = new URL(src, base);
    return /^https?:$/.test(u.protocol) ? u.href : undefined;
  } catch {
    return undefined;
  }
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function uniq(xs: string[]): string[] {
  return [...new Set(xs.filter(Boolean))];
}
