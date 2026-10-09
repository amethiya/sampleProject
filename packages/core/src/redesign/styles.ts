/**
 * A site's design DNA: which look (colour theme + fonts) of the design system it gets, and which trade it really is
 * (map data sometimes files a biscuit kitchen as a shop). Stored as "3|<look>|<trade>".
 */
import type { CategoryId } from "../types";
import { LOOKS, lookById, pickLook, type Look } from "./system";

/** Bumped when the picking rules change, so looks chosen under older rules are picked again. */
export const DNA_VERSION = "3";

export interface DesignDna {
  key: string;
  look: Look;
  trade: CategoryId;
}

const TRADES: CategoryId[] = ["restaurant", "cafe", "gym", "salon", "clothing", "retail", "healthcare", "accounting", "import_export", "services"];

/** Words in a business's name that say which trade it really is. */
const NAME_HINTS: [CategoryId, RegExp][] = [
  ["cafe", /\b(caf[eé]|coffee|espresso|bakery|patisserie|roast(er|ery)|tea ?room|donut|bagel)\b/i],
  ["restaurant", /\b(restaurant|kitchen|biscuit|burger|pizz|grill|diner|bistro|trattoria|tavern|bbq|taqueria|sushi|ramen|izakaya|eatery|brasserie)/i],
  ["gym", /\b(gym|fitness|crossfit|yoga|pilates|boxing|martial|athletic|strength)\b/i],
  ["salon", /\b(salon|spa|barber|beauty|nails?|lash|brow|hair|aesthetic)\b/i],
  ["healthcare", /\b(dental|dentist|clinic|medical|health|physio|therapy|chiro|ortho|vet|pharmacy|doctor|dr\.)\b/i],
  ["accounting", /\b(accounting|accountants?|cpa|tax|bookkeeping|payroll)\b/i],
  ["import_export", /\b(import|export|trading|logistics|freight|shipping|wholesale)\b/i],
  ["clothing", /\b(boutique|apparel|clothing|fashion|tailor|bridal)\b/i],
];

/** The trade to design for: the business name wins over a mis-filed category. */
export function tradeFor(category: CategoryId, name = ""): CategoryId {
  for (const [trade, re] of NAME_HINTS) if (re.test(name)) return trade;
  return category;
}

export function dnaFromKey(key: string): DesignDna | null {
  const [v, lookId, trade] = key.split("|");
  const look = lookById(lookId);
  if (v !== DNA_VERSION || !look || !TRADES.includes(trade as CategoryId)) return null;
  return { key, look, trade: trade as CategoryId };
}

export function makeDna(look: Look, trade: CategoryId): DesignDna {
  return { key: [DNA_VERSION, look.id, trade].join("|"), look, trade };
}

/**
 * Pick the DNA for a site: its real trade (from the name), and that trade's favourite look unless one of the two
 * most recent redesigns already used it. `text` is the business name first, then its content.
 */
export function pickDna(_siteId: string, category: string, recentKeys: string[], text = ""): DesignDna {
  const trade = tradeFor(category as CategoryId, text.slice(0, 80));
  const recent = recentKeys.map((k) => k.split("|")[1]).filter(Boolean);
  return makeDna(pickLook(trade, recent), trade);
}

export { LOOKS };
