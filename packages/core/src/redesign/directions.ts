/**
 * Creative direction: the design intelligence behind every Claude redesign.
 *
 * Every redesign is built in one direction, the house style ("House Editorial", from the approved Union Oyster House
 * redesign): the layout adapts to each business's content while the look, type, motion and the seven house colour
 * themes stay the same. The palette is the job's house theme (contrast-checked by design); the colour maths below is
 * still used by QA and research.
 *
 * Pure data and maths: runs in Workers and Node.
 */
import type { CategoryId } from "../types";
import { HOUSE_FONTS, LOOKS, type Look } from "./system";

export type ThreeD = "none" | "optional" | "feature";

export interface Palette {
  name: string;
  dark: boolean;
  bg: string;
  surface: string;
  text: string;
  muted: string;
  /** The accent as a fill (buttons, badges, highlights): the brand's true colour when it has one. */
  accent: string;
  /** Text colour on accent-filled buttons. */
  onAccent: string;
  /** A second, quieter colour for details (eyebrows, rules, tints). */
  support: string;
  /** The accent when it is itself text, links or thin lines on the background (adjusted to stay readable). */
  accentText?: string;
  /** True when accent-filled shapes need an outline to stand out from the background (e.g. bright yellow on cream). */
  accentNeedsEdge?: boolean;
}

export interface FontPairing {
  display: string;
  body: string;
  /** Google Fonts css2 query (the part after `?`, without `&display=swap`). */
  query: string;
  note: string;
}

export interface MotionSystem {
  /** What happens when the page opens ("none" means no loader and no intro sequence). */
  intro: string;
  /** How moving between pages feels. */
  transition: string;
  /** What happens as the visitor scrolls. */
  scroll: string;
  /** Hover and press feedback. */
  hover: string;
  /** The one effect people will remember this site by. */
  signature: string;
}

const M = (intro: string, transition: string, scroll: string, hover: string, signature: string): MotionSystem => ({ intro, transition, scroll, hover, signature });

export interface CreativeDirection {
  id: string;
  name: string;
  concept: string;
  /** Trades this direction is made for (best fit), and ones it can serve well. */
  primary: CategoryId[];
  secondary: CategoryId[];
  /** How it reacts to the site's material. */
  wantsPhotos: "many" | "some" | "few";
  likesPriceLists: boolean;
  hero: string;
  sequence: string[];
  grid: string;
  typeScale: string;
  fonts: FontPairing[];
  palettes: Palette[];
  imagery: string;
  components: string[];
  motion: string;
  threeD: ThreeD;
  threeDIdea?: string;
  conversion: string;
  /** false: never chosen automatically, only when the owner picks it. */
  auto?: boolean;
  /** This direction's own motion system. Nothing in it is shared with another direction. */
  motionSystem: MotionSystem;
  /** The UI kit components (ids from ui-kit.ts) that suit this direction; no others are used. */
  kit: string[];
  avoid: string[];
}

const P = (name: string, dark: boolean, bg: string, surface: string, text: string, muted: string, accent: string, onAccent: string, support: string): Palette =>
  ({ name, dark, bg, surface, text, muted, accent, onAccent, support });
const F = (display: string, body: string, query: string, note: string): FontPairing => ({ display, body, query, note });

/** The one direction every redesign is built in: the approved Union Oyster House system. */
export const HOUSE_DIRECTION_ID = "house-editorial";

/** The seven house themes as palettes (the job's theme is the one used; see creativeBrief). */
const HOUSE_PALETTES: Palette[] = LOOKS.map((l) => P(l.name, l.dark, l.bg, l.surface, l.text, l.textMuted, l.accent, l.onAccent, l.accent2));

export const DIRECTIONS: CreativeDirection[] = [
  {
    id: HOUSE_DIRECTION_ID,
    name: "House Editorial",
    concept: "The Revamp Radar house style, from the approved Union Oyster House redesign: an editorial page set in Caslon and Instrument Sans, one of seven house colour themes (the visitor can switch between all seven), generous white space, hairline rules and numbered section heads, the business's own photography used large, and one confident motion language: a short opening curtain, headlines rising out of a mask, a hero photograph that grows to full screen as you scroll, a ribbon of the business's facts, a statement that lights up word by word, a horizontal scroll-driven track, a page index whose photo follows the pointer, parallax photographs, an inverse contact band and a large footer wordmark. It must feel like premium agency work made for this business: the layout adapts to the content, the look and feel stay the same.",
    primary: ["restaurant", "cafe", "gym", "salon", "clothing", "retail", "healthcare", "accounting", "import_export", "services"],
    secondary: [],
    wantsPhotos: "some", likesPriceLists: true,
    hero: "Editorial hero: a small eyebrow row (trade · city on the left, the phone number on the right); the business's name or its own strongest claim as a huge two-line Caslon headline whose lines rise out of a mask, the last word in the accent italic; a short real paragraph and two buttons (primary filled with a magnetic pull, secondary outlined) set beside the second line on desktop; below it the business's best wide photograph inside the page margins, which grows to full bleed as the visitor scrolls (pinned with position: sticky) while the headline drifts up and fades; once it fills the screen a dark scrim, a caption (address eyebrow + one real line in large type) and up to three real figures (founding year rolling in like an odometer, phone, hours) arrive, with a slowly turning circular seal.",
    sequence: [
      "Opening curtain (once per session): inverse colours, trade · city in small italic caps, the name rising, a hairline drawing across, then the curtain lifts",
      "Editorial hero with the expanding photograph, caption and rolling figures",
      "Fact ribbon: an endless, pausable strip of the business's real facts (name, trade, city, founding year, address, hours) in Caslon, alternating with italics, separated by small accent stars",
      "No. 01 statement: the opening sentence of the business's own story in large Caslon, lighting up word by word as it scrolls; then the rest of the story beside two overlapping parallax photographs and a pull quote from the site",
      "No. 02 track: the main offer (menus, services, programmes, history) as numbered panels on a horizontal track driven by vertical scrolling (desktop), with outlined numbers that fill with the accent as each panel arrives and a 01 / 06 counter with a progress hairline; a vertical numbered list on phones and with reduced motion",
      "The remaining content, section by section: numbered head, masked heading, text and the section's own photos (parallax), long lists as clean price lists",
      "In pictures: the business's own photos as a bento grid that zooms gently on hover",
      "Explore: an index of the other pages in large Caslon rows; on mouse devices a photo of each page follows the pointer and changes with the row",
      "Visit band in the theme's inverse colours: masked name, address in large type, opening hours, phone, email, primary action and directions",
      "Footer in inverse colours: the name as a large wordmark rising out of its mask, trade · city in italic, the primary action, three columns (visit, pages, more) and the concept credit",
    ],
    grid: "84rem container with 20px (phone) / 40px gutters; 12-column logic with deliberate asymmetry (4/8, 5/7, 7/5 splits); 88–144px section rhythm; hairline 1px rules; sharp corners everywhere (no rounded cards).",
    typeScale: "Display (Libre Caslon Display) 3.1–9.5rem for the hero, 2.2–4rem for section headings, line-height .95–1.05, tracking -0.015 to -0.03em; italic accents in Libre Caslon Text; body Instrument Sans 16.5px/1.7; labels 0.72rem, 600, tracked 0.2em uppercase; section heads 'No. 01' in italic serif beside the label.",
    fonts: [F("Libre Caslon Display", "Instrument Sans", HOUSE_FONTS, "Caslon for display and italic accents, Instrument Sans for text: the house pairing for every site.")],
    palettes: HOUSE_PALETTES,
    imagery: "The business's own photographs, large and cropped with intent (object-fit, chosen focal point); archive or historic photos where the site has them; stock only to fill gaps, consistent in tone and credited. Every photo sits in a frame that clips it, many with a slow parallax drift.",
    components: ["Theme picker with the seven house palettes and a circular reveal", "Opening curtain", "Masked line headlines", "Expanding hero photograph with scrim, caption, rolling figures and turning seal", "Fact ribbon", "Word-by-word statement", "Horizontal scroll track with outlined numbers", "Page index with a pointer-following photo", "Parallax photographs", "Bento gallery", "Inverse visit band", "Footer wordmark"],
    motion: "The house motion language (the starter's motion.js): curtain, masked lines, expanding hero, ribbon, word-by-word statement, horizontal track, pointer preview, parallax, magnetic primary button, scroll progress hairline, circular theme reveal. Motion (window.Motion) only; transforms, opacity and clip-path; native scrolling; everything off with reduced motion.",
    motionSystem: M(
      "A short opening curtain in the inverse colours (trade · city, the name rising, a hairline drawing across) lifts after about 1.4s, once per browser session; then the header slides down and the hero headline rises line by line out of its mask.",
      "Plain page loads; every page opens with its masked headline (no curtain after the first visit in a session).",
      "The hero photograph grows from the page margins to full bleed while the headline drifts away, then its caption and rolling figures arrive; a statement lights up word by word; a horizontal track moves with vertical scrolling; photographs drift inside their frames; section headings rise out of masks as they arrive.",
      "Primary buttons lean towards the pointer (magnetic); index rows slide right and take the accent while a photo follows the pointer; gallery photos zoom slowly; links underline from the left.",
      "The hero photograph expanding to full screen on scroll, and the theme switch spreading in a circle from the chosen swatch.",
    ),
    kit: ["scroll-progress", "magnetic-button", "scroll-reveal-paragraph", "mask-reveal-up", "marquee", "number-ticker", "image-accordion"],
    threeD: "none",
    conversion: "The primary action in the header, beside the hero headline, in the visit band and in the footer; phone numbers as tel: links in the hero eyebrow and caption; on phones the header keeps the menu and theme button within reach.",
    avoid: [
      "Rounded cards, gradient blobs, glassmorphism, neon, drop shadows on everything",
      "The old system's pieces: counter loaders, echo (outlined copy) headings, round cut-out plates, dust splashes, cloud reveals",
      "Colours outside the seven house themes",
      "Text over the busy part of a photo without the scrim",
      "Inventing figures for the rolling numbers: only real numbers from content.json",
    ],
  },
];

/** Earlier direction ids (jobs queued before the house style) all build the house direction now. */
const LEGACY_DIRECTIONS = ["cinematic-hospitality", "editorial-magazine", "swiss-precision", "warm-neighbourhood", "clinical-calm", "bold-kinetic", "luxe-minimal", "craft-heritage", "global-trade-3d", "bento-modern", "organic-wellness", "immersive-showcase"];

export function directionById(id: string | null | undefined): CreativeDirection | undefined {
  if (!id) return undefined;
  return DIRECTIONS.find((d) => d.id === id) ?? (LEGACY_DIRECTIONS.includes(id) ? DIRECTIONS[0] : undefined);
}

/** What the site gives a designer to work with. Built from the crawl (and the browser research when available). */
export interface SiteSignals {
  trade: CategoryId;
  pages: number;
  images: number;
  prices: number;
  words: number;
  hasMenu: boolean;
  hasTeam: boolean;
  hasBooking: boolean;
  hasFaq: boolean;
  phone: boolean;
  email: boolean;
  hours: boolean;
}

export interface BrandSignals {
  /** Colours from the original site, most prominent first (hex). */
  colors: string[];
  /** Background of the original site's body, when measured. */
  background?: string;
  fonts: string[];
  logo?: string;
}

/** Recently used direction ids, newest first; the last two are never repeated, the last six are penalised. */
export function chooseDirection(signals: SiteSignals, recent: string[] = [], seed = ""): CreativeDirection {
  const scored = DIRECTIONS.filter((d) => d.auto !== false).map((d) => ({ d, score: scoreDirection(d, signals, recent, seed) }));
  scored.sort((a, b) => b.score - a.score);
  return scored[0].d;
}

export function scoreDirection(d: CreativeDirection, s: SiteSignals, recent: string[], seed = ""): number {
  let score = d.primary.includes(s.trade) ? 6 : d.secondary.includes(s.trade) ? 3 : -4;
  // Material: photo-led directions need photos, typographic ones shine without them.
  if (d.wantsPhotos === "many") score += s.images >= 10 ? 2 : s.images >= 5 ? 0 : -6;
  if (d.wantsPhotos === "few") score += s.images < 5 ? 2 : 0;
  if (d.likesPriceLists && s.prices >= 4) score += 1.5;
  if (d.id === "clinical-calm" && (s.hasFaq || s.hasBooking)) score += 1;
  if (d.id === "global-trade-3d" && s.trade !== "import_export") score -= 3;
  // Variety: never the same direction as the last two redesigns; fade the penalty over the last six.
  const at = recent.indexOf(d.id);
  if (at === 0 || at === 1) score -= 20;
  else if (at > 1 && at < 6) score -= 5 - at * 0.5;
  // Deterministic tie-break per site, so equally good directions spread across businesses.
  return score + (hash(`${seed}:${d.id}`) % 1000) / 1250;
}

const PRICE = /(?:[$€£]\s?\d|\d[\d.,]*\s?(?:€|eur|usd|\$|£|kč|zł|chf|kr)\b)/i;

export function siteSignals(trade: CategoryId, site: { pages: { label: string; title: string; sections: { heading: string; paragraphs: string[]; items: string[]; images: string[] }[] }[] },
  contact: { phones: string[]; emails: string[]; openingHours?: string }): SiteSignals {
  const pages = site.pages;
  const texts = pages.flatMap((p) => [p.label, p.title, ...p.sections.flatMap((x) => [x.heading, ...x.paragraphs, ...x.items])]);
  const all = texts.join(" \n ");
  const labels = pages.map((p) => `${p.label} ${p.title}`).join(" ");
  return {
    trade,
    pages: pages.length,
    images: new Set(pages.flatMap((p) => p.sections.flatMap((x) => x.images))).size,
    prices: texts.filter((t) => PRICE.test(t)).length,
    words: all.split(/\s+/).filter(Boolean).length,
    hasMenu: /\b(menu|menü|speisekarte|carte|carta|jídelní|food|drinks)\b/i.test(labels),
    hasTeam: /\b(team|staff|our people|doctors?|ärzte|tým|équipe|about)\b/i.test(labels),
    hasBooking: /\b(book|booking|reserv|appointment|termin|rezerv|réserv)/i.test(all),
    hasFaq: /\b(faq|frequently asked|häufige fragen)\b/i.test(all),
    phone: contact.phones.length > 0,
    email: contact.emails.length > 0,
    hours: !!contact.openingHours || /\b(mon|tue|wed|thu|fri|sat|sun|mo|di|mi|do|fr|sa|so)\w*\s*[-–:]/i.test(all),
  };
}

// ---- Colour maths (WCAG) ------------------------------------------------------------------------------------------

export function parseColor(c: string): [number, number, number] | null {
  const s = c.trim().toLowerCase();
  let m = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (m) {
    const h = m[1].length === 3 ? m[1].split("").map((x) => x + x).join("") : m[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
  }
  m = s.match(/^rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)(?:[ ,/]+([\d.]+%?))?\s*\)$/);
  if (m) {
    if (m[4] !== undefined && parseFloat(m[4]) === 0) return null; // fully transparent
    return [Number(m[1]), Number(m[2]), Number(m[3])];
  }
  return null;
}

export function toHex([r, g, b]: [number, number, number]): string {
  return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}

function luminance([r, g, b]: [number, number, number]): number {
  const f = (v: number) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrast(a: string, b: string): number {
  const x = parseColor(a), y = parseColor(b);
  if (!x || !y) return 1;
  const [l1, l2] = [luminance(x), luminance(y)].sort((p, q) => q - p);
  return (l1 + 0.05) / (l2 + 0.05);
}

function saturation([r, g, b]: [number, number, number]): number {
  const max = Math.max(r, g, b) / 255, min = Math.min(r, g, b) / 255;
  return max === 0 ? 0 : (max - min) / max;
}

/** Darken (on light backgrounds) or lighten (on dark ones) a colour until it reaches the contrast target. */
export function ensureContrast(color: string, bg: string, target: number): string {
  const rgb = parseColor(color), back = parseColor(bg);
  if (!rgb || !back) return color;
  const towards = luminance(back) > 0.4 ? 0 : 255;
  let cur: [number, number, number] = [...rgb];
  for (let i = 0; i < 24 && contrast(toHex(cur), bg) < target; i++) cur = cur.map((v) => v + (towards - v) * 0.12) as [number, number, number];
  return toHex(cur);
}

/** The brand's most usable accent: a saturated colour that isn't near-white, near-black or grey. */
export function brandAccent(brand: BrandSignals | null | undefined): string | null {
  for (const c of brand?.colors ?? []) {
    const rgb = parseColor(c);
    if (!rgb) continue;
    const l = luminance(rgb);
    if (saturation(rgb) >= 0.35 && l > 0.03 && l < 0.85) return toHex(rgb);
  }
  return null;
}

/**
 * The palette for a job: one of the seven house themes, exactly as designed (every pair already passes WCAG AA).
 * The job's own theme wins (the DNA's, or the one the owner forced); otherwise one is picked by seed. Brand colours
 * no longer recolour it: every redesign uses the house themes.
 */
export function paletteFor(d: CreativeDirection, _brand?: BrandSignals | null, seed = "", look?: Look | null): Palette & { fromBrand: boolean; themeId: string } {
  const l = look ?? LOOKS.find((x) => x.name === d.palettes[hash(seed + d.id) % d.palettes.length].name) ?? LOOKS[0];
  const base = P(l.name, l.dark, l.bg, l.surface, l.text, l.textMuted, l.accent, l.onAccent, l.accent2);
  return { ...base, accentText: l.accent, accentNeedsEdge: false, fromBrand: false, themeId: l.id };
}

export function fontsFor(d: CreativeDirection, seed = "", recentFonts: string[] = []): FontPairing {
  const fresh = d.fonts.filter((f) => !recentFonts.includes(f.display));
  const list = fresh.length ? fresh : d.fonts;
  return list[hash(seed + "fonts") % list.length];
}

/** The full creative brief for one job: the direction plus the palette and fonts chosen for this business. */
export function creativeBrief(d: CreativeDirection, opts: { brand?: BrandSignals | null; seed?: string; recentFonts?: string[]; look?: Look | null } = {}) {
  const palette = paletteFor(d, opts.brand, opts.seed, opts.look);
  const fonts = fontsFor(d, opts.seed, opts.recentFonts);
  return {
    id: d.id,
    name: d.name,
    concept: d.concept,
    hero: d.hero,
    sequence: d.sequence,
    grid: d.grid,
    typography: { ...fonts, scale: d.typeScale, googleFontsUrl: `https://fonts.googleapis.com/css2?${fonts.query}&display=swap` },
    palette,
    imagery: d.imagery,
    signatureComponents: d.components,
    motion: d.motion,
    motionSystem: d.motionSystem,
    kit: d.kit,
    threeD: d.threeD,
    threeDIdea: d.threeDIdea ?? null,
    conversion: d.conversion,
    avoid: d.avoid,
  };
}

export type CreativeBrief = ReturnType<typeof creativeBrief>;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
