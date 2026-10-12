import { businessNoun, type Findings } from "./findings";
import type { Lead } from "./types";

export interface Pitch {
  to: string;
  subject: string;
  body: string;
  gmailUrl: string;
}

const article = (noun: string) => (/^[aeiou]/i.test(noun) ? "an" : "a");
const lc = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const plural = (noun: string) =>
  /(s|sh|ch|x)$/.test(noun) ? `${noun}es` : /[^aeiou]y$/.test(noun) ? `${noun.slice(0, -1)}ies` : noun.endsWith("'s practice") ? noun.replace("'s practice", "s' practices") : `${noun}s`;

/** Findings for leads audited before profiles existed, from their audit reasons only. */
function legacyFindings(lead: Lead): Findings {
  const r = lead.audit.reasons;
  const any = (re: RegExp) => r.some((x) => re.test(x));
  return {
    design: any(/Table-based|Fixed-width|Deprecated|Copyright year|slider|site builder/) ? ["The layout and styling are built with old techniques, so it looks dated"] : [],
    technology: [
      ...r.filter((x) => /jQuery|WordPress|Bootstrap|Flash|Internet Explorer|Built with/.test(x)),
      ...(!lead.audit.https ? ["No HTTPS: browsers mark the site \"Not secure\""] : []),
    ],
    userExperience: any(/semantic structure|line breaks/) ? ["The page has no clear structure, which makes information hard to find"] : [],
    mobile: any(/mobile-friendly|responsive CSS|Fixed-width/) ? ["The site doesn't adapt to phone screens"] : [],
    seo: [...(any(/meta description/) ? ["No meta description, so Google writes its own snippet"] : []), ...(any(/social preview/) ? ["No social preview tags"] : [])],
    aiSearch: [],
  };
}

/**
 * The first email to a business: what is holding its website back (only what the audit measured), what we would do
 * (modern design, mobile, SEO, AI search), and the free preview already built for them. Plain text, one link, an
 * opt-out line. The noun follows the business type: "the best gym in Austin", "the best hair salon in Vienna".
 */
export function buildPitch(lead: Lead, previewUrl: string, senderName: string): Pitch | null {
  const to = lead.contacts.emails[0];
  if (!to) return null;

  const f = lead.profile?.findings ?? legacyFindings(lead);
  const noun = lead.profile?.businessNoun ?? businessNoun(lead.category, lead.kind, lead.name);
  const city = lead.city;
  const domain = lead.website.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
  const tech = lead.profile?.tech;
  const stack = [tech?.cms && tech.generator ? tech.generator : tech?.cms, ...(tech?.libraries ?? [])].filter(Boolean).slice(0, 3) as string[];

  const problems: string[] = [];
  // 1. Old design and old technology (always: a lead only qualifies with an outdated score).
  const design = f.design[0] ? `${f.design[0]}.` : `The design looks dated next to other ${plural(noun)} in ${city}.`;
  const insecure = f.technology.some((x) => /HTTPS/.test(x));
  const techLine = stack.length ? ` It also runs on older technology (${stack.join(", ")})` : f.technology.some((x) => !/HTTPS/.test(x)) ? " It also runs on older web technology" : "";
  problems.push(`Outdated design and technology: ${lc(design)}${techLine ? `${techLine}${insecure ? ", and without HTTPS browsers label it \"Not secure\"" : ""}.` : insecure ? " Without HTTPS, browsers label it \"Not secure\"." : ""}`);
  // 2. Not user-friendly / user interface.
  if (f.userExperience.length) problems.push(`Not user-friendly: ${f.userExperience.slice(0, 2).map(lc).join("; ")}.`);
  // 3. Mobile.
  if (f.mobile.length) problems.push(`Not built for phones: ${lc(f.mobile[0])}. Most people look for ${article(noun)} ${noun} on their phone today.`);
  // 4. SEO.
  if (f.seo.length) problems.push(`Search engines (SEO) aren't set up: ${f.seo.slice(0, 3).map(lc).join("; ")}. That makes it harder for people in ${city} to find you on Google.`);
  // 5. AI search.
  if (f.aiSearch.length) problems.push(`AI assistants aren't recommending you: more and more people ask ChatGPT, Google Gemini or Perplexity for "the best ${noun} in ${city}". These assistants suggest businesses whose websites clearly state what they offer, where they are and when they're open. ${f.aiSearch[0].replace(/^The site doesn't/, "Your site doesn't")}, so your ${noun} is unlikely to be suggested.`);

  const subject = `${lead.name}: a new website for your ${noun} (free preview inside)`;
  const body = [
    `Hi ${lead.name} team,`,
    "",
    `I came across ${domain} while looking at ${plural(noun)} in ${city}, and I wanted to share a few things that may be costing you customers:`,
    "",
    ...problems.map((p) => `• ${p}`),
    "",
    `Here's how I can help ${lead.name} grow:`,
    "",
    `• A modern, fast and easy-to-use design that reflects the quality of your ${noun}`,
    "• Full mobile support: the website adapts to every phone and tablet",
    "• SEO set up properly, so customers find you on Google",
    `• AI-search ready, so assistants like ChatGPT can recommend you when someone asks for the best ${noun} in ${city}`,
    "",
    "To show you what this could look like, I've already built a free preview of your new website, using your own text and photos:",
    previewUrl,
    "",
    "You can switch between colour themes on the page and pick the one you like best.",
    "Nothing has changed on your current site, and the preview isn't listed on Google.",
    "",
    "If you like it, just reply to this email and I'll walk you through the next steps. If it's not for you, no problem at all.",
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
