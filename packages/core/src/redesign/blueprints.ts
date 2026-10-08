/**
 * Scene blueprints: the storyboard each redesign is built around. A blueprint names one signature 3D moment
 * (an object and how the scroll moves it), the beats of the home page, and the motion recipes to use.
 *
 * They follow the 3D scroll sites shown in the design-showcase reels the studio collects: one hero object that the
 * scroll pulls apart, spins on a turntable between giant type, or orbits, with captions arriving one beat at a
 * time. The template engine renders the object and the motion; Claude redesigns get the whole blueprint in
 * content.json and build it with the website-redesign skill. The catalogue in the skill
 * (references/blueprints.md) is generated from this file: `npm run skill:catalog`.
 */
import type { CategoryId } from "../types";
import type { ObjectKind } from "./themes";

/** How the home-page chapter moves the object as you scroll. */
export type ChapterMotion = "explode" | "stack" | "orbit" | "turntable";

export interface Blueprint {
  id: string;
  name: string;
  categories: CategoryId[];
  /** Words in the business name or content that make this blueprint the natural choice (pizza, burger…). */
  keywords: string[];
  object: ObjectKind;
  motion: ChapterMotion;
  /** The one moment visitors remember. */
  signature: string;
  /** Home-page storyboard: 4–6 beats, each with its motion. Content always comes from the site. */
  beats: string[];
  /** Recipe numbers in the skill's references/motion-recipes.md. */
  recipes: number[];
}

const B = (
  id: string, name: string, categories: CategoryId[], keywords: string[], object: ObjectKind, motion: ChapterMotion,
  signature: string, beats: string[], recipes: number[],
): Blueprint => ({ id, name, categories, keywords, object, motion, signature, beats, recipes });

export const BLUEPRINTS: Blueprint[] = [
  // Restaurants
  B("burger-stack", "Exploded burger", ["restaurant", "cafe"], ["burger", "smash", "grill", "diner", "bbq", "barbecue", "fries", "hot dog", "street food"], "burger", "stack",
    "A burger rises into view, then every layer lifts apart (bun, cheese, patty, lettuce, tomato) as captions name what makes the food theirs, and snaps back together.",
    ["Hook: name in huge type, the burger drops in and settles", "Pinned stack: layers separate one by one, a caption per layer from the menu", "Menu: priced list with category tabs, items rise in", "Story: about text in blur-to-sharp words", "Visit: hours, map, call button"],
    [2, 16, 3, 4, 15]),
  B("pizza-pull", "Slice pull", ["restaurant", "cafe"], ["pizza", "pizzeria", "napoli", "napoletana", "forno", "wood fired", "wood-fired", "slice", "calzone"], "pizza", "explode",
    "A whole pizza turns under warm light, then the slices pull away from the centre as the menu headings appear, and close up again.",
    ["Hook: pizza spins in from above, title rises from a mask", "Pull: slices draw outward in a pinned chapter, captions from the menu", "Menu: two-column priced list, image mask reveals", "Oven/story: pull quote from the about text", "Visit: hours card, map, booking button"],
    [2, 7, 5, 4, 15]),
  B("cellar-orbit", "Cellar orbit", ["restaurant", "cafe"], ["wine", "bar", "bistro", "trattoria", "osteria", "cocktail", "tapas", "brasserie", "enoteca", "pub"], "glass", "orbit",
    "The camera circles a glass of wine in a dark room while the venue's own words sharpen from blur.",
    ["Hook: cinematic dark hero, slow photo zoom", "Orbit: camera circles the glass, three captions", "Menu or wine list with thin rules", "Gallery: pinned horizontal sequence of their photos", "Reserve: hours and map"],
    [2, 7, 8, 6, 4]),
  B("brass-rings", "Brass rings", ["restaurant"], [], "rings", "orbit",
    "Brass rings turn around a pearl like a table setting seen from above; the camera drifts around them through three captions.",
    ["Hook: editorial headline and photo", "Orbit chapter with brass rings", "Menu as an editorial list", "Story with image mask reveals", "Visit"],
    [2, 7, 8, 5, 3]),
  B("candle-turntable", "Candlelit turntable", ["restaurant", "cafe"], ["restaurant", "kitchen", "cuisine", "dining"], "rings", "turntable",
    "The business name is split in giant type with the object turning slowly between the halves, like a product launch.",
    ["Hook: type-sandwich hero, object between the halves of the name", "Specs strip: hours, location, call, small labels", "Menu reveal one category at a time", "Photo gallery with parallax", "Visit"],
    [2, 17, 3, 5, 15]),

  // Cafés
  B("steam-cup", "Steam rising", ["cafe"], ["coffee", "espresso", "café", "cafe", "roast", "latte", "tea"], "cup", "explode",
    "A cup on its saucer with beans around it; on scroll the beans scatter and steam particles rise while the headline sharpens.",
    ["Hook: warm hero, headline sharpens from blur", "Cup chapter: beans scatter, steam rises, three captions", "Drinks board as a priced list", "Pastry or space gallery", "Visit with hours"],
    [2, 7, 9, 4, 5]),
  B("bean-orbit", "Bean orbit", ["cafe"], ["beans", "roastery", "brew", "barista"], "cup", "orbit",
    "The camera orbits the cup while beans circle it like planets.",
    ["Hook", "Orbit chapter", "Menu list", "Story in blur-to-sharp words", "Visit"],
    [2, 7, 8, 4]),
  B("bakery-turntable", "Bakery turntable", ["cafe", "retail"], ["bakery", "pastry", "patisserie", "croissant", "bread", "cake", "donut", "dessert", "ice cream", "gelato"], "cup", "turntable",
    "The name in huge type with the cup turning between the halves, captions at the corners like a product spec sheet.",
    ["Hook: type sandwich", "Specs strip", "Menu tiles that lift on hover", "Gallery with mask reveals", "Visit"],
    [2, 17, 5, 15]),

  // Gyms
  B("kinetic-iron", "Kinetic iron", ["gym"], ["gym", "fitness", "training", "strength"], "dumbbell", "explode",
    "Letters slam into place, then a chrome dumbbell bursts apart and reassembles as the classes appear.",
    ["Hook: kinetic headline, letters slam in", "Dumbbell chapter: plates burst apart", "Timetable or classes list", "Trainers grid", "Join: membership list and call button"],
    [11, 7, 13, 3, 14]),
  B("plate-slide", "Plate slide", ["gym"], ["powerlifting", "weightlifting", "barbell", "lifting"], "dumbbell", "stack",
    "The plates slide out along the bar one by one as you scroll, each carrying a caption, then lock back on.",
    ["Hook: bold poster type", "Plate slide chapter", "Velocity marquee of class names", "Membership list", "Visit"],
    [11, 16, 13, 3]),
  B("kettlebell-turntable", "Kettlebell launch", ["gym"], ["crossfit", "kettlebell", "functional", "bootcamp", "hiit"], "kettlebell", "turntable",
    "A kettlebell turns between the halves of the gym's name, like a sneaker launch page.",
    ["Hook: type sandwich with the kettlebell", "Specs strip: hours, location, call", "Classes revealed one at a time", "Velocity marquee", "Join"],
    [17, 11, 13, 15]),
  B("kettlebell-orbit", "Kettlebell orbit", ["gym"], ["yoga", "pilates", "boxing", "martial", "studio"], "kettlebell", "orbit",
    "The camera circles a kettlebell while particles gather into a ring.",
    ["Hook", "Orbit chapter", "Classes", "Coaches", "Join"],
    [2, 7, 9, 3]),

  // Salons
  B("facet-gem", "Facet light", ["salon", "retail", "services"], ["salon", "beauty", "nails", "lash", "brow", "jewel", "jewelry", "jewellery"], "gem", "orbit",
    "A faceted gem turns in soft light while services fade in from blur.",
    ["Hook: quiet luxury hero", "Gem orbit chapter", "Services and prices list", "Gallery of work", "Book"],
    [2, 7, 4, 6]),
  B("perfume-turntable", "Bottle launch", ["salon", "retail"], ["spa", "perfume", "fragrance", "cosmetic", "skincare", "skin", "aesthetic", "wellness", "massage"], "perfume", "turntable",
    "A glass bottle turns slowly between the halves of the name, spec-sheet captions at its sides.",
    ["Hook: type sandwich with the bottle", "Specs strip", "Treatments list one at a time", "Gallery", "Book"],
    [17, 4, 5, 15]),
  B("silk-ribbon", "Silk ribbon", ["salon", "clothing"], ["hair", "stylist", "barber", "silk", "bridal"], "ribbon", "orbit",
    "Silk ribbons flow and twist around the frame while the camera drifts; headings rise from masks.",
    ["Hook: editorial serif headline", "Ribbon orbit chapter", "Services list", "Team portraits", "Book"],
    [2, 7, 3, 5]),

  // Clothing
  B("type-sandwich", "Type sandwich", ["clothing", "retail"], ["boutique", "fashion", "collection", "apparel", "clothing", "wear"], "ribbon", "turntable",
    "The brand name split in giant type with flowing fabric turning between the halves, model-number style captions at the corners.",
    ["Hook: type sandwich", "Collection one at a time, product-launch reveals", "Lookbook as a pinned horizontal gallery", "Brand story", "Store"],
    [17, 6, 3, 5]),
  B("deconstructed", "Deconstructed", ["clothing", "services"], ["tailor", "bespoke", "suit", "atelier", "denim", "made to measure"], "ribbon", "explode",
    "Dark spotlit stage with fog: the piece comes apart into its panels as captions describe the craft, then reassembles.",
    ["Hook: dark spotlight hero, serif headline", "Deconstruct chapter: panels pull apart", "Craft story in blur-to-sharp words", "Collection grid", "Fitting / visit"],
    [18, 7, 4, 3]),
  B("lookbook-scenes", "Scene lookbook", ["clothing", "salon", "retail"], ["saree", "sari", "lehenga", "kurta", "ethnic", "textile", "fabric"], "ribbon", "stack",
    "Scenes like a film: a floating product card with fabric ribbons flowing around it, a scene counter, the next look sliding in on scroll.",
    ["Hook: layered photo cut-outs at different depths", "Scenes: a pinned card per look with ribbons, scene counter", "Collection grid", "Story", "Store"],
    [19, 20, 6, 5]),

  // Retail
  B("gift-turntable", "Gift box", ["retail"], ["gift", "shop", "store", "toys", "books", "flowers", "florist", "home"], "parcel", "turntable",
    "A wrapped box turns between the halves of the shop's name.",
    ["Hook: type sandwich", "Categories as tiles", "Featured items from the content", "Store hours", "Visit"],
    [17, 3, 5, 15]),
  B("unboxing", "Unboxing", ["retail", "import_export"], ["delivery", "online", "electronics", "hardware", "supply"], "parcel", "explode",
    "The box opens on scroll: lid lifts, sides fall away, ribbon unwraps.",
    ["Hook", "Unboxing chapter", "Categories", "Brands or products from the content", "Visit"],
    [2, 7, 3, 5]),

  // Healthcare
  B("capsule-calm", "Calm capsules", ["healthcare"], ["clinic", "medical", "health", "doctor", "pharmacy", "physio", "therapy"], "capsules", "explode",
    "Capsules and a cross float apart and reassemble, slowly, with plenty of air.",
    ["Hook: calm hero, soft photo", "Capsule chapter", "Services list", "First visit info", "Contact"],
    [2, 7, 3, 4]),
  B("capsule-orbit", "Care orbit", ["healthcare"], ["care", "family", "practice", "wellbeing"], "capsules", "orbit",
    "The camera circles the cross while capsules drift around it.",
    ["Hook", "Orbit chapter", "Services", "Team", "Contact"],
    [2, 7, 8, 3]),
  B("clean-turntable", "Clean turntable", ["healthcare"], ["dental", "dentist", "orthodont", "optician", "vision", "eye", "vet", "veterinary"], "capsules", "turntable",
    "The practice name in large, light type with the object turning between the halves; captions like spec labels.",
    ["Hook: type sandwich, light palette", "Specs strip: hours, call, location", "Treatments list", "Team", "Contact"],
    [17, 3, 15]),

  // Accounting
  B("coin-stack", "Rising stacks", ["accounting"], ["accounting", "accountant", "bookkeeping", "tax", "cpa"], "coins", "stack",
    "Coin stacks rise and separate layer by layer as services appear; real numbers from the content count up.",
    ["Hook: precise headline", "Stack chapter", "Services list", "Process timeline (only if sequential)", "Contact"],
    [2, 16, 3, 15]),
  B("ledger-orbit", "Ledger orbit", ["accounting", "services"], ["finance", "financial", "advisory", "wealth", "insurance", "audit"], "coins", "orbit",
    "The camera orbits coin stacks while thin lines draw across the page.",
    ["Hook", "Orbit chapter", "Services with SVG line drawing", "Credentials", "Contact"],
    [2, 7, 12, 3]),
  B("coin-turntable", "Coin launch", ["accounting"], ["payroll", "consult"], "coins", "turntable",
    "Giant split name with the coin stacks turning between the halves.",
    ["Hook: type sandwich", "Specs strip", "Services one at a time", "Contact"],
    [17, 3, 15]),

  // Import / export
  B("globe-routes", "Global routes", ["import_export"], ["export", "import", "trading", "global", "international"], "globe", "orbit",
    "The camera orbits a wire globe with containers circling it; route lines draw on scroll.",
    ["Hook", "Globe orbit chapter", "Services", "Sectors or countries (only from the content)", "Contact"],
    [2, 7, 12, 3]),
  B("container-stack", "Container stack", ["import_export", "services"], ["cargo", "freight", "container", "logistics", "shipping", "warehouse", "moving", "removals"], "parcel", "stack",
    "Stacked crates lift apart level by level like a port crane at work, each with a caption.",
    ["Hook: bold headline", "Stack chapter", "Services", "Process (only if sequential)", "Contact"],
    [11, 16, 3, 12]),
  B("globe-turntable", "Globe launch", ["import_export"], ["distribution", "wholesale", "sourcing"], "globe", "turntable",
    "The company name split in giant type with the globe turning between the halves.",
    ["Hook: type sandwich", "Specs strip", "Services", "Contact"],
    [17, 3, 12]),

  // Local services
  B("swiss-gem", "Swiss object", ["services"], ["law", "lawyer", "attorney", "notary", "architect", "studio", "agency", "real estate", "realty"], "gem", "turntable",
    "Strict Swiss grid with one precise object turning in the middle of the name.",
    ["Hook: type sandwich", "Services list", "Cases or portfolio from the content", "Contact"],
    [17, 3, 5]),
  B("tool-explode", "Tools apart", ["services"], ["plumb", "electric", "repair", "construction", "builder", "roof", "clean", "garage", "mechanic", "auto"], "parcel", "explode",
    "A toolbox-like stack of boxes pulls apart into its parts as the services appear.",
    ["Hook", "Explode chapter", "Services", "Area served (only from the content)", "Contact"],
    [2, 7, 3]),
  B("rings-orbit-services", "Quiet orbit", ["services"], ["photograph", "wedding", "event", "travel", "school", "tutor"], "rings", "orbit",
    "Rings turn slowly while the camera orbits, with a gallery of the business's photos after.",
    ["Hook", "Orbit chapter", "Gallery: pinned horizontal", "Services", "Contact"],
    [2, 7, 6, 3]),
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function blueprintById(id: string | undefined): Blueprint | undefined {
  return id ? BLUEPRINTS.find((b) => b.id === id) : undefined;
}

/**
 * Pick the blueprint for a site: the best keyword match among its category's blueprints (a pizzeria gets the
 * slice pull, a burger bar the exploded burger), otherwise a hash-random one, skipping the ones used recently.
 */
export function pickBlueprint(siteId: string, category: CategoryId, text: string, recentIds: string[] = []): Blueprint {
  const pool = BLUEPRINTS.filter((b) => b.categories.includes(category));
  const candidates = pool.length ? pool : BLUEPRINTS;
  const lower = text.toLowerCase();
  const has = (k: string) => new RegExp(`(^|[^a-z])${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(lower);
  const score = (b: Blueprint) => b.keywords.reduce((n, k) => n + (has(k) ? (k.length > 5 ? 2 : 1) : 0), 0);
  const recent = new Set(recentIds.slice(0, 3));
  const seed = hash(siteId);
  const ranked = candidates
    .map((b, i) => ({ b, s: score(b), r: (seed >>> (i % 24)) % 997 }))
    .sort((x, y) => y.s - x.s || x.r - y.r);
  const best = ranked[0];
  // A strong match (the business is literally a pizzeria) wins even if it was used recently.
  if (best.s >= 2) return best.b;
  return (ranked.find((x) => !recent.has(x.b.id)) ?? best).b;
}
