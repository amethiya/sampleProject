# QA checklist (run on every page before finishing)

## Content
- [ ] Every section from this page in content.json is present: every heading, paragraph and list item, in order,
      word for word, original language. Spot-check the first, middle and last item of long lists.
- [ ] Links from content.json are used (order online, gift cards, PDFs, maps, email, phone).
- [ ] Nothing invented: no reviews, prices, stats, awards, people or claims that aren't in content.json.
- [ ] The business's own images are used where they appear; stock fills gaps and is credited in the footer.

## Design system
- [ ] The theme in designDirection.theme is applied (colours and fonts); not plain black and white.
- [ ] Home follows the system: hero with round cut-out + dust, cloud reveal, story + info strip, offerings zigzag,
      cards, remaining content, visit CTA over a photo, four-column footer. Inner pages open with page-top.
- [ ] It looks better than the starter page, never worse. It would make a client say "wow".

## UI kit (Magic UI + Smooth UI)
- [ ] The ui-kit `<style>` and `<script>` from the starter are kept, and nothing else loads React, Tailwind or the
      libraries.
- [ ] Home uses at least 8 different kit components, each inner page at least 5, from both libraries, placed as in
      BRIEF.md's "UI kit placement" (scroll progress, shimmer + magnetic primary buttons, card spotlight/glow/tilt,
      scroll-reveal story paragraph, photo marquee when there are 4+ own photos, blur fade on content...).
- [ ] No kit effect on elements the motion script animates; no number ticker on a number that isn't in the text.
- [ ] With reduced motion and with scripts blocked, all text is visible and the page still reads well.

## Structure
- [ ] Concept banner at the top linking to this page's `originalUrl`.
- [ ] Navigation lists every page (main pages in the header, all pages in the mobile menu and footer).
- [ ] `<meta name="robots" content="noindex, nofollow">`, a `<title>`, `lang` set, valid HTML.
- [ ] External scripts only from content.json.libraries; fonts from Google Fonts; images from content.json and
      images.unsplash.com. No forms that submit, no fetch/XHR, no analytics.

## Motion and behaviour
- [ ] Loader, echo headings, plates spinning in, cloud reveal, reveals and page transitions work.
- [ ] Native scrolling (no smooth-scroll library, no `scroll-behavior: smooth`); wheel, keyboard and touch scroll.
- [ ] Storage access never throws; with scripts blocked everything is visible; reduced motion gets fades only.
- [ ] Scroll the whole page once: nothing is left hidden.

## Responsive
- [ ] 360px to 1600px with no horizontal scrolling; mobile menu; tap targets at least 44px.
