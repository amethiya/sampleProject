export type CategoryId =
  | "restaurant" | "cafe" | "gym" | "salon" | "clothing" | "retail" | "import_export" | "healthcare" | "accounting" | "services";
/** Target markets: United States, European Union, Canada, Australia, New Zealand. */
export type RegionId = "us" | "eu" | "ca" | "au" | "nz";

export interface City {
  id: string;
  name: string;
  country: string; // ISO 3166-1 alpha-2
  region: RegionId;
  lat: number;
  lon: number;
}

/** A business found via OpenStreetMap that has a website, not yet audited. */
export interface Candidate {
  id: string; // normalized host, e.g. "joespizza.com"
  name: string;
  category: CategoryId;
  city: string;
  country: string;
  region: RegionId;
  website: string;
  osmEmail?: string;
  osmPhone?: string;
  address?: string;
  openingHours?: string;
  lat?: number;
  lon?: number;
}

export interface AuditResult {
  score: number; // 0 (modern) .. 100 (very outdated)
  reasons: string[];
  finalUrl: string;
  https: boolean;
}

export interface SiteContent {
  title: string;
  description: string;
  headings: string[];
  paragraphs: string[];
  images: string[];
  logo?: string;
  navLinks: string[];
}

export interface Contacts {
  emails: string[];
  phones: string[];
  contactPage?: string;
}

export interface Lead extends Candidate {
  audit: AuditResult;
  contacts: Contacts;
  content: SiteContent;
  qualified: boolean;
  auditedAt: string;
}

export type LeadStatus = "new" | "contacted" | "replied" | "won" | "lost" | "ignored";
