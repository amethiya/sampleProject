# QA checklist (run on every page before finishing)

An automated browser QA (apps/cli/src/qa.ts) measures most of these afterwards at 1440px, 820px and 390px; catch
them yourself first.

## Content
- [ ] Every section from this page in content.json is present: every heading, paragraph and list item, in order,
      word for word, original language. Spot-check the first, middle and last item of long lists. (QA measures
      coverage: below 85% on any page is a critical defect.)
- [ ] Links from content.json are used (order online, gift cards, PDFs, maps, email, phone).
- [ ] Nothing invented: no reviews, ratings, prices, stats, awards, certifications, people or claims that aren't in
      content.json. No placeholder text (lorem ipsum, TODO, example.com, 123-456-7890).
- [ ] The business's own images are used where they appear; stock fills gaps and is credited in the footer.

## House style
- [ ] The page follows designDirection.creative (House Editorial, house-style.md): the editorial hero with the
      expanding photograph, the fact ribbon, the statement, the track, the index, the visit band and the footer,
      adapted to the real content; fonts from its googleFontsUrl.
- [ ] `<html data-theme>` is designDirection.theme; the tokens of all seven house themes are in the CSS; the header's
      theme picker lists all seven, switches without a reload (circular reveal), remembers the choice and works with
      the keyboard. No colour outside the theme tokens (photo scrims excepted).
- [ ] It does not read as a template: the photos, words, figures and crops are this business's.
- [ ] The primary action is on the first screen, repeated in the visit band and footer, and in the header.

## UI kit and motion
- [ ] Only the kit components listed in content.json `uiKit`, restyled with the theme tokens; nothing loads React,
      Tailwind or the libraries.
- [ ] The house motion system is built: curtain once per session, masked headlines, expanding hero with caption and
      rolling figures (real numbers only), ribbon, word-by-word statement, horizontal track on desktop, pointer
      preview, parallax, magnetic primary button. None of the retired system: no counter loader, echo headings, round
      plates, dust or cloud reveal.
- [ ] No kit effect on elements the motion script already animates; no rolling figure or ticker on a number that
      isn't in the text.
- [ ] With reduced motion and with scripts blocked, all text is visible and the page still reads well.

## Structure
- [ ] Concept banner at the top linking to this page's `originalUrl`.
- [ ] Navigation lists every page (main pages in the header, all pages in the mobile menu and footer); every
      internal link uses a `link` value from content.json.
- [ ] `<meta name="robots" content="noindex, nofollow">`, a `<title>`, `lang` set, exactly one `<h1>`, valid HTML.
- [ ] External scripts only from content.json.libraries; fonts from Google Fonts; images from content.json and
      images.unsplash.com. No forms that submit, no fetch/XHR, no analytics.

## Motion and behaviour
- [ ] Entrance animations start from states set in script; with scripts blocked everything is visible.
- [ ] Scroll the whole page once: nothing is left hidden (QA counts elements still invisible after a scroll).
- [ ] Native scrolling (no smooth-scroll library, no `scroll-behavior: smooth`); wheel, keyboard and touch scroll.
- [ ] Storage access never throws (the preview is sandboxed); no script errors in the console.
- [ ] Reduced motion gets no movement and no curtain. No WebGL.

## Responsive and accessible
- [ ] 360px to 1600px with no horizontal scrolling; mobile menu; tap targets at least 44px.
- [ ] Text contrast at least 4.5:1 (3:1 for large text), including text over photos (use a scrim).
- [ ] Visible keyboard focus; alt text on content images (alt="" on decorative ones); every link and button has
      an accessible name.
