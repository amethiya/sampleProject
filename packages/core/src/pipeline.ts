import { DEFAULT_ACTIVE_DAYS, checkActivity, type ActivityResult } from "./activity";
import { auditHtml } from "./audit";
import { countryName, isTargetCountry } from "./categories";
import { extractContacts, extractContent, parseHtml } from "./extract";
import { businessNoun, siteFindings, socialLinks, structuredDataTypes, techProfile } from "./findings";
import { fetchPage, hasMailServer } from "./http";
import type { Candidate, Lead, SiteProfile } from "./types";

export const DEFAULT_MIN_SCORE = 35;

export interface AuditOptions {
  /** Activity window in days (default 30). */
  activeDays?: number;
  now?: Date;
}

/**
 * Audit a candidate against the four lead criteria and collect its full profile:
 * 1. a public email address whose domain accepts mail;
 * 2. an outdated design and technology (outdated score at least `minScore`);
 * 3. in the United States or the European Union;
 * 4. active: evidence of activity within the window (default 30 days) and not parked or under construction.
 * The cheap checks run first; the MX lookup and activity requests only for sites that pass them.
 * Returns null when the site is unreachable.
 */
export async function auditCandidate(c: Candidate, minScore = DEFAULT_MIN_SCORE, opts: AuditOptions = {}): Promise<Lead | null> {
  const now = opts.now ?? new Date();
  const windowDays = opts.activeDays ?? DEFAULT_ACTIVE_DAYS;
  const page = await fetchPage(c.website);
  if (!page) return null;

  const audit = auditHtml(page.html, page.url, now);
  const root = parseHtml(page.html);
  const contacts = extractContacts(root, page.html, page.url);
  const content = extractContent(root, page.url);

  if (!contacts.emails.length && contacts.contactPage && audit.score >= minScore) {
    const sub = await fetchPage(contacts.contactPage);
    if (sub) {
      const more = extractContacts(parseHtml(sub.html), sub.html, sub.url);
      contacts.emails = more.emails;
      contacts.phones = [...new Set([...contacts.phones, ...more.phones])].slice(0, 3);
    }
  }
  if (c.osmEmail && !contacts.emails.includes(c.osmEmail.toLowerCase())) contacts.emails.unshift(c.osmEmail.toLowerCase());
  if (c.osmPhone && !contacts.phones.length) contacts.phones.push(c.osmPhone);

  // Cheap criteria first.
  const rejected: string[] = [];
  const inTarget = isTargetCountry(c.country);
  if (!inTarget) rejected.push(`Not in the US or the EU (${countryName(c.country)})`);
  if (audit.score < minScore) rejected.push(`Looks modern enough (outdated score ${audit.score}, needs ${minScore})`);
  const email = contacts.emails[0] ?? null;
  if (!email) rejected.push("No public email address");

  // Then the checks that need requests, only for sites that can still qualify.
  let mailServer: boolean | null = null;
  let activity: ActivityResult = { active: false, windowDays, evidence: [], hasSitemap: null };
  if (!rejected.length) {
    [mailServer, activity] = await Promise.all([hasMailServer(email!.split("@")[1]), checkActivity(page, now, windowDays)]);
    if (mailServer === false) rejected.push(`The email domain doesn't accept mail (${email})`);
    if (activity.parked) rejected.push(activity.parked);
    else if (!activity.active) rejected.push(`No sign of activity in the last ${windowDays} days${activity.lastActivity ? ` (latest: ${activity.lastActivity})` : ""}`);
  }

  const text = root.text.replace(/\s+/g, " ").trim();
  const wordCount = text ? text.split(" ").length : 0;
  let host = "";
  try { host = new URL(page.url).hostname.replace(/^www\./, ""); } catch { /* keep empty */ }
  const profile: SiteProfile = {
    checkedAt: now.toISOString(),
    businessNoun: businessNoun(c.category, c.kind, c.name),
    email: { address: email, onSiteDomain: !!email && !!host && email.endsWith(`@${host}`), mailServer },
    location: { city: c.city, country: c.country, countryName: countryName(c.country), region: c.region, address: c.address, lat: c.lat, lon: c.lon, inTargetMarket: inTarget },
    activity,
    findings: siteFindings(page.html, audit, { hasSitemap: activity.hasSitemap ?? undefined, wordCount }),
    tech: techProfile(page.html, audit.https, page.server),
    structuredData: structuredDataTypes(page.html),
    social: socialLinks(page.html),
    hasSitemap: activity.hasSitemap ?? null,
    wordCount,
  };

  return {
    ...c,
    audit,
    contacts,
    content,
    qualified: rejected.length === 0,
    rejected,
    profile,
    auditedAt: now.toISOString(),
  };
}

export const SHEET_HEADERS = [
  "Discovered", "Business", "Category", "City", "Country", "Website", "Outdated score",
  "Issues", "Emails", "Phones", "Contact page", "Address", "Preview URL", "Status",
  "Business type", "Last activity", "Activity evidence", "SEO issues", "AI search issues", "Mobile issues", "Technology", "Social",
];

export function leadToRow(lead: Lead, previewUrl: string, status = "new"): string[] {
  const p = lead.profile;
  return [
    lead.auditedAt.slice(0, 10),
    lead.name,
    lead.category,
    lead.city,
    countryName(lead.country),
    lead.website,
    String(lead.audit.score),
    lead.audit.reasons.join("; "),
    lead.contacts.emails.join(", "),
    lead.contacts.phones.join(", "),
    lead.contacts.contactPage ?? "",
    lead.address ?? "",
    previewUrl,
    status,
    p?.businessNoun ?? "",
    p?.activity.lastActivity ?? "",
    p?.activity.evidence.map((e) => e.detail).join("; ") ?? "",
    p?.findings.seo.join("; ") ?? "",
    p?.findings.aiSearch.join("; ") ?? "",
    p?.findings.mobile.join("; ") ?? "",
    p ? [p.tech.cms, p.tech.generator, ...p.tech.libraries].filter(Boolean).join(", ") : "",
    p?.social.map((s) => s.url).join(" ") ?? "",
  ];
}
