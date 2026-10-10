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
    expect(new Set(UI_KIT.map((c) => c.library))).toEqual(new Set(["Magic UI", "Smooth UI", "21st.dev"]));
    expect(new Set(UI_KIT.map((c) => c.id)).size).toBe(UI_KIT.length);
    // Runs under the preview CSP: no network, no storage, no external hosts, no eval.
    expect(UI_KIT_JS).not.toMatch(/fetch\(|XMLHttpRequest|localStorage|sessionStorage|https?:\/\/|eval\(|new Function/);
    expect(UI_KIT_CSS).not.toMatch(/https?:\/\/|@import/);
    expect(() => new Function(UI_KIT_JS)).not.toThrow();
    const md = readFileSync(new URL("../../../.claude/skills/website-redesign/references/ui-kit.md", import.meta.url), "utf8");
    for (const c of UI_KIT) expect(md, `run npm run skill:catalog (${c.id} missing)`).toContain(`\`${c.id}\``);
    expect(readFileSync(new URL("../../../.claude/skills/website-redesign/references/ui-kit.js", import.meta.url), "utf8")).toContain(UI_KIT_JS);
    const lead = { name: "Kit Cafe", category: "cafe", city: "Austin", country: "US", website: "https://kit.example", contacts: { emails: [], phones: [] }, content: { title: "Kit Cafe", description: "", headings: ["Coffee"], paragraphs: ["Roasting our own beans in Austin since 1987, every single morning."], images: [], navLinks: [] } } as never;
    const html = renderSitePage(lead, snapshotFromLead(lead), "home");
    expect(html).toContain(UI_KIT_JS);
    expect(html).toContain('class="mu-progress"');
    expect(html).toContain("mu-shimmer");
    expect(html).toContain('class="tw-paths"');
  });

  it("animates with Motion (Framer Motion's engine), pinned to an exact CDN version, never GSAP", async () => {
    const { SYSTEM_LIBRARIES, SYSTEM_MOTION_JS, HEAD_JS, LIBRARIES } = await import("../src");
    expect(SYSTEM_LIBRARIES).toEqual([expect.stringMatching(/^https:\/\/cdn\.jsdelivr\.net\/npm\/motion@\d+\.\d+\.\d+\/dist\/motion\.js$/)]);
    expect(Object.values(LIBRARIES)).toEqual(SYSTEM_LIBRARIES);
    expect(SYSTEM_MOTION_JS).toContain("window.Motion");
    expect(SYSTEM_MOTION_JS + HEAD_JS).not.toMatch(/gsap|ScrollTrigger/);
    expect(() => new Function(SYSTEM_MOTION_JS)).not.toThrow();
  });

  it("offers rich themes, navy first for most trades, rotating away from recent ones", async () => {
    const { LOOKS, pickLook } = await import("../src");
    expect(LOOKS.length).toBeGreaterThanOrEqual(8);
    expect(LOOKS.some((l) => !l.dark)).toBe(true);
    expect(pickLook("accounting").id).toBe("midnight-navy");
    expect(pickLook("accounting", ["midnight-navy"]).id).not.toBe("midnight-navy");
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

  it("renders every section of the page in the design system, escaped, with no 3D", async () => {
    const { renderSitePage, makeDna, lookById } = await import("../src");
    const lead = { id: "x", name: "Tony <b>Burger</b>", website: "https://t.com", category: "restaurant", city: "Austin", country: "US", contacts: { emails: ["a@t.com"], phones: ["+1 512 555 0100"] }, audit: { score: 50, issues: [] }, content: { title: "T", description: "", headings: [], paragraphs: [], images: [] } } as never;
    const site = { crawledAt: "", pages: [
      { slug: "home", url: "https://t.com", label: "Home", title: "T", description: "", sections: [
        { heading: "Our story", paragraphs: ["Every patty is smashed to order on a seasoned flat-top grill since 1998."], items: [], images: [] },
        { heading: "Burgers", paragraphs: [], items: ["Classic 9.50", "Double 12.00", "Veggie 10.00"], images: [] },
        { heading: "Unique closing words", paragraphs: ["A final paragraph that must appear on the page as well."], items: [], images: [] },
      ] },
      { slug: "menu", url: "https://t.com/menu", label: "Menu", title: "Menu", description: "", sections: [{ heading: "Sides", paragraphs: [], items: ["Fries 4.00"], images: [] }] },
    ] };
    const html = renderSitePage(lead, site, "home", { dna: makeDna(lookById("midnight-navy")!, "restaurant") });
    for (const text of ["Every patty is smashed", "Classic", "12.00", "Unique closing words", "A final paragraph"]) expect(html).toContain(text);
    expect(html).toContain("--bg:#0c1424");
    expect(html).toContain('class="echo"');
    expect(html).toContain("Tony &lt;b&gt;Burger&lt;/b&gt;");
    expect(html).not.toContain("<b>Burger</b>");
    expect(html).not.toMatch(/three(\.min)?\.js|lenis|<canvas id/);
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

describe("crawler image resolution", () => {
  it("asks site image services for the large original", async () => {
    const { highestResolution } = await import("../src/crawl");
    expect(highestResolution(new URL("https://example.com/wp-content/uploads/2020/05/pizza-300x200.jpg")).href).toBe("https://example.com/wp-content/uploads/2020/05/pizza.jpg");
    expect(highestResolution(new URL("https://images.squarespace-cdn.com/content/v1/abc/photo.jpg?format=300w")).searchParams.get("format")).toBe("2500w");
    expect(highestResolution(new URL("https://cdn.shopify.com/s/files/1/shirt_300x.jpg")).pathname).toBe("/s/files/1/shirt.jpg");
  });
});
