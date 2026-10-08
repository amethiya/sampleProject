import type { CategoryDef } from "./categories";
import { hostId, isBlockedHost, normalizeWebsite } from "./http";
import type { Candidate, City } from "./types";

// Tried in order on each attempt; the public servers are often overloaded, so keep several.
export const OVERPASS_URLS = [
  "https://lz4.overpass-api.de/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];
// Overpass answers 406 to browser-like "Mozilla/..." user agents, so identify plainly.
const OVERPASS_UA = "RevampRadar/0.1 (+https://github.com/amethiya/sampleProject)";

/**
 * Small radius keeps queries cheap on the shared public server; `offset` shifts the
 * circle around the city centre so repeated runs cover different neighbourhoods.
 */
export function buildOverpassQuery(
  category: CategoryDef, city: City, radiusM = 3500, max = 150, offset: [number, number] = [0, 0],
): string {
  const lat = (city.lat + offset[0]).toFixed(4), lon = (city.lon + offset[1]).toFixed(4);
  const around = `(around:${radiusM},${lat},${lon})`;
  const stmts = category.filters.flatMap((f) => [
    `nwr${f}["website"]${around};`,
    `nwr${f}["contact:website"]${around};`,
  ]);
  return `[out:json][timeout:25];(${stmts.join("")});out tags center ${max};`;
}

interface OverpassElement {
  tags?: Record<string, string>;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
}

export function parseOverpass(json: { elements?: OverpassElement[] }, category: CategoryDef, city: City): Candidate[] {
  const seen = new Set<string>();
  const out: Candidate[] = [];
  for (const el of json.elements ?? []) {
    const t = el.tags ?? {};
    const name = t.name?.trim();
    const website = normalizeWebsite(t.website ?? t["contact:website"] ?? t.url ?? "");
    if (!name || !website || t.brand || t["brand:wikidata"]) continue; // skip chains
    const id = hostId(website);
    if (isBlockedHost(id) || seen.has(id)) continue;
    seen.add(id);
    const street = [t["addr:housenumber"], t["addr:street"]].filter(Boolean).join(" ");
    const address = [street, t["addr:postcode"], t["addr:city"]].filter(Boolean).join(", ");
    out.push({
      id,
      name,
      category: category.id,
      city: city.name,
      country: city.country,
      region: city.region,
      website,
      osmEmail: t.email ?? t["contact:email"],
      osmPhone: t.phone ?? t["contact:phone"],
      address: address || undefined,
      openingHours: t.opening_hours,
      lat: el.lat ?? el.center?.lat,
      lon: el.lon ?? el.center?.lon,
    });
  }
  return out;
}

export async function discoverCandidates(category: CategoryDef, city: City, attempts = 3): Promise<Candidate[]> {
  const jitter = () => (Math.random() - 0.5) * 0.08; // ~±4 km
  const errors: string[] = [];
  for (let i = 0; i < attempts; i++) {
    if (i) await new Promise((r) => setTimeout(r, 4000 * i));
    const url = OVERPASS_URLS[i % OVERPASS_URLS.length];
    const body = "data=" + encodeURIComponent(buildOverpassQuery(category, city, 3500, 150, i ? [jitter(), jitter()] : [0, 0]));
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded", "user-agent": OVERPASS_UA, accept: "application/json" },
        body,
        signal: AbortSignal.timeout(40_000),
      });
      if (res.ok) return parseOverpass(await res.json(), category, city);
      errors.push(`${url} ${res.status}`);
    } catch (e) {
      errors.push(`${url} ${(e as Error).message}`);
    }
  }
  throw new Error(`Overpass failed: ${errors.join(" | ")}`);
}
