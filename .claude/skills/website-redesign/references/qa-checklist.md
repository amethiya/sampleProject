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

## Creative direction
- [ ] The page follows designDirection.creative: its hero composition, sequence (adapted to the real content), grid,
      typography (fonts from its googleFontsUrl) and palette tokens.
- [ ] It does not read as a template: swapping the business name would not make it fit another business.
- [ ] The primary action is on the first screen, repeated after the key content, and one tap away on phones.

## UI kit (Magic UI + Smooth UI)
- [ ] The ui-kit `<style>` and `<script>` from the starter are kept, and nothing else loads React, Tailwind or the
      libraries.
- [ ] Home uses at least 8 different kit components, each inner page at least 5, from both libraries, placed as in
      BRIEF.md's "UI kit placement" (scroll progress, shimmer + magnetic primary buttons, card spotlight/glow/tilt,
      scroll-reveal story paragraph, photo marquee when there are 4+ own photos, blur fade on content...).
- [ ] The kit is restyled with the palette and paced to the direction's motion language.
- [ ] No kit effect on elements your own Motion code animates; no number ticker on a number that isn't in the text.
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
- [ ] Reduced motion gets no movement. 3D (only if allowed) is lazy, paused off-screen, with a static fallback.

## Responsive and accessible
- [ ] 360px to 1600px with no horizontal scrolling; mobile menu; tap targets at least 44px.
- [ ] Text contrast at least 4.5:1 (3:1 for large text), including text over photos (use a scrim).
- [ ] Visible keyboard focus; alt text on content images (alt="" on decorative ones); every link and button has
      an accessible name.
