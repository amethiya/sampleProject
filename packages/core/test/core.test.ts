import { describe, expect, it } from "vitest";
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
  it("writes a plain-language pitch with preview link, opt-out and Gmail compose URL", () => {
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
    expect(p.body).toMatch(/won't contact you again/);
    expect(p.subject).toContain("redesigned website");
    expect(p.gmailUrl).toContain("to=joe%40joesdiner.com");
  });
});

describe("scene blueprints", () => {
  it("matches the business: pizzeria → slice pull, burger bar → exploded burger", async () => {
    const { pickBlueprint } = await import("../src");
    expect(pickBlueprint("a.com", "restaurant", "Luigi's Pizzeria — wood fired pizza since 1980").id).toBe("pizza-pull");
    expect(pickBlueprint("b.com", "restaurant", "Smash burgers and fries").id).toBe("burger-stack");
    expect(pickBlueprint("c.com", "salon", "Barber shop and hair stylist").id).toBe("silk-ribbon");
    expect(pickBlueprint("dentalelements.com", "healthcare", "Dental Elements https://dentalelements.com Welcome to our practice in the city. Our clinic offers medical care and health checks").id).toBe("clean-turntable");
  });

  it("rotates when nothing matches, avoiding recent blueprints", async () => {
    const { pickBlueprint } = await import("../src");
    const first = pickBlueprint("d.com", "accounting", "");
    const next = pickBlueprint("d.com", "accounting", "", [first.id]);
    expect(next.id).not.toBe(first.id);
  });

  it("covers every category, uses known recipes, and is in the skill catalogue", async () => {
    const { BLUEPRINTS, CATEGORIES } = await import("../src");
    const { readFileSync } = await import("node:fs");
    const md = readFileSync(new URL("../../../.claude/skills/website-redesign/references/blueprints.md", import.meta.url), "utf8");
    for (const c of CATEGORIES) expect(BLUEPRINTS.filter((b) => b.categories.includes(c.id)).length).toBeGreaterThanOrEqual(3);
    for (const b of BLUEPRINTS) {
      expect(md, `run npm run skill:catalog (${b.id} missing)`).toContain(`\`${b.id}\``);
      for (const r of b.recipes) expect(r).toBeLessThanOrEqual(22);
    }
    expect(new Set(BLUEPRINTS.map((b) => b.id)).size).toBe(BLUEPRINTS.length);
  });

  it("stores the blueprint in the DNA key and still reads older keys", async () => {
    const { pickDna, dnaFromKey } = await import("../src");
    const dna = pickDna("e.com", "restaurant", [], "pizza");
    expect(dna.key.split("|")).toHaveLength(6);
    expect(dnaFromKey(dna.key)?.blueprint?.id).toBe("pizza-pull");
    const old = dnaFromKey(dna.key.split("|").slice(0, 5).join("|"));
    expect(old).not.toBeNull();
    expect(old?.blueprint).toBeUndefined();
  });

  it("renders the blueprint's object and motion in the 3D chapter", async () => {
    const { dnaFromKey, renderSitePage, snapshotFromLead } = await import("../src");
    const lead = { id: "x", name: "Tony Burger", website: "https://t.com", category: "restaurant", city: "Austin", country: "US", contacts: { emails: ["a@t.com"], phones: [] }, audit: { score: 50, issues: [] }, content: { title: "T", description: "", headings: [], paragraphs: [], images: [] } } as never;
    const site = snapshotFromLead(lead);
    const html = renderSitePage(lead, site, site.pages[0].slug, { dna: dnaFromKey("ember|jakarta|split|soft|bold|kettlebell-turntable")! });
    expect(html).toContain('data-variant="turntable"');
    expect(html).toContain('data-kind="kettlebell"');
    expect(html).toContain("<span>Tony</span><span>Burger</span>");
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
    expect(rev).toContain("never relax the content rules");
    expect(jobBrief({ mode: "revise" }, [])).toBe(BRIEF); // nothing to revise from
  });
});
