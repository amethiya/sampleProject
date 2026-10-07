export const USER_AGENT =
  "Mozilla/5.0 (compatible; RevampRadar/0.1; +https://github.com/amethiya/sampleProject)";

const MAX_BYTES = 1_500_000;

export interface FetchedPage {
  url: string; // final URL after redirects
  status: number;
  html: string;
}

/** Fetch an HTML page with a timeout and a size cap. Returns null on any failure. */
export async function fetchPage(url: string, timeoutMs = 12_000): Promise<FetchedPage | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "user-agent": USER_AGENT, accept: "text/html,application/xhtml+xml" },
    });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || (type && !type.includes("html"))) return null;
    const text = await res.text();
    return { url: res.url || url, status: res.status, html: text.slice(0, MAX_BYTES) };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
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
];

export function isBlockedHost(host: string): boolean {
  return BLOCKED_HOSTS.some((b) => host === b || host.endsWith("." + b));
}
