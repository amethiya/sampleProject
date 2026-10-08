/**
 * Layout templates: the page structure each redesign is built around, modelled on how good real-world websites in
 * each trade are laid out. Photography and typography carry the design; motion stays quiet (a gentle fade as
 * content appears). No 3D objects, particles, loaders or scroll effects.
 *
 * The template engine uses the hero layout and mood; Claude redesigns get the whole template in content.json and
 * build it with the website-redesign skill. The skill's catalogue (references/blueprints.md) is generated from this
 * file: `npm run skill:catalog`.
 */
import type { CategoryId } from "../types";
import type { HeroLayout } from "./styles";

/** Light or dark overall look; "any" lets the palette rotation decide. */
export type Mood = "light" | "dark" | "any";

export interface Blueprint {
  id: string;
  name: string;
  categories: CategoryId[];
  /** Words in the business name or content that make this template the natural choice (pizza, dental…). */
  keywords: string[];
  hero: HeroLayout;
  mood: Mood;
  /** The first impression: what the top of the home page shows. */
  signature: string;
  /** Home page, top to bottom. Every section is filled with the business's own content. */
  beats: string[];
  /** Pattern numbers in the skill's references/patterns.md. */
  patterns: number[];
}

const B = (
  id: string, name: string, categories: CategoryId[], keywords: string[], hero: HeroLayout, mood: Mood,
  signature: string, beats: string[], patterns: number[],
): Blueprint => ({ id, name, categories, keywords, hero, mood, signature, beats, patterns });

export const BLUEPRINTS: Blueprint[] = [
  // Restaurants
  B("chefs-table", "Chef's table", ["restaurant"], ["restaurant", "kitchen", "cuisine", "dining", "chef", "tasting"], "fullbleed", "dark",
    "A full-screen photograph of the food or dining room, the restaurant's name set large in a refined serif, one booking button.",
    ["Full-bleed photo hero with name, one line from the site and a reservation button", "Short introduction in large type", "Menu: categories as headings, dishes with descriptions and prices in two clean columns", "Story or chef section: photo beside text", "Opening hours and location with map", "Reservation band and footer"],
    [1, 2, 3, 4, 6, 8]),
  B("neighbourhood-bistro", "Neighbourhood bistro", ["restaurant", "cafe"], ["bistro", "brasserie", "wine", "bar", "tapas", "trattoria", "osteria", "pub"], "split", "any",
    "Name, opening hours and address on the left; a large photograph on the right. Feels like a well-kept local favourite.",
    ["Split hero: name, hours and address beside a large photo", "Menu by category with prices", "Photo grid of the room and dishes", "About text in a single readable column", "Visit: map, hours, phone"],
    [1, 2, 3, 5, 6]),
  B("pizzeria", "Pizzeria", ["restaurant"], ["pizza", "pizzeria", "napoli", "napoletana", "forno", "wood fired", "wood-fired", "calzone"], "fullbleed", "dark",
    "A warm full-bleed photograph of pizza or the oven, bold name, order and call buttons side by side.",
    ["Full-bleed hero with order and call buttons", "Menu first: pizzas and prices, then other sections", "Short story with photo", "Hours and locations", "Order band and footer"],
    [1, 2, 3, 4, 6]),
  B("burger-joint", "Burger joint", ["restaurant", "cafe"], ["burger", "smash", "grill", "diner", "bbq", "barbecue", "fries", "hot dog", "street food", "biscuit"], "editorial", "light",
    "A confident headline in a heavy sans, a big appetising photo beneath it, order buttons for each location.",
    ["Headline hero with a large photo and order buttons", "Menu with clear prices; specials highlighted", "Locations side by side with hours and phone", "Photo strip", "FAQ or notes from the site", "Footer"],
    [1, 3, 5, 6, 7]),

  // Cafés
  B("morning-cafe", "Morning café", ["cafe"], ["coffee", "espresso", "café", "cafe", "latte", "tea", "brunch", "breakfast"], "split", "light",
    "Soft daylight photography beside a calm serif headline, hours visible straight away.",
    ["Split hero with hours under the name", "Drinks and food lists in columns", "Photo grid of the space", "About text", "Visit"],
    [1, 2, 3, 5, 6]),
  B("bakery-window", "Bakery window", ["cafe", "retail"], ["bakery", "pastry", "patisserie", "croissant", "bread", "cake", "donut", "dessert", "ice cream", "gelato"], "editorial", "light",
    "An editorial headline above a wide photograph of the counter or bakes, like a shop window.",
    ["Editorial hero: headline above a wide photo", "Today's bakes / menu with prices", "Ordering or pickup information", "Story", "Visit"],
    [1, 3, 5, 6]),
  B("roastery", "Roastery", ["cafe"], ["roast", "roastery", "beans", "brew", "barista"], "fullbleed", "dark",
    "A dark full-bleed photograph of coffee, light type, quiet and premium.",
    ["Full-bleed hero", "Coffees and brew methods as a list", "Process (only if the site describes it in steps)", "Café locations", "Footer"],
    [1, 2, 3, 6]),

  // Gyms and studios
  B("strength-club", "Strength club", ["gym"], ["gym", "fitness", "strength", "training", "powerlifting", "barbell", "crossfit"], "fullbleed", "dark",
    "A high-contrast full-bleed training photograph, a strong condensed headline, join and timetable buttons.",
    ["Full-bleed hero with join and timetable buttons", "What the gym offers in a three-column grid", "Class timetable as a table", "Coaches with portraits (only people named on the site)", "Membership options as listed", "Visit and footer"],
    [1, 3, 4, 7, 6]),
  B("calm-studio", "Calm studio", ["gym", "salon"], ["yoga", "pilates", "barre", "meditation", "stretch", "wellness"], "split", "light",
    "Airy split layout: a serene photograph beside generous whitespace and a light serif headline.",
    ["Split hero", "Classes listed with times", "Teachers", "Pricing as listed", "Studio location"],
    [1, 2, 3, 5, 6]),
  B("fight-gym", "Fight gym", ["gym"], ["boxing", "martial", "mma", "jiu", "karate", "kickboxing"], "editorial", "dark",
    "A bold editorial headline over a gritty photograph, schedule front and centre.",
    ["Editorial hero", "Schedule table", "Programmes", "Coaches", "Join"],
    [1, 3, 4, 7]),

  // Salons and beauty
  B("salon-atelier", "Salon atelier", ["salon"], ["salon", "hair", "stylist", "colour", "color", "bridal", "blow"], "editorial", "light",
    "Fashion-magazine layout: a refined serif headline, a tall portrait photograph, services in an elegant price list.",
    ["Editorial hero with a tall photo", "Services and prices in an elegant two-column list", "Team portraits", "Gallery of work", "Book and visit"],
    [1, 2, 3, 5, 6]),
  B("spa-retreat", "Spa retreat", ["salon"], ["spa", "massage", "facial", "skin", "skincare", "aesthetic", "beauty", "nails", "lash", "brow"], "fullbleed", "light",
    "A soft full-bleed photograph with a calm overlay, treatments listed clearly with durations and prices.",
    ["Full-bleed hero", "Treatments with durations and prices", "Packages (if listed)", "About the space", "Book"],
    [1, 3, 2, 6]),
  B("barber-shop", "Barber shop", ["salon"], ["barber", "barbershop", "shave", "fade", "grooming"], "split", "dark",
    "Dark, classic split layout: photo of the shop, cuts and prices in a clean list, walk-in hours.",
    ["Split hero with hours", "Cuts and prices", "Barbers", "Visit"],
    [1, 3, 6]),

  // Clothing and fashion
  B("lookbook", "Lookbook", ["clothing"], ["collection", "fashion", "apparel", "wear", "denim", "streetwear"], "fullbleed", "any",
    "Photography first: a full-bleed campaign image and minimal type, then a large photo grid.",
    ["Full-bleed campaign hero", "Collection photo grid with captions", "Brand story in a single column", "Store information", "Footer"],
    [1, 5, 2, 6]),
  B("boutique", "Boutique", ["clothing", "retail"], ["boutique", "clothing", "dress", "accessories", "shoes"], "editorial", "light",
    "Editorial headline with an asymmetric pair of photographs, like a printed magazine spread.",
    ["Editorial hero with two photos", "Categories as image tiles", "About the shop", "Visit"],
    [1, 5, 2, 6]),
  B("tailor-atelier", "Tailor's atelier", ["clothing", "services"], ["tailor", "bespoke", "suit", "made to measure", "alterations", "saree", "sari", "lehenga", "ethnic", "textile", "fabric"], "split", "dark",
    "Dark, crafted split layout: a close-up of fabric or tailoring beside a serif headline; the craft explained in steps only when the site describes them.",
    ["Split hero", "Services or garments with prices if listed", "Craft or process (only if sequential on the site)", "Gallery", "Appointment"],
    [1, 2, 5, 3, 6]),

  // Retail
  B("shopfront", "Shopfront", ["retail"], ["shop", "store", "market", "goods", "home", "books", "toys", "gift", "flowers", "florist"], "split", "light",
    "A friendly split hero with the shop photo, opening hours and address immediately visible.",
    ["Split hero with hours", "Product categories as photo tiles", "Featured items from the site", "About", "Visit"],
    [1, 5, 3, 6]),
  B("jeweller", "Jeweller", ["retail", "salon"], ["jewel", "jewelry", "jewellery", "watch", "gold", "diamond", "ring"], "centered", "dark",
    "Quiet luxury: a centred serif headline, lots of space, one beautiful product photograph.",
    ["Centred hero", "Collections", "Craft / about", "Appointment and visit"],
    [1, 2, 5, 6]),
  B("supply-store", "Supply store", ["retail", "import_export"], ["hardware", "supply", "supplies", "electronics", "tools", "parts", "delivery", "online"], "editorial", "light",
    "Practical and clear: headline, category list, delivery and contact details up top.",
    ["Editorial hero with key contact details", "Categories list", "Brands or products from the site", "Delivery / service info", "Contact"],
    [1, 3, 7, 6]),

  // Healthcare
  B("family-practice", "Family practice", ["healthcare"], ["clinic", "medical", "health", "doctor", "practice", "family", "care", "physio", "therapy", "rehab"], "split", "light",
    "Reassuring split layout: a calm photo, the practice name, phone and booking in the first screen.",
    ["Split hero with phone and booking", "Services as a clear list", "First visit / patient information", "Team (only named on the site)", "Location, hours, contact"],
    [1, 3, 7, 6]),
  B("dental-clinic", "Dental clinic", ["healthcare"], ["dental", "dentist", "orthodont", "teeth", "implant", "smile", "optician", "vision", "eye"], "editorial", "light",
    "Clean and bright: a light editorial headline, one clinical-quality photo, treatments in clear groups.",
    ["Editorial hero", "Treatments grouped by type", "Insurance / payment information if listed", "Team", "Book and visit"],
    [1, 3, 7, 6]),
  B("therapy-room", "Therapy room", ["healthcare"], ["psycholog", "counsel", "therapist", "mental", "kinder", "child", "vet", "veterinary"], "centered", "light",
    "Calm and personal: a centred headline, warm muted palette, the practitioner's own words up front.",
    ["Centred hero", "Approach / about in readable prose", "Services", "Fees if listed", "Contact"],
    [1, 2, 3, 6]),

  // Accounting and finance
  B("trusted-advisor", "Trusted advisor", ["accounting"], ["accounting", "accountant", "cpa", "advisory", "consult"], "split", "light",
    "Professional services layout: a clear headline, a photo of the office or team, phone and email up top.",
    ["Split hero with contact details", "Services in a two-column grid", "Who they help (only from the site)", "Credentials as listed", "Contact"],
    [1, 3, 7, 6]),
  B("tax-office", "Tax office", ["accounting"], ["tax", "bookkeeping", "payroll", "irs", "returns"], "editorial", "light",
    "Plain and efficient: headline, services list, opening hours and how to get started.",
    ["Editorial hero", "Services list", "How to start (only if the site gives steps)", "Hours and contact"],
    [1, 3, 4, 6]),
  B("finance-firm", "Finance firm", ["accounting", "services"], ["finance", "financial", "wealth", "insurance", "audit", "investment"], "fullbleed", "dark",
    "Corporate and calm: a dark full-bleed city or office photograph, restrained serif headline.",
    ["Full-bleed hero", "Services", "Approach in prose", "Team", "Contact"],
    [1, 2, 3, 6]),

  // Import and export
  B("trade-house", "Trade house", ["import_export"], ["export", "import", "trading", "international", "global", "sourcing"], "fullbleed", "dark",
    "A full-bleed photograph of a port or warehouse, a confident headline, contact for enquiries.",
    ["Full-bleed hero with enquiry button", "Products or services", "Markets / countries (only from the site)", "About the company", "Contact"],
    [1, 3, 7, 6]),
  B("logistics", "Logistics", ["import_export", "services"], ["cargo", "freight", "container", "logistics", "shipping", "warehouse", "moving", "removals", "courier"], "split", "light",
    "Clear operational layout: headline and contact beside a photo, services in a clean grid.",
    ["Split hero", "Services grid", "Process (only if sequential on the site)", "Coverage", "Contact"],
    [1, 3, 4, 7, 6]),
  B("wholesale", "Wholesale", ["import_export", "retail"], ["wholesale", "distribution", "distributor", "bulk", "b2b"], "editorial", "light",
    "Catalogue feel: editorial headline, product categories as photo tiles, trade contact details.",
    ["Editorial hero", "Product categories", "Brands", "Ordering information", "Contact"],
    [1, 5, 3, 6]),

  // Local services
  B("law-office", "Law office", ["services"], ["law", "lawyer", "attorney", "legal", "notary", "solicitor"], "centered", "light",
    "Measured and authoritative: centred serif headline, practice areas in a clear list, direct contact.",
    ["Centred hero", "Practice areas", "Attorneys (only named on the site)", "Contact"],
    [1, 2, 3, 6]),
  B("trades-pro", "Trades pro", ["services"], ["plumb", "electric", "repair", "construction", "builder", "roof", "clean", "garage", "mechanic", "auto", "hvac", "landscap"], "split", "light",
    "Get-a-quote layout: phone number and service area in the first screen, a photo of real work.",
    ["Split hero with phone", "Services list", "Area served (only from the site)", "Photos of work", "Contact"],
    [1, 3, 5, 7, 6]),
  B("studio-portfolio", "Studio portfolio", ["services"], ["architect", "design", "studio", "agency", "photograph", "wedding", "event", "real estate", "realty"], "fullbleed", "any",
    "Portfolio first: a full-bleed project image, minimal type, then a grid of work.",
    ["Full-bleed hero", "Project grid with captions", "Services", "About", "Contact"],
    [1, 5, 3, 6]),
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
 * Pick the template for a site: the best keyword match among its category's templates (a pizzeria gets
 * "Pizzeria", a dentist "Dental clinic"), otherwise a hash-random one, skipping the ones used recently.
 * Words in the business name count most.
 */
export function pickBlueprint(siteId: string, category: CategoryId, text: string, recentIds: string[] = []): Blueprint {
  const pool = BLUEPRINTS.filter((b) => b.categories.includes(category));
  const candidates = pool.length ? pool : BLUEPRINTS;
  const lower = text.toLowerCase();
  const head = lower.slice(0, 60); // the business name and domain come first
  const re = (k: string) => new RegExp(`(^|[^a-z])${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
  const score = (b: Blueprint) =>
    b.keywords.reduce((n, k) => n + (re(k).test(head) ? 10 : re(k).test(lower) ? (k.length > 5 ? 2 : 1) : 0), 0);
  const recent = new Set(recentIds.slice(0, 3));
  const seed = hash(siteId);
  // Map data files some businesses under the wrong trade ("Biscuit Kitchen" as a shop). When the business name
  // clearly names another trade's template and nothing in its own category does, follow the name.
  const nameHit = (b: Blueprint) => b.keywords.some((k) => re(k).test(head));
  if (!candidates.some(nameHit)) {
    const other = BLUEPRINTS.filter((b) => !b.categories.includes(category) && nameHit(b)).sort((x, y) => score(y) - score(x))[0];
    if (other) return other;
  }
  const ranked = candidates
    .map((b, i) => ({ b, s: score(b), r: (seed >>> (i % 24)) % 997 }))
    .sort((x, y) => y.s - x.s || x.r - y.r);
  const best = ranked[0];
  if (best.s >= 2) return best.b;
  return (ranked.find((x) => !recent.has(x.b.id)) ?? best).b;
}
