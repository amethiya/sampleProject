# Quality bar: what a "wow" redesign looks like

The owner's standard: a client opens the redesign and says "oh wow", and it looks made for that business.

The approved reference is the **Union Oyster House** redesign (America's oldest restaurant, Boston). Every redesign is
now built in its house style ("House Editorial"): the layout adapts to each business's content, while the look, type,
motion and the seven house colour themes stay the same. Earlier lessons still hold: a random palette with text-only
boxes reads as "you just changed the colours", and a flat, correct layout reads as "a little good, not that much".

## First screen
- An editorial hero: a small eyebrow row (trade · city, phone), the business's name or its own strongest claim as a
  huge two-line Caslon headline with the last word in the accent italic, a short real paragraph and two buttons
  beside it on desktop.
- Below it, the business's best wide photograph inside the page margins. As the visitor scrolls it grows to full
  screen, the headline drifts away, and a dark scrim, a caption built from real facts and up to three real figures
  (the founding year rolling in, phone, hours) arrive, with a slowly turning seal. Never text over the busy part of a
  photo without the scrim.

## Pacing like a magazine
1. Opening curtain (once per session), then the hero and expanding photograph
2. A ribbon of the business's real facts, moving slowly
3. No. 01: the opening sentence of the story as a large statement that lights up word by word; the rest of the story
   beside two overlapping parallax photographs, with a pull quote from the site
4. No. 02: the main offer (menus, services, history) as numbered panels on a horizontal track driven by scrolling
5. The remaining content, each with a numbered head, a masked heading and its own photos
6. The business's photos as a bento grid
7. An index of the other pages whose photo follows the pointer
8. The visit band in inverse colours, then a footer with a large wordmark

## Craft details
- Type: Libre Caslon Display for headlines (up to ~9.5rem in the hero), Libre Caslon Text italics for accent words,
  Instrument Sans for text; tracked uppercase labels; "No. 01" section heads in italic serif.
- Colour: only the seven house themes (themes.md). The site opens in its theme and the header's palette button switches
  between all seven with a circular reveal; the choice is remembered per site.
- Photography: large and cropped with intent; the business's own first, archive photos where it has them, stock only
  to fill gaps and credited. Photos sit in frames and drift slowly (parallax).
- Sharp corners, hairline rules, generous white space, asymmetric splits (4/8, 5/7). No rounded cards, gradients,
  glassmorphism or neon.
- Motion: the owner asked for animation that makes people say "wow", done professionally: masked headlines, the
  expanding hero, the word-by-word statement, the horizontal track, the pointer-following preview, parallax, a
  magnetic primary button, the scroll-progress hairline and the circular theme reveal. Purposeful, never in the way
  of reading; all of it off with reduced motion. Scrolling stays native: a smooth-scroll library once broke scrolling
  for the owner.
- Every overlay is checked for contrast: image at z-index 0, scrim at 1, text at 2.
- Check every page on desktop and phone with screenshots before calling it done; fix anything that reads as a
  template.

## Retired
The earlier "Cinematic Hospitality" system (dark candle-lit hero, round cut-out plates in a dust splash, echo headings,
cloud reveal, counter loader) is retired. QA rejects its pieces.
