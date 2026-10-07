import type { CategoryId, City } from "./types";

export interface CategoryDef {
  id: CategoryId;
  label: string;
  /** Overpass QL tag filters; each entry becomes one `nwr[...]` statement. */
  filters: string[];
}

export const CATEGORIES: CategoryDef[] = [
  { id: "restaurant", label: "Restaurant", filters: ['["amenity"="restaurant"]'] },
  { id: "gym", label: "Gym / Fitness", filters: ['["leisure"="fitness_centre"]', '["sport"="fitness"]'] },
  {
    id: "import_export",
    label: "Import / Export",
    filters: [
      '["shop"="wholesale"]',
      '["office"~"^(company|logistics|import_export)$"]["name"~"import|export|trading|handel",i]',
    ],
  },
  {
    id: "healthcare",
    label: "Healthcare",
    filters: ['["amenity"~"^(clinic|doctors|dentist)$"]', '["healthcare"~"^(clinic|doctor|dentist|physiotherapist)$"]'],
  },
  { id: "accounting", label: "Accounting", filters: ['["office"~"^(accountant|tax_advisor)$"]'] },
];

export const CITIES: City[] = [
  // United States
  { id: "nyc", name: "New York", country: "US", region: "us", lat: 40.7128, lon: -74.006 },
  { id: "chicago", name: "Chicago", country: "US", region: "us", lat: 41.8781, lon: -87.6298 },
  { id: "houston", name: "Houston", country: "US", region: "us", lat: 29.7604, lon: -95.3698 },
  { id: "phoenix", name: "Phoenix", country: "US", region: "us", lat: 33.4484, lon: -112.074 },
  { id: "philadelphia", name: "Philadelphia", country: "US", region: "us", lat: 39.9526, lon: -75.1652 },
  { id: "dallas", name: "Dallas", country: "US", region: "us", lat: 32.7767, lon: -96.797 },
  { id: "austin", name: "Austin", country: "US", region: "us", lat: 30.2672, lon: -97.7431 },
  { id: "denver", name: "Denver", country: "US", region: "us", lat: 39.7392, lon: -104.9903 },
  { id: "seattle", name: "Seattle", country: "US", region: "us", lat: 47.6062, lon: -122.3321 },
  { id: "boston", name: "Boston", country: "US", region: "us", lat: 42.3601, lon: -71.0589 },
  { id: "miami", name: "Miami", country: "US", region: "us", lat: 25.7617, lon: -80.1918 },
  { id: "atlanta", name: "Atlanta", country: "US", region: "us", lat: 33.749, lon: -84.388 },
  { id: "sf", name: "San Francisco", country: "US", region: "us", lat: 37.7749, lon: -122.4194 },
  { id: "la", name: "Los Angeles", country: "US", region: "us", lat: 34.0522, lon: -118.2437 },
  // European Union
  { id: "berlin", name: "Berlin", country: "DE", region: "eu", lat: 52.52, lon: 13.405 },
  { id: "munich", name: "Munich", country: "DE", region: "eu", lat: 48.1351, lon: 11.582 },
  { id: "paris", name: "Paris", country: "FR", region: "eu", lat: 48.8566, lon: 2.3522 },
  { id: "madrid", name: "Madrid", country: "ES", region: "eu", lat: 40.4168, lon: -3.7038 },
  { id: "barcelona", name: "Barcelona", country: "ES", region: "eu", lat: 41.3874, lon: 2.1686 },
  { id: "rome", name: "Rome", country: "IT", region: "eu", lat: 41.9028, lon: 12.4964 },
  { id: "milan", name: "Milan", country: "IT", region: "eu", lat: 45.4642, lon: 9.19 },
  { id: "amsterdam", name: "Amsterdam", country: "NL", region: "eu", lat: 52.3676, lon: 4.9041 },
  { id: "vienna", name: "Vienna", country: "AT", region: "eu", lat: 48.2082, lon: 16.3738 },
  { id: "brussels", name: "Brussels", country: "BE", region: "eu", lat: 50.8503, lon: 4.3517 },
  { id: "lisbon", name: "Lisbon", country: "PT", region: "eu", lat: 38.7223, lon: -9.1393 },
  { id: "dublin", name: "Dublin", country: "IE", region: "eu", lat: 53.3498, lon: -6.2603 },
  { id: "prague", name: "Prague", country: "CZ", region: "eu", lat: 50.0755, lon: 14.4378 },
  { id: "warsaw", name: "Warsaw", country: "PL", region: "eu", lat: 52.2297, lon: 21.0122 },
  { id: "stockholm", name: "Stockholm", country: "SE", region: "eu", lat: 59.3293, lon: 18.0686 },
  { id: "copenhagen", name: "Copenhagen", country: "DK", region: "eu", lat: 55.6761, lon: 12.5683 },
];

export function categoryById(id: string): CategoryDef | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function cityById(id: string): City | undefined {
  return CITIES.find((c) => c.id === id);
}

/** Deterministic rotation over every (category, city) pair so daily runs spread coverage. */
export function sliceForCursor(cursor: number): { category: CategoryDef; city: City } {
  const n = CATEGORIES.length * CITIES.length;
  const i = ((cursor % n) + n) % n;
  return { category: CATEGORIES[i % CATEGORIES.length], city: CITIES[Math.floor(i / CATEGORIES.length)] };
}

/** "CZ" → "Czechia", "US" → "United States". */
export function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}
