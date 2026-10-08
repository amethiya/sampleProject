import { BLUEPRINTS, pickBlueprint, type Blueprint } from "./blueprints";
import type { CategoryId } from "../types";

/**
 * Design DNA: every redesign gets its own palette, type pairing, hero layout, shape language and concept,
 * chosen so it differs from the most recent redesigns. Category still decides photography, 3D subject and copy.
 */

export interface Palette {
  id: string;
  dark: boolean;
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  line: string;
  accent: string;
  accentInk: string;
}

export interface FontPair {
  id: string;
  fonts: string; // Google Fonts css2 query
  display: string;
  body: string;
  weight: number;
  tracking: string;
  upper?: boolean; // set headings in capitals
}

export type HeroLayout = "fullbleed" | "split" | "editorial" | "centered";
export type Corners = "sharp" | "soft" | "round";

export interface Concept {
  id: string;
  name: string;
  direction: string; // one-line art direction, also handed to Claude
}

export interface DesignDna {
  key: string;
  palette: Palette;
  fonts: FontPair;
  hero: HeroLayout;
  corners: Corners;
  concept: Concept;
  /** The scene blueprint (signature 3D moment and storyboard). Absent on keys stored before blueprints existed. */
  blueprint?: Blueprint;
}

const L = (ink: string, a: number) => `rgba(${ink},${a})`;

export const PALETTES: Palette[] = [
  { id: "ember", dark: true, bg: "#15110e", surface: "#1f1914", ink: "#f4ede3", muted: "#b6a893", line: L("244,237,227", 0.12), accent: "#d6a55c", accentInk: "#1b130b" },
  { id: "volt", dark: true, bg: "#0d0e11", surface: "#17191d", ink: "#f2f2ef", muted: "#9b9fa8", line: L("242,242,239", 0.1), accent: "#ff5b1f", accentInk: "#140600" },
  { id: "harbor", dark: true, bg: "#0a1424", surface: "#111f35", ink: "#eaf0f7", muted: "#93a5bd", line: L("234,240,247", 0.11), accent: "#45aef5", accentInk: "#04121f" },
  { id: "forest", dark: true, bg: "#0f1a14", surface: "#16241c", ink: "#e9f1ea", muted: "#9db3a3", line: L("233,241,234", 0.11), accent: "#8fd694", accentInk: "#0a1a0e" },
  { id: "plum", dark: true, bg: "#1a1020", surface: "#24172c", ink: "#f3eaf6", muted: "#b9a3c2", line: L("243,234,246", 0.11), accent: "#ff7eb6", accentInk: "#2a0a1a" },
  { id: "graphite", dark: true, bg: "#121212", surface: "#1c1c1c", ink: "#efefef", muted: "#a3a3a3", line: L("239,239,239", 0.1), accent: "#e8ff5a", accentInk: "#141600" },
  { id: "clinic", dark: false, bg: "#f4f7f9", surface: "#ffffff", ink: "#0f2537", muted: "#566b7d", line: L("15,37,55", 0.1), accent: "#16798a", accentInk: "#ffffff" },
  { id: "ledger", dark: false, bg: "#f1f3f5", surface: "#ffffff", ink: "#121d2c", muted: "#5a6577", line: L("18,29,44", 0.11), accent: "#235c4b", accentInk: "#ffffff" },
  { id: "terracotta", dark: false, bg: "#f6efe8", surface: "#fffaf5", ink: "#2b1d16", muted: "#7c6556", line: L("43,29,22", 0.12), accent: "#b4532a", accentInk: "#fff6ef" },
  { id: "sage", dark: false, bg: "#eef2ec", surface: "#f9fbf8", ink: "#1d2a22", muted: "#5f7266", line: L("29,42,34", 0.12), accent: "#3f6f52", accentInk: "#f2fff6" },
  { id: "cobalt", dark: false, bg: "#f3f5fb", surface: "#ffffff", ink: "#0e1838", muted: "#56607f", line: L("14,24,56", 0.1), accent: "#2448d8", accentInk: "#ffffff" },
  { id: "blush", dark: false, bg: "#fbf3f2", surface: "#ffffff", ink: "#2a1418", muted: "#7f5f64", line: L("42,20,24", 0.1), accent: "#c2405a", accentInk: "#ffffff" },
  { id: "sand", dark: false, bg: "#f5f0e6", surface: "#fffdf8", ink: "#1f1b14", muted: "#6f675a", line: L("31,27,20", 0.12), accent: "#1f1b14", accentInk: "#f5f0e6" },
  { id: "citrus", dark: false, bg: "#fdfbf2", surface: "#ffffff", ink: "#1c1a0e", muted: "#6b6750", line: L("28,26,14", 0.11), accent: "#e05a00", accentInk: "#ffffff" },
];

export const FONT_PAIRS: FontPair[] = [
  { id: "cormorant-manrope", fonts: "family=Cormorant+Garamond:wght@500;600&family=Manrope:wght@400;500;600", display: "'Cormorant Garamond', Georgia, serif", body: "'Manrope', system-ui, sans-serif", weight: 500, tracking: "-0.01em" },
  { id: "archivo-wide", fonts: "family=Archivo:wdth,wght@62..125,400..900", display: "'Archivo', Impact, sans-serif", body: "'Archivo', system-ui, sans-serif", weight: 850, tracking: "-0.02em", upper: true },
  { id: "jakarta", fonts: "family=Plus+Jakarta+Sans:wght@400;500;600;700", display: "'Plus Jakarta Sans', system-ui, sans-serif", body: "'Plus Jakarta Sans', system-ui, sans-serif", weight: 650, tracking: "-0.03em" },
  { id: "fraunces-intertight", fonts: "family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter+Tight:wght@400;500;600", display: "'Fraunces', Georgia, serif", body: "'Inter Tight', system-ui, sans-serif", weight: 400, tracking: "-0.02em" },
  { id: "sora-intertight", fonts: "family=Sora:wght@400;600;700&family=Inter+Tight:wght@400;500", display: "'Sora', system-ui, sans-serif", body: "'Inter Tight', system-ui, sans-serif", weight: 600, tracking: "-0.035em" },
  { id: "dmserif-dmsans", fonts: "family=DM+Serif+Display&family=DM+Sans:wght@400;500;700", display: "'DM Serif Display', Georgia, serif", body: "'DM Sans', system-ui, sans-serif", weight: 400, tracking: "-0.01em" },
  { id: "syne-worksans", fonts: "family=Syne:wght@600;700;800&family=Work+Sans:wght@400;500", display: "'Syne', system-ui, sans-serif", body: "'Work Sans', system-ui, sans-serif", weight: 700, tracking: "-0.02em" },
  { id: "playfair-sourcesans", fonts: "family=Playfair+Display:wght@500;700&family=Source+Sans+3:wght@400;600", display: "'Playfair Display', Georgia, serif", body: "'Source Sans 3', system-ui, sans-serif", weight: 500, tracking: "-0.015em" },
  { id: "bebas-karla", fonts: "family=Bebas+Neue&family=Karla:wght@400;500;700", display: "'Bebas Neue', Impact, sans-serif", body: "'Karla', system-ui, sans-serif", weight: 400, tracking: "0.01em", upper: true },
  { id: "instrument-geist", fonts: "family=Instrument+Serif&family=Geist:wght@400;500;600", display: "'Instrument Serif', Georgia, serif", body: "'Geist', system-ui, sans-serif", weight: 400, tracking: "-0.01em" },
  { id: "spacegrotesk", fonts: "family=Space+Grotesk:wght@400;500;700", display: "'Space Grotesk', system-ui, sans-serif", body: "'Space Grotesk', system-ui, sans-serif", weight: 700, tracking: "-0.04em" },
  { id: "unbounded-figtree", fonts: "family=Unbounded:wght@500;700&family=Figtree:wght@400;500;600", display: "'Unbounded', system-ui, sans-serif", body: "'Figtree', system-ui, sans-serif", weight: 600, tracking: "-0.03em" },
];

export const HERO_LAYOUTS: HeroLayout[] = ["fullbleed", "split", "editorial", "centered"];
export const CORNERS: Corners[] = ["sharp", "soft", "round"];

export const CONCEPTS: Concept[] = [
  { id: "cinematic", name: "Cinematic", direction: "Full-bleed imagery, slow camera-like motion, dramatic contrast, generous darkness." },
  { id: "editorial", name: "Editorial magazine", direction: "Magazine layout: oversized serif headlines, columns, pull quotes, thin rules, asymmetric grids." },
  { id: "swiss", name: "Swiss modern", direction: "Strict grid, flush-left type, numbered sections only where content is sequential, precise spacing, restrained colour." },
  { id: "luxury", name: "Quiet luxury", direction: "Lots of whitespace, small refined type, slow fades, thin gold-like accents, few elements per screen." },
  { id: "bold", name: "Bold poster", direction: "Huge condensed type, strong colour blocks, punchy marquee and kinetic text, high energy." },
  { id: "organic", name: "Warm organic", direction: "Soft rounded shapes, warm tones, gentle parallax, handcrafted feel, flowing section transitions." },
  { id: "tech", name: "Precise tech", direction: "Crisp geometry, thin borders, monochrome base with one vivid accent, data-like detail, snappy motion." },
  { id: "gallery", name: "Gallery", direction: "Photography first: large image sequences, horizontal galleries, captions, minimal chrome." },
];

const CATEGORY_PALETTES: Record<string, string[]> = {
  restaurant: ["ember", "terracotta", "plum", "forest", "sand", "citrus", "blush", "graphite"],
  gym: ["volt", "graphite", "cobalt", "citrus", "plum", "harbor", "forest"],
  healthcare: ["clinic", "sage", "cobalt", "blush", "sand", "harbor", "forest"],
  accounting: ["ledger", "cobalt", "sand", "sage", "graphite", "harbor", "clinic"],
  import_export: ["harbor", "cobalt", "graphite", "ledger", "citrus", "forest", "sand"],
  cafe: ["terracotta", "sand", "ember", "sage", "forest", "citrus", "blush"],
  salon: ["blush", "plum", "sand", "sage", "graphite", "terracotta", "clinic"],
  clothing: ["graphite", "sand", "blush", "volt", "plum", "cobalt", "citrus"],
  retail: ["citrus", "sand", "terracotta", "cobalt", "forest", "sage", "graphite"],
  services: ["cobalt", "ledger", "sage", "sand", "harbor", "graphite", "clinic"],
};

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function rotate<T>(xs: T[], seed: number): T[] {
  const n = xs.length;
  return xs.map((_, i) => xs[(i + seed) % n]);
}

/** Rebuild a DNA from its stored key ("palette|fonts|hero|corners|concept|blueprint"). */
export function dnaFromKey(key: string): DesignDna | null {
  const [p, f, h, c, k, b] = key.split("|");
  const palette = PALETTES.find((x) => x.id === p);
  const fonts = FONT_PAIRS.find((x) => x.id === f);
  const concept = CONCEPTS.find((x) => x.id === k);
  if (!palette || !fonts || !concept || !HERO_LAYOUTS.includes(h as HeroLayout) || !CORNERS.includes(c as Corners)) return null;
  const blueprint = b ? BLUEPRINTS.find((x) => x.id === b) : undefined;
  return { key, palette, fonts, hero: h as HeroLayout, corners: c as Corners, concept, blueprint };
}

/**
 * Choose a DNA for a site that avoids what recent redesigns used: no palette from the last 6, no type pairing
 * from the last 6, no concept from the last 4, a different hero layout from the previous one, and a scene
 * blueprint that suits the business (`text` is its name and content, for keywords like pizza or burger).
 */
export function pickDna(siteId: string, category: string, recentKeys: string[], text = ""): DesignDna {
  const recent = recentKeys.map(dnaFromKey).filter((d): d is DesignDna => !!d);
  const used = <T>(get: (d: DesignDna) => T, n: number) => new Set(recent.slice(0, n).map(get));
  const seed = hash(siteId);
  const palIds = CATEGORY_PALETTES[category] ?? PALETTES.map((p) => p.id);

  const pickFrom = <T>(items: T[], avoid: Set<T>, s: number) => rotate(items, s).find((x) => !avoid.has(x)) ?? rotate(items, s)[0];
  const palette = PALETTES.find((p) => p.id === pickFrom(palIds, used((d) => d.palette.id, 6), seed))!;
  const fonts = FONT_PAIRS.find((f) => f.id === pickFrom(FONT_PAIRS.map((x) => x.id), used((d) => d.fonts.id, 6), seed >>> 3))!;
  const hero = pickFrom(HERO_LAYOUTS, used((d) => d.hero, 1), seed >>> 5);
  const corners = pickFrom(CORNERS, used((d) => d.corners, 1), seed >>> 7);
  const concept = CONCEPTS.find((c) => c.id === pickFrom(CONCEPTS.map((x) => x.id), used((d) => d.concept.id, 4), seed >>> 9))!;
  const blueprint = pickBlueprint(siteId, category as CategoryId, text, recent.map((d) => d.blueprint?.id ?? ""));
  const key = [palette.id, fonts.id, hero, corners, concept.id, blueprint.id].join("|");
  return { key, palette, fonts, hero, corners, concept, blueprint };
}
