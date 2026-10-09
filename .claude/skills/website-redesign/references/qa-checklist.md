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
- [ ] External scripts only from content.json.libraries. Only Google Fonts, the given images, images.unsplash.com
      and openstreetmap.org otherwise.
      No forms that submit, no fetch/XHR, no analytics.

## Professional standard
- [ ] Follows the layout template in `designDirection.layoutTemplate`, the visual style in
      `designDirection.visualStyle`, and the palette, fonts and corner style.
- [ ] Every page in content.json has its own file, and every page's `links` (order online, menus, maps) are used.
- [ ] The first screen shows what the business is, where it is and the main action.
- [ ] Looks like a real, premium business website: no 3D, WebGL, particles, custom cursors or cartoonish effects.
- [ ] Motion follows references/motion.js: opening sequence, reveals, parallax, word brightening, page transitions.
- [ ] With scripts blocked, everything is visible; with `prefers-reduced-motion`, nothing animates.
- [ ] Scroll the whole page once in a browser: nothing is left hidden, and wheel, trackpad, keyboard and touch
      scrolling all work (no smooth-scroll library, no `scroll-behavior: smooth`).
- [ ] Text contrast is comfortable; body lines stay under ~75 characters; consistent spacing and alignment.

## Responsive
- [ ] Works from 360px to 1600px wide with no horizontal scrolling; mobile menu when nav doesn't fit;
      tap targets at least 44px.
