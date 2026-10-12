import { afterEach, describe, expect, it, vi } from "vitest";
import {
  auditHtml, buildOverpassQuery, decodeCfEmail, extractContacts, extractContent, parseHtml,
  parseOverpass, renderRedesign, sliceForCursor, buildPitch, CATEGORIES, CITIES,
} from "../src";

const OLD = `<html><head><title>Joe's Diner</title><meta name="generator" content="Microsoft FrontPage 4.0"></head>
<body bgcolor="#ffffff"><center><font face="Arial">Welcome to Joe's</font></center>
<table><tr><td><table><tr><td><table><tr><td>Menu</td></tr></table></td></tr></table></td></tr></table>
<a href="mailto:joe@joesdiner.com">Email</a> <a href="tel:+1 (555) 123-4567">Call</a> <a href="/contact.htm">Contact us</a>
<p>Copyright &copy; 2009 Joe's Diner. All rights reserved.</p>
<script src="js/jquery-1.4.2.min.js"></script></body></html>`;

const MODERN = `<!doctype html><html><head><meta name="viewport" content="width=device-width"><meta name="description" content="x">
<meta property="og:title" content="x"><style>@media (max-width:600px){}</style></head><body><div id="__next"></div>
<script id="__NEXT_DATA__"></script><footer>© ${new Date().getFullYear()}</footer></body></html>`;

describe("auditHtml", () => {
  it("scores an old site high with reasons", () => {
    const r = auditHtml(OLD, "http://joesdiner.com/", new Date("2026-10-07"));
    expect(r.score).toBeGreaterThanOrEqual(70);
    expect(r.reasons).toEqual(expect.arrayContaining(["No HTTPS", "Not mobile-friendly (no viewport meta)"]));
    expect(r.reasons.join()).toMatch(/FrontPage/);
    expect(r.reasons.join()).toMatch(/2009/);
    expect(r.reasons.join()).toMatch(/jQuery 1\.4/);
  });
  it("scores a modern site low", () => {
    expect(auditHtml(MODERN, "https://modern.io/").score).toBe(0);
  });
});

describe("extraction", () => {
  it("finds emails, phones and contact page", () => {
    const c = extractContacts(parseHtml(OLD), OLD, "http://joesdiner.com/");
    expect(c.emails).toEqual(["joe@joesdiner.com"]);
    expect(c.phones).toEqual(["+15551234567"]);
    expect(c.contactPage).toBe("http://joesdiner.com/contact.htm");
  });
  it("ignores junk emails and decodes cloudflare protection", () => {
    // "a@b.co" xor 0x42
    const enc = "42" + [..."a@b.co"].map((ch) => (ch.charCodeAt(0) ^ 0x42).toString(16).padStart(2, "0")).join("");
    expect(decodeCfEmail(enc)).toBe("a@b.co");
    const html = `<img src="logo@2x.png"><span data-cfemail="${enc}"></span> info@example.com`;
    expect(extractContacts(parseHtml(html), html, "https://b.co").emails).toEqual(["a@b.co"]);
  });
  it("extracts content with absolute image URLs", () => {
    const html = `<title>T</title><h1>Fresh Pasta</h1><img src="/img/logo.png" alt="logo"><img src="/img/room.jpg">
      <p>${"We have served handmade pasta in this neighbourhood since 1987, family run. ".repeat(2)}</p>`;
    const c = extractContent(parseHtml(html), "http://x.com/a/");
    expect(c.logo).toBe("http://x.com/img/logo.png");
    expect(c.images).toEqual(["http://x.com/img/room.jpg"]);
    expect(c.headings).toContain("Fresh Pasta");
    expect(c.paragraphs[0]).toMatch(/handmade pasta/);
  });
});

describe("discovery", () => {
  it("builds an Overpass query and skips chains/social links", () => {
    const cat = CATEGORIES[0], city = CITIES[0];
    expect(buildOverpassQuery(cat, city)).toContain(`(around:3500,${city.lat.toFixed(4)},${city.lon.toFixed(4)})`);
    const cands = parseOverpass({ elements: [
      { tags: { name: "Joe's", website: "www.joesdiner.com", email: "hi@joesdiner.com" } },
      { tags: { name: "Joe's dup", website: "http://joesdiner.com/menu" } },
      { tags: { name: "McD", website: "https://mcdonalds.com", brand: "McDonald's" } },
      { tags: { name: "FB only", website: "https://facebook.com/x" } },
    ] }, cat, city);
    expect(cands.map((c) => c.id)).toEqual(["joesdiner.com"]);
    expect(cands[0].osmEmail).toBe("hi@joesdiner.com");
  });
  it("rotates through every category/city pair", () => {
    const n = CATEGORIES.length * CITIES.length;
    const seen = new Set(Array.from({ length: n }, (_, i) => { const s = sliceForCursor(i); return s.category.id + s.city.id; }));
    expect(seen.size).toBe(n);
  });
});

describe("renderRedesign", () => {
  it("escapes scraped content and marks the page as a concept", () => {
    const html = renderRedesign({
      name: `<script>alert(1)</script>Joe's`, category: "restaurant", city: "Austin", country: "US",
      website: "http://joesdiner.com", contacts: { emails: ["joe@joesdiner.com"], phones: [] },
      content: { title: "", description: "", headings: [], paragraphs: ["<img src=x onerror=alert(1)> long enough paragraph text here"], images: ["javascript:alert(1)", "https://x.com/a'b.jpg"], navLinks: [] },
    });
    expect(html).not.toContain("<script>alert(1)");
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain("javascript:alert");
    expect(html).toContain("noindex");
    expect(html).toContain("Not the official website");
  });
});

describe("buildPitch", () => {
  it("writes the pitch for an older lead from its audit reasons, with preview link, opt-out and Gmail compose URL", () => {
    const lead = {
      id: "joesdiner.com", name: "Joe's Diner", category: "restaurant", city: "Austin", country: "US", region: "us",
      website: "http://joesdiner.com/", auditedAt: "", qualified: true,
      audit: { score: 70, finalUrl: "", https: false, reasons: ["No HTTPS", "Not mobile-friendly (no viewport meta)", "Copyright year 2009 (17 years old)"] },
      contacts: { emails: ["joe@joesdiner.com"], phones: [] },
      content: { title: "", description: "", headings: [], paragraphs: [], images: [], navLinks: [] },
    } as const;
    const p = buildPitch(lead as never, "https://x.dev/preview/joesdiner.com", "Vivek")!;
    expect(p.to).toBe("joe@joesdiner.com");
    expect(p.body).toContain("https://x.dev/preview/joesdiner.com");
    expect(p.body).toMatch(/phone/);
    expect(p.body).toMatch(/Not secure/);
    expect(p.body).toContain("the best restaurant in Austin");
    expect(p.body).toMatch(/won't contact you again/);
    expect(p.subject).toBe("Joe's Diner: a new website for your restaurant (free preview inside)");
    expect(p.gmailUrl).toContain("to=joe%40joesdiner.com");
  });

  it("pitches what the audit measured, with the business type in the AI-search line", () => {
    const profile = {
      businessNoun: "gym",
      findings: {
        design: ["The layout is built with old techniques (tables, fixed widths, inline styling), so it looks dated next to modern sites"],
        technology: ["Very old jQuery 1.7"], userExperience: ["Phone numbers are not tappable, so mobile visitors can't call in one tap"],
        mobile: ["The layout doesn't adapt to phone and tablet screens"],
        seo: ["No meta description, so Google writes its own snippet", "No main heading (H1) on the page"],
        aiSearch: ["The site doesn't publish this information in a form they can read (no structured business data)"],
      },
      tech: { cms: "WordPress", libraries: ["jQuery 1.7", "Bootstrap 3"], https: true },
    };
    const lead = { id: "iron.com", name: "Iron Gym", category: "gym", city: "Austin", country: "US", region: "us", website: "https://www.iron.com/", auditedAt: "", qualified: true,
      audit: { score: 60, finalUrl: "", https: true, reasons: [] }, contacts: { emails: ["hi@iron.com"], phones: [] }, content: {}, profile };
    const p = buildPitch(lead as never, "https://x.dev/preview/iron.com/", "Vivek")!;
    expect(p.body).toContain("Outdated design and technology: the layout is built with old techniques");
    expect(p.body).toContain("older technology (WordPress, jQuery 1.7, Bootstrap 3)");
    expect(p.body).toContain("Not user-friendly: phone numbers are not tappable");
    expect(p.body).toContain("Not built for phones");
    expect(p.body).toContain("Search engines (SEO) aren't set up: no meta description");
    expect(p.body).toContain('"the best gym in Austin"');
    expect(p.body).toContain("Your site doesn't publish this information in a form they can read (no structured business data), so your gym is unlikely to be suggested.");
    expect(p.body).toContain("Most people look for a gym on their phone today.");
    expect(p.body).toContain("recommend you when someone asks for the best gym in Austin");
    expect(p.body).toContain("Full mobile support");
    expect(p.body).toContain("looking at gyms in Austin");
    expect(p.body).not.toMatch(/Not secure/);
    // Nothing is claimed without a finding behind it.
    const quiet = buildPitch({ ...lead, profile: { ...profile, findings: { ...profile.findings, mobile: [], seo: [], aiSearch: [] } } } as never, "u", "V")!;
    expect(quiet.body).not.toMatch(/Not built for phones|Search engines \(SEO\) aren't|AI assistants aren't recommending/);
    expect(quiet.body).toContain("AI-search ready"); // the offer still lists what we'd do
  });
});

describe("night search window", () => {
  it("runs 01:00–07:00 IST (19:30–01:30 UTC), across midnight UTC, and counts the night from its start", async () => {
    const { inWindow, windowStart } = await import("../src");
    const at = (iso: string) => new Date(iso);
    expect(inWindow(at("2026-10-12T19:29:00Z"))).toBe(false);
    expect(inWindow(at("2026-10-12T19:30:00Z"))).toBe(true);
    expect(inWindow(at("2026-10-12T23:59:00Z"))).toBe(true);
    expect(inWindow(at("2026-10-13T01:29:00Z"))).toBe(true);
    expect(inWindow(at("2026-10-13T01:30:00Z"))).toBe(false);
    expect(inWindow(at("2026-10-13T06:00:00Z"))).toBe(false);
    expect(windowStart(at("2026-10-13T00:45:00Z")).toISOString()).toBe("2026-10-12T19:30:00.000Z");
    expect(windowStart(at("2026-10-12T21:00:00Z")).toISOString()).toBe("2026-10-12T19:30:00.000Z");
    expect(inWindow(at("2026-10-12T10:00:00Z"), "09:00", "17:00")).toBe(true);
  });
});

describe("website details", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("reads domain age, archive history and Google's real-user data, and estimates traffic honestly", async () => {
    const { parseRdap, parseCdx, parsePsi, trafficLevel } = await import("../src");
    const now = new Date("2026-10-12T00:00:00Z");
    expect(parseRdap({ events: [{ eventAction: "registration", eventDate: "1997-11-05T05:00:00Z" }, { eventAction: "expiration", eventDate: "2028-11-04T04:00:00Z" }],
      entities: [{ roles: ["registrar"], vcardArray: ["vcard", [["version", {}, "text", "4.0"], ["fn", {}, "text", "Network Solutions, LLC"]]] }] }, now))
      .toEqual({ registered: "1997-11-05", expires: "2028-11-04", registrar: "Network Solutions, LLC", ageYears: 28 });
    expect(parseCdx([["timestamp"], ["19981206111024"], ["20090115000000"], ["20260901000000"]])).toEqual({ first: "1998-12-06", last: "2026-09-01", monthsCaptured: 3 });
    const g = parsePsi({ lighthouseResult: { categories: { performance: { score: 0.42 }, seo: { score: 0.9 }, accessibility: { score: 0.7 }, "best-practices": { score: 1 } } },
      originLoadingExperience: { metrics: { LARGEST_CONTENTFUL_PAINT_MS: { percentile: 3100 }, CUMULATIVE_LAYOUT_SHIFT_SCORE: { percentile: 12 }, INTERACTION_TO_NEXT_PAINT: { percentile: 240 } }, overall_category: "AVERAGE" } });
    expect(g).toMatchObject({ performance: 42, seo: 90, accessibility: 70, bestPractices: 100, hasRealUserData: true, lcpMs: 3100, cls: 0.12, inpMs: 240, overall: "AVERAGE" });
    expect(parsePsi({ lighthouseResult: { categories: {} }, loadingExperience: {} as never }).hasRealUserData).toBe(false);
    const live = { up: true, status: 200, finalUrl: "x", https: true, responseMs: 900 };
    expect(trafficLevel({ live, popularity: { trancoRank: 920275 }, google: { hasRealUserData: null } }).label).toBe("Moderate: #920,275 worldwide");
    expect(trafficLevel({ live, popularity: { trancoRank: 5000 }, google: { hasRealUserData: null } }).level).toBe("high");
    expect(trafficLevel({ live, popularity: { trancoRank: null }, google: { hasRealUserData: true } }).level).toBe("moderate");
    expect(trafficLevel({ live, popularity: { trancoRank: null }, google: { hasRealUserData: false } }).level).toBe("low");
    expect(trafficLevel({ live: { ...live, up: false }, popularity: { trancoRank: null }, google: { hasRealUserData: null } }).level).toBe("unknown");
  });

  it("collects every source, skips Google without a key, and survives an archive outage", async () => {
    const { websiteInsights } = await import("../src");
    const calls: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: string) => {
      const url = String(input); calls.push(url);
      const j = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "content-type": "application/json" } });
      if (url.startsWith("https://rdap.org")) return j({ events: [{ eventAction: "registration", eventDate: "2010-01-01T00:00:00Z" }] });
      if (url.includes("collapse=timestamp:6")) return new Response("Temporarily Offline", { status: 503 });
      if (url.includes("web.archive.org/cdx") && url.includes("limit=1")) return j([["timestamp"], ["20110304000000"]]);
      if (url.startsWith("https://tranco-list.eu")) return j({ ranks: [] });
      if (url.includes("pagespeedonline")) return j({ lighthouseResult: { categories: { performance: { score: 0.5 } } }, loadingExperience: { id: "x" } });
      return new Response("<html></html>", { status: 200, headers: { "content-type": "text/html" } });
    }));
    const noKey = await websiteInsights("https://www.bakery.example/", { now: new Date("2026-10-12T00:00:00Z") });
    expect(calls.some((u) => u.includes("pagespeedonline"))).toBe(false);
    expect(noKey.google.error).toMatch(/Google API key/);
    expect(noKey.domain).toMatchObject({ name: "bakery.example", registered: "2010-01-01", ageYears: 16 });
    expect(noKey.archive).toMatchObject({ first: "2011-03-04", monthsCaptured: 0 });
    expect(noKey.archive.error).toMatch(/only the first capture/);
    expect(noKey.traffic.level).toBe("low");
    const withKey = await websiteInsights("https://www.bakery.example/", { googleKey: "K" });
    expect(calls.find((u) => u.includes("pagespeedonline"))).toMatch(/strategy=MOBILE/);
    expect(calls.find((u) => u.includes("pagespeedonline"))).not.toMatch(/key=/);
    expect((await websiteInsights("not a url")).live.error).toBe("Not a valid website address");
    expect(withKey.google).toMatchObject({ performance: 50, hasRealUserData: false });
    expect(withKey.traffic.level).toBe("low");
  });
});

describe("lead criteria", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("reads dates in US, EU and ISO formats, ignoring copyright lines", async () => {
    const { pageDates, sitemapDates, feedDates } = await import("../src");
    const iso = (ds: Date[]) => ds.map((d) => d.toISOString().slice(0, 10)).sort();
    expect(iso(pageDates("Live music on October 3, 2026! Brunch 12 Oktober 2026. Menu updated 2026-09-28. Closed 11/26/2026, 24.12.2026. © 2019 Joe's"))).toEqual(["2026-09-28", "2026-10-03", "2026-10-12", "2026-11-26", "2026-12-24"]);
    expect(pageDates("Copyright 2026 Joe's Diner. Since 1987.")).toEqual([]);
    expect(iso(sitemapDates("<urlset><url><lastmod>2026-10-01T10:00:00+00:00</lastmod></url><url><lastmod>2024-01-01</lastmod></url></urlset>"))).toEqual(["2024-01-01", "2026-10-01"]);
    expect(iso(feedDates("<rss><channel><lastBuildDate>Mon, 05 Oct 2026 09:00:00 +0000</lastBuildDate></channel></rss>"))).toEqual(["2026-10-05"]);
  });

  it("counts a site as active only with evidence inside the window, or a live booking/ordering service", async () => {
    const { judgeActivity, liveServices, parkedReason } = await import("../src");
    const now = new Date("2026-10-12T12:00:00Z");
    expect(judgeActivity([{ kind: "sitemap", detail: "x", date: "2026-09-20" }], now, 30).active).toBe(true);
    const old = judgeActivity([{ kind: "sitemap", detail: "x", date: "2026-08-01" }], now, 30);
    expect(old.active).toBe(false);
    expect(old.lastActivity).toBe("2026-08-01");
    expect(judgeActivity([{ kind: "sitemap", detail: "x", date: "2026-08-01" }], now, 90).active).toBe(true);
    expect(judgeActivity([{ kind: "page-date", detail: "x", date: "2026-12-24" }], now, 30).active).toBe(true); // upcoming event
    expect(judgeActivity([{ kind: "live-service", detail: "Live OpenTable reservations on the site" }], now, 30).active).toBe(true);
    expect(judgeActivity([{ kind: "sitemap", detail: "x", date: "2026-10-10" }], now, 30, "Not a live site").active).toBe(false);
    expect(liveServices('<a href="https://www.opentable.com/single.aspx?rid=1">Reserve</a>')).toEqual(["OpenTable reservations"]);
    expect(parkedReason("<title>example.com is for sale!</title><body>Buy this domain</body>")).toMatch(/Not a live site/);
    expect(parkedReason("<title>Under Construction</title>")).toMatch(/Not a live site/);
    expect(parkedReason(`<title>Joe's Diner</title><body>${"Great food since 1987. ".repeat(10)}</body>`)).toBeUndefined();
  });

  it("names the business the way searchers do, from its map listing, name or category", async () => {
    const { businessNoun } = await import("../src");
    expect(businessNoun("salon", "hairdresser")).toBe("hair salon");
    expect(businessNoun("gym", "fitness_centre")).toBe("gym");
    expect(businessNoun("retail", "florist")).toBe("florist");
    expect(businessNoun("healthcare", undefined, "Smile Dental Care")).toBe("dentist");
    expect(businessNoun("retail")).toBe("shop");
  });

  it("finds SEO and AI-search gaps from the page, and recognises structured business data", async () => {
    const { siteFindings, structuredDataTypes, auditHtml } = await import("../src");
    const bare = "<html><head><title>Home</title></head><body><p>Welcome</p></body></html>";
    const f = siteFindings(bare, auditHtml(bare, "http://x.com/"), { hasSitemap: false, wordCount: 20 });
    expect(f.seo.join(" ")).toMatch(/title .*tells Google very little/);
    expect(f.seo.join(" ")).toMatch(/No meta description/);
    expect(f.seo).toContain("No sitemap for search engines");
    expect(f.aiSearch.join(" ")).toMatch(/no structured business data/);
    expect(f.mobile.length).toBeGreaterThan(0);
    const ld = `<script type="application/ld+json">{"@context":"https://schema.org","@type":"Restaurant","openingHours":"Mo-Su 11:00-22:00"}</script>`;
    expect(structuredDataTypes(ld)).toEqual(["Restaurant"]);
    expect(siteFindings(ld, auditHtml(ld, "https://x.com/"), { wordCount: 400 }).aiSearch).toEqual([]);
  });

  it("only looks for clients in the United States and the European Union", async () => {
    const { CITIES, isTargetCountry } = await import("../src");
    expect(CITIES.every((c) => isTargetCountry(c.country) && (c.region === "us" || c.region === "eu"))).toBe(true);
    expect(isTargetCountry("DE")).toBe(true);
    expect(isTargetCountry("CA")).toBe(false);
    expect(isTargetCountry("GB")).toBe(false);
  });

  it("qualifies an outdated, active US/EU site with a working email, and records why others are skipped", async () => {
    const { auditCandidate } = await import("../src");
    const now = new Date("2026-10-12T12:00:00Z");
    const home = `<html><head><title>Joe's Diner Austin</title></head><body><table><tr><td><font>Joe's Diner</font></td></tr></table><table><tr><td>a</td></tr></table><table><tr><td>b</td></tr></table>
      <center>${"Best breakfast in town, served every morning. ".repeat(12)}</center><a href="mailto:joe@joesdiner.com">Email</a> © 2011</body></html>`;
    const stub = (sitemapDate: string, mx: boolean) => vi.stubGlobal("fetch", vi.fn(async (input: string) => {
      const url = String(input);
      const res = (body: string, type: string) => new Response(body, { status: 200, headers: { "content-type": type } });
      if (url.startsWith("https://cloudflare-dns.com")) return new Response(JSON.stringify({ Status: 0, Answer: mx ? [{ type: 15 }] : [] }), { headers: { "content-type": "application/dns-json" } });
      if (url.endsWith("/robots.txt")) return res("User-agent: *\nSitemap: http://joesdiner.com/sitemap.xml", "text/plain");
      if (url.endsWith("/sitemap.xml")) return res(`<urlset><url><loc>x</loc><lastmod>${sitemapDate}</lastmod></url></urlset>`, "application/xml");
      if (url === "http://joesdiner.com/") return res(home, "text/html");
      return new Response("", { status: 404 });
    }));
    const cand = { id: "joesdiner.com", name: "Joe's Diner", category: "restaurant", kind: "restaurant", city: "Austin", country: "US", region: "us", website: "http://joesdiner.com/" } as const;

    stub("2026-10-01", true);
    const ok = (await auditCandidate(cand as never, 35, { now }))!;
    expect(ok.rejected).toEqual([]);
    expect(ok.qualified).toBe(true);
    expect(ok.profile!.activity.active).toBe(true);
    expect(ok.profile!.activity.evidence[0].detail).toBe("Sitemap updated 2026-10-01");
    expect(ok.profile!.email).toEqual({ address: "joe@joesdiner.com", onSiteDomain: true, mailServer: true });
    expect(ok.profile!.businessNoun).toBe("restaurant");
    expect(ok.profile!.hasSitemap).toBe(true);

    stub("2025-01-01", true);
    const stale = (await auditCandidate(cand as never, 35, { now }))!;
    expect(stale.qualified).toBe(false);
    expect(stale.rejected!.join()).toMatch(/No sign of activity in the last 30 days \(latest: 2025-01-01\)/);

    stub("2026-10-01", false);
    expect((await auditCandidate(cand as never, 35, { now }))!.rejected!.join()).toMatch(/doesn't accept mail/);

    stub("2026-10-01", true);
    const abroad = (await auditCandidate({ ...cand, country: "CA" } as never, 35, { now }))!;
    expect(abroad.qualified).toBe(false);
    expect(abroad.rejected!.join()).toMatch(/Not in the US or the EU \(Canada\)/);
  });
});

describe("design system", () => {
  it("keeps the skill's generated references in step with the code", async () => {
    const { LOOKS } = await import("../src");
    const { readFileSync } = await import("node:fs");
    const md = readFileSync(new URL("../../../.claude/skills/website-redesign/references/themes.md", import.meta.url), "utf8");
    for (const l of LOOKS) expect(md, `run npm run skill:catalog (${l.id} missing)`).toContain(`\`${l.id}\``);
  });

  it("ships the Magic UI + Smooth UI kit on every page and documents every component for the skill", async () => {
    const { UI_KIT, UI_KIT_CSS, UI_KIT_JS, renderSitePage, snapshotFromLead } = await import("../src");
    const { readFileSync } = await import("node:fs");
    expect(new Set(UI_KIT.map((c) => c.library))).toEqual(new Set(["Magic UI", "Smooth UI", "21st.dev", "Bencho"]));
    expect(new Set(UI_KIT.map((c) => c.id)).size).toBe(UI_KIT.length);
    // Runs under the preview CSP: no network, no storage, no external hosts, no eval.
    expect(UI_KIT_JS).not.toMatch(/fetch\(|XMLHttpRequest|localStorage|sessionStorage|https?:\/\/|eval\(|new Function/);
    expect(UI_KIT_CSS).not.toMatch(/https?:\/\/|@import/);
    expect(() => new Function(UI_KIT_JS)).not.toThrow();
    const md = readFileSync(new URL("../../../.claude/skills/website-redesign/references/ui-kit.md", import.meta.url), "utf8");
    for (const c of UI_KIT) expect(md, `run npm run skill:catalog (${c.id} missing)`).toContain(`\`${c.id}\``);
    expect(readFileSync(new URL("../../../.claude/skills/website-redesign/references/ui-kit.js", import.meta.url), "utf8")).toContain(UI_KIT_JS);
    const lead = { name: "Kit Cafe", category: "cafe", city: "Austin", country: "US", website: "https://kit.example", contacts: { emails: [], phones: [] }, content: { title: "Kit Cafe", description: "", headings: ["Coffee"], paragraphs: ["Roasting our own beans in Austin since 1987, every single morning. Come early for the first batch."], images: [], navLinks: [] } } as never;
    const html = renderSitePage(lead, snapshotFromLead(lead), "home");
    expect(html).toContain(UI_KIT_JS);
    expect(html).toContain('class="mu-progress"');
    expect(html).toContain("data-su-magnetic");
    expect(html).toContain("data-su-scroll-reveal");
  });
  it("gives each direction its own kit components instead of the same set on every site", async () => {
    const { BRIEF, RUNNER_PROMPT, briefContent, UI_KIT, DIRECTIONS } = await import("../src");
    expect(BRIEF).not.toContain("UI kit placement");
    expect(RUNNER_PROMPT).toContain("motion system");
    const lead = { name: "Kit Cafe", category: "cafe", city: "Austin", country: "US", website: "https://kit.example", contacts: { emails: [], phones: [] } } as never;
    for (const d of DIRECTIONS) {
      const c = briefContent(lead, { crawledAt: "", pages: [] } as never, undefined, [], { direction: d.id });
      expect(c.uiKit.components.map((k) => k.id).sort()).toEqual([...d.kit].sort());
      expect(c.uiKit.components.length).toBeLessThan(UI_KIT.length / 2);
    }
  });

  it("animates with Motion (Framer Motion's engine), pinned to an exact CDN version, never GSAP", async () => {
    const { SYSTEM_LIBRARIES, SYSTEM_MOTION_JS, HEAD_JS, LIBRARIES } = await import("../src");
    expect(SYSTEM_LIBRARIES).toEqual([expect.stringMatching(/^https:\/\/cdn\.jsdelivr\.net\/npm\/motion@\d+\.\d+\.\d+\/dist\/motion\.js$/)]);
    expect(Object.values(LIBRARIES)).toEqual(SYSTEM_LIBRARIES);
    expect(SYSTEM_MOTION_JS).toContain("window.Motion");
    expect(SYSTEM_MOTION_JS + HEAD_JS).not.toMatch(/gsap|ScrollTrigger/);
    expect(() => new Function(SYSTEM_MOTION_JS)).not.toThrow();
  });

  it("offers the seven house themes, Classic Monochrome first, rotating away from recent ones, all readable", async () => {
    const { LOOKS, pickLook, contrast } = await import("../src");
    expect(LOOKS.map((l) => l.id)).toEqual(["classic", "noir", "latte", "sage", "cobalt", "cocoa", "rose"]);
    for (const l of LOOKS) {
      for (const [a, b] of [[l.text, l.bg], [l.textMuted, l.bg], [l.textSubtle, l.bg], [l.textMuted, l.bgMuted], [l.onAccent, l.accent], [l.invText, l.invBg], [l.invMuted, l.invBg]]) {
        expect(contrast(a, b), `${l.id}: ${a} on ${b}`).toBeGreaterThanOrEqual(4.5);
      }
    }
    expect(pickLook("accounting").id).toBe("classic");
    expect(pickLook("restaurant", ["classic"]).id).not.toBe("classic");
    expect(pickLook("salon", ["classic", "rose"]).id).toBe("latte");
  });

  it("ships every house theme and the theme picker on every page, opening in the site's own theme", async () => {
    const { renderSitePage, makeDna, lookById, LOOKS, HEAD_JS, SYSTEM_BASE_JS } = await import("../src");
    const lead = { name: "Pick Bistro", category: "restaurant", city: "Austin", country: "US", website: "https://pick.example", contacts: { emails: [], phones: [] }, content: { title: "", description: "", headings: [], paragraphs: [], images: [], navLinks: [] } } as never;
    const site = { crawledAt: "", pages: [{ slug: "home", url: "https://pick.example", label: "Home", title: "", description: "", sections: [] }] };
    const html = renderSitePage(lead, site, "home", { dna: makeDna(lookById("cocoa")!, "restaurant") });
    expect(html).toContain('<html lang="en" data-theme="cocoa" data-site="pick.example">');
    for (const l of LOOKS) {
      expect(html).toContain(`[data-theme="${l.id}"]{`);
      expect(html).toContain(`data-id="${l.id}"`);
    }
    expect(html).toContain('class="theme-btn"');
    expect(html).toContain('id="theme-panel"');
    // The choice is remembered per site, and storage never throws in sandboxed previews.
    expect(HEAD_JS).toContain("rr-theme:");
    expect(HEAD_JS).toMatch(/try\{.*localStorage.*\}catch/);
    expect(SYSTEM_BASE_JS).toContain("startViewTransition");
    expect(() => new Function(HEAD_JS)).not.toThrow();
    expect(() => new Function(SYSTEM_BASE_JS)).not.toThrow();
  });
  it("designs for the trade the business name says, over a mis-filed category", async () => {
    const { tradeFor, pickDna, dnaFromKey } = await import("../src");
    expect(tradeFor("retail", "Rise & Shine Biscuit Kitchen")).toBe("restaurant");
    expect(tradeFor("services", "Dental Elements")).toBe("healthcare");
    const dna = pickDna("x", "retail", [], "Rise & Shine Biscuit Kitchen");
    expect(dna.trade).toBe("restaurant");
    expect(dnaFromKey(dna.key)?.look.id).toBe(dna.look.id);
    expect(dnaFromKey("ember|jakarta|split|soft|bold|pizzeria|2")).toBeNull();
  });

  it("lets the client compare the seven themes on the home page and copy their favourite, with no form or address", async () => {
    const { renderSitePage, LOOKS, HEAD_JS, SYSTEM_BASE_JS } = await import("../src");
    const lead = { name: "Fav Cafe", category: "cafe", city: "Austin", country: "US", website: "https://fav.example", contacts: { emails: ["hi@fav.example"], phones: [] }, content: { title: "", description: "", headings: [], paragraphs: [], images: [], navLinks: [] } } as never;
    const site = { crawledAt: "", pages: [
      { slug: "home", url: "https://fav.example", label: "Home", title: "", description: "", sections: [] },
      { slug: "menu", url: "https://fav.example/menu", label: "Menu", title: "", description: "", sections: [{ heading: "Coffee", paragraphs: [], items: ["Latte 4.00"], images: [] }] },
    ] };
    const home = renderSitePage(lead, site, "home");
    expect(home).toContain('<section class="themes" id="themes"');
    expect(home.match(/class="th-card"/g)).toHaveLength(LOOKS.length);
    expect(home).toContain("Copy my choice");
    expect(home.indexOf('id="themes"')).toBeLessThan(home.indexOf('id="visit"'));
    expect(home).not.toMatch(/<form|mailto:[^"]*subject=/);
    expect(renderSitePage(lead, site, "menu")).not.toContain('id="themes"');
    // A shared link (?theme=rose) opens the page in that theme; the choice text carries it.
    expect(HEAD_JS).toContain("theme=");
    expect(SYSTEM_BASE_JS).toContain("?theme=");
    expect(SYSTEM_BASE_JS).toContain("rr-fav:");
  });

  it("renders every section of the page in the house style, escaped, numbered in page order, with no 3D", async () => {
    const { renderSitePage, makeDna, lookById } = await import("../src");
    const lead = { id: "x", name: "Tony <b>Burger</b>", website: "https://t.com", category: "restaurant", city: "Austin", country: "US", contacts: { emails: ["a@t.com"], phones: ["+1 512 555 0100"] }, audit: { score: 50, issues: [] }, content: { title: "T", description: "", headings: [], paragraphs: [], images: [] } } as never;
    const site = { crawledAt: "", pages: [
      { slug: "home", url: "https://t.com", label: "Home", title: "T", description: "", sections: [
        { heading: "Our story", paragraphs: ["Every patty is smashed to order on a seasoned flat-top grill since 1998. We still grind the beef every morning."], items: [], images: [] },
        { heading: "Burgers", paragraphs: [], items: ["Classic 9.50", "Double 12.00", "Veggie 10.00"], images: [] },
        { heading: "Unique closing words", paragraphs: ["A final paragraph that must appear on the page as well."], items: [], images: [] },
      ] },
      { slug: "menu", url: "https://t.com/menu", label: "Menu", title: "Menu", description: "", sections: [{ heading: "Sides", paragraphs: [], items: ["Fries 4.00"], images: [] }] },
    ] };
    const html = renderSitePage(lead, site, "home", { dna: makeDna(lookById("classic")!, "restaurant") });
    for (const text of ["Every patty is smashed to order on a seasoned flat-top grill since 1998.", "We still grind the beef every morning.", "Classic", "12.00", "Unique closing words", "A final paragraph"]) expect(html).toContain(text);
    expect(html).toContain("--bg:#ffffff");
    expect(html).toContain('class="xp"');
    expect(html).toContain('class="statement"');
    expect(html).toContain('data-roll>1998<');
    const nos = [...html.matchAll(/class="no">No\. (\d+)/g)].map((m) => m[1]);
    expect(nos).toEqual(nos.map((_, i) => String(i + 1).padStart(2, "0")));
    expect(html).toContain("Tony &lt;b&gt;Burger&lt;/b&gt;");
    expect(html).not.toContain("<b>Burger</b>");
    expect(html).not.toMatch(/three(\.min)?\.js|lenis|<canvas id|class="echo"|plate-stage|cloud-reveal/);
  });
});

describe("job brief", () => {
  it("adds the owner's notes and points revisions at the previous pages", async () => {
    const { BRIEF, jobBrief } = await import("../src");
    expect(jobBrief({})).toBe(BRIEF);
    const fresh = jobBrief({ notes: "Darker, bigger photos", mode: "fresh" });
    expect(fresh).toContain("> Darker, bigger photos");
    expect(fresh).toContain("Start a new design");
    const rev = jobBrief({ notes: "Bigger menu", mode: "revise" }, ["index.html", "menu.html"]);
    expect(rev).toContain("./previous/ (index.html, menu.html)");
    expect(rev).toContain("./site/ already holds the previous version's pages");
    expect(rev).toContain("leave every other page exactly as it is");
    expect(rev).not.toContain("not only the changed ones");
    expect(rev).toContain("never relax the content rules");
    expect(jobBrief({ mode: "revise" }, [])).toBe(BRIEF); // nothing to revise from
  });
});

describe("crawler image resolution", () => {
  it("asks site image services for the large original", async () => {
    const { highestResolution } = await import("../src/crawl");
    expect(highestResolution(new URL("https://example.com/wp-content/uploads/2020/05/pizza-300x200.jpg")).href).toBe("https://example.com/wp-content/uploads/2020/05/pizza.jpg");
    expect(highestResolution(new URL("https://images.squarespace-cdn.com/content/v1/abc/photo.jpg?format=300w")).searchParams.get("format")).toBe("2500w");
    expect(highestResolution(new URL("https://cdn.shopify.com/s/files/1/shirt_300x.jpg")).pathname).toBe("/s/files/1/shirt.jpg");
  });
});

describe("creative directions", () => {
  const sig = (trade: string, extra: Record<string, unknown> = {}) => ({ trade, pages: 4, images: 6, prices: 0, words: 800, hasMenu: false, hasTeam: false, hasBooking: false, hasFaq: false, phone: true, email: true, hours: true, ...extra }) as never;

  it("builds every business in the house direction, and maps old direction ids onto it", async () => {
    const { chooseDirection, directionById, DIRECTIONS, HOUSE_DIRECTION_ID } = await import("../src");
    expect(DIRECTIONS.map((d) => d.id)).toEqual([HOUSE_DIRECTION_ID]);
    for (const t of ["restaurant", "healthcare", "accounting", "import_export", "gym", "salon"]) {
      for (const seed of ["a", "b"]) expect(chooseDirection(sig(t), [], seed).id).toBe(HOUSE_DIRECTION_ID);
    }
    expect(directionById("editorial-magazine")?.id).toBe(HOUSE_DIRECTION_ID);
    expect(directionById("cinematic-hospitality")?.id).toBe(HOUSE_DIRECTION_ID);
    expect(directionById("not-a-direction")).toBeUndefined();
  });
  it("uses the job's house theme as the palette, and the owner's chosen theme over it", async () => {
    const { directionById, paletteFor, lookById, briefContent, LOOKS } = await import("../src");
    const d = directionById("house-editorial")!;
    const rose = paletteFor(d, { colors: ["#22c55e"], fonts: [] }, "seed", lookById("rose"));
    expect(rose).toMatchObject({ themeId: "rose", bg: lookById("rose")!.bg, accent: lookById("rose")!.accent, fromBrand: false });
    // Without a theme, one of the seven is picked by seed; brand colours never recolour it.
    const p = paletteFor(d, { colors: ["#22c55e"], fonts: [] }, "x");
    expect(LOOKS.map((l) => l.accent)).toContain(p.accent);
    const lead = { id: "y", name: "Pal Cafe", category: "cafe", city: "Austin", country: "US", website: "https://pal.example", contacts: { emails: [], phones: [] } } as never;
    const c = briefContent(lead, { crawledAt: "", pages: [] } as never, undefined, [], { forcedLook: lookById("sage") });
    expect(c.designDirection.theme.id).toBe("sage");
    expect(c.designDirection.creative.palette.themeId).toBe("sage");
    expect(c.designDirection.allThemes).toHaveLength(7);
  });
  it("avoids photo-led directions when the site has few photos", async () => {
    const { chooseDirection } = await import("../src");
    for (const seed of ["1", "2", "3"]) expect(["luxe-minimal", "immersive-showcase"]).not.toContain(chooseDirection(sig("clothing", { images: 1 }), [], seed).id);
  });

  it("keeps every house palette readable", async () => {
    const { DIRECTIONS, contrast } = await import("../src");
    for (const p of DIRECTIONS[0].palettes) {
      expect(contrast(p.text, p.bg)).toBeGreaterThanOrEqual(7);
      expect(contrast(p.muted, p.bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(p.onAccent, p.accent)).toBeGreaterThanOrEqual(4.5);
    }
  });
  it("puts the house direction, theme, signals and UX audit in content.json, with Motion and no Three.js", async () => {
    const { briefContent, LIBRARIES } = await import("../src");
    const lead = { id: "x.com", name: "Harbor Freight Partners", website: "https://x.com", category: "import_export", city: "Hamburg", country: "DE", contacts: { emails: ["a@x.com"], phones: [] }, audit: { score: 60, reasons: ["No mobile viewport meta tag"], finalUrl: "", https: false }, content: { title: "", description: "", headings: [], paragraphs: [], images: [], navLinks: [] } } as never;
    const site = { crawledAt: "", pages: [{ slug: "home", url: "https://x.com", label: "Home", title: "Home", description: "", sections: [{ heading: "Shipping", paragraphs: ["Sea and air freight from Hamburg to the world."], items: [], images: [] }] }] };
    const c = briefContent(lead, site, undefined, [], { direction: "global-trade-3d" });
    expect(c.designDirection.creative.id).toBe("house-editorial");
    expect(c.designDirection.creative.threeD).toBe("none");
    expect(c.libraries).toEqual(LIBRARIES);
    expect(c.designDirection.theme.id).toBe("classic");
    expect(c.designDirection.uxAudit.some((f: { area: string }) => f.area === "mobile")).toBe(true);
    expect(c.designDirection.creative.typography.googleFontsUrl).toBe("https://fonts.googleapis.com/css2?family=Libre+Caslon+Display&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Instrument+Sans:wght@400;500;600&display=swap");
  });
  it("gives the house direction its motion system and a focused kit, all real components", async () => {
    const { DIRECTIONS, UI_KIT, BRIEF, RUNNER_PROMPT } = await import("../src");
    const ids = new Set(UI_KIT.map((c) => c.id));
    const [d] = DIRECTIONS;
    for (const k of d.kit) expect(ids, `unknown kit ${k}`).toContain(k);
    for (const key of ["intro", "transition", "scroll", "hover", "signature"] as const) expect(d.motionSystem[key].length).toBeGreaterThan(20);
    expect(BRIEF).toContain("seven house themes");
    expect(BRIEF).toContain("theme picker");
    expect(RUNNER_PROMPT).toContain("house-style.md");
  });
  it("documents every direction for the skill (npm run skill:catalog)", async () => {
    const { DIRECTIONS } = await import("../src");
    const { readFileSync } = await import("node:fs");
    const md = readFileSync(new URL("../../../.claude/skills/website-redesign/references/directions.md", import.meta.url), "utf8");
    for (const d of DIRECTIONS) {
      expect(md, `run npm run skill:catalog (${d.id} missing)`).toContain(`\`${d.id}\``);
      expect(md).toContain(d.hero);
    }
  });
});

describe("redesign QA scorecard", () => {
  const page = (o: Record<string, unknown> = {}) => ({
    slug: "home", viewport: "desktop", loaded: true, overflowX: 0, images: 6, brokenImages: 0, consoleErrors: [], failedRequests: [], cspViolations: [],
    hasBanner: true, hasNoindex: true, hasTitle: true, hasLang: true, h1: 1, brokenLinks: [], htmlLinks: 0, disallowedScripts: [], coverage: 1, missing: [],
    placeholders: [], smallTapTargets: 0, imagesNoAlt: 0, unnamedControls: 0, lowContrast: 0, stuckHidden: 0, loadMs: 900, lcpMs: 1200, bytes: 900_000, requests: 20, ...o,
  }) as never;
  const all = (o: Record<string, unknown> = {}, m: Record<string, unknown> = {}) => [page(o), page({ viewport: "tablet", ...o }), page({ viewport: "mobile", ...o, ...m })];
  const good = { visual: 8, brand: 8, originality: 8, ux: 8, notes: [] };

  it("passes a clean, well-reviewed redesign", async () => {
    const { scoreRedesign } = await import("../src");
    const s = scoreRedesign(all(), ["home"], good);
    expect(s.critical).toEqual([]);
    expect(s.pass).toBe(true);
    expect(s.overall).toBeGreaterThanOrEqual(7);
  });

  it("never passes without a design review, with a critical defect, or with a missing page, however high the average", async () => {
    const { scoreRedesign } = await import("../src");
    expect(scoreRedesign(all(), ["home"], null).pass).toBe(false);
    const overflow = scoreRedesign(all({}, { overflowX: 120 }), ["home"], { ...good, visual: 10, brand: 10, originality: 10, ux: 10 });
    expect(overflow.pass).toBe(false);
    expect(overflow.critical.join(" ")).toMatch(/sideways on phones/);
    const missing = scoreRedesign(all(), ["home", "menu"], good);
    expect(missing.pass).toBe(false);
    expect(missing.critical).toContain('Page "menu" is missing.');
    const dropped = scoreRedesign(all({ coverage: 0.6, missing: ["Our full wine list"] }), ["home"], good);
    expect(dropped.critical.join(" ")).toMatch(/missing 40% of the site's text/);
    const fake = scoreRedesign(all({ placeholders: ["lorem ipsum"] }), ["home"], good);
    expect(fake.pass).toBe(false);
  });

  it("writes a report Claude can act on", async () => {
    const { scoreRedesign, scorecardMarkdown } = await import("../src");
    const m = all({ consoleErrors: ["TypeError: x is undefined"] });
    const md = scorecardMarkdown(scoreRedesign(m, ["home"], good), m);
    expect(md).toContain("NOT READY");
    expect(md).toContain("Critical defects");
    expect(md).toContain("TypeError");
  });

  it("rejects a page that uses the retired system's pieces, and flags kit outside the house list", async () => {
    const { scoreRedesign, UI_KIT } = await import("../src");
    expect(new Set(UI_KIT.map((c) => c.selector)).size).toBe(UI_KIT.length);
    const old = all({ borrowed: ["counter loader", "dust splash"], kit: ["border-beam"] });
    const s = scoreRedesign(old, ["home"], good, undefined, { direction: "house-editorial", kit: ["mask-reveal-up"] });
    expect(s.pass).toBe(false);
    expect(s.critical.join(" ")).toMatch(/retired system's pieces \(counter loader, dust splash\)/);
    expect(s.warnings.join(" ")).toMatch(/don't belong to this direction: border-beam/);
  });
  it("retries technical failures with backoff and sends everything else to a person", async () => {
    const { retryDelayMinutes, shouldRetry } = await import("../src");
    expect([1, 2, 3, 4, 5, 9].map(retryDelayMinutes)).toEqual([5, 10, 20, 40, 60, 60]);
    expect(shouldRetry("technical", 1, 3)).toBe(true);
    expect(shouldRetry("technical", 3, 3)).toBe(false);
    expect(shouldRetry("unreachable", 1, 3)).toBe(false);
    expect(shouldRetry("quality", 1, 3)).toBe(false);
  });
});

describe("injected spam", () => {
  it("removes hacked-in gambling spam, including the block between hits, and keeps the business's own text", async () => {
    const { stripInjectedSpam, briefContent } = await import("../src");
    const real = ["41 Union Street", "The Union Oyster House, located on the Freedom Trail, enjoys the distinction of being America's oldest restaurant.", "OYSTERS"];
    const spam = [
      "Якщо ви цікавитеся сучасними форматами азартних розваг, варто звернути увагу на різні онлайн-платформи та їхні бонуси.",
      "Enjoy winorama casino with exciting slots and live dealer action.",
      "Spinsup biedt snelle stortingen en soepel mobiel spelen.",
      "Just as the restaurant offers seafood, jokabey online casino is where every player wins.",
    ];
    const site = { crawledAt: "", pages: [
      { slug: "home", url: "https://u.example", label: "Home", title: "Home", description: "", sections: [{ heading: "Welcome", paragraphs: [...real, ...spam], items: [], images: [], links: [{ text: "beste betting sider", href: "https://x.example" }, { text: "Menus", href: "https://u.example/menus" }] }] },
      { slug: "menus", url: "https://u.example/menus", label: "Menus", title: "Menus", description: "", sections: [{ heading: "Chowder", paragraphs: ["Clam chowder, a Boston classic since 1826."], items: ["Cup 8", "Bowl 12"], images: [] }] },
    ] };
    const { site: clean, removed } = stripInjectedSpam(site as never);
    const text = JSON.stringify(clean);
    expect(text).not.toMatch(/casino|азарт|Spinsup|jokabey|betting/i);
    for (const r of [...real, "Clam chowder, a Boston classic since 1826.", "Bowl 12"]) expect(text).toContain(r);
    expect(removed.length).toBe(spam.length + 1);
    // A genuinely Ukrainian business keeps its Ukrainian text.
    const ua = { crawledAt: "", pages: [{ slug: "home", url: "https://k.example", label: "Головна", title: "Кав'ярня", description: "", sections: [{ heading: "Про нас", paragraphs: ["Ми варимо каву щоранку для наших гостей у центрі Києва вже десять років."], items: ["Меню", "Контакти"], images: [] }] }] };
    expect(stripInjectedSpam(ua as never).removed).toEqual([]);
    const lead = { id: "u.example", name: "Union", category: "restaurant", city: "Boston", country: "US", website: "https://u.example", contacts: { emails: [], phones: [] } } as never;
    const c = briefContent(lead, site as never);
    expect(JSON.stringify(c.pages)).not.toMatch(/casino|jokabey/i);
    expect(c.contentNotes?.injectedSpamRemoved).toBe(spam.length + 1);
  });
});

describe("markup fragments", () => {
  it("strips tag fragments that broken HTML leaks into crawled text, and leaves ordinary < and > alone", async () => {
    const { stripMarkup, cleanMarkup } = await import("../src");
    expect(stripMarkup('<class="bottomnav">GIFT SHOP')).toBe("GIFT SHOP");
    expect(stripMarkup("Open daily</td> until 10pm")).toBe("Open daily until 10pm");
    expect(stripMarkup("&lt;div class=&quot;x&quot;&gt;Lobster roll 29")).toBe("Lobster roll 29");
    expect(stripMarkup("Fresh oysters <span")).toBe("Fresh oysters");
    for (const t of ["Kids < 12 eat free", "Mains > $20 include a side", "We <3 Boston", "2 < 3"]) expect(stripMarkup(t)).toBe(t);
    const site = cleanMarkup({ crawledAt: "", pages: [{ slug: "store", url: "", label: "Store", title: "Store", description: "", sections: [{ heading: "", paragraphs: ["<br/>"], items: ['<class="bottomnav">GIFT SHOP', "Mugs 12"], images: [] }] }] } as never);
    expect(site.pages[0].sections[0].items).toEqual(["GIFT SHOP", "Mugs 12"]);
    expect(site.pages[0].sections[0].paragraphs).toEqual([]);
  });

  it("drops text that third-party widgets print into a page, and keeps the business's own footer lines", async () => {
    const { cleanMarkup, isWidgetBoilerplate } = await import("../src");
    for (const t of ["This jQuery slider was created with the free EasyRotator software from DWUser.com.", "Use WordPress? The free EasyRotator for WordPress plugin lets you create beautiful WordPress sliders in seconds.", "Your browser does not support the video tag.", "Please enable JavaScript to view this page.", "Powered by Wix"]) expect(isWidgetBoilerplate(t), t).toBe(true);
    for (const t of ["© 2026 Union Oyster House. All rights reserved.", "Designed by our own chef in 1998", "Powered by fresh oysters daily"]) expect(isWidgetBoilerplate(t), t).toBe(false);
    const site = cleanMarkup({ crawledAt: "", pages: [{ slug: "home", url: "", label: "Home", title: "Home", description: "", sections: [{ heading: "", paragraphs: ["This jQuery slider was created with the free EasyRotator software from DWUser.com.", "America's oldest restaurant."], items: [], images: [] }] }] } as never);
    expect(site.pages[0].sections[0].paragraphs).toEqual(["America's oldest restaurant."]);
  });
});
