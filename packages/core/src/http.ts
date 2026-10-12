export const USER_AGENT =
  "Mozilla/5.0 (compatible; RevampRadar/0.1; +https://github.com/amethiya/sampleProject)";

const MAX_BYTES = 1_500_000;

export interface FetchedPage {
  url: string; // final URL after redirects
  status: number;
  html: string;
  /** The server's Last-Modified header, when it sent one. */
  lastModified?: string;
  /** The Server header (technology hint). */
  server?: string;
}

/** Fetch an HTML page with a timeout and a size cap. Returns null on any failure. */
export async function fetchPage(url: string, timeoutMs = 12_000, accept: "html" | "xml" = "html"): Promise<FetchedPage | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "user-agent": USER_AGENT, accept: accept === "xml" ? "application/xml,text/xml" : "text/html,application/xhtml+xml" },
    });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || (type && !type.includes(accept === "xml" ? "xml" : "html"))) return null;
    const text = await res.text();
    return {
      url: res.url || url, status: res.status, html: text.slice(0, MAX_BYTES),
      lastModified: res.headers.get("last-modified") ?? undefined, server: res.headers.get("server") ?? undefined,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Fetch a small text resource (robots.txt, sitemap, feed). Returns null on any failure or non-text answer. */
export async function fetchText(url: string, timeoutMs = 8_000, maxBytes = 600_000): Promise<string | null> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "user-agent": USER_AGENT, accept: "text/plain,application/xml,text/xml,application/rss+xml,*/*;q=0.5" },
    });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || /html/i.test(type)) return null; // soft 404s return HTML
    return (await res.text()).slice(0, maxBytes);
  } catch {
    return null;
  }
}

/** Whether a domain accepts email (has MX records), via DNS over HTTPS. null when the lookup itself failed. */
export async function hasMailServer(domain: string): Promise<boolean | null> {
  try {
    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`, {
      headers: { accept: "application/dns-json" },
      signal: AbortSignal.timeout(6_000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { Status?: number; Answer?: { type: number }[] };
    if (json.Status === 3) return false; // NXDOMAIN
    return (json.Answer ?? []).some((a) => a.type === 15);
  } catch {
    return null;
  }
}

export function normalizeWebsite(raw: string): string | null {
  let s = raw.trim().split(/[;\s]/)[0];
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = "http://" + s;
  try {
    const u = new URL(s);
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function hostId(url: string): string {
  return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
}

/** Hosts that are not a business's own website (social profiles, directories, chains). */
const BLOCKED_HOSTS = [
  "facebook.com", "instagram.com", "twitter.com", "x.com", "tiktok.com", "linkedin.com", "youtube.com",
  "linktr.ee", "yelp.com", "tripadvisor.com", "google.com", "goo.gl", "g.page", "business.site",
  "ubereats.com", "doordash.com", "grubhub.com", "opentable.com", "thefork.com", "deliveroo.com",
  "mcdonalds.com", "starbucks.com", "subway.com", "burgerking.com", "kfc.com", "dominos.com",
  "planetfitness.com", "anytimefitness.com", "mcfit.com", "basic-fit.com", "24hourfitness.com",
  "cvs.com", "walgreens.com", "doctolib.fr", "doctolib.de", "jameda.de", "zocdoc.com",
  // Booking and ordering platforms: a profile there is not the business's own website.
  "booksy.com", "vagaro.com", "fresha.com", "mindbodyonline.com", "schedulicity.com", "setmore.com", "calendly.com",
  "square.site", "squareup.com", "toasttab.com", "clover.com", "chownow.com", "treatwell.com", "treatwell.de", "treatwell.fr",
  "resy.com", "sevenrooms.com", "quandoo.com", "lieferando.de", "just-eat.com", "ubereats.com",
];

export function isBlockedHost(host: string): boolean {
  return BLOCKED_HOSTS.some((b) => host === b || host.endsWith("." + b));
}
