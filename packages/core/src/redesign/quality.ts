/**
 * Redesign quality: the UX audit of the original site, the QA scorecard for a rendered redesign, and the retry policy
 * for jobs. Pure logic shared by the runner, the job CLI and the Worker; the browser measurements come from
 * apps/cli/src/qa.ts.
 *
 * A redesign passes only when no critical defect was found, every category clears its floor and the weighted score
 * reaches the threshold. A high average never hides a broken page.
 */
import type { SiteSignals } from "./directions";
import { UI_KIT } from "./ui-kit";

// ---- UX audit of the original site ---------------------------------------------------------------------------------

export interface UxFinding {
  area: "mobile" | "navigation" | "conversion" | "content" | "trust" | "accessibility" | "performance" | "visual";
  finding: string;
  fix: string;
}

/** Findings from the audit reasons and the crawl; the browser research adds measured ones. */
export function uxAudit(reasons: string[], s: SiteSignals): UxFinding[] {
  const out: UxFinding[] = [];
  const has = (re: RegExp) => reasons.some((r) => re.test(r));
  if (has(/viewport|mobile/i)) out.push({ area: "mobile", finding: "The current site is not built for phones (no mobile viewport).", fix: "Mobile-first layout, 16px+ body text, 44px tap targets, a sticky call/book action on phones." });
  if (has(/table layout|fixed-width|frames/i)) out.push({ area: "visual", finding: "Layout is built with tables or fixed widths, so it breaks on small screens.", fix: "Fluid grid with clamp()-based type and spacing from 360px to 1600px." });
  if (has(/https/i)) out.push({ area: "trust", finding: "The site is not served over HTTPS; browsers warn visitors.", fix: "Mention it in the pitch; the redesign is HTTPS by default." });
  if (has(/copyright|outdated|old/i)) out.push({ area: "trust", finding: "Signals of neglect (old copyright year or outdated technology).", fix: "A fresh, current design; no dates unless the site states them." });
  if (s.pages > 10) out.push({ area: "navigation", finding: `${s.pages} pages compete in the navigation.`, fix: "Group pages: 4–6 primary links in the header, the rest in a menu and the footer sitemap." });
  if (!s.phone && !s.email) out.push({ area: "conversion", finding: "No phone number or email is easy to find.", fix: "Use the contact page link prominently; never invent contact details." });
  else out.push({ area: "conversion", finding: "Contact details are not presented as one-tap actions.", fix: `Make ${[s.phone && "the phone number a tel: link", s.email && "the email a mailto: link"].filter(Boolean).join(" and ")} and repeat the main action after key sections.` });
  if (s.hasBooking) out.push({ area: "conversion", finding: "The site mentions booking or reservations.", fix: "Put the booking action above the fold and in a sticky mobile bar, using the site's own booking link." });
  if (s.prices >= 4) out.push({ area: "content", finding: `${s.prices} price lines are buried in running text or tables.`, fix: "Present them as a scannable price list (name, short description, price aligned)." });
  if (s.images < 4) out.push({ area: "visual", finding: `Only ${s.images} usable photos on the site.`, fix: "Lead with typography and colour; use stock sparingly, consistent in tone, credited." });
  if (s.words > 2500) out.push({ area: "content", finding: `Long pages (${s.words} words in total).`, fix: "Keep every word but give it structure: headings, columns, accordions for long lists, a summary up top." });
  if (!s.hours) out.push({ area: "content", finding: "Opening hours are hard to find.", fix: "If the site states hours anywhere, surface them near the top and in the footer." });
  return out;
}

// ---- QA scorecard --------------------------------------------------------------------------------------------------

export type Viewport = "desktop" | "tablet" | "mobile";

/** What the browser measured for one page at one viewport (apps/cli/src/qa.ts). */
export interface PageMeasure {
  slug: string;
  viewport: Viewport;
  loaded: boolean;
  overflowX: number;
  images: number;
  brokenImages: number;
  consoleErrors: string[];
  failedRequests: string[];
  cspViolations: string[];
  hasBanner: boolean;
  hasNoindex: boolean;
  hasTitle: boolean;
  hasLang: boolean;
  h1: number;
  brokenLinks: string[];
  htmlLinks: number;
  disallowedScripts: string[];
  /** Share of the page's content.json text found in the rendered text (0–1). */
  coverage: number;
  missing: string[];
  placeholders: string[];
  smallTapTargets: number;
  imagesNoAlt: number;
  unnamedControls: number;
  lowContrast: number;
  /** Elements still invisible (opacity 0 / hidden by an animation) after scrolling the whole page. */
  stuckHidden: number;
  /** Ids of the UI kit components found on the page (optional for older measurements). */
  kit?: string[];
  loadMs: number;
  lcpMs: number | null;
  bytes: number;
  requests: number;
}

/** Claude's own design review of the rendered screenshots (model-judged, labelled as such). */
export interface DesignReview {
  visual: number;
  brand: number;
  originality: number;
  ux: number;
  notes: string[];
}

export interface Category {
  id: "visual" | "brand" | "originality" | "ux" | "responsive" | "functional" | "accessibility" | "performance" | "content" | "readiness";
  label: string;
  score: number | null;
  source: "measured" | "model" | "mixed";
  criteria: string;
  notes: string[];
}

export interface Scorecard {
  overall: number;
  pass: boolean;
  threshold: number;
  critical: string[];
  warnings: string[];
  categories: Category[];
  pages: number;
  measuredAt: string;
}

const WEIGHTS: Record<Category["id"], number> = {
  visual: 2, brand: 1.5, originality: 1, ux: 1.5, responsive: 1.5, functional: 1.5, accessibility: 1, performance: 0.75, content: 2, readiness: 0,
};
/** Below this, a category blocks a pass even when the weighted score is high. */
const FLOOR = 5;
export const PASS_THRESHOLD = 7;
/** Every redesign uses the Magic UI + Smooth UI kit: distinct components on the home page and on each inner page. */
export const KIT_MIN_HOME = 8;
export const KIT_MIN_INNER = 5;

/** What a page lacks to meet the UI kit requirement (null when it meets it or wasn't measured). */
export function kitShortfall(m: Pick<PageMeasure, "slug" | "kit">): string | null {
  if (!m.kit) return null;
  const ids = new Set(m.kit);
  const min = m.slug === "home" ? KIT_MIN_HOME : KIT_MIN_INNER;
  const libs = new Set(UI_KIT.filter((c) => ids.has(c.id)).map((c) => c.library));
  const missing = [ids.size < min && `${ids.size} of ${min} kit components`, (!libs.has("Magic UI") || !libs.has("Smooth UI")) && "both Magic UI and Smooth UI"].filter(Boolean);
  return missing.length ? `"${m.slug}" uses ${missing.join(" and needs ")}` : null;
}

const clamp = (n: number) => Math.max(0, Math.min(10, Math.round(n * 10) / 10));
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function scoreRedesign(measures: PageMeasure[], expectedSlugs: string[], review: DesignReview | null, threshold = PASS_THRESHOLD): Scorecard {
  const critical: string[] = [];
  const warnings: string[] = [];
  const at = (v: Viewport) => measures.filter((m) => m.viewport === v);
  const desktop = at("desktop");
  const mobile = at("mobile");

  // Critical defects: any one of these means the redesign is not client-ready.
  for (const slug of expectedSlugs) {
    const m = desktop.find((x) => x.slug === slug);
    if (!m) critical.push(`Page "${slug}" is missing.`);
    else if (!m.loaded) critical.push(`Page "${slug}" did not load.`);
  }
  for (const m of mobile) if (m.overflowX > 4) critical.push(`"${m.slug}" scrolls sideways on phones (${Math.round(m.overflowX)}px too wide).`);
  for (const m of desktop) {
    if (m.coverage < 0.85) critical.push(`"${m.slug}" is missing ${Math.round((1 - m.coverage) * 100)}% of the site's text (e.g. "${(m.missing[0] ?? "").slice(0, 80)}").`);
    if (!m.hasBanner) critical.push(`"${m.slug}" has no "Concept redesign" banner.`);
    if (m.brokenLinks.length) critical.push(`"${m.slug}" links to pages that don't exist: ${m.brokenLinks.slice(0, 3).join(", ")}.`);
    if (m.placeholders.length) critical.push(`"${m.slug}" contains placeholder text: ${m.placeholders.slice(0, 3).join(", ")}.`);
    if (m.consoleErrors.length) critical.push(`"${m.slug}" throws script errors: ${m.consoleErrors[0].slice(0, 140)}`);
    if (m.images >= 3 && m.brokenImages / m.images > 0.3) critical.push(`"${m.slug}": ${m.brokenImages} of ${m.images} images are broken.`);
    if (m.stuckHidden > 3) critical.push(`"${m.slug}": ${m.stuckHidden} elements stay invisible after scrolling (an entrance animation never runs).`);
    if (m.disallowedScripts.length) critical.push(`"${m.slug}" loads scripts from hosts that aren't allowed: ${m.disallowedScripts.join(", ")}.`);
  }

  const pages = desktop.length || 1;
  const avg = (f: (m: PageMeasure) => number, list = desktop) => (list.length ? sum(list.map(f)) / list.length : 0);

  const content = clamp(10 * avg((m) => Math.min(1, m.coverage)) - 3 * desktop.filter((m) => m.placeholders.length).length);
  const functional = clamp(10
    - 2 * sum(desktop.map((m) => m.brokenLinks.length))
    - 2 * sum(desktop.map((m) => Math.min(2, m.consoleErrors.length)))
    - 1 * sum(desktop.map((m) => Math.min(2, m.cspViolations.length)))
    - 0.5 * sum(desktop.map((m) => m.htmlLinks ? 1 : 0))
    - 4 * avg((m) => (m.images ? m.brokenImages / m.images : 0))
    - 1 * sum(desktop.map((m) => Math.min(2, m.failedRequests.length))) / pages);
  const responsive = clamp(10
    - 5 * mobile.filter((m) => m.overflowX > 4).length / Math.max(1, mobile.length)
    - 2 * at("tablet").filter((m) => m.overflowX > 4).length / Math.max(1, at("tablet").length)
    - 3 * Math.min(1, avg((m) => m.smallTapTargets, mobile) / 12));
  const accessibility = clamp(10
    - 2 * desktop.filter((m) => !m.hasLang || !m.hasTitle).length / pages
    - 1.5 * desktop.filter((m) => m.h1 !== 1).length / pages
    - 2 * Math.min(1, avg((m) => m.imagesNoAlt) / 5)
    - 2 * Math.min(1, avg((m) => m.unnamedControls) / 3)
    - 2.5 * Math.min(1, avg((m) => m.lowContrast) / 8));
  const performance = clamp(10
    - Math.max(0, (avg((m) => m.lcpMs ?? m.loadMs) - 2500) / 600)
    - Math.max(0, (avg((m) => m.bytes) / 1e6 - 3) * 0.8));

  const kitShort = desktop.map(kitShortfall).filter((x): x is string => !!x);
  for (const k of kitShort) warnings.push(`UI kit requirement not met: ${k} (home ${KIT_MIN_HOME}, inner pages ${KIT_MIN_INNER}, from both libraries; see skill/references/ui-kit.md).`);

  const r = review ? { visual: clamp(review.visual), brand: clamp(review.brand), originality: clamp(review.originality), ux: clamp(review.ux) } : null;
  const navOk = desktop.every((m) => !m.brokenLinks.length);
  const ux = r ? clamp(r.ux - (navOk ? 0 : 2)) : null;

  const note = (cond: boolean, s: string) => (cond ? [s] : []);
  const categories: Category[] = [
    { id: "visual", label: "Visual quality", score: r?.visual ?? null, source: "model", criteria: "Hierarchy, typography, spacing, imagery and polish read as agency work (model review of desktop and phone screenshots).", notes: review?.notes.slice(0, 3) ?? ["No design review was run."] },
    { id: "brand", label: "Brand relevance", score: r?.brand ?? null, source: "model", criteria: "Fits this business, its trade and its own brand colours and photos.", notes: [] },
    { id: "originality", label: "Design originality", score: r?.originality ?? null, source: "model", criteria: "Follows its creative direction; does not read as a template or as the recent redesigns.", notes: [] },
    { id: "ux", label: "UX and information architecture", score: ux, source: "mixed", criteria: "Clear navigation to every page, the primary action visible early and repeated, scannable content.", notes: note(!navOk, "Broken internal links.") },
    { id: "responsive", label: "Responsive behaviour", score: responsive, source: "measured", criteria: "No sideways scrolling at 390px or 820px; tap targets at least 40px.", notes: mobile.filter((m) => m.smallTapTargets > 6).map((m) => `${m.slug}: ${m.smallTapTargets} small tap targets`) },
    { id: "functional", label: "Functional correctness", score: functional, source: "measured", criteria: "No script errors, CSP violations, broken links, broken images or failed requests.", notes: desktop.flatMap((m) => [...m.cspViolations.slice(0, 1), ...m.failedRequests.slice(0, 1)].map((x) => `${m.slug}: ${x.slice(0, 120)}`)).slice(0, 4) },
    { id: "accessibility", label: "Accessibility", score: accessibility, source: "measured", criteria: "lang and title set, one h1, alt text, named controls, text contrast at least 4.5:1.", notes: desktop.filter((m) => m.lowContrast > 4).map((m) => `${m.slug}: ${m.lowContrast} low-contrast text elements`) },
    { id: "performance", label: "Performance", score: performance, source: "measured", criteria: "Largest contentful paint under 2.5s on a fast connection; page weight under 3MB.", notes: desktop.map((m) => `${m.slug}: LCP ${Math.round(m.lcpMs ?? m.loadMs)}ms, ${(m.bytes / 1e6).toFixed(1)}MB, ${m.requests} requests`).slice(0, 3) },
    { id: "content", label: "Content accuracy", score: content, source: "measured", criteria: "At least 95% of every page's text present word for word; no placeholders.", notes: desktop.filter((m) => m.coverage < 0.97).map((m) => `${m.slug}: ${Math.round(m.coverage * 100)}% of the text`) },
  ];

  const scored = categories.filter((c) => c.score !== null);
  const weight = sum(scored.map((c) => WEIGHTS[c.id]));
  const overall = clamp(sum(scored.map((c) => (c.score as number) * WEIGHTS[c.id])) / (weight || 1));
  for (const c of scored) if ((c.score as number) < FLOOR) warnings.push(`${c.label} is below ${FLOOR}/10 (${c.score}).`);
  if (!review) warnings.push("No design review: visual quality, brand fit and originality were not judged.");
  const pass = !critical.length && !!review && !kitShort.length && scored.every((c) => (c.score as number) >= FLOOR) && overall >= threshold;
  categories.push({ id: "readiness", label: "Overall client readiness", score: pass ? overall : Math.min(overall, threshold - 0.1), source: "mixed", criteria: `No critical defect, UI kit requirement met, every category at least ${FLOOR}, weighted score at least ${threshold}.`, notes: pass ? ["Ready to send."] : [...critical, ...warnings].slice(0, 3) });

  return { overall, pass, threshold, critical, warnings, categories, pages: desktop.length, measuredAt: new Date().toISOString() };
}

/** Markdown version of a scorecard for the job folder (Claude reads it in the refinement pass). */
export function scorecardMarkdown(s: Scorecard, measures: PageMeasure[]): string {
  let md = `# QA report\n\n**${s.pass ? "PASS" : "NOT READY"}**: ${s.overall}/10 (threshold ${s.threshold}).\n\n`;
  if (s.critical.length) md += `## Critical defects (fix all of these)\n\n${s.critical.map((c) => `- ${c}`).join("\n")}\n\n`;
  if (s.warnings.length) md += `## Warnings\n\n${s.warnings.map((c) => `- ${c}`).join("\n")}\n\n`;
  md += "## Scorecard\n\n| Category | Score | Source | Notes |\n|---|---|---|---|\n";
  for (const c of s.categories) md += `| ${c.label} | ${c.score ?? "–"} | ${c.source} | ${c.notes.join("; ").replace(/\|/g, "/")} |\n`;
  md += "\n## Per page\n\n";
  for (const m of measures) {
    const issues = [
      m.overflowX > 4 && `scrolls sideways by ${Math.round(m.overflowX)}px`,
      m.coverage < 0.97 && `${Math.round(m.coverage * 100)}% of the text; missing: ${m.missing.slice(0, 4).map((x) => `"${x.slice(0, 70)}"`).join(", ")}`,
      m.brokenImages && `${m.brokenImages}/${m.images} broken images`,
      m.consoleErrors.length && `script errors: ${m.consoleErrors.slice(0, 2).join(" / ").slice(0, 200)}`,
      m.cspViolations.length && `CSP blocked: ${m.cspViolations.slice(0, 2).join(" / ").slice(0, 200)}`,
      m.brokenLinks.length && `broken links: ${m.brokenLinks.join(", ")}`,
      m.htmlLinks && `${m.htmlLinks} links end in .html`,
      m.smallTapTargets > 6 && `${m.smallTapTargets} tap targets under 40px`,
      m.lowContrast > 4 && `${m.lowContrast} low-contrast text elements`,
      m.imagesNoAlt && `${m.imagesNoAlt} images without alt`,
      m.unnamedControls && `${m.unnamedControls} links/buttons without an accessible name`,
      m.h1 !== 1 && `${m.h1} h1 elements`,
      m.stuckHidden && `${m.stuckHidden} elements invisible after scrolling`,
      m.placeholders.length && `placeholders: ${m.placeholders.join(", ")}`,
      !m.hasBanner && "no concept banner",
      !m.hasNoindex && "no robots noindex meta",
      m.viewport === "desktop" && m.kit && `UI kit: ${m.kit.length ? m.kit.join(", ") : "none"}${kitShortfall(m) ? " (below the requirement)" : ""}`,
    ].filter(Boolean);
    md += `- **${m.slug} @ ${m.viewport}**: ${issues.length ? issues.join("; ") : "no issues found"}\n`;
  }
  return md;
}

// ---- Job retry policy ----------------------------------------------------------------------------------------------

export type FailureKind = "technical" | "unreachable" | "quality" | "cancelled";

/** Minutes to wait before attempt `attempt + 1` (attempt is 1-based): 5, 10, 20, 40, capped at 60. */
export function retryDelayMinutes(attempt: number): number {
  return Math.min(60, 5 * 2 ** Math.max(0, attempt - 1));
}

/** Technical failures retry; an unreachable site, a cancelled job or a quality failure goes to a person. */
export function shouldRetry(kind: FailureKind, attempts: number, maxAttempts: number): boolean {
  return kind === "technical" && attempts < maxAttempts;
}
