# Quality bar: what a "wow" redesign looks like

The owner's standard: a client opens the redesign and says "oh wow". Our first attempts at Rise & Shine Biscuit
Kitchen failed that test twice: a random palette with text-only boxes read as "you just changed the colours", and a
brand-correct but flat menu-board layout read as "a little good, not that much". The version that passed did these
things. Aim for all of them on every site.

## First screen
- A cinematic hero: a split layout with a deep, near-black panel for the headline and a large, beautiful photograph
  filling the other side (never text over the busiest part of a photo).
- One huge, elegant headline from the site's own words (Rise & Shine: "Biscuits baked fresh daily", from its menu),
  a short real paragraph under it, two calls to action.
- The most useful action as a designed object on the photo: an "Order for pickup" glass card listing every location
  with an Order button. For other trades: a booking card, opening hours card, or quote request card.

## Pacing like a magazine
Alternate light and dark sections, and photo-led and type-led sections:
1. Hero (dark, photo)
2. Intro statement in large serif type beside a portrait photo (light)
3. Signature offer as a feature (dark): the six named biscuit sandwiches in large serif names with prices in the
   accent colour, sticky photo alongside; the basics as a dotted-leader price list underneath
4. Full-bleed photo band with one press quote in very large type over a strong dark overlay
5. A secondary story (coffee from their roaster) as a split section with photo and a small price table
6. Location cards with hover lift
7. A bold accent-colour band for the main conversion message (call ahead, book now)
8. Two cards linking to the remaining sections (gallery, gift cards)
9. A rich dark footer with a big closing line, every location and all page links

## Craft details
- Type: an expressive display serif (Gloock) with a clean grotesk (Hanken Grotesk); headline sizes up to ~8rem;
  generous line height for body; small tracked eyebrows used sparingly.
- Colour: near-black warm ink, cream paper, one confident accent (butter yellow) for actions, one secondary warm
  tone for eyebrows. Taken from the brand (their black-and-white printed menu), not a random palette.
- Photography: large, warm, appetising, consistent; real photos of what the business sells. Stock is credited.
- Inner pages open with a photo header (dark gradient for legibility) or a big type header; never a bare title.
- Pill buttons with an arrow that nudges on hover; underline-on-hover nav; subtle image zoom on hover.
- Motion (references/motion.js): the owner scored the static version 6/10 and asked for "beautiful animation".
  Curtain and hero opening sequence, photo reveals, parallax, word-by-word statements, sequenced
  content, a slow ticker and curtain page transitions lift it to the expected level. The owner still rated subtle motion 6/10 and asked for "full animation": add
  scroll-driven set pieces (pinned hero that opens the photo to full screen, a sideways gallery of the signature
  offer, a circle-burst colour band, a loader counter). Scrolling stays native: a smooth-scroll library broke scrolling for the owner.
- Every overlay is checked for contrast: image at z-index 0, gradient at 1, text at 2.
- Check every page on desktop and phone with screenshots before calling it done; fix anything that reads as a
  template.

## Owner's reference: "Edem Restaurant" (Olga Malinovska), shared as the standard to match
- One consistent dark theme (#0e0e0d), cream text, a muted gold accent (#c9a55b) used only for thin lines, icons
  with a soft glow, prices and labels. No other colours.
- A light, classic display face (Marcellus, which also matches Trajan-style logos) with a light grotesk (Jost 300);
  small "Discover" labels with a short gold rule above each section title; thin rectangular outline buttons whose
  fill wipes up on hover.
- Cut-out round plates of food floating on black with a flour/spice splash beside them (make them by cropping
  top-down photos to a circle with transparency and embedding as WebP); they spin into place on load and roll in
  from the side, turning, in a zigzag menu.
- Headings arrive as three outlined "ghost" copies that collapse into the real line.
- A cinematic transition: flour clouds part as you scroll to reveal a full-screen photo with one line of text.
- An info strip with thin gold line icons (locate us, open hours, call ahead), a row of service icons that glow on
  hover, a sliding row of press quotes with arrow controls, and an "Order for pickup" section over a dark photo.
- Loader with a counter and a thin gold line; curtain page transitions.
- Footer (the owner asked for a proper one): a call-to-action band (open hours line in large display type with the
  main action buttons) over a thin gold rule; then four balanced columns: brand (logo, one real line about the
  business, email), Explore and More link columns (current page in gold), and every location with address, phone,
  hours and Order / Map links; a huge faint outlined wordmark; a bottom bar with domain, concept + photo credit and a
  Back to top button. Never one long column of links or a lone email button.
