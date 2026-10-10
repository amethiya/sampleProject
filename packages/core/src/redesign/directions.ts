/**
 * Creative directions: the design intelligence behind every Claude redesign.
 *
 * A theme only changes colours; a direction changes the whole design: hero composition, section sequence and pacing,
 * grid, typography, palette strategy, imagery, signature components, motion language and whether 3D earns a place.
 * Each job gets the direction that best fits the business (its trade, how much photography and pricing it has, its
 * brand's own colours) and that differs from the most recent redesigns, so neighbouring redesigns never share a
 * layout. The palette is built from the business's brand colour when it has a usable one, and every pair is checked
 * for WCAG contrast.
 *
 * Pure data and maths: runs in Workers and Node.
 */
import type { CategoryId } from "../types";

export type ThreeD = "none" | "optional" | "feature";

export interface Palette {
  name: string;
  dark: boolean;
  bg: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  /** Text colour on accent-filled buttons. */
  onAccent: string;
  /** A second, quieter colour for details (eyebrows, rules, tints). */
  support: string;
}

export interface FontPairing {
  display: string;
  body: string;
  /** Google Fonts css2 query (the part after `?`, without `&display=swap`). */
  query: string;
  note: string;
}

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
  avoid: string[];
}

const P = (name: string, dark: boolean, bg: string, surface: string, text: string, muted: string, accent: string, onAccent: string, support: string): Palette =>
  ({ name, dark, bg, surface, text, muted, accent, onAccent, support });
const F = (display: string, body: string, query: string, note: string): FontPairing => ({ display, body, query, note });

export const DIRECTIONS: CreativeDirection[] = [
  {
    id: "cinematic-hospitality",
    name: "Cinematic Hospitality",
    concept: "The approved Rise & Shine / Edem system: a dark, candle-lit evening mood, a light classic display face, round cut-out plates floating in a dust splash, a cloud reveal onto a full-screen photo. The starter pages already implement it.",
    primary: ["restaurant"], secondary: ["cafe"],
    wantsPhotos: "some", likesPriceLists: true,
    hero: "Split: label, the business name as an echo heading, one real line and two outline buttons on the left; a round cut-out photo of the signature dish spinning in on a dust splash on the right.",
    sequence: ["Hero with round cut-out", "Sticky cloud reveal onto a full-screen photo with one real line", "Story with the info strip (location, hours, phone)", "Offerings zigzag with round images and real prices", "Signature cards", "Remaining content", "Visit / call to action over a dark photo", "Four-column footer"],
    grid: "Centered 1200px container, generous 120px+ vertical rhythm, zigzag rows.",
    typeScale: "Display up to 7rem, light weight; body 16.5px/1.75 light grotesk; small tracked labels with a short gold rule.",
    fonts: [
      F("Marcellus", "Jost", "family=Marcellus&family=Jost:wght@300;400;500", "Classic, Trajan-like capitals with a light grotesk."),
      F("Cormorant Garamond", "Manrope", "family=Cormorant+Garamond:wght@500;600&family=Manrope:wght@300;400;500", "Elegant high-contrast serif."),
    ],
    palettes: [
      P("Espresso & Gold", true, "#0e0e0d", "#1b1a18", "#ece6da", "#9a948a", "#c9a55b", "#14100a", "#e4c27c"),
      P("Midnight & Brass", true, "#0c1424", "#172338", "#eef0f4", "#97a3b6", "#c8a96a", "#0c1424", "#e3c88f"),
      P("Burgundy & Champagne", true, "#1c0c11", "#2e161d", "#f3e9e4", "#b49c9d", "#d8bc8c", "#1c0c11", "#ecd6aa"),
    ],
    imagery: "Warm, appetising close-ups; top-down plates cropped to circles; the dining room at night.",
    components: ["Loader counter + curtain", "Echo headings", "Round cut-out plates with dust", "Sticky cloud reveal", "Info strip with glowing line icons", "Dotted-leader price lists"],
    motion: "The starter's motion.js: loader, echo headings collapsing, plates spinning in, cloud reveal, curtain page transitions.",
    threeD: "none",
    conversion: "Reserve / order card in the hero and a visit band over a dark photo.",
    avoid: ["Using this direction for non-hospitality trades"],
  },
  {
    id: "editorial-magazine",
    name: "Editorial Magazine",
    concept: "A printed food or culture magazine: warm paper, very large serif headlines, an asymmetric 12-column grid, numbered chapters, pull quotes from the site's own words and photo essays with captions.",
    primary: ["restaurant", "cafe", "clothing"], secondary: ["salon", "retail", "services"],
    wantsPhotos: "some", likesPriceLists: true,
    hero: "Masthead hero: the business name set huge across the full width (clamp to 14vw), an issue-style line (city, trade, the year founded only if the site states it), and one tall photograph offset to the right third, breaking the grid.",
    sequence: ["Masthead hero", "Contents strip listing every page as numbered chapters (01, 02 …)", "Opening essay: the site's strongest paragraph with a drop cap beside a portrait photo", "Menu / services as a two-column magazine list with dotted leaders and prices in small caps", "Photo essay: 3 images in an asymmetric collage with captions", "Pull quote from the site's own text in very large italic", "Practical box (hours, address, phone) styled as a sidebar", "Colophon footer"],
    grid: "12-column grid with deliberate asymmetry (content on columns 2–8, images bleeding to the edge); hairline rules between sections; section numbers in the margin.",
    typeScale: "Display 6–10rem with tight tracking; italic for pull quotes; body 18px/1.65 serif or humanist sans; small caps for labels.",
    fonts: [
      F("Fraunces", "Newsreader", "family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,700;1,9..144,400&family=Newsreader:opsz,wght@6..72,400;6..72,500", "Soft, characterful serif with a reading serif."),
      F("Playfair Display", "Source Serif 4", "family=Playfair+Display:ital,wght@0,500;0,800;1,500&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600", "High-contrast editorial serif."),
      F("DM Serif Display", "DM Sans", "family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,600", "Classic magazine pairing."),
    ],
    palettes: [
      P("Newsprint", false, "#f4efe6", "#fbf8f2", "#1b1916", "#5f584e", "#b0341f", "#ffffff", "#d9cbb3"),
      P("Ink & Tomato", false, "#fffdf8", "#f3ede2", "#141414", "#5c5c5c", "#d1462f", "#ffffff", "#e9dfcf"),
      P("Olive Press", false, "#eeeadf", "#f7f4ec", "#22261c", "#5d6352", "#6b7a2e", "#ffffff", "#cfc9b4"),
    ],
    imagery: "Documentary photographs with captions; mix one full-bleed image with smaller framed ones; black-and-white treatment allowed for archival shots.",
    components: ["Numbered chapter headers", "Drop cap", "Dotted-leader price list in two columns", "Asymmetric photo collage with captions", "Hairline rules", "Pull quote (only the site's own words)"],
    motion: "Restrained and typographic: lines of the masthead slide up from a mask, rules draw in from left, images unveil with a clip-path wipe, nothing bounces. 400–700ms, ease-out.",
    threeD: "none",
    conversion: "A clear 'Reserve' / 'Order' text link in the header and a practical sidebar box repeated before the footer.",
    avoid: ["Round cut-out plates", "Dark-everywhere backgrounds", "Card grids", "Glassmorphism"],
  },
  {
    id: "swiss-precision",
    name: "Swiss Precision",
    concept: "International Typographic Style: a strict grid, one confident grotesk, large numerals, ruled tables and a single signal colour. Clarity is the luxury.",
    primary: ["accounting", "import_export", "services"], secondary: ["healthcare", "retail"],
    wantsPhotos: "few", likesPriceLists: true,
    hero: "Typographic hero: one statement from the site set very large and left-aligned over 8 of 12 columns, a ruled key-facts column on the right (location, hours, phone, services count as real facts), no photo or a single small one.",
    sequence: ["Typographic hero with key-facts column", "Services as a numbered ruled index (01–0n) that expands into detail", "Process or approach from the site's own text as numbered steps", "Facts table (only facts from the site)", "Contact block as a 3-column ruled grid", "Footer with the full sitemap in columns"],
    grid: "Visible 12-column logic, 8px baseline, hard left alignment, hairline 1px rules, generous margins; no rounded corners.",
    typeScale: "Display 4.5–8rem, weight 500–600, tracking −0.03em; body 17px/1.6; tabular numerals for prices and numbers.",
    fonts: [
      F("Inter Tight", "Inter", "family=Inter+Tight:wght@500;600;700&family=Inter:wght@400;500", "Neutral, precise grotesk."),
      F("Instrument Sans", "Instrument Sans", "family=Instrument+Sans:wdth,wght@75..100,400..700", "Contemporary grotesk with a condensed width for display."),
      F("Space Grotesk", "IBM Plex Sans", "family=Space+Grotesk:wght@500;700&family=IBM+Plex+Sans:wght@400;500", "Technical character."),
    ],
    palettes: [
      P("Paper & Signal Red", false, "#f5f5f2", "#ffffff", "#111111", "#5a5a5a", "#e3271b", "#ffffff", "#d8d8d2"),
      P("White & Cobalt", false, "#ffffff", "#f1f3f6", "#0b1220", "#4e586a", "#1f4fe0", "#ffffff", "#dfe4ec"),
      P("Graphite & Lime", true, "#121314", "#1b1c1e", "#f2f2ef", "#9a9c9f", "#c6f432", "#121314", "#2c2e31"),
    ],
    imagery: "Few, carefully cropped photos (duotone or desaturated allowed); diagrams and numbers do the work.",
    components: ["Numbered ruled index", "Key-facts column", "Tabular price/fee table", "Accordion service details", "Big numerals"],
    motion: "Precise and quick: rules draw in, numbers tick up only when the number is in the site's text, rows reveal in a 40ms stagger, accordions spring open. 250–450ms.",
    threeD: "none",
    conversion: "A persistent 'Book a consultation' / 'Request a quote' button in the header plus a ruled contact grid; phone as a tel: link.",
    avoid: ["Decorative gradients", "Rounded cards", "Stock photos of handshakes", "Script fonts"],
  },
  {
    id: "warm-neighbourhood",
    name: "Warm Neighbourhood",
    concept: "The friendly local spot: sunny colours, rounded shapes, hand-drawn underlines and sticker badges, photos in soft frames. Approachable and human, never childish.",
    primary: ["cafe", "retail", "services"], secondary: ["restaurant", "gym", "salon"],
    wantsPhotos: "some", likesPriceLists: true,
    hero: "Centered hero on a warm colour field: a friendly headline from the site with one word underlined by a hand-drawn SVG stroke, a cluster of 2–3 tilted photos in rounded frames, and a round sticker badge with a real fact (opening hours or neighbourhood).",
    sequence: ["Friendly hero with tilted photo cluster", "What we do as 3–4 rounded tiles with line icons", "Menu / products as tabbed categories", "Story with a large photo and a wavy divider", "Photo marquee of the business's own images", "Visit us: map link, hours and phone in a big rounded card", "Cheerful footer"],
    grid: "Fluid 1180px container, rounded 24–32px radii, wavy SVG section dividers, generous padding.",
    typeScale: "Display 3.5–6rem, rounded heavy weight; body 17px/1.7; handwritten accent font only for 1–3 short labels.",
    fonts: [
      F("Bricolage Grotesque", "Nunito Sans", "family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,800&family=Nunito+Sans:opsz,wght@6..12,400;6..12,600", "Warm, quirky grotesk."),
      F("Young Serif", "Figtree", "family=Young+Serif&family=Figtree:wght@400;600", "Soft serif with a friendly sans."),
      F("Fredoka", "Outfit", "family=Fredoka:wght@500;700&family=Outfit:wght@400;500", "Rounded and approachable."),
    ],
    palettes: [
      P("Butter & Tomato", false, "#fff6e3", "#ffffff", "#2b1d12", "#6e5a47", "#e2552c", "#ffffff", "#ffd36b"),
      P("Mint & Cocoa", false, "#eef7f1", "#ffffff", "#2a1f1a", "#5d6b62", "#2e8b57", "#ffffff", "#f6c4a8"),
      P("Peach & Plum", false, "#fff0ea", "#ffffff", "#2d1830", "#6d5670", "#8d3b72", "#ffffff", "#ffb48f"),
    ],
    imagery: "The business's own candid photos in rounded frames with slight rotation; people, counters, products.",
    components: ["Hand-drawn SVG underline", "Sticker badge (real facts only)", "Tilted photo cluster", "Tabbed menu", "Wavy dividers", "Photo marquee"],
    motion: "Playful but calm springs: photos settle into their tilt, the underline draws itself, tiles lift on hover, stickers rotate slowly. Spring stiffness ~200, damping ~20.",
    threeD: "none",
    conversion: "Big rounded 'Call us' / 'Order' buttons; on phones a sticky bottom bar with Call and Directions.",
    avoid: ["Dark luxury palettes", "Thin hairline serif", "Corporate stock photos"],
  },
  {
    id: "clinical-calm",
    name: "Clinical Calm",
    concept: "Reassurance through clarity: airy light layouts, soft tints, large readable type, clear journeys (what we treat → how it works → book) and trust built only from real facts.",
    primary: ["healthcare"], secondary: ["accounting", "salon", "services"],
    wantsPhotos: "some", likesPriceLists: false,
    hero: "Split hero on a soft tint: a plain-language promise from the site, two buttons (book / call) and real practical facts (hours, address) as chips; on the right a calm photo in a large soft-cornered frame with a small card overlapping it showing the opening hours.",
    sequence: ["Calm split hero with practical chips", "Quick paths: 3–6 large tappable tiles to the main treatments/services pages", "Treatments with short descriptions and 'learn more' links", "How a visit works as numbered steps (only if the site describes it)", "Team (only people named on the site)", "Practical information: hours table, address with map link, insurance/payment notes from the site", "FAQ accordion from the site's own Q&A", "Footer with emergency info if the site lists it"],
    grid: "1160px container, 12-column with 24px gutters, 16–20px radii, lots of white space; content width capped at 68ch for reading.",
    typeScale: "Display 3–5rem, weight 600; body 18px/1.7 (never below 16px); strong heading hierarchy for scanning.",
    fonts: [
      F("Plus Jakarta Sans", "Plus Jakarta Sans", "family=Plus+Jakarta+Sans:wght@400;500;600;700", "Clear, friendly, accessible."),
      F("Manrope", "Source Sans 3", "family=Manrope:wght@500;700&family=Source+Sans+3:wght@400;600", "Calm geometric with a highly legible text face."),
      F("Lexend", "Lexend", "family=Lexend:wght@300;400;600", "Designed for reading proficiency."),
    ],
    palettes: [
      P("Teal Clinic", false, "#f4f8f9", "#ffffff", "#0f2537", "#4d6475", "#0f7a8a", "#ffffff", "#d6ecef"),
      P("Soft Blue", false, "#f5f7fc", "#ffffff", "#13203b", "#55617a", "#2457c5", "#ffffff", "#dfe7fa"),
      P("Sage Care", false, "#f5f8f4", "#ffffff", "#1c2a22", "#566459", "#2f7d5b", "#ffffff", "#dcebdf"),
    ],
    imagery: "Bright, real practice photos; people and spaces; avoid scary clinical close-ups and generic stock smiles.",
    components: ["Practical chips", "Quick-path tiles", "Numbered steps", "Hours table", "FAQ accordion", "Sticky mobile Book / Call bar"],
    motion: "Gentle and short: fades and 12px rises, 300–400ms, no parallax on text, no looping animation. Reduced motion = no movement at all.",
    threeD: "none",
    conversion: "Book / call above the fold, repeated after treatments, and a sticky Call button on phones (tel: link from the site).",
    avoid: ["Dark backgrounds", "Dramatic motion", "Tiny grey text", "Invented credentials or ratings"],
  },
  {
    id: "bold-kinetic",
    name: "Bold Kinetic",
    concept: "Energy and confidence: condensed oversized type, a high-voltage accent, diagonal cuts, marquees and scroll-driven motion that feels like a training session or a street-wear drop.",
    primary: ["gym", "clothing"], secondary: ["services", "retail"],
    wantsPhotos: "some", likesPriceLists: true,
    hero: "Full-bleed photo with a strong dark duotone; a giant condensed headline that overflows the width in 2–3 stacked lines, one line knocked out in the accent colour; a marquee band of the site's own keywords (classes, programmes) running underneath.",
    sequence: ["Full-bleed kinetic hero", "Marquee band of real offerings", "Programmes / collection as large numbered panels that pin and swap on scroll", "Schedule or prices table (from the site)", "Photo grid with diagonal crops", "Membership / visit CTA in a full-width accent block", "Heavy footer with oversized wordmark"],
    grid: "Edge-to-edge sections, angled clip-path dividers (4–6°), tight 8px gaps in image grids, oversized type breaking containers.",
    typeScale: "Display 8–16rem condensed, uppercase, weight 800–900; body 16px/1.6.",
    fonts: [
      F("Anton", "Inter", "family=Anton&family=Inter:wght@400;600", "Tall, punchy condensed."),
      F("Archivo", "Archivo", "family=Archivo:wdth,wght@62..125,400..900", "Variable width: use the condensed axis for display."),
      F("Big Shoulders Display", "Barlow", "family=Big+Shoulders+Display:wght@700;900&family=Barlow:wght@400;600", "Industrial condensed."),
    ],
    palettes: [
      P("Blackout & Volt", true, "#0b0b0c", "#161618", "#f4f4f1", "#a1a1a6", "#d7ff3a", "#0b0b0c", "#2a2a2d"),
      P("Concrete & Orange", true, "#121314", "#1d1f21", "#f2f2ef", "#9b9fa8", "#ff5b1f", "#120600", "#2b2e33"),
      P("Chalk & Red", false, "#f1f0ec", "#ffffff", "#0f0f0f", "#55555a", "#e5241b", "#ffffff", "#d9d7d0"),
    ],
    imagery: "High-contrast action photos, dramatic light, grain; duotone in the accent colour for consistency.",
    components: ["Overflowing condensed headline", "Keyword marquee", "Pinned swapping panels", "Angled dividers", "Velocity-skewed images", "Oversized footer wordmark"],
    motion: "Fast and physical: headline lines slam in with a short overshoot, marquee speed follows scroll velocity (springValue), panels pin and crossfade, images skew slightly with velocity. Keep it under 600ms per move.",
    threeD: "optional",
    threeDIdea: "A slowly rotating low-poly kettlebell or product silhouette in the hero (Three.js, flat-shaded in the accent colour), only on desktop and only if it reads instantly.",
    conversion: "'Start / Join / Shop' in the accent colour everywhere it matters; trial or visit details in the CTA block.",
    avoid: ["Serif body text", "Pastel palettes", "Gentle fades only"],
  },
  {
    id: "luxe-minimal",
    name: "Luxe Minimal",
    concept: "Quiet luxury: ivory and ink, a fine serif, vast white space, full-bleed photography and almost nothing else. Every element is placed, nothing is filler.",
    primary: ["salon", "clothing"], secondary: ["restaurant", "retail", "healthcare"],
    wantsPhotos: "many", likesPriceLists: true,
    hero: "A single full-bleed photograph (100svh) with the business name in a fine serif, small, centred low on the image; a one-line caption and a thin text link. Nothing else on the first screen.",
    sequence: ["Full-bleed quiet hero", "A short statement from the site centred in a wide field of white", "Alternating full-bleed image and narrow text column", "Services / collection as an elegant list with prices aligned right in small caps", "A horizontal gallery of the business's own photos", "Appointment / visit details in a centred block", "Minimal footer"],
    grid: "Narrow text measure (40–55ch) in wide margins; images full-bleed or on a 6-column offset; spacing in large steps (160–240px).",
    typeScale: "Display 3–6rem light (300) with generous tracking for small caps; body 16px/1.8; letter-spaced uppercase labels at 11–12px.",
    fonts: [
      F("Cormorant", "Jost", "family=Cormorant:ital,wght@0,300;0,500;1,300&family=Jost:wght@300;400", "Fine, high-fashion serif."),
      F("Italiana", "Manrope", "family=Italiana&family=Manrope:wght@300;400;500", "Elegant display caps."),
      F("Bodoni Moda", "Karla", "family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;1,6..96,400&family=Karla:wght@300;400", "Didone luxury."),
    ],
    palettes: [
      P("Ivory & Ink", false, "#f7f3ec", "#fffdf8", "#1a1814", "#6f685d", "#1a1814", "#f7f3ec", "#cdbfa8"),
      P("Bone & Bronze", false, "#efe9df", "#f8f4ec", "#221d17", "#6c6255", "#8a6a3f", "#ffffff", "#d6c7ae"),
      P("Noir & Pearl", true, "#0f0f0f", "#181818", "#efece6", "#9b968d", "#e9e2d4", "#0f0f0f", "#2a2a2a"),
    ],
    imagery: "Large, consistent, editorial photos; warm natural light; avoid busy collages.",
    components: ["Full-bleed hero", "Narrow statement block", "Right-aligned small-caps price list", "Horizontal gallery (scroll-driven, native scroll)", "Thin underline links"],
    motion: "Slow and silky: 900–1400ms fades, images scale from 1.06 to 1 as they enter, text fades with a 6px rise, no bounce, no stagger longer than 120ms.",
    threeD: "none",
    conversion: "Understated but always visible 'Book an appointment' link in the header; a full-width booking block near the end.",
    avoid: ["Bright accent buttons", "Icons", "Card grids", "Busy motion"],
  },
  {
    id: "craft-heritage",
    name: "Craft & Heritage",
    concept: "Made by hand, here, for years: textured paper, slab and old-style serifs, ledger-style price lists, stamp-like badges and honest photography of the work.",
    primary: ["restaurant", "retail", "import_export"], secondary: ["cafe", "services", "clothing"],
    wantsPhotos: "some", likesPriceLists: true,
    hero: "A framed hero like a shop sign: the business name in a slab or old-style serif inside a double-ruled border, a stamp badge with a real fact (city, or the founding year only if stated), and a large photo of the craft beneath with a torn/deckled edge mask.",
    sequence: ["Sign-like framed hero", "Our craft: the site's story with a photo of hands at work", "Ledger price list / product catalogue with ruled lines and categories", "Process in 3–4 illustrated steps (only steps the site describes)", "Photo wall of the business's own images", "Find us: address card like a postcard", "Footer with a stamp wordmark"],
    grid: "1140px container with framed panels, double rules, subtle paper texture via CSS gradients (no image files), 4px radii.",
    typeScale: "Display 3.5–6.5rem slab or old-style serif; body 17px/1.7 serif; small caps for categories.",
    fonts: [
      F("Zilla Slab", "Libre Franklin", "family=Zilla+Slab:wght@500;700&family=Libre+Franklin:wght@400;500", "Sturdy slab with a classic sans."),
      F("Rokkitt", "Lora", "family=Rokkitt:wght@500;800&family=Lora:ital,wght@0,400;0,500;1,400", "Printed-matter feel."),
      F("Abril Fatface", "Crimson Pro", "family=Abril+Fatface&family=Crimson+Pro:wght@400;500", "Poster heritage."),
    ],
    palettes: [
      P("Kraft & Forest", false, "#efe6d4", "#f8f2e6", "#23251c", "#5f5a49", "#2f5d3a", "#ffffff", "#c9b48d"),
      P("Parchment & Oxblood", false, "#f3ead9", "#fbf6ec", "#2a1a14", "#6a5547", "#7b2121", "#ffffff", "#d7c09a"),
      P("Workshop Navy", true, "#16202b", "#1f2b38", "#f1e9da", "#a9a291", "#d9a441", "#16202b", "#2c3a49"),
    ],
    imagery: "Honest photos of the product and the people who make it; warm tones; slight grain allowed.",
    components: ["Double-ruled frames", "Stamp badge (real facts only)", "Ledger price list", "Deckled-edge image mask", "Postcard address card"],
    motion: "Tactile: stamps press in (scale 1.15→1 with a tiny rotation), ledger rows write in from left, photos settle like placed prints. 350–600ms.",
    threeD: "none",
    conversion: "'Visit the shop' / 'Order' buttons styled as labels; phone and address always one tap away.",
    avoid: ["Neon accents", "Glassmorphism", "Futuristic sans"],
  },
  {
    id: "global-trade-3d",
    name: "Global Trade",
    concept: "A business that moves goods across borders: deep ocean tones, a live 3D globe with the routes and regions the site mentions, crisp data-like layout and mono labels.",
    primary: ["import_export"], secondary: ["services", "accounting"],
    wantsPhotos: "few", likesPriceLists: false,
    hero: "Dark hero with an interactive Three.js globe on the right (dots for landmasses, arcs for routes between places named on the site, slow auto-rotate, drag to turn) and on the left a statement from the site plus a 'Request a quote' button and real facts in mono labels.",
    sequence: ["Globe hero", "Capabilities as a ruled grid with line icons", "Products / markets as filterable chips or tabs (from the site)", "How shipping works as a horizontal timeline (only if described)", "Photo band of ports, warehouses or the products", "Enquiry block with all contact details", "Footer with offices"],
    grid: "1200px container, 12 columns, 1px rules in 10% white, mono labels, 12px radii only on interactive elements.",
    typeScale: "Display 3.5–6rem, weight 600, tight tracking; mono labels 12px uppercase; body 16.5px/1.65.",
    fonts: [
      F("Sora", "Inter Tight", "family=Sora:wght@500;700&family=Inter+Tight:wght@400;500", "Technical geometric."),
      F("Space Grotesk", "Space Mono", "family=Space+Grotesk:wght@500;700&family=Space+Mono:wght@400", "Logistic, data-like."),
      F("Manrope", "JetBrains Mono", "family=Manrope:wght@500;700&family=JetBrains+Mono:wght@400", "Clean with mono details."),
    ],
    palettes: [
      P("Deep Ocean", true, "#07131f", "#0d1f31", "#e8f0f7", "#8ea3b8", "#3fb0f0", "#04121f", "#123049"),
      P("Harbour Night", true, "#0b1418", "#132227", "#ecf2f1", "#93aaa8", "#2ed3a6", "#04140f", "#1c3238"),
      P("Container Orange", false, "#f3f5f7", "#ffffff", "#0d1b2a", "#526173", "#e8630a", "#ffffff", "#dde3ea"),
    ],
    imagery: "Ports, containers, warehouses and the actual products; desaturated with an accent-coloured overlay for consistency.",
    components: ["Three.js globe with route arcs", "Mono labels", "Ruled capability grid", "Product tabs", "Horizontal timeline"],
    motion: "Measured: the globe fades in and starts rotating, arcs draw along their path, grid cells reveal in a stagger, numbers tick only if in the text.",
    threeD: "feature",
    threeDIdea: "Three.js globe (points sphere from a lat/lon grid, no external textures) with arcs between the business's city and places named on the site; lazy-init via IntersectionObserver; static SVG fallback when WebGL or motion is unavailable.",
    conversion: "'Request a quote' in the hero, header and enquiry block; email and phone as links.",
    avoid: ["Clip-art ships", "Generic stock handshakes", "Invented trade volumes or countries"],
  },
  {
    id: "bento-modern",
    name: "Bento Modern",
    concept: "A contemporary product-company feel for a local business: a bento grid of real content tiles of different sizes, crisp sans, soft depth, interactive tiles that reward hovering, and one tasteful 3D or tilt moment.",
    primary: ["services", "retail", "accounting"], secondary: ["gym", "healthcare", "import_export"],
    wantsPhotos: "some", likesPriceLists: false,
    hero: "Headline and two buttons left; on the right a bento cluster of 4–5 tiles (a photo, the opening hours, the phone number, a service list, a location tile) with slight perspective tilt that straightens on scroll.",
    sequence: ["Bento hero", "Services as a bento grid (one large feature tile, smaller tiles around)", "Before/after or project gallery (only real images)", "How it works in 3 cards (from the site)", "Prices / packages table when the site lists them", "FAQ from the site", "Contact bento: map link, phone, email, hours", "Footer"],
    grid: "1200px container, CSS grid with 12 columns and dense auto-placement, 20px gaps, 20–28px radii, soft 1px borders and subtle shadows.",
    typeScale: "Display 3.5–6rem weight 600, tracking −0.035em; body 16px/1.6; tile titles 1.25rem.",
    fonts: [
      F("Onest", "Onest", "family=Onest:wght@400;500;700", "Modern neo-grotesk."),
      F("Outfit", "Inter", "family=Outfit:wght@500;700&family=Inter:wght@400;500", "Friendly geometric with Inter."),
      F("Hanken Grotesk", "Hanken Grotesk", "family=Hanken+Grotesk:wght@400;500;700", "Clean grotesk."),
    ],
    palettes: [
      P("Cloud & Indigo", false, "#f6f7fb", "#ffffff", "#0e1222", "#596079", "#4f46e5", "#ffffff", "#e6e8f4"),
      P("Stone & Emerald", false, "#f5f5f1", "#ffffff", "#121612", "#5b6159", "#0f9d6b", "#ffffff", "#e3e6dd"),
      P("Night & Coral", true, "#0d0f14", "#161a22", "#eef0f5", "#959cad", "#ff6f59", "#160604", "#232836"),
    ],
    imagery: "The business's own photos cropped tightly into tiles; product shots on clean backgrounds.",
    components: ["Bento grid", "Tilt / spotlight tiles (UI kit)", "Perspective hero cluster", "Pricing table", "FAQ accordion"],
    motion: "Responsive and springy: tiles enter in a grid stagger, tilt follows the pointer (fine pointers only), the hero cluster flattens with scroll progress, buttons get a subtle shimmer.",
    threeD: "optional",
    threeDIdea: "CSS 3D perspective on the hero bento cluster (no WebGL needed); optionally a small Three.js object representing the trade if it reads instantly.",
    conversion: "Primary CTA in the hero and in the contact bento; sticky header button.",
    avoid: ["Text-only boxes", "More than one accent colour", "Gradient blobs everywhere"],
  },
  {
    id: "organic-wellness",
    name: "Organic Wellness",
    concept: "Breathing room: earthy greens and clay, soft organic blob masks on photos, generous curves, gentle breathing motion. Calm, natural, restorative.",
    primary: ["salon"], secondary: ["healthcare", "gym", "cafe", "retail"],
    wantsPhotos: "some", likesPriceLists: true,
    hero: "Asymmetric hero: headline with an italic word, a calm paragraph and a booking button on the left; on the right a large photo inside an organic blob mask that slowly morphs, with a small leaf-line illustration in SVG.",
    sequence: ["Organic hero", "Philosophy / story from the site in a centred calm block", "Treatments or classes as soft cards with durations and prices (from the site)", "A slow full-width photo band with one line of text", "Practical details (hours, address, booking) in a rounded panel", "Gallery in blob masks", "Soft footer"],
    grid: "1140px container, curved section edges (SVG), 28–40px radii, generous padding, asymmetric image placement.",
    typeScale: "Display 3.5–6rem, serif with italic accents; body 17px/1.75.",
    fonts: [
      F("Gloock", "Hanken Grotesk", "family=Gloock&family=Hanken+Grotesk:wght@300;400;500", "Expressive serif with a calm grotesk."),
      F("Lora", "Nunito Sans", "family=Lora:ital,wght@0,500;1,500&family=Nunito+Sans:opsz,wght@6..12,300;6..12,400", "Soft, organic."),
      F("Marcellus", "Mulish", "family=Marcellus&family=Mulish:wght@300;400", "Classical calm."),
    ],
    palettes: [
      P("Sage & Clay", false, "#f3f1ea", "#fbfaf6", "#26302a", "#5f6a62", "#a4593a", "#ffffff", "#c9d6c3"),
      P("Moss & Sand", false, "#efede4", "#f8f7f1", "#1f2a20", "#5a6458", "#4c6b3c", "#ffffff", "#e3d5b8"),
      P("Dusk Lavender", false, "#f4f1f5", "#fcfbfd", "#2a2430", "#655c6c", "#7a5c8e", "#ffffff", "#e3d7ea"),
    ],
    imagery: "Natural light, plants, textures, hands, calm interiors.",
    components: ["Morphing blob mask", "Curved section edges", "Soft treatment cards", "Line-art SVG accents"],
    motion: "Breathing: blob masks morph over 8–12s loops (paused for reduced motion), elements fade up slowly (700ms), no snapping.",
    threeD: "none",
    conversion: "Calm but clear 'Book' button repeated after treatments and in a sticky mobile bar.",
    avoid: ["Hard edges everywhere", "Neon", "Aggressive urgency"],
  },
  {
    id: "immersive-showcase",
    name: "Immersive Showcase",
    concept: "Let the work speak: full-screen photography, scroll-driven chapters with sticky captions, a horizontal gallery and an image-led narrative. For businesses with strong visual material.",
    primary: ["restaurant", "clothing", "services"], secondary: ["salon", "gym", "retail", "cafe"],
    wantsPhotos: "many", likesPriceLists: false,
    hero: "Scroll-expanding media: a centred framed photo that grows to full screen as you scroll (UI kit scroll media expansion), with the business name splitting to either side.",
    sequence: ["Scroll-expanding hero", "Chapters: 3–4 full-screen photo sections with sticky captions carrying the site's text", "Horizontal gallery of the business's own photos (native scroll, scroll-linked translate)", "Offer / menu summary in a clean two-column list", "Visit / book over a full-bleed photo", "Footer"],
    grid: "Full-bleed sections; captions in a 5-column sticky column; gallery cards at 60vw on desktop, 85vw on phones.",
    typeScale: "Display 4–9rem; captions 1.25rem; body 17px/1.7.",
    fonts: [
      F("Syne", "Inter", "family=Syne:wght@600;800&family=Inter:wght@400;500", "Expressive wide display."),
      F("Unbounded", "Manrope", "family=Unbounded:wght@500;700&family=Manrope:wght@400;500", "Wide, contemporary."),
      F("Playfair Display", "Inter", "family=Playfair+Display:ital,wght@0,600;1,500&family=Inter:wght@400;500", "Classic contrast."),
    ],
    palettes: [
      P("Gallery Black", true, "#0a0a0a", "#141414", "#f2f0eb", "#9d9a93", "#f0c35a", "#0a0a0a", "#262626"),
      P("Gallery White", false, "#fafaf8", "#ffffff", "#111111", "#5e5e5e", "#111111", "#fafaf8", "#e7e5e0"),
      P("Deep Teal", true, "#0b1a1c", "#122629", "#eef3f2", "#93a8a6", "#f2a65a", "#0b1a1c", "#1d3438"),
    ],
    imagery: "The business's own best photos at full size; only use stock where the site has none and keep it consistent.",
    components: ["Scroll media expansion (UI kit)", "Sticky captions", "Scroll-linked horizontal gallery", "Full-bleed CTA"],
    motion: "Scroll-driven: media expands with scroll progress, captions crossfade at chapter boundaries, the gallery translates with scroll. Native scrolling only; transforms and opacity only.",
    threeD: "optional",
    threeDIdea: "A subtle WebGL (Three.js) image-plane ripple on the hero photo that follows the pointer on desktop; off on touch and for reduced motion.",
    conversion: "A fixed small 'Book / Visit' pill bottom-right after the hero.",
    avoid: ["Using it when the site has fewer than 5 usable photos", "Text over busy image areas without a scrim"],
  },
];

export function directionById(id: string | null | undefined): CreativeDirection | undefined {
  return id ? DIRECTIONS.find((d) => d.id === id) : undefined;
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
  const scored = DIRECTIONS.map((d) => ({ d, score: scoreDirection(d, signals, recent, seed) }));
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
 * The palette for a direction: the option matching the brand's light/dark mode, its accent replaced by the brand's
 * own colour when it has a usable one, and every pair adjusted to pass contrast (text 7:1, muted 4.5:1, accent 3:1).
 */
export function paletteFor(d: CreativeDirection, brand?: BrandSignals | null, seed = ""): Palette & { fromBrand: boolean } {
  const bgRgb = brand?.background ? parseColor(brand.background) : null;
  const brandDark = bgRgb ? luminance(bgRgb) < 0.2 : null;
  const options = brandDark === null ? d.palettes : d.palettes.filter((p) => p.dark === brandDark);
  const list = options.length ? options : d.palettes;
  const base = list[hash(seed + d.id) % list.length];
  const accent = brandAccent(brand);
  const p: Palette = { ...base };
  if (accent) p.accent = accent;
  p.text = ensureContrast(p.text, p.bg, 7);
  p.muted = ensureContrast(p.muted, p.bg, 4.5);
  p.accent = ensureContrast(p.accent, p.bg, 3);
  p.onAccent = contrast("#ffffff", p.accent) >= contrast("#111111", p.accent) ? "#ffffff" : "#111111";
  return { ...p, name: accent ? `${base.name}, brand accent ${accent}` : base.name, fromBrand: !!accent };
}

export function fontsFor(d: CreativeDirection, seed = "", recentFonts: string[] = []): FontPairing {
  const fresh = d.fonts.filter((f) => !recentFonts.includes(f.display));
  const list = fresh.length ? fresh : d.fonts;
  return list[hash(seed + "fonts") % list.length];
}

/** The full creative brief for one job: the direction plus the palette and fonts chosen for this business. */
export function creativeBrief(d: CreativeDirection, opts: { brand?: BrandSignals | null; seed?: string; recentFonts?: string[] } = {}) {
  const palette = paletteFor(d, opts.brand, opts.seed);
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
