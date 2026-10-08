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
- [ ] No external scripts. Only Google Fonts, the given images, images.unsplash.com and openstreetmap.org.
      No forms that submit, no fetch/XHR, no analytics.

## Professional standard
- [ ] Follows the layout template in `designDirection.layoutTemplate` and the palette, fonts and corner style.
- [ ] The first screen shows what the business is, where it is and the main action.
- [ ] Looks like a real business website: no 3D, particles, loaders, custom cursors, marquees, parallax,
      pinned/sideways sections, animated letters, wavy dividers or giant pill buttons.
- [ ] Only motion: one gentle fade-in and the header turning solid. `prefers-reduced-motion` respected.
- [ ] Text contrast is comfortable; body lines stay under ~75 characters; consistent spacing and alignment.

## Responsive
- [ ] Works from 360px to 1600px wide with no horizontal scrolling; mobile menu when nav doesn't fit;
      tap targets at least 44px.
