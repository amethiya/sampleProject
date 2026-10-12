/**
 * Is the website (and the business behind it) active? A lead only qualifies with evidence of activity inside the
 * window (default 30 days): sitemap or feed dates, dates on the page (news, events, specials, also upcoming ones), a
 * recent Last-Modified header, or a live booking/ordering service that only works while the business trades.
 * Parked, for-sale, "under construction" and default server pages are rejected outright.
 *
 * Pure parsing plus one function that makes at most three small requests (robots.txt, a sitemap, a WordPress feed).
 */
import { fetchText, type FetchedPage } from "./http";

export const DEFAULT_ACTIVE_DAYS = 30;
const DAY = 86_400_000;

export interface ActivityEvidence {
  kind: "sitemap" | "feed" | "page-date" | "last-modified" | "live-service";
  detail: string;
  /** ISO date of the evidence (absent for live services). */
  date?: string;
}

export interface ActivityResult {
  active: boolean;
  windowDays: number;
  /** Most recent dated evidence (ISO date), even when it is outside the window. */
  lastActivity?: string;
  evidence: ActivityEvidence[];
  /** Why the site is not a live business website (parked, for sale, under construction...). */
  parked?: string;
  /** Whether a sitemap was found (null: not checked). */
  hasSitemap?: boolean | null;
}

const PARKED_TITLE = /domain (is )?for sale|buy this domain|parked|under construction|coming soon|account suspended|default web site page|welcome to nginx|apache2 .*default page|it works!|index of \/|site not found|website expired|this site can.t be reached/i;
const PARKED_BODY = /this domain (name )?(may be|is) for sale|buy this domain|domain (is )?parked|parked free|site (is )?under construction|website (is )?(coming soon|under construction)|account (has been )?suspended|hosting account .* (expired|suspended)|this website is (currently )?unavailable/i;

/** A reason when the page is not a live business website, else undefined. */
export function parkedReason(html: string): string | undefined {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() ?? "";
  if (PARKED_TITLE.test(title)) return `Not a live site: "${title.slice(0, 60)}"`;
  const text = visibleText(html);
  if (text.length < 800 && PARKED_BODY.test(text)) return "Not a live site (parked, for sale or under construction)";
  if (text.length < 40) return "Page has no content";
  return undefined;
}

/** Live services that only keep working while the business trades: booking, ordering, appointments, shop checkout. */
const LIVE_SERVICES: [RegExp, string][] = [
  [/opentable\.com/i, "OpenTable reservations"], [/resy\.com/i, "Resy reservations"], [/sevenrooms\.com/i, "SevenRooms reservations"],
  [/thefork\.|quandoo\./i, "online table booking"], [/toasttab\.com/i, "Toast online ordering"], [/squareup\.com|square\.site/i, "Square ordering/payments"],
  [/clover\.com\/online/i, "Clover online ordering"], [/chownow\.com/i, "ChowNow ordering"], [/doordash\.com|grubhub\.com|dine\.online|ubereats\.com|deliveroo\.|just-?eat\.|lieferando\./i, "delivery ordering"],
  [/mindbodyonline\.com|mindbody\.io/i, "Mindbody booking"], [/vagaro\.com/i, "Vagaro booking"], [/fresha\.com/i, "Fresha booking"], [/booksy\.com/i, "Booksy booking"],
  [/treatwell\./i, "Treatwell booking"], [/schedulicity\.com|acuityscheduling\.com|setmore\.com|calendly\.com|simplybook\.(me|it)/i, "online appointment booking"],
  [/zocdoc\.com|doctolib\.|jameda\.de|nexhealth\.com|localmed\.com/i, "online patient booking"],
  [/cdn\.shopify\.com\/s\/|myshopify\.com|ecwid\.com|woocommerce-cart|wc-ajax=/i, "online shop checkout"],
];

export function liveServices(html: string): string[] {
  return [...new Set(LIVE_SERVICES.filter(([re]) => re.test(html)).map(([, name]) => name))];
}

const MONTHS: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
  aug: 7, august: 7, sep: 8, sept: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
  // German, French, Spanish, Italian, Dutch month names (EU sites)
  januar: 0, februar: 1, "märz": 2, maerz: 2, mai: 4, juni: 5, juli: 6, oktober: 9, dezember: 11,
  janvier: 0, "février": 1, fevrier: 1, mars: 2, avril: 3, juin: 5, juillet: 6, "août": 7, aout: 7, septembre: 8, octobre: 9, novembre: 10, "décembre": 11, decembre: 11,
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5, julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
  gennaio: 0, febbraio: 1, aprile: 3, maggio: 4, giugno: 5, luglio: 6, settembre: 8, ottobre: 9, dicembre: 11,
  januari: 0, februari: 1, maart: 2, mei: 4, augustus: 7,
};

function valid(y: number, m: number, d: number): Date | null {
  if (y < 1995 || y > 2100 || m < 0 || m > 11 || d < 1 || d > 31) return null;
  const date = new Date(Date.UTC(y, m, d));
  return date.getUTCMonth() === m ? date : null;
}

/** Calendar dates written on a page (not copyright years). */
export function pageDates(text: string): Date[] {
  const t = text.replace(/(©|&copy;|copyright)[^\n]{0,60}/gi, " ");
  const out: Date[] = [];
  const names = Object.keys(MONTHS).sort((a, b) => b.length - a.length).join("|");
  const push = (d: Date | null) => { if (d) out.push(d); };
  // 2026-10-12
  for (const m of t.matchAll(/\b((?:19|20)\d{2})-(\d{1,2})-(\d{1,2})\b/g)) push(valid(+m[1], +m[2] - 1, +m[3]));
  // October 12, 2026 / Oct 12th 2026
  for (const m of t.matchAll(new RegExp(`\\b(${names})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+((?:19|20)\\d{2})\\b`, "gi"))) push(valid(+m[3], MONTHS[m[1].toLowerCase()], +m[2]));
  // 12 October 2026 / 12. Oktober 2026 / 12 de octubre de 2026
  for (const m of t.matchAll(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th|\\.)?\\s+(?:de\\s+)?(${names})\\.?,?\\s+(?:de\\s+)?((?:19|20)\\d{2})\\b`, "gi"))) push(valid(+m[3], MONTHS[m[2].toLowerCase()], +m[1]));
  // 10/12/2026 (US) and 12.10.2026 (EU)
  for (const m of t.matchAll(/\b(\d{1,2})\/(\d{1,2})\/((?:19|20)\d{2})\b/g)) push(valid(+m[3], +m[1] - 1, +m[2]));
  for (const m of t.matchAll(/\b(\d{1,2})\.(\d{1,2})\.((?:19|20)\d{2})\b/g)) push(valid(+m[3], +m[2] - 1, +m[1]));
  return out;
}

/** <lastmod> dates from a sitemap (or sitemap index). */
export function sitemapDates(xml: string): Date[] {
  return [...xml.matchAll(/<lastmod>\s*([^<\s]+)\s*<\/lastmod>/gi)].map((m) => new Date(m[1])).filter((d) => !isNaN(d.getTime()));
}

/** The newest date in an RSS or Atom feed. */
export function feedDates(xml: string): Date[] {
  return [...xml.matchAll(/<(lastBuildDate|pubDate|updated|published)>\s*([^<]+?)\s*<\/\1>/gi)].map((m) => new Date(m[2])).filter((d) => !isNaN(d.getTime()));
}

export function sitemapUrls(robots: string, origin: string): string[] {
  const listed = [...robots.matchAll(/^\s*sitemap:\s*(\S+)/gim)].map((m) => m[1]);
  return [...new Set([...listed, `${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`, `${origin}/wp-sitemap.xml`])];
}

/**
 * Decide from collected evidence: active when any dated evidence falls inside the window (dates up to a year
 * ahead count: an upcoming event was posted recently), or a live booking/ordering service is on the site.
 */
export function judgeActivity(evidence: ActivityEvidence[], now: Date, windowDays = DEFAULT_ACTIVE_DAYS, parked?: string): ActivityResult {
  const from = now.getTime() - windowDays * DAY, to = now.getTime() + 365 * DAY;
  const dated = evidence.filter((e) => e.date).sort((a, b) => b.date!.localeCompare(a.date!));
  const past = dated.filter((e) => new Date(e.date!).getTime() <= now.getTime());
  const recent = dated.filter((e) => { const t = new Date(e.date!).getTime(); return t >= from && t <= to; });
  const live = evidence.filter((e) => e.kind === "live-service");
  return {
    active: !parked && (recent.length > 0 || live.length > 0),
    windowDays,
    lastActivity: (past[0] ?? dated[0])?.date,
    evidence: [...recent, ...live, ...dated.filter((e) => !recent.includes(e)).slice(0, 3)],
    parked,
  };
}

function visibleText(html: string): string {
  return html.replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

const day = (d: Date) => d.toISOString().slice(0, 10);

/** Gather activity evidence for a fetched homepage (robots.txt + one sitemap + a WordPress feed at most). */
export async function checkActivity(page: FetchedPage, now = new Date(), windowDays = DEFAULT_ACTIVE_DAYS): Promise<ActivityResult> {
  const parked = parkedReason(page.html);
  const evidence: ActivityEvidence[] = [];
  const newest = (dates: Date[]) => dates.filter((d) => d.getTime() <= now.getTime() + 365 * DAY).sort((a, b) => b.getTime() - a.getTime())[0];

  for (const s of liveServices(page.html)) evidence.push({ kind: "live-service", detail: `Live ${s} on the site` });
  const onPage = newest(pageDates(visibleText(page.html)));
  if (onPage) evidence.push({ kind: "page-date", detail: `Date on the page: ${day(onPage)}`, date: day(onPage) });
  if (page.lastModified) {
    const lm = new Date(page.lastModified);
    // A Last-Modified of "now" only means the page is generated on request: not evidence either way.
    if (!isNaN(lm.getTime()) && now.getTime() - lm.getTime() > 60_000) evidence.push({ kind: "last-modified", detail: `Server says last modified ${day(lm)}`, date: day(lm) });
  }

  let hasSitemap: boolean | null = null;
  if (!parked) {
    hasSitemap = false;
    let origin = "";
    try { origin = new URL(page.url).origin; } catch { /* keep empty */ }
    if (origin) {
      const robots = (await fetchText(`${origin}/robots.txt`)) ?? "";
      for (const url of sitemapUrls(robots, origin).slice(0, 2)) {
        const xml = await fetchText(url);
        if (xml && /<urlset|<sitemapindex/i.test(xml)) hasSitemap = true;
        const d = xml ? newest(sitemapDates(xml)) : undefined;
        if (d) { evidence.push({ kind: "sitemap", detail: `Sitemap updated ${day(d)}`, date: day(d) }); break; }
        if (xml && /<urlset|<sitemapindex/i.test(xml)) break; // a sitemap without dates: don't try the next
      }
      if (/wp-content|wp-includes/i.test(page.html)) {
        const feed = await fetchText(`${origin}/feed/`);
        const d = feed ? newest(feedDates(feed)) : undefined;
        if (d) evidence.push({ kind: "feed", detail: `Latest post ${day(d)}`, date: day(d) });
      }
    }
  }
  return { ...judgeActivity(evidence, now, windowDays, parked), hasSitemap };
}
