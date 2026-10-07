import type { Lead } from "./types";

export interface Pitch {
  to: string;
  subject: string;
  body: string;
  gmailUrl: string;
}

/** Plain-language versions of audit reasons, ordered by how persuasive they are to an owner. */
const BENEFITS: [RegExp, string][] = [
  [/mobile-friendly|responsive CSS/i, "it is hard to use on a phone, which is where most of your visitors come from"],
  [/HTTPS/i, "browsers like Chrome label it \"Not secure\", which puts some customers off"],
  [/Copyright year/i, "the footer still shows an old year, so it can look like the business isn't active"],
  [/Flash|jQuery|WordPress|Bootstrap|Internet Explorer|Deprecated|Table-based|doctype|generator|Built with|site builder/i,
    "it runs on older web technology that loads slowly and ranks lower on Google"],
  [/meta description|social preview/i, "links to it look bare when shared on Google, WhatsApp or social media"],
];

export function buildPitch(lead: Lead, previewUrl: string, senderName: string): Pitch | null {
  const to = lead.contacts.emails[0];
  if (!to) return null;

  const points: string[] = [];
  for (const [re, text] of BENEFITS) {
    if (points.length < 3 && lead.audit.reasons.some((r) => re.test(r)) && !points.includes(text)) points.push(text);
  }
  if (!points.length) points.push("its design looks dated next to competitors nearby");

  const subject = `A fresh look for ${lead.name}'s website`;
  const body = [
    `Hi ${lead.name} team,`,
    "",
    `I came across ${lead.website.replace(/^https?:\/\//, "").replace(/\/$/, "")} while looking at ${label(lead.category)} in ${lead.city}. A few things stood out:`,
    "",
    ...points.map((p) => `• ${p}`),
    "",
    "Instead of just describing it, I built a free concept of what a modern version could look like, using your existing content:",
    previewUrl,
    "",
    "If you like the direction, I can turn it into your real site, with mobile support, fast loading and easy updates. If not, no problem at all.",
    "",
    "Best regards,",
    senderName,
    "",
    "—",
    "You're receiving this one-time note because your business email is listed publicly on your website. Reply \"no thanks\" and I won't contact you again.",
  ].join("\n");

  const gmailUrl =
    "https://mail.google.com/mail/?view=cm&fs=1" +
    `&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return { to, subject, body, gmailUrl };
}

function label(cat: string): string {
  return (
    { restaurant: "restaurants", gym: "gyms", import_export: "import/export companies", healthcare: "healthcare practices", accounting: "accounting firms" }[cat] ??
    "local businesses"
  );
}
