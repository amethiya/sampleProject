/**
 * Injected spam: hacked small-business sites often carry hidden gambling, pharma or loan text, sometimes in another
 * language (Union Oyster House had Ukrainian casino copy on its home page). It is not the business's content: it is
 * removed before a redesign brief is written (so Claude never sees it and QA never asks for it back), and counted so
 * the owner can tell the business its site is compromised.
 */
import type { SiteSnapshot } from "./crawl";

/**
 * Broken HTML on old sites leaks into crawled text as tag fragments ('<class="bottomnav">GIFT SHOP'). They are not
 * content: strip them so Claude doesn't have to choose between pasting markup and "missing" text in QA.
 */
const TAG = /<\/?[a-z!?][^<>]{0,200}>|<[a-z!?][^<>\s]*(?:\s[^<>]*)?$|&lt;\/?[a-z][\s\S]{0,200}?&gt;/gi;

export function stripMarkup(text: string): string {
  return text.replace(TAG, " ").replace(/\s{2,}/g, " ").trim();
}

/** A copy of the snapshot with markup fragments removed from every text (texts left empty are dropped). */
export function cleanMarkup(site: SiteSnapshot): SiteSnapshot {
  const fix = (t: string) => (/[<>]|&lt;|&gt;/.test(t) ? stripMarkup(t) : t);
  return {
    ...site,
    pages: site.pages.map((p) => ({
      ...p,
      title: fix(p.title),
      sections: p.sections
        .map((s) => ({ ...s, heading: fix(s.heading), paragraphs: s.paragraphs.map(fix).filter(Boolean), items: s.items.map(fix).filter(Boolean), links: s.links?.map((l) => ({ ...l, text: fix(l.text) })) }))
        .filter((s) => s.heading || s.paragraphs.length || s.items.length || s.images.length),
    })),
  };
}

const SPAM = /casino|казино|азарт|ставк[аи]|букмекер|\bbetting\b|\bbet\s*sites?\b|\bslots?\s+(?:online|machine|game)|\bpokies\b|\bjackpot|\bpoker\s+(?:online|room)|\bbookmaker|\bfree\s+spins|\bno\s+deposit\s+bonus|\bgamstop\b|\bviagra\b|\bcialis\b|\blevitra\b|\bpayday\s+loans?\b|\bescort\s+service|\bjokabey\b|\.bet\b|\bspins\b|\blive[- ]dealer/i;
const CYRILLIC = /[Ѐ-ӿ]/g;
const LETTERS = /\p{L}/gu;

/** Mostly Cyrillic text on a page whose other text is mostly not. */
function foreignScript(text: string, pageCyrillicShare: number): boolean {
  const letters = text.match(LETTERS)?.length ?? 0;
  if (letters < 40) return false;
  const share = (text.match(CYRILLIC)?.length ?? 0) / letters;
  return share > 0.6 && pageCyrillicShare < 0.2;
}

export function isInjectedSpam(text: string, pageCyrillicShare = 0): boolean {
  return SPAM.test(text) || foreignScript(text, pageCyrillicShare);
}

/** Share of Cyrillic letters in texts that aren't keyword spam; judged across the whole site, because spam can fill a page. */
function cyrillicShare(texts: string[]): number {
  const own = texts.filter((t) => !SPAM.test(t)).join(" ");
  return (own.match(CYRILLIC)?.length ?? 0) / Math.max(1, own.match(LETTERS)?.length ?? 0);
}

/** A copy of the snapshot without injected spam, plus what was removed. */
export function stripInjectedSpam(site: SiteSnapshot): { site: SiteSnapshot; removed: { page: string; text: string }[] } {
  const removed: { page: string; text: string }[] = [];
  const texts = site.pages.flatMap((p) => p.sections.flatMap((s) => [s.heading, ...s.paragraphs, ...s.items]));
  // Long Cyrillic passages are foreign on a site whose shorter, everyday text (nav labels, headings) is not.
  const everyday = cyrillicShare(texts.filter((t) => t.length < 120));
  const pages = site.pages.map((p) => {
    const keep = (t: string) => {
      if (!t || !isInjectedSpam(t, everyday)) return true;
      removed.push({ page: p.slug, text: t.slice(0, 160) });
      return false;
    };
    const sections = p.sections
      .map((s) => {
        // Injected spam arrives as a contiguous block, often inside the same container as real content, and much of it
        // uses brand names no keyword list keeps up with. Within a list, everything between the first and last spam
        // hit is the block; text before or after it is the business's own.
        const span = (list: string[]) => {
          const hits = list.map((t, i) => (isInjectedSpam(t, everyday) ? i : -1)).filter((i) => i >= 0);
          if (hits.length < 3) return list.filter(keep);
          const [lo, hi] = [hits[0], hits[hits.length - 1]];
          return list.filter((t, i) => {
            if (i < lo || i > hi) return keep(t);
            removed.push({ page: p.slug, text: t.slice(0, 160) });
            return false;
          });
        };
        return { ...s, heading: keep(s.heading) ? s.heading : "", paragraphs: span(s.paragraphs), items: span(s.items), links: s.links?.filter((l) => keep(l.text) && keep(l.href)) };
      })
      .filter((s) => s.heading || s.paragraphs.length || s.items.length || s.images.length);
    return { ...p, sections };
  });
  return { site: { ...site, pages }, removed };
}
