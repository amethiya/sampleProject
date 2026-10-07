import type { AuditResult } from "./types";

interface Signal {
  points: number;
  reason: string;
}

const OLD_GENERATORS = /frontpage|dreamweaver|iweb|golive|netobjects|homestead|web\s?easy|joomla!? 1\.|wordpress [1-4]\./i;
const OLD_BUILDERS = /weebly|jimdo|yola|homestead\.com|websitebuilder|mywebsite|ionos|site123|webs\.com|tripod|angelfire|godaddysites/i;
const MODERN_MARKERS =
  /__NEXT_DATA__|data-reactroot|id="__nuxt"|webflow|squarespace|static\.wixstatic|framerusercontent|cdn\.shopify|_astro\/|___gatsby|data-svelte|elementor-kit/i;

export function auditHtml(html: string, finalUrl: string, now = new Date()): AuditResult {
  const signals: Signal[] = [];
  const add = (points: number, reason: string) => signals.push({ points, reason });
  const lower = html.toLowerCase();
  const https = finalUrl.startsWith("https://");

  if (!https) add(15, "No HTTPS");
  if (!/<meta[^>]+name=["']?viewport/i.test(html)) add(20, "Not mobile-friendly (no viewport meta)");
  if (!/^\s*(<!--[\s\S]*?-->\s*)*<!doctype html>/i.test(html)) add(8, "Legacy or missing HTML5 doctype");

  const tables = count(lower, /<table/g);
  const divs = count(lower, /<div/g);
  if (tables >= 3 && tables * 4 > divs) add(10, `Table-based layout (${tables} tables)`);

  const deprecated = ["font", "center", "marquee", "blink", "frameset", "frame"].filter((t) =>
    new RegExp(`<${t}[\\s>]`, "i").test(html),
  );
  if (deprecated.length) add(Math.min(12, deprecated.length * 4), `Deprecated tags: <${deprecated.join(">, <")}>`);

  if (/\.swf\b|shockwave|swfobject/i.test(html)) add(10, "Uses Flash");
  if (/\s(bgcolor|background)=["']?[#\w]/i.test(html) || /spacer\.gif/i.test(html)) add(5, "Presentational HTML attributes / spacer GIFs");

  const jq = html.match(/jquery[.-]?(\d)\.(\d+)(?:\.\d+)?(?:\.min)?\.js/i);
  if (jq) {
    const major = Number(jq[1]);
    if (major < 2) add(8, `Very old jQuery ${jq[1]}.${jq[2]}`);
    else if (major < 3) add(4, `Old jQuery ${jq[1]}.${jq[2]}`);
  }

  const year = latestCopyrightYear(html);
  if (year) {
    const age = now.getFullYear() - year;
    if (age >= 5) add(10, `Copyright year ${year} (${age} years old)`);
    else if (age >= 3) add(5, `Copyright year ${year}`);
  }

  const gen = html.match(/<meta[^>]+name=["']?generator["']?[^>]+content=["']([^"']+)/i)?.[1];
  if (gen && OLD_GENERATORS.test(gen)) add(10, `Built with ${gen}`);

  const inlineStyles = count(lower, /\sstyle=/g);
  if (inlineStyles > 60) add(5, `Heavy inline styling (${inlineStyles} style attributes)`);

  const imgs = html.match(/<img\b[^>]*>/gi) ?? [];
  const noAlt = imgs.filter((i) => !/\balt=["'][^"']+/i.test(i)).length;
  if (imgs.length >= 4 && noAlt / imgs.length > 0.5) add(3, "Most images lack alt text");

  if (!/<meta[^>]+name=["']?description/i.test(html)) add(3, "No meta description");
  if (!/<meta[^>]+property=["']?og:/i.test(html)) add(2, "No social preview tags");
  if (!/@media/i.test(html) && !/<link[^>]+media=/i.test(html) && !/bootstrap|foundation/i.test(html))
    add(5, "No responsive CSS detected");

  // Responsive-but-dated: old stacks and UX patterns that still look low-effort today.
  const wp = html.match(/wp-(?:includes|content)[^"']*\?ver=(\d)\.(\d)/i) ?? gen?.match(/wordpress (\d)\.(\d)/i);
  if (wp && Number(wp[1]) < 6) add(8, `Old WordPress ${wp[1]}.${wp[2]}`);
  const bs = html.match(/bootstrap\/(\d)\.\d|bootstrap[.-](\d)\.\d/i);
  const bsMajor = bs ? Number(bs[1] ?? bs[2]) : 0;
  if (bsMajor && bsMajor <= 3) add(5, `Bootstrap ${bsMajor}`);
  if (/jquery-migrate/i.test(html)) add(3, "Relies on jquery-migrate");
  if (/revslider|nivo-?slider|flexslider|jquery\.cycle|camera_wrap|layerslider/i.test(html)) add(5, "Dated image-slider plugin");
  if (/google-analytics\.com\/(ga|urchin)\.js|_gaq\.push|['"]UA-\d+-\d+['"]/i.test(html)) add(4, "Legacy Google Analytics (pre-GA4)");
  if (/<!--\[if (lt |lte )?IE/i.test(html) || /X-UA-Compatible[^>]+IE=(Emulate)?IE?[5-9]/i.test(html)) add(4, "Internet Explorer hacks");
  if (!/<(header|nav|main|section|footer|article)[\s>]/i.test(html)) add(6, "No HTML5 semantic structure");
  if (count(lower, /<br\s*\/?>/g) > 25) add(4, "Layout built with line breaks");
  if (/<(table|div|td)[^>]+width=["']?\d{3,4}["'\s>]/i.test(html) || /width:\s*(9[0-9]{2}|7[0-9]{2}|8[0-9]{2})px/i.test(html))
    add(5, "Fixed-width layout");
  if (imgs.length >= 6 && !/srcset=|loading=["']lazy/i.test(html)) add(3, "No responsive or lazy-loaded images");
  if (OLD_BUILDERS.test(html) || (gen && OLD_BUILDERS.test(gen))) add(6, "Built on a dated site builder");
  if (!/<link[^>]+rel=["']?(shortcut )?icon/i.test(html)) add(2, "No favicon");

  if (MODERN_MARKERS.test(html)) add(-15, "Modern framework/builder detected");

  const score = Math.max(0, Math.min(100, signals.reduce((s, x) => s + x.points, 0)));
  return { score, reasons: signals.filter((s) => s.points > 0).map((s) => s.reason), finalUrl, https };
}

function count(s: string, re: RegExp): number {
  return s.match(re)?.length ?? 0;
}

function latestCopyrightYear(html: string): number | undefined {
  const years = [...html.matchAll(/(?:©|&copy;|copyright)\s*(?:[\w.,\s-]{0,30}?)((?:19|20)\d{2})(?:\s*[-–]\s*((?:19|20)\d{2}))?/gi)]
    .map((m) => Number(m[2] ?? m[1]))
    .filter((y) => y > 1990);
  return years.length ? Math.max(...years) : undefined;
}
