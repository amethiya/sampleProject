# QA checklist (run on every page before finishing)

## Content
- [ ] Every section from this page in content.json is present: every heading, paragraph and list item, in order,
      word for word, original language. Spot-check the first, middle and last item of long lists.
- [ ] The business's own images are used where they appeared; each `<img>` has `alt`, `loading="lazy"`,
      `referrerpolicy="no-referrer"`; a script hides images with `naturalWidth < 240`.
- [ ] Nothing invented: no reviews, prices, stats, awards, people or claims that aren't in content.json.

## Structure
- [ ] Concept banner at the top linking to this page's `originalUrl`.
- [ ] Navigation lists every page using the `link` values (`./`, `./<slug>`); the current page is marked.
- [ ] Contact block (address, phone, email, hours if present, OpenStreetMap link) and footer on every page.
- [ ] `<meta name="robots" content="noindex, nofollow">`, a `<title>`, `lang` set, valid HTML (all tags closed).
- [ ] Only allowed external hosts: scripts from content.json.libraries, Google Fonts, the given images,
      images.unsplash.com, openstreetmap.org. No forms that submit, no fetch/XHR, no analytics.

## Design
- [ ] Palette, fonts, hero layout, corners and concept from `designDirection` are applied.
- [ ] Layouts differ from `mustLookDifferentFrom`; sections are shaped by their content, not one repeated card.
- [ ] Text contrast is comfortable in all sections; body lines stay under ~75 characters.

## Motion
- [ ] One signature moment on the home page (3D chapter, kinetic headline or pinned gallery) chosen from the
      category profile.
- [ ] Scroll-scrubbed storytelling + eased one-shot reveals; no element animates without a reason.
- [ ] `prefers-reduced-motion` turns off smooth scroll and animation and shows everything.
- [ ] With JavaScript or WebGL unavailable, all content is still visible and readable.
- [ ] WebGL renders only while visible; devicePixelRatio capped at 2.

## Responsive
- [ ] Works from 360px to 1600px wide with no horizontal scrolling; mobile menu when nav doesn't fit;
      tap targets at least 44px; pinned/horizontal sections fall back to native scroll on small screens.
