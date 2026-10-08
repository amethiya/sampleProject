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

  const domain = lead.website.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
  const subject = `${lead.name}: your redesigned website is ready to view`;
  const body = [
    `Hi ${lead.name} team,`,
    "",
    `I was looking at ${domain} and noticed a few things that may be costing you customers:`,
    "",
    ...points.map((p) => `• ${p}`),
    "",
    "So I rebuilt your website as a demo, using your own text and photos, with a modern design that works well on phones:",
    previewUrl,
    "",
    "Nothing has changed on your current site, and the demo isn't listed on Google.",
    "",
    "If you like it, I can turn it into your live website. Just reply to this email and we can go through the details. If it's not for you, no problem at all.",
    "",
    "Best regards,",
    senderName,
    "",
    "—",
    `You're receiving this one-time email because this address is listed on ${domain}. Reply "no thanks" and I won't contact you again.`,
  ].join("\n");

  const gmailUrl =
    "https://mail.google.com/mail/?view=cm&fs=1" +
    `&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return { to, subject, body, gmailUrl };
}
