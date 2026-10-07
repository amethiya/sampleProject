import { auditHtml } from "./audit";
import { extractContacts, extractContent, parseHtml } from "./extract";
import { fetchPage } from "./http";
import { countryName } from "./categories";
import type { Candidate, Lead } from "./types";

export const DEFAULT_MIN_SCORE = 35;

/**
 * Fetch a candidate's homepage (and its contact page when no email is found),
 * score how outdated it is, and pull out contacts + content for the redesign.
 * Uses at most 2 HTTP requests. Returns null when the site is unreachable.
 */
export async function auditCandidate(c: Candidate, minScore = DEFAULT_MIN_SCORE): Promise<Lead | null> {
  const page = await fetchPage(c.website);
  if (!page) return null;

  const audit = auditHtml(page.html, page.url);
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

  return {
    ...c,
    audit,
    contacts,
    content,
    qualified: audit.score >= minScore && contacts.emails.length + contacts.phones.length > 0,
    auditedAt: new Date().toISOString(),
  };
}

export const SHEET_HEADERS = [
  "Discovered", "Business", "Category", "City", "Country", "Website", "Outdated score",
  "Issues", "Emails", "Phones", "Contact page", "Address", "Preview URL", "Status",
];

export function leadToRow(lead: Lead, previewUrl: string, status = "new"): string[] {
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
  ];
}
