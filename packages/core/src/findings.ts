/**
 * What is wrong with a website, grouped the way the pitch talks about it: design, technology, user-friendliness,
 * mobile, SEO and AI search. Every finding is measured on the page; the pitch only claims what is listed here.
 * Also: the business noun for "the best <noun> in <city>", social profiles and the detected technology. Pure.
 */
import type { AuditResult, CategoryId } from "./types";

export interface Findings {
  design: string[];
  technology: string[];
  userExperience: string[];
  mobile: string[];
  seo: string[];
  aiSearch: string[];
}

export interface TechProfile {
  generator?: string;
  cms?: string;
  libraries: string[];
  server?: string;
  https: boolean;
}

const has = (re: RegExp, s: string) => re.test(s);

export function techProfile(html: string, https: boolean, server?: string): TechProfile {
  const generator = html.match(/<meta[^>]+name=["']?generator["']?[^>]+content=["']([^"']+)/i)?.[1];
  const cms = /wp-content|wp-includes/i.test(html) ? "WordPress" : /joomla/i.test(html) ? "Joomla" : /drupal/i.test(html) ? "Drupal"
    : /static\.wixstatic|wix\.com/i.test(html) ? "Wix" : /squarespace/i.test(html) ? "Squarespace" : /weebly/i.test(html) ? "Weebly"
    : /godaddysites|websitebuilder/i.test(html) ? "GoDaddy Website Builder" : /jimdo/i.test(html) ? "Jimdo" : /cdn\.shopify/i.test(html) ? "Shopify" : undefined;
  const libs: string[] = [];
  const jq = html.match(/jquery[.-]?(\d\.\d+)(?:\.\d+)?(?:\.min)?\.js/i);
  if (jq) libs.push(`jQuery ${jq[1]}`); else if (/jquery/i.test(html)) libs.push("jQuery");
  const bs = html.match(/bootstrap(?:\/|[.-])(\d)\.\d/i);
  if (bs) libs.push(`Bootstrap ${bs[1]}`);
  if (/\.swf\b|swfobject/i.test(html)) libs.push("Flash");
  if (/font-awesome\/[34]\./i.test(html)) libs.push("Font Awesome 3/4");
  if (/prototype\.js|mootools|scriptaculous/i.test(html)) libs.push("Prototype/MooTools");
  return { generator, cms, libraries: libs, server, https };
}

/** Structured-data types declared on the page (JSON-LD and microdata). */
export function structuredDataTypes(html: string): string[] {
  const types = new Set<string>();
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    for (const t of m[1].matchAll(/"@type"\s*:\s*(\[[^\]]*\]|"[^"]+")/g)) for (const x of t[1].matchAll(/"([^"]+)"/g)) types.add(x[1]);
  }
  for (const m of html.matchAll(/itemtype=["']https?:\/\/schema\.org\/(\w+)/gi)) types.add(m[1]);
  return [...types];
}

const LOCAL_TYPES = /LocalBusiness|Restaurant|FoodEstablishment|CafeOrCoffeeShop|Bakery|BarOrPub|Store|ClothingStore|HealthAndBeautyBusiness|HairSalon|BeautySalon|DaySpa|ExerciseGym|SportsActivityLocation|MedicalBusiness|MedicalClinic|Dentist|Physician|Physiotherapy|AccountingService|ProfessionalService|LegalService|HomeAndConstructionBusiness|Organization|Corporation/;

export function siteFindings(html: string, audit: AuditResult, extras: { hasSitemap?: boolean; wordCount?: number } = {}): Findings {
  const r = audit.reasons;
  const any = (re: RegExp) => r.filter((x) => re.test(x));
  const f: Findings = { design: [], technology: [], userExperience: [], mobile: [], seo: [], aiSearch: [] };

  // Design and user interface
  if (any(/Table-based|Fixed-width|line breaks|Presentational|Deprecated|inline styling/).length) f.design.push("The layout is built with old techniques (tables, fixed widths, inline styling), so it looks dated next to modern sites");
  if (any(/Copyright year/).length) f.design.push(`The footer still shows ${r.find((x) => /Copyright year/.test(x))!.replace(/Copyright year (\d+).*/, "$1")}, which makes the site look unmaintained`);
  if (any(/slider plugin/).length) f.design.push("It relies on an old image-slider plugin");
  if (any(/site builder/).length) f.design.push("It is built on a dated site builder template");
  if (!f.design.length && audit.score >= 25) f.design.push("The design looks dated compared with competitors nearby");

  // Technology
  for (const x of any(/jQuery|WordPress|Bootstrap|Flash|Internet Explorer|doctype|Built with|jquery-migrate|Legacy Google Analytics/)) f.technology.push(x);
  if (!audit.https) f.technology.push("No HTTPS: browsers mark the site \"Not secure\"");

  // User-friendliness
  if (any(/semantic structure/).length) f.userExperience.push("The page has no clear layout of header, menu and content, so visitors struggle to find what they need");
  if (any(/alt text/).length) f.userExperience.push("Most images have no text description");
  if (!/<nav[\s>]|class=["'][^"']*(nav|menu)/i.test(html)) f.userExperience.push("There is no clear navigation menu");
  if (!/href=["']tel:/i.test(html)) f.userExperience.push("Phone numbers are not tappable, so mobile visitors can't call in one tap");
  if (any(/lazy-loaded/).length) f.userExperience.push("Images are not optimised, so pages load slowly");

  // Mobile
  if (any(/mobile-friendly|viewport/).length) f.mobile.push("On a phone it shows as a shrunken desktop page that visitors have to pinch and zoom");
  if (any(/responsive CSS/).length) f.mobile.push("The layout doesn't adapt to phone and tablet screens");
  if (any(/Fixed-width/).length) f.mobile.push("A fixed-width layout forces visitors to zoom and scroll sideways on phones");
  if (any(/Flash/).length) f.mobile.push("Flash content doesn't work on any phone");

  // SEO
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() ?? "";
  if (!title) f.seo.push("The page has no title for Google to show");
  else if (title.length < 15 || /^(home|index|untitled|welcome)\b/i.test(title)) f.seo.push(`The page title ("${title.slice(0, 40)}") tells Google very little`);
  if (!/<meta[^>]+name=["']?description/i.test(html)) f.seo.push("No meta description, so Google writes its own snippet");
  const h1 = (html.match(/<h1[\s>]/gi) ?? []).length;
  if (h1 === 0) f.seo.push("No main heading (H1) on the page");
  if (!/<link[^>]+rel=["']?canonical/i.test(html)) f.seo.push("No canonical URL");
  if (extras.hasSitemap === false) f.seo.push("No sitemap for search engines");
  if (!/<meta[^>]+property=["']?og:/i.test(html)) f.seo.push("No social preview tags, so shared links look bare");
  if (any(/alt text/).length) f.seo.push("Images have no alt text for image search");
  if (!audit.https) f.seo.push("No HTTPS, which search engines rank lower");

  // AI search (ChatGPT, Gemini, Perplexity, Google AI Overviews read structured, crawlable facts)
  const types = structuredDataTypes(html);
  if (!types.some((t) => LOCAL_TYPES.test(t))) f.aiSearch.push("The site doesn't publish this information in a form they can read (no structured business data)");
  if (!/openingHours|opening_hours|"openingHoursSpecification"/i.test(html)) f.aiSearch.push("Opening hours aren't published in a machine-readable form");
  if ((extras.wordCount ?? 999) < 150) f.aiSearch.push("There is very little readable text on the page for search engines and AI to understand");
  if (/<img[^>]+src=["'][^"']*(menu|price|hours)[^"']*\.(jpe?g|png|gif)/i.test(html)) f.aiSearch.push("Key information (menu, prices or hours) is in images that search engines and AI can't read");
  return f;
}

/** Social profiles linked from the site. */
export function socialLinks(html: string): { platform: string; url: string }[] {
  const platforms: [string, RegExp][] = [
    ["Facebook", /https?:\/\/(?:www\.)?facebook\.com\/[^"'\s<>]+/i], ["Instagram", /https?:\/\/(?:www\.)?instagram\.com\/[^"'\s<>]+/i],
    ["X / Twitter", /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[^"'\s<>]+/i], ["LinkedIn", /https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/[^"'\s<>]+/i],
    ["YouTube", /https?:\/\/(?:www\.)?youtube\.com\/[^"'\s<>]+/i], ["TikTok", /https?:\/\/(?:www\.)?tiktok\.com\/[^"'\s<>]+/i],
    ["Yelp", /https?:\/\/(?:www\.)?yelp\.[a-z.]+\/biz\/[^"'\s<>]+/i], ["Tripadvisor", /https?:\/\/(?:www\.)?tripadvisor\.[a-z.]+\/[^"'\s<>]+/i],
  ];
  const out: { platform: string; url: string }[] = [];
  for (const [platform, re] of platforms) {
    const m = html.match(re)?.[0];
    if (m && !/sharer|share\.php|intent\/tweet|\/plugins\//i.test(m)) out.push({ platform, url: m.replace(/&amp;/g, "&") });
  }
  return out;
}

/** OpenStreetMap kinds → the noun owners and searchers use ("the best hair salon in Austin"). */
const KIND_NOUNS: Record<string, string> = {
  restaurant: "restaurant", cafe: "café", coffee: "coffee shop", fitness_centre: "gym", fitness: "gym",
  hairdresser: "hair salon", beauty: "beauty salon", cosmetics: "beauty shop", massage: "massage studio",
  clothes: "clothing store", boutique: "boutique", shoes: "shoe store", fashion_accessories: "accessories boutique", bag: "bag shop",
  gift: "gift shop", furniture: "furniture store", jewelry: "jewellery store", florist: "florist", books: "bookshop", toys: "toy shop",
  sports: "sports shop", bicycle: "bike shop", hardware: "hardware store", interior_decoration: "interior design shop", electronics: "electronics store",
  optician: "optician", pet: "pet shop", bakery: "bakery", deli: "deli", wine: "wine shop", art: "art gallery", music: "music shop", stationery: "stationery shop",
  wholesale: "wholesaler", logistics: "logistics company", import_export: "import-export company", company: "trading company",
  clinic: "clinic", doctors: "doctor's practice", doctor: "doctor's practice", dentist: "dentist", physiotherapist: "physiotherapist",
  accountant: "accountant", tax_advisor: "tax advisor", lawyer: "law firm", estate_agent: "estate agent", insurance: "insurance agency",
  architect: "architect", travel_agent: "travel agency", consulting: "consultancy", carpenter: "carpenter", electrician: "electrician",
  plumber: "plumber", photographer: "photographer", painter: "painter", tailor: "tailor",
};

const CATEGORY_NOUNS: Record<CategoryId, string> = {
  restaurant: "restaurant", cafe: "café", gym: "gym", salon: "salon", clothing: "clothing store", retail: "shop",
  import_export: "import-export company", healthcare: "clinic", accounting: "accountant", services: "local business",
};

/** The noun for "the best ___ in <city>": from the OSM kind, the business name, then the category. */
export function businessNoun(category: CategoryId, kind?: string, name = ""): string {
  if (kind && KIND_NOUNS[kind]) return KIND_NOUNS[kind];
  if (/dental|dentist|zahnarzt/i.test(name)) return "dentist";
  if (/physio/i.test(name)) return "physiotherapist";
  if (/barber/i.test(name)) return "barber shop";
  if (/\b(hair|coiff|friseur)/i.test(name)) return "hair salon";
  if (/\b(nail|lash|brow|beauty|spa)\b/i.test(name)) return "beauty salon";
  if (/pizz/i.test(name)) return "pizzeria";
  if (/bakery|bäckerei|boulangerie|patisserie/i.test(name)) return "bakery";
  if (/yoga/i.test(name)) return "yoga studio";
  return CATEGORY_NOUNS[category];
}
