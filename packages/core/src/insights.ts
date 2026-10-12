/**
 * Website details for a lead's "Website" tab, from free public sources only: is the site live (and how fast), how
 * old is the domain, how long it has been archived, how popular it is (Tranco top-1M rank; whether Google has public
 * Chrome real-user data for it) and Google PageSpeed scores.
 *
 * Exact visit counts are not public: they live in the owner's own Google Analytics / Search Console, which only the
 * owner can see. The traffic level here is an honest estimate from public signals, and says so.
 *
 * Runs in the Worker (fetch only). Every source is optional: a failure is recorded, never thrown.
 */
import { USER_AGENT } from "./http";

export interface SiteInsights {
  checkedAt: string;
  live: { up: boolean; status: number | null; finalUrl: string | null; https: boolean; responseMs: number | null; server?: string; error?: string };
  domain: { name: string; registered?: string; expires?: string; registrar?: string; ageYears?: number; error?: string };
  archive: { first?: string; last?: string; monthsCaptured: number; url: string; error?: string };
  popularity: { trancoRank: number | null; trancoDate?: string; error?: string };
  google: {
    performance?: number; seo?: number; accessibility?: number; bestPractices?: number;
    /** Google has public Chrome real-user data for the whole site (only sites with enough visitors do). */
    hasRealUserData: boolean | null;
    lcpMs?: number; cls?: number; inpMs?: number; overall?: string;
    error?: string;
  };
  traffic: { level: "high" | "moderate" | "low" | "unknown"; label: string; explanation: string };
}

type Fetch = typeof fetch;
const MONTH = /^(\d{4})(\d{2})/;
const isoDay = (ts: string) => `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}`;

async function getJson<T>(f: Fetch, url: string, timeoutMs: number, init: RequestInit = {}): Promise<{ ok: true; data: T } | { ok: false; status: number | null; error: string }> {
  try {
    const res = await f(url, { ...init, headers: { "user-agent": USER_AGENT, accept: "application/json", ...(init.headers ?? {}) }, signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) return { ok: false, status: res.status, error: `HTTP ${res.status}` };
    return { ok: true, data: (await res.json()) as T };
  } catch (e) {
    return { ok: false, status: null, error: (e as Error).name === "TimeoutError" ? "timed out" : (e as Error).message.slice(0, 120) };
  }
}

export function registrableDomain(host: string): string {
  return host.toLowerCase().replace(/^www\./, "");
}

async function liveCheck(f: Fetch, url: string): Promise<SiteInsights["live"]> {
  const t0 = Date.now();
  try {
    const res = await f(url, { redirect: "follow", headers: { "user-agent": USER_AGENT, accept: "text/html" }, signal: AbortSignal.timeout(15_000) });
    const ms = Date.now() - t0;
    await res.body?.cancel().catch(() => {});
    const finalUrl = res.url || url;
    return { up: res.ok, status: res.status, finalUrl, https: finalUrl.startsWith("https://"), responseMs: ms, server: res.headers.get("server") ?? undefined };
  } catch (e) {
    return { up: false, status: null, finalUrl: null, https: url.startsWith("https://"), responseMs: null, error: (e as Error).name === "TimeoutError" ? "No answer within 15 seconds" : (e as Error).message.slice(0, 120) };
  }
}

interface Rdap { events?: { eventAction: string; eventDate: string }[]; entities?: { roles?: string[]; vcardArray?: [string, [string, unknown, string, string][]] }[] }

/** Domain registration dates from RDAP (many EU country domains don't publish them). */
export function parseRdap(r: Rdap, now: Date): Omit<SiteInsights["domain"], "name"> {
  if (!Array.isArray(r?.events)) r = { ...r, events: [] };
  if (!Array.isArray(r.entities)) r = { ...r, entities: [] };
  const ev = (a: string) => r.events?.find((e) => e?.eventAction === a)?.eventDate;
  const registered = ev("registration");
  const expires = ev("expiration");
  const reg = r.entities?.find((e) => Array.isArray(e?.roles) && e.roles.includes("registrar"));
  const card = reg?.vcardArray?.[1];
  const registrar = Array.isArray(card) ? card.find((x) => Array.isArray(x) && x[0] === "fn")?.[3] : undefined;
  const age = registered ? Math.floor((now.getTime() - new Date(registered).getTime()) / (365.25 * 86_400_000)) : NaN;
  const ageYears = Number.isFinite(age) ? age : undefined;
  return { registered: registered?.slice(0, 10), expires: expires?.slice(0, 10), registrar: typeof registrar === "string" ? registrar : undefined, ageYears };
}

/** First and last capture and how many distinct months the Internet Archive captured. Rows: [["timestamp"], ["20090101..."], ...]. */
export function parseCdx(rows: string[][]): { first?: string; last?: string; monthsCaptured: number } {
  if (!Array.isArray(rows)) return { monthsCaptured: 0 };
  const ts = rows.slice(rows[0]?.[0] === "timestamp" ? 1 : 0).map((r) => (Array.isArray(r) ? String(r[0]) : "")).filter((t) => MONTH.test(t)).sort();
  return { first: ts[0] ? isoDay(ts[0]) : undefined, last: ts.length ? isoDay(ts[ts.length - 1]) : undefined, monthsCaptured: new Set(ts.map((t) => t.slice(0, 6))).size };
}

interface Psi {
  lighthouseResult?: { categories?: Record<string, { score: number | null }> };
  loadingExperience?: { metrics?: Record<string, { percentile: number }>; overall_category?: string; origin_fallback?: boolean };
  originLoadingExperience?: { metrics?: Record<string, { percentile: number }>; overall_category?: string };
}

export function parsePsi(p: Psi): Omit<SiteInsights["google"], "error"> {
  const c = p.lighthouseResult?.categories ?? {};
  const pct = (k: string) => (typeof c[k]?.score === "number" ? Math.round((c[k].score as number) * 100) : undefined);
  const field = p.originLoadingExperience?.metrics && Object.keys(p.originLoadingExperience.metrics).length ? p.originLoadingExperience : p.loadingExperience?.metrics && Object.keys(p.loadingExperience.metrics).length ? p.loadingExperience : undefined;
  const m = field?.metrics ?? {};
  return {
    performance: pct("performance"), seo: pct("seo"), accessibility: pct("accessibility"), bestPractices: pct("best-practices"),
    hasRealUserData: !!field,
    lcpMs: m.LARGEST_CONTENTFUL_PAINT_MS?.percentile,
    cls: m.CUMULATIVE_LAYOUT_SHIFT_SCORE ? m.CUMULATIVE_LAYOUT_SHIFT_SCORE.percentile / 100 : undefined,
    inpMs: m.INTERACTION_TO_NEXT_PAINT?.percentile,
    overall: field?.overall_category,
  };
}

/** The traffic estimate from public signals. Never presented as a visit count. */
export function trafficLevel(i: Pick<SiteInsights, "live" | "popularity" | "google">): SiteInsights["traffic"] {
  if (!i.live.up) return { level: "unknown", label: "Site not reachable", explanation: "The site didn't answer, so its traffic can't be estimated." };
  const rank = i.popularity.trancoRank;
  if (rank) {
    const pos = `#${rank.toLocaleString("en-US")} worldwide`;
    return rank <= 100_000
      ? { level: "high", label: `High: ${pos}`, explanation: "In the top 100,000 websites of the Tranco ranking, a research list built from several traffic sources." }
      : { level: "moderate", label: `Moderate: ${pos}`, explanation: "In the top 1 million websites of the Tranco ranking (a research list built from several traffic sources): strong for a local business, modest on the web as a whole." };
  }
  if (i.google.hasRealUserData === true) return { level: "moderate", label: "Moderate: enough visitors for Google's public data", explanation: "Google publishes real Chrome-user data only for sites with a meaningful number of visitors, and this site has it. It is not in the top 1 million." };
  if (i.google.hasRealUserData === false) return { level: "low", label: "Low", explanation: "Too few visitors for Google's public Chrome real-user data, and not in the top 1 million websites. Typical for a small local business site." };
  if (i.popularity.trancoRank === null && !i.popularity.error) return { level: "low", label: "Low: not in the top 1 million websites", explanation: "Not in the Tranco top-1M ranking. Google's real-user data (which can tell low from moderate traffic) needs a free Google API key; see the note below." };
  return { level: "unknown", label: "Unknown", explanation: "The public traffic sources didn't answer this time. Try Refresh." };
}

/**
 * Collect every source in parallel (at most 6 requests). Google PageSpeed needs `googleKey` (a free Google Cloud API
 * key with the PageSpeed Insights API enabled): Google refuses keyless calls. Without a key that part is skipped.
 */
export async function websiteInsights(website: string, opts: { googleKey?: string; now?: Date; fetch?: Fetch } = {}): Promise<SiteInsights> {
  const f = opts.fetch ?? fetch;
  const now = opts.now ?? new Date();
  let host = "";
  try { host = new URL(website).hostname; } catch { /* keep empty */ }
  if (!host) {
    const live = { up: false, status: null, finalUrl: null, https: false, responseMs: null, error: "Not a valid website address" };
    const empty = { checkedAt: now.toISOString(), live, domain: { name: website, error: "Not a valid website address" }, archive: { monthsCaptured: 0, url: "https://web.archive.org/" }, popularity: { trancoRank: null }, google: { hasRealUserData: null } };
    return { ...empty, traffic: trafficLevel(empty) };
  }
  // Only the registrable part is looked up, minus "www." (a shop.example.co.uk subdomain is looked up as is).
  const domain = registrableDomain(host);
  const archiveUrl = `https://web.archive.org/web/*/${domain}`;
  const psiParams: [string, string][] = [
    ["url", website], ["strategy", "MOBILE"],
    ["category", "PERFORMANCE"], ["category", "SEO"], ["category", "ACCESSIBILITY"], ["category", "BEST_PRACTICES"],
    // Only the parts we use: the full answer is several hundred kB.
    ["fields", "lighthouseResult/categories/*/score,loadingExperience(metrics,overall_category,origin_fallback),originLoadingExperience(metrics,overall_category)"],
  ];
  // The key goes in a header, never the URL, so it can't leak into a stored error message.
  const psiUrl = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?" + new URLSearchParams(psiParams).toString();

  const cdxBase = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(domain)}&output=json&fl=timestamp&filter=statuscode:200`;
  const [live, rdap, cdx, firstCapture, tranco, psi] = await Promise.all([
    liveCheck(f, website),
    getJson<Rdap>(f, `https://rdap.org/domain/${encodeURIComponent(domain)}`, 10_000, { headers: { accept: "application/rdap+json, application/json" } }),
    // The month-by-month history is the useful one but the archive is often overloaded; the first capture is cheap.
    getJson<string[][]>(f, `${cdxBase}&collapse=timestamp:6&limit=600`, 15_000),
    getJson<string[][]>(f, `${cdxBase}&limit=1`, 10_000),
    getJson<{ ranks?: { date: string; rank: number }[] }>(f, `https://tranco-list.eu/api/ranks/domain/${encodeURIComponent(domain)}`, 8_000),
    opts.googleKey ? getJson<Psi>(f, psiUrl, 60_000, { headers: { "x-goog-api-key": opts.googleKey } }) : Promise.resolve(null),
  ]);

  const safe = <T,>(fn: () => T, fallback: T): T => { try { return fn(); } catch { return fallback; } };
  const insights: Omit<SiteInsights, "traffic"> = {
    checkedAt: now.toISOString(),
    live,
    domain: rdap.ok ? { name: domain, ...safe(() => parseRdap(rdap.data, now), { error: "The registry's answer couldn't be read" }) } : { name: domain, error: rdap.status === 404 ? "This domain's registry doesn't publish registration dates" : `Lookup failed (${rdap.error})` },
    archive: cdx.ok ? { ...safe(() => parseCdx(cdx.data), { monthsCaptured: 0 }), url: archiveUrl }
      : firstCapture.ok ? { first: safe(() => parseCdx(firstCapture.data).first, undefined), monthsCaptured: 0, url: archiveUrl, error: "The archive's full history didn't load (it is often busy); only the first capture is shown" }
      : { monthsCaptured: 0, url: archiveUrl, error: `The Internet Archive didn't answer (${cdx.error})` },
    popularity: tranco.ok
      ? { trancoRank: tranco.data.ranks?.[0]?.rank ?? null, trancoDate: tranco.data.ranks?.[0]?.date }
      : { trancoRank: null, error: tranco.status === 404 ? undefined : `Ranking lookup failed (${tranco.error})` },
    google: !psi ? { hasRealUserData: null, error: "Add a free Google API key (GOOGLE_API_KEY) to see Google PageSpeed scores and real-user data" }
      : psi.ok ? safe(() => parsePsi(psi.data), { hasRealUserData: null, error: "Google PageSpeed's answer couldn't be read" } as SiteInsights["google"])
      : { hasRealUserData: null, error: psi.status === 429 ? "Google PageSpeed quota reached for today" : `Google PageSpeed failed (${psi.error})` },
  };
  return { ...insights, traffic: trafficLevel(insights) };
}
