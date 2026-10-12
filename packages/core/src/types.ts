export type CategoryId =
  | "restaurant" | "cafe" | "gym" | "salon" | "clothing" | "retail" | "import_export" | "healthcare" | "accounting" | "services";
/** Target markets: the United States and the European Union. */
export type RegionId = "us" | "eu";

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
  /** The OpenStreetMap kind (hairdresser, fitness_centre, dentist...), for "the best <noun> in <city>". */
  kind?: string;
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

/** Everything we know about a site, collected when it is audited and stored with the lead. */
export interface SiteProfile {
  checkedAt: string;
  /** "the best <noun> in <city>" */
  businessNoun: string;
  email: { address: string | null; onSiteDomain: boolean; mailServer: boolean | null };
  location: { city: string; country: string; countryName: string; region: string; address?: string; lat?: number; lon?: number; inTargetMarket: boolean };
  activity: import("./activity").ActivityResult;
  findings: import("./findings").Findings;
  tech: import("./findings").TechProfile;
  structuredData: string[];
  social: { platform: string; url: string }[];
  hasSitemap: boolean | null;
  wordCount: number;
}

export interface Lead extends Candidate {
  audit: AuditResult;
  contacts: Contacts;
  content: SiteContent;
  qualified: boolean;
  /** Why the site does not qualify (empty when it does). */
  rejected?: string[];
  profile?: SiteProfile;
  auditedAt: string;
}

export type LeadStatus = "new" | "contacted" | "replied" | "won" | "lost" | "ignored";
