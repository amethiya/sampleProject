/**
 * Stages F/G of the redesign pipeline: render the redesign in a real browser and measure it.
 *
 * Serves ./site/ on 127.0.0.1 with the same sandboxed CSP the Worker uses for Claude pages (so CSP violations and
 * storage errors show up here, not in front of a client), loads every page at desktop, tablet and phone widths,
 * scrolls through it, and measures: sideways overflow, broken images, script errors, failed requests, CSP blocks,
 * concept banner, noindex, broken internal links, disallowed scripts, content coverage against content.json,
 * placeholder text, tap targets, alt text, unnamed controls, text contrast, elements an animation left invisible, and
 * load timings. Screenshots go to qa/ for the design review. The scorecard logic is in @rr/core (quality.ts).
 */
import { createServer, type Server } from "node:http";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { AI_CSP, scoreRedesign, scorecardMarkdown, type DesignReview, type PageMeasure, type Scorecard, type Viewport } from "@rr/core";
import { safeContext } from "./browser";

const VIEWPORTS: { name: Viewport; width: number; height: number; mobile: boolean }[] = [
  { name: "desktop", width: 1440, height: 900, mobile: false },
  { name: "tablet", width: 820, height: 1180, mobile: true },
  { name: "mobile", width: 390, height: 844, mobile: true },
];
const ALLOWED_SCRIPT_HOSTS = ["cdn.jsdelivr.net", "cdnjs.cloudflare.com"];
const PLACEHOLDER = /lorem ipsum|\bTODO\b|\bTBD\b|\[(?:your|insert|add)[^\]]*\]|placeholder text|example\.com|123[-. ]456[-. ]7890|\bJohn Doe\b|\bJane Doe\b|your business name/i;

interface ContentPage { file: string; link: string; sections: { heading: string; paragraphs: string[]; items: string[] }[] }

/** Serve site/ like the Worker: "/" → index.html, "/<slug>" → <slug>.html, Claude-page CSP, nothing else. */
function serve(siteDir: string): Promise<{ server: Server; origin: string }> {
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent((req.url ?? "/").split("?")[0]).replace(/\/+$/, "");
    const slug = path === "" ? "index" : path.slice(1);
    if (!/^[a-z0-9_-]{1,64}$/.test(slug)) return res.writeHead(404).end("Not found");
    try {
      const html = await readFile(join(siteDir, `${slug}.html`));
      res.writeHead(200, { "content-type": "text/html; charset=utf-8", "content-security-policy": AI_CSP, "cache-control": "no-store" }).end(html);
    } catch {
      res.writeHead(404).end("Not found");
    }
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => {
    const a = server.address();
    resolve({ server, origin: `http://127.0.0.1:${typeof a === "object" && a ? a.port : 0}` });
  }));
}

/** Runs in the page after the scroll pass. Self-contained. */
function inPage(arg: { texts: string[]; slugs: string[]; mobile: boolean; placeholder: string; allowed: string[] }) {
  const norm = (s: string) => s.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
  const clone = document.body.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("script, style, noscript, template").forEach((e) => e.remove());
  const alts = Array.from(document.images).map((i) => i.alt).join(" ");
  const pageText = norm((clone.textContent ?? "") + " " + alts + " " + document.title);
  let total = 0, found = 0;
  const missing: string[] = [];
  for (const t of arg.texts) {
    const n = norm(t);
    if (n.length < 3) continue;
    total += n.length;
    if (pageText.includes(n)) found += n.length;
    else missing.push(t);
  }
  missing.sort((a, b) => b.length - a.length);

  const visible = (e: Element) => {
    const r = e.getBoundingClientRect();
    const s = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none";
  };
  const imgs = Array.from(document.images).filter((i) => getComputedStyle(i).display !== "none" && i.closest("[hidden]") === null);
  const broken = imgs.filter((i) => i.complete && i.naturalWidth === 0 && visible(i)).length;

  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"));
  const brokenLinks: string[] = [];
  let htmlLinks = 0;
  for (const a of links) {
    const raw = a.getAttribute("href") ?? "";
    if (/\.html?(#|$)/i.test(raw) && !/^https?:/i.test(raw)) htmlLinks++;
    if (/^(https?:|mailto:|tel:|#|javascript:|sms:|data:)/i.test(raw)) continue;
    const path = raw.replace(/^\.\//, "/").replace(/[?#].*$/, "").replace(/\/+$/, "").replace(/\.html?$/i, "");
    const slug = path === "" || path === "/" || path === "." ? "home" : path.replace(/^\//, "");
    if (!arg.slugs.includes(slug) && !arg.slugs.includes(slug === "index" ? "home" : slug)) brokenLinks.push(raw);
  }

  const scripts = Array.from(document.querySelectorAll<HTMLScriptElement>("script[src]")).map((s) => { try { return new URL(s.src).hostname; } catch { return s.src; } });
  const moduleImports = Array.from(document.querySelectorAll("script[type=module]")).flatMap((s) => [...(s.textContent ?? "").matchAll(/from\s+["'](https?:\/\/[^"']+)["']|import\(\s*["'](https?:\/\/[^"']+)["']/g)].map((m) => new URL(m[1] || m[2]).hostname));
  const disallowed = [...new Set([...scripts, ...moduleImports].filter((h) => !arg.allowed.includes(h)))];

  const bodyText = document.body.innerText;
  const ph = new RegExp(arg.placeholder, "i");
  const placeholders = [...new Set((bodyText.match(new RegExp(arg.placeholder, "gi")) ?? []).map((x) => x.slice(0, 40)))].filter((x) => ph.test(x));

  const controls = Array.from(document.querySelectorAll<HTMLElement>("a[href], button")).filter(visible);
  const small = arg.mobile ? controls.filter((e) => {
    const r = e.getBoundingClientRect();
    return (r.width < 40 || r.height < 40) && !e.closest("p, li p, .prose") && getComputedStyle(e).display !== "inline";
  }).length : 0;
  const unnamed = controls.filter((e) => !(e.innerText.trim() || e.getAttribute("aria-label") || e.getAttribute("title") || e.querySelector("img[alt]:not([alt=''])") || e.getAttribute("aria-labelledby"))).length;
  const noAlt = Array.from(document.images).filter((i) => !i.hasAttribute("alt")).length;

  // Text contrast against the nearest solid background (elements over images/gradients are skipped: unknowable here).
  const parse = (c: string) => { const m = c.match(/rgba?\(([\d.]+), ([\d.]+), ([\d.]+)(?:, ([\d.]+))?\)/); return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null; };
  const lum = (c: { r: number; g: number; b: number }) => [c.r, c.g, c.b].map((v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
  let low = 0;
  const textEls = Array.from(document.querySelectorAll<HTMLElement>("p, li, h1, h2, h3, h4, a, span, button, td, dd, small, label")).filter((e) => {
    const own = Array.from(e.childNodes).some((n) => n.nodeType === 3 && (n.textContent ?? "").trim().length > 1);
    return own && visible(e);
  }).slice(0, 500);
  for (const e of textEls) {
    const s = getComputedStyle(e);
    if (parseFloat(s.opacity) < 0.95) continue;
    const fg = parse(s.color);
    if (!fg || fg.a < 0.5) continue;
    let bg: ReturnType<typeof parse> = null;
    let unknown = false;
    for (let n: HTMLElement | null = e; n; n = n.parentElement) {
      const ns = getComputedStyle(n);
      if (ns.backgroundImage !== "none" || n.tagName === "IMG" || n.tagName === "VIDEO") { unknown = true; break; }
      const c = parse(ns.backgroundColor);
      if (c && c.a > 0.85) { bg = c; break; }
    }
    if (unknown) continue;
    bg ??= { r: 255, g: 255, b: 255, a: 1 };
    const [l1, l2] = [lum(fg), lum(bg)].sort((a, b) => b - a);
    const ratio = (l1 + 0.05) / (l2 + 0.05);
    const size = parseFloat(s.fontSize);
    const large = size >= 24 || (size >= 18.6 && Number(s.fontWeight) >= 700);
    if (ratio < (large ? 3 : 4.5)) low++;
  }

  // Content an entrance animation never revealed (checked after the scroll pass).
  const stuck = Array.from(document.querySelectorAll<HTMLElement>("h1, h2, h3, p, li, img, a.btn, .btn, button")).filter((e) => {
    if (e.closest("[aria-hidden=true], nav, dialog:not([open]), [hidden], details:not([open])")) return false;
    const r = e.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    if ((e.textContent ?? "").trim().length < 12 && e.tagName !== "IMG") return false;
    for (let n: HTMLElement | null = e; n && n !== document.body; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (parseFloat(s.opacity) < 0.05 || s.visibility === "hidden") return true;
    }
    return false;
  }).length;

  return {
    overflowX: document.documentElement.scrollWidth - innerWidth,
    images: imgs.length,
    brokenImages: broken,
    hasBanner: /concept redesign/i.test(bodyText),
    hasNoindex: !!document.querySelector("meta[name=robots][content*=noindex]"),
    hasTitle: !!document.title.trim(),
    hasLang: !!document.documentElement.lang,
    h1: document.querySelectorAll("h1").length,
    brokenLinks: [...new Set(brokenLinks)].slice(0, 10),
    htmlLinks,
    disallowedScripts: disallowed,
    coverage: total ? found / total : 1,
    missing: missing.slice(0, 12),
    placeholders,
    smallTapTargets: small,
    imagesNoAlt: noAlt,
    unnamedControls: unnamed,
    lowContrast: low,
    stuckHidden: stuck,
    height: document.documentElement.scrollHeight,
  };
}

export interface QaRun {
  scorecard: Scorecard;
  measures: PageMeasure[];
  screenshots: string[];
}

/** Measure every page of ./site against content.json, write qa/report.md + screenshots, and score it. */
export async function runQa(dir: string, review: DesignReview | null = null, log: (m: string) => void = () => {}): Promise<QaRun> {
  const content = JSON.parse(await readFile(join(dir, "content.json"), "utf8")) as { pages: ContentPage[] };
  const qaDir = join(dir, "qa");
  await mkdir(qaDir, { recursive: true });
  const files = new Set((await readdir(join(dir, "site")).catch(() => [] as string[])).filter((f) => f.endsWith(".html")));
  const slugs = content.pages.map((p) => (p.file === "index.html" ? "home" : p.file.replace(/\.html$/, "")));
  const { server, origin } = await serve(join(dir, "site"));
  // The QA server, and the Worker whose /img proxy serves the business's photos (may be localhost during development).
  const trusted = [origin, ...(process.env.RR_URL ? [new URL(process.env.RR_URL).origin] : [])];
  const measures: PageMeasure[] = [];
  const screenshots: string[] = [];
  try {
    for (const vp of VIEWPORTS) {
      const ctx = await safeContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.mobile, hasTouch: vp.mobile, deviceScaleFactor: 1, allowOrigins: trusted, serviceWorkers: "allow" }); // the sandboxed CSP already rules out service workers
      try {
        for (const [i, p] of content.pages.entries()) {
          if (!files.has(p.file)) continue;
          const slug = slugs[i];
          const page = await ctx.newPage();
          const errors: string[] = [], csp: string[] = [], failed: string[] = [];
          let bytes = 0, requests = 0;
          page.on("pageerror", (e) => errors.push(e.message.slice(0, 300)));
          page.on("console", (m) => {
            const t = m.text();
            if (/Content Security Policy|Refused to/i.test(t)) csp.push(t.slice(0, 240));
            else if (m.type() === "error" && !/Failed to load resource/i.test(t)) errors.push(t.slice(0, 300));
          });
          page.on("requestfailed", (r) => { if (!/favicon/.test(r.url())) failed.push(`${r.failure()?.errorText ?? "failed"}: ${r.url().slice(0, 140)}`); });
          page.on("response", (r) => {
            requests++;
            bytes += Number(r.headers()["content-length"] ?? 0);
            if (r.status() >= 400 && !/favicon/.test(r.url())) failed.push(`${r.status()}: ${r.url().slice(0, 140)}`);
          });
          const t0 = Date.now();
          let loaded = false;
          try {
            await page.goto(`${origin}${p.link.replace(/^\./, "")}`, { waitUntil: "load", timeout: 45_000 });
            loaded = true;
            await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
          } catch (e) {
            errors.push(`Page did not load: ${(e as Error).message.split("\n")[0]}`);
          }
          const loadMs = Date.now() - t0;
          if (loaded) {
            // Scroll through like a visitor so scroll-triggered animations run, then back to the top.
            const height = await page.evaluate(() => document.documentElement.scrollHeight);
            for (let y = 0; y < height; y += Math.round(vp.height * 0.7)) {
              await page.mouse.wheel(0, Math.round(vp.height * 0.7));
              await page.waitForTimeout(110);
            }
            await page.waitForTimeout(900);
            const m = await page.evaluate(inPage, {
              texts: p.sections.flatMap((s) => [s.heading, ...s.paragraphs, ...s.items]).filter(Boolean),
              slugs, mobile: vp.mobile, placeholder: PLACEHOLDER.source, allowed: ALLOWED_SCRIPT_HOSTS,
            });
            const lcp = await page.evaluate(() => new Promise<number | null>((res) => {
              try {
                new PerformanceObserver((l) => { const e = l.getEntries(); res(e.length ? Math.round(e[e.length - 1].startTime) : null); }).observe({ type: "largest-contentful-paint", buffered: true });
                setTimeout(() => res(null), 300);
              } catch { res(null); }
            }));
            await page.evaluate(() => scrollTo(0, 0));
            await page.waitForTimeout(400);
            // Screenshots for the design review: every page's first screen, full pages of home and two others.
            const shot = (name: string) => join(qaDir, `${slug}-${vp.name}${name}.jpg`);
            if (vp.name !== "tablet" || i === 0) {
              await page.screenshot({ path: shot(""), type: "jpeg", quality: 60 });
              screenshots.push(shot(""));
            }
            if (i < 3 && vp.name !== "tablet") {
              await page.screenshot({ path: shot("-full"), type: "jpeg", quality: 50, fullPage: true, clip: { x: 0, y: 0, width: vp.width, height: Math.min(m.height, vp.mobile ? 7000 : 6000) } });
              screenshots.push(shot("-full"));
            }
            measures.push({
              slug, viewport: vp.name, loaded, overflowX: m.overflowX, images: m.images, brokenImages: m.brokenImages,
              consoleErrors: [...new Set(errors)], failedRequests: [...new Set(failed)], cspViolations: [...new Set(csp)],
              hasBanner: m.hasBanner, hasNoindex: m.hasNoindex, hasTitle: m.hasTitle, hasLang: m.hasLang, h1: m.h1,
              brokenLinks: m.brokenLinks, htmlLinks: m.htmlLinks, disallowedScripts: m.disallowedScripts,
              coverage: m.coverage, missing: m.missing, placeholders: m.placeholders, smallTapTargets: m.smallTapTargets,
              imagesNoAlt: m.imagesNoAlt, unnamedControls: m.unnamedControls, lowContrast: m.lowContrast, stuckHidden: m.stuckHidden,
              loadMs, lcpMs: lcp, bytes, requests,
            });
          } else {
            measures.push({ slug, viewport: vp.name, loaded: false, overflowX: 0, images: 0, brokenImages: 0, consoleErrors: errors, failedRequests: failed, cspViolations: csp, hasBanner: false, hasNoindex: false, hasTitle: false, hasLang: false, h1: 0, brokenLinks: [], htmlLinks: 0, disallowedScripts: [], coverage: 0, missing: [], placeholders: [], smallTapTargets: 0, imagesNoAlt: 0, unnamedControls: 0, lowContrast: 0, stuckHidden: 0, loadMs, lcpMs: null, bytes, requests });
          }
          await page.close();
        }
      } finally {
        await ctx.close().catch(() => {});
      }
      log(`measured ${vp.name} (${vp.width}px)`);
    }
  } finally {
    server.close();
  }
  const scorecard = scoreRedesign(measures, slugs, review);
  await writeFile(join(qaDir, "report.md"), scorecardMarkdown(scorecard, measures) + `\nScreenshots: ${screenshots.map((s) => s.slice(qaDir.length + 1)).join(", ")}\n`);
  await writeFile(join(qaDir, "scorecard.json"), JSON.stringify(scorecard, null, 2));
  return { scorecard, measures, screenshots };
}

/** Claude's design review (qa/review.json), validated; null when missing or malformed. */
export async function readReview(dir: string): Promise<DesignReview | null> {
  try {
    const r = JSON.parse(await readFile(join(dir, "qa", "review.json"), "utf8")) as Partial<DesignReview>;
    const n = (v: unknown) => (typeof v === "number" && v >= 0 && v <= 10 ? v : null);
    const [visual, brand, originality, ux] = [n(r.visual), n(r.brand), n(r.originality), n(r.ux)];
    if (visual === null || brand === null || originality === null || ux === null) return null;
    return { visual, brand, originality, ux, notes: Array.isArray(r.notes) ? r.notes.map(String).slice(0, 6) : [] };
  } catch {
    return null;
  }
}
