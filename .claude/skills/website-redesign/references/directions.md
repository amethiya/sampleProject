# Creative directions

Generated from packages/core/src/redesign/directions.ts by `npm run skill:catalog`. Do not edit by hand.

Each job gets one direction in `content.json → designDirection.creative`, chosen from the business's trade, its
material (photos, price lists) and brand, and never the same as the two most recent redesigns. The palette and fonts in
content.json are the ones picked for this business (brand accent applied, contrast checked); the options below show the
range. Build the direction faithfully: it is what makes each redesign look made for its business.

| Direction | Made for | Also fits | Photos | 3D |
|---|---|---|---|---|
| Cinematic Hospitality (`cinematic-hospitality`) | restaurant | cafe | some | none |
| Editorial Magazine (`editorial-magazine`) | restaurant, cafe, clothing | salon, retail, services | some | none |
| Swiss Precision (`swiss-precision`) | accounting, import_export, services | healthcare, retail | few | none |
| Warm Neighbourhood (`warm-neighbourhood`) | cafe, retail, services | restaurant, gym, salon | some | none |
| Clinical Calm (`clinical-calm`) | healthcare | accounting, salon, services | some | none |
| Bold Kinetic (`bold-kinetic`) | gym, clothing | services, retail | some | optional |
| Luxe Minimal (`luxe-minimal`) | salon, clothing | restaurant, retail, healthcare | many | none |
| Craft & Heritage (`craft-heritage`) | restaurant, retail, import_export | cafe, services, clothing | some | none |
| Global Trade (`global-trade-3d`) | import_export | services, accounting | few | feature |
| Bento Modern (`bento-modern`) | services, retail, accounting | gym, healthcare, import_export | some | optional |
| Organic Wellness (`organic-wellness`) | salon | healthcare, gym, cafe, retail | some | none |
| Immersive Showcase (`immersive-showcase`) | restaurant, clothing, services | salon, gym, retail, cafe | many | optional |

## Cinematic Hospitality (`cinematic-hospitality`)

The approved Rise & Shine / Edem system: a dark, candle-lit evening mood, a light classic display face, round cut-out plates floating in a dust splash, a cloud reveal onto a full-screen photo. The starter pages already implement it.

- **Hero:** Split: label, the business name as an echo heading, one real line and two outline buttons on the left; a round cut-out photo of the signature dish spinning in on a dust splash on the right.
- **Sequence:** Hero with round cut-out → Sticky cloud reveal onto a full-screen photo with one real line → Story with the info strip (location, hours, phone) → Offerings zigzag with round images and real prices → Signature cards → Remaining content → Visit / call to action over a dark photo → Four-column footer
- **Grid:** Centered 1200px container, generous 120px+ vertical rhythm, zigzag rows.
- **Type:** Display up to 7rem, light weight; body 16.5px/1.75 light grotesk; small tracked labels with a short gold rule. Pairings: Marcellus + Jost (Classic, Trajan-like capitals with a light grotesk.); Cormorant Garamond + Manrope (Elegant high-contrast serif.)
- **Palettes:** Espresso & Gold (dark: bg #0e0e0d, text #ece6da, accent #c9a55b); Midnight & Brass (dark: bg #0c1424, text #eef0f4, accent #c8a96a); Burgundy & Champagne (dark: bg #1c0c11, text #f3e9e4, accent #d8bc8c)
- **Imagery:** Warm, appetising close-ups; top-down plates cropped to circles; the dining room at night.
- **Signature components:** Loader counter + curtain, Echo headings, Round cut-out plates with dust, Sticky cloud reveal, Info strip with glowing line icons, Dotted-leader price lists
- **Motion:** The starter's motion.js: loader, echo headings collapsing, plates spinning in, cloud reveal, curtain page transitions.
- **3D:** none
- **Conversion:** Reserve / order card in the hero and a visit band over a dark photo.
- **Avoid:** Using this direction for non-hospitality trades

## Editorial Magazine (`editorial-magazine`)

A printed food or culture magazine: warm paper, very large serif headlines, an asymmetric 12-column grid, numbered chapters, pull quotes from the site's own words and photo essays with captions.

- **Hero:** Masthead hero: the business name set huge across the full width (clamp to 14vw), an issue-style line (city, trade, the year founded only if the site states it), and one tall photograph offset to the right third, breaking the grid.
- **Sequence:** Masthead hero → Contents strip listing every page as numbered chapters (01, 02 …) → Opening essay: the site's strongest paragraph with a drop cap beside a portrait photo → Menu / services as a two-column magazine list with dotted leaders and prices in small caps → Photo essay: 3 images in an asymmetric collage with captions → Pull quote from the site's own text in very large italic → Practical box (hours, address, phone) styled as a sidebar → Colophon footer
- **Grid:** 12-column grid with deliberate asymmetry (content on columns 2–8, images bleeding to the edge); hairline rules between sections; section numbers in the margin.
- **Type:** Display 6–10rem with tight tracking; italic for pull quotes; body 18px/1.65 serif or humanist sans; small caps for labels. Pairings: Fraunces + Newsreader (Soft, characterful serif with a reading serif.); Playfair Display + Source Serif 4 (High-contrast editorial serif.); DM Serif Display + DM Sans (Classic magazine pairing.)
- **Palettes:** Newsprint (light: bg #f4efe6, text #1b1916, accent #b0341f); Ink & Tomato (light: bg #fffdf8, text #141414, accent #d1462f); Olive Press (light: bg #eeeadf, text #22261c, accent #6b7a2e)
- **Imagery:** Documentary photographs with captions; mix one full-bleed image with smaller framed ones; black-and-white treatment allowed for archival shots.
- **Signature components:** Numbered chapter headers, Drop cap, Dotted-leader price list in two columns, Asymmetric photo collage with captions, Hairline rules, Pull quote (only the site's own words)
- **Motion:** Restrained and typographic: lines of the masthead slide up from a mask, rules draw in from left, images unveil with a clip-path wipe, nothing bounces. 400–700ms, ease-out.
- **3D:** none
- **Conversion:** A clear 'Reserve' / 'Order' text link in the header and a practical sidebar box repeated before the footer.
- **Avoid:** Round cut-out plates; Dark-everywhere backgrounds; Card grids; Glassmorphism

## Swiss Precision (`swiss-precision`)

International Typographic Style: a strict grid, one confident grotesk, large numerals, ruled tables and a single signal colour. Clarity is the luxury.

- **Hero:** Typographic hero: one statement from the site set very large and left-aligned over 8 of 12 columns, a ruled key-facts column on the right (location, hours, phone, services count as real facts), no photo or a single small one.
- **Sequence:** Typographic hero with key-facts column → Services as a numbered ruled index (01–0n) that expands into detail → Process or approach from the site's own text as numbered steps → Facts table (only facts from the site) → Contact block as a 3-column ruled grid → Footer with the full sitemap in columns
- **Grid:** Visible 12-column logic, 8px baseline, hard left alignment, hairline 1px rules, generous margins; no rounded corners.
- **Type:** Display 4.5–8rem, weight 500–600, tracking −0.03em; body 17px/1.6; tabular numerals for prices and numbers. Pairings: Inter Tight + Inter (Neutral, precise grotesk.); Instrument Sans + Instrument Sans (Contemporary grotesk with a condensed width for display.); Space Grotesk + IBM Plex Sans (Technical character.)
- **Palettes:** Paper & Signal Red (light: bg #f5f5f2, text #111111, accent #e3271b); White & Cobalt (light: bg #ffffff, text #0b1220, accent #1f4fe0); Graphite & Lime (dark: bg #121314, text #f2f2ef, accent #c6f432)
- **Imagery:** Few, carefully cropped photos (duotone or desaturated allowed); diagrams and numbers do the work.
- **Signature components:** Numbered ruled index, Key-facts column, Tabular price/fee table, Accordion service details, Big numerals
- **Motion:** Precise and quick: rules draw in, numbers tick up only when the number is in the site's text, rows reveal in a 40ms stagger, accordions spring open. 250–450ms.
- **3D:** none
- **Conversion:** A persistent 'Book a consultation' / 'Request a quote' button in the header plus a ruled contact grid; phone as a tel: link.
- **Avoid:** Decorative gradients; Rounded cards; Stock photos of handshakes; Script fonts

## Warm Neighbourhood (`warm-neighbourhood`)

The friendly local spot: sunny colours, rounded shapes, hand-drawn underlines and sticker badges, photos in soft frames. Approachable and human, never childish.

- **Hero:** Centered hero on a warm colour field: a friendly headline from the site with one word underlined by a hand-drawn SVG stroke, a cluster of 2–3 tilted photos in rounded frames, and a round sticker badge with a real fact (opening hours or neighbourhood).
- **Sequence:** Friendly hero with tilted photo cluster → What we do as 3–4 rounded tiles with line icons → Menu / products as tabbed categories → Story with a large photo and a wavy divider → Photo marquee of the business's own images → Visit us: map link, hours and phone in a big rounded card → Cheerful footer
- **Grid:** Fluid 1180px container, rounded 24–32px radii, wavy SVG section dividers, generous padding.
- **Type:** Display 3.5–6rem, rounded heavy weight; body 17px/1.7; handwritten accent font only for 1–3 short labels. Pairings: Bricolage Grotesque + Nunito Sans (Warm, quirky grotesk.); Young Serif + Figtree (Soft serif with a friendly sans.); Fredoka + Outfit (Rounded and approachable.)
- **Palettes:** Butter & Tomato (light: bg #fff6e3, text #2b1d12, accent #e2552c); Mint & Cocoa (light: bg #eef7f1, text #2a1f1a, accent #2e8b57); Peach & Plum (light: bg #fff0ea, text #2d1830, accent #8d3b72)
- **Imagery:** The business's own candid photos in rounded frames with slight rotation; people, counters, products.
- **Signature components:** Hand-drawn SVG underline, Sticker badge (real facts only), Tilted photo cluster, Tabbed menu, Wavy dividers, Photo marquee
- **Motion:** Playful but calm springs: photos settle into their tilt, the underline draws itself, tiles lift on hover, stickers rotate slowly. Spring stiffness ~200, damping ~20.
- **3D:** none
- **Conversion:** Big rounded 'Call us' / 'Order' buttons; on phones a sticky bottom bar with Call and Directions.
- **Avoid:** Dark luxury palettes; Thin hairline serif; Corporate stock photos

## Clinical Calm (`clinical-calm`)

Reassurance through clarity: airy light layouts, soft tints, large readable type, clear journeys (what we treat → how it works → book) and trust built only from real facts.

- **Hero:** Split hero on a soft tint: a plain-language promise from the site, two buttons (book / call) and real practical facts (hours, address) as chips; on the right a calm photo in a large soft-cornered frame with a small card overlapping it showing the opening hours.
- **Sequence:** Calm split hero with practical chips → Quick paths: 3–6 large tappable tiles to the main treatments/services pages → Treatments with short descriptions and 'learn more' links → How a visit works as numbered steps (only if the site describes it) → Team (only people named on the site) → Practical information: hours table, address with map link, insurance/payment notes from the site → FAQ accordion from the site's own Q&A → Footer with emergency info if the site lists it
- **Grid:** 1160px container, 12-column with 24px gutters, 16–20px radii, lots of white space; content width capped at 68ch for reading.
- **Type:** Display 3–5rem, weight 600; body 18px/1.7 (never below 16px); strong heading hierarchy for scanning. Pairings: Plus Jakarta Sans + Plus Jakarta Sans (Clear, friendly, accessible.); Manrope + Source Sans 3 (Calm geometric with a highly legible text face.); Lexend + Lexend (Designed for reading proficiency.)
- **Palettes:** Teal Clinic (light: bg #f4f8f9, text #0f2537, accent #0f7a8a); Soft Blue (light: bg #f5f7fc, text #13203b, accent #2457c5); Sage Care (light: bg #f5f8f4, text #1c2a22, accent #2f7d5b)
- **Imagery:** Bright, real practice photos; people and spaces; avoid scary clinical close-ups and generic stock smiles.
- **Signature components:** Practical chips, Quick-path tiles, Numbered steps, Hours table, FAQ accordion, Sticky mobile Book / Call bar
- **Motion:** Gentle and short: fades and 12px rises, 300–400ms, no parallax on text, no looping animation. Reduced motion = no movement at all.
- **3D:** none
- **Conversion:** Book / call above the fold, repeated after treatments, and a sticky Call button on phones (tel: link from the site).
- **Avoid:** Dark backgrounds; Dramatic motion; Tiny grey text; Invented credentials or ratings

## Bold Kinetic (`bold-kinetic`)

Energy and confidence: condensed oversized type, a high-voltage accent, diagonal cuts, marquees and scroll-driven motion that feels like a training session or a street-wear drop.

- **Hero:** Full-bleed photo with a strong dark duotone; a giant condensed headline that overflows the width in 2–3 stacked lines, one line knocked out in the accent colour; a marquee band of the site's own keywords (classes, programmes) running underneath.
- **Sequence:** Full-bleed kinetic hero → Marquee band of real offerings → Programmes / collection as large numbered panels that pin and swap on scroll → Schedule or prices table (from the site) → Photo grid with diagonal crops → Membership / visit CTA in a full-width accent block → Heavy footer with oversized wordmark
- **Grid:** Edge-to-edge sections, angled clip-path dividers (4–6°), tight 8px gaps in image grids, oversized type breaking containers.
- **Type:** Display 8–16rem condensed, uppercase, weight 800–900; body 16px/1.6. Pairings: Anton + Inter (Tall, punchy condensed.); Archivo + Archivo (Variable width: use the condensed axis for display.); Big Shoulders Display + Barlow (Industrial condensed.)
- **Palettes:** Blackout & Volt (dark: bg #0b0b0c, text #f4f4f1, accent #d7ff3a); Concrete & Orange (dark: bg #121314, text #f2f2ef, accent #ff5b1f); Chalk & Red (light: bg #f1f0ec, text #0f0f0f, accent #e5241b)
- **Imagery:** High-contrast action photos, dramatic light, grain; duotone in the accent colour for consistency.
- **Signature components:** Overflowing condensed headline, Keyword marquee, Pinned swapping panels, Angled dividers, Velocity-skewed images, Oversized footer wordmark
- **Motion:** Fast and physical: headline lines slam in with a short overshoot, marquee speed follows scroll velocity (springValue), panels pin and crossfade, images skew slightly with velocity. Keep it under 600ms per move.
- **3D:** optional: A slowly rotating low-poly kettlebell or product silhouette in the hero (Three.js, flat-shaded in the accent colour), only on desktop and only if it reads instantly.
- **Conversion:** 'Start / Join / Shop' in the accent colour everywhere it matters; trial or visit details in the CTA block.
- **Avoid:** Serif body text; Pastel palettes; Gentle fades only

## Luxe Minimal (`luxe-minimal`)

Quiet luxury: ivory and ink, a fine serif, vast white space, full-bleed photography and almost nothing else. Every element is placed, nothing is filler.

- **Hero:** A single full-bleed photograph (100svh) with the business name in a fine serif, small, centred low on the image; a one-line caption and a thin text link. Nothing else on the first screen.
- **Sequence:** Full-bleed quiet hero → A short statement from the site centred in a wide field of white → Alternating full-bleed image and narrow text column → Services / collection as an elegant list with prices aligned right in small caps → A horizontal gallery of the business's own photos → Appointment / visit details in a centred block → Minimal footer
- **Grid:** Narrow text measure (40–55ch) in wide margins; images full-bleed or on a 6-column offset; spacing in large steps (160–240px).
- **Type:** Display 3–6rem light (300) with generous tracking for small caps; body 16px/1.8; letter-spaced uppercase labels at 11–12px. Pairings: Cormorant + Jost (Fine, high-fashion serif.); Italiana + Manrope (Elegant display caps.); Bodoni Moda + Karla (Didone luxury.)
- **Palettes:** Ivory & Ink (light: bg #f7f3ec, text #1a1814, accent #1a1814); Bone & Bronze (light: bg #efe9df, text #221d17, accent #8a6a3f); Noir & Pearl (dark: bg #0f0f0f, text #efece6, accent #e9e2d4)
- **Imagery:** Large, consistent, editorial photos; warm natural light; avoid busy collages.
- **Signature components:** Full-bleed hero, Narrow statement block, Right-aligned small-caps price list, Horizontal gallery (scroll-driven, native scroll), Thin underline links
- **Motion:** Slow and silky: 900–1400ms fades, images scale from 1.06 to 1 as they enter, text fades with a 6px rise, no bounce, no stagger longer than 120ms.
- **3D:** none
- **Conversion:** Understated but always visible 'Book an appointment' link in the header; a full-width booking block near the end.
- **Avoid:** Bright accent buttons; Icons; Card grids; Busy motion

## Craft & Heritage (`craft-heritage`)

Made by hand, here, for years: textured paper, slab and old-style serifs, ledger-style price lists, stamp-like badges and honest photography of the work.

- **Hero:** A framed hero like a shop sign: the business name in a slab or old-style serif inside a double-ruled border, a stamp badge with a real fact (city, or the founding year only if stated), and a large photo of the craft beneath with a torn/deckled edge mask.
- **Sequence:** Sign-like framed hero → Our craft: the site's story with a photo of hands at work → Ledger price list / product catalogue with ruled lines and categories → Process in 3–4 illustrated steps (only steps the site describes) → Photo wall of the business's own images → Find us: address card like a postcard → Footer with a stamp wordmark
- **Grid:** 1140px container with framed panels, double rules, subtle paper texture via CSS gradients (no image files), 4px radii.
- **Type:** Display 3.5–6.5rem slab or old-style serif; body 17px/1.7 serif; small caps for categories. Pairings: Zilla Slab + Libre Franklin (Sturdy slab with a classic sans.); Rokkitt + Lora (Printed-matter feel.); Abril Fatface + Crimson Pro (Poster heritage.)
- **Palettes:** Kraft & Forest (light: bg #efe6d4, text #23251c, accent #2f5d3a); Parchment & Oxblood (light: bg #f3ead9, text #2a1a14, accent #7b2121); Workshop Navy (dark: bg #16202b, text #f1e9da, accent #d9a441)
- **Imagery:** Honest photos of the product and the people who make it; warm tones; slight grain allowed.
- **Signature components:** Double-ruled frames, Stamp badge (real facts only), Ledger price list, Deckled-edge image mask, Postcard address card
- **Motion:** Tactile: stamps press in (scale 1.15→1 with a tiny rotation), ledger rows write in from left, photos settle like placed prints. 350–600ms.
- **3D:** none
- **Conversion:** 'Visit the shop' / 'Order' buttons styled as labels; phone and address always one tap away.
- **Avoid:** Neon accents; Glassmorphism; Futuristic sans

## Global Trade (`global-trade-3d`)

A business that moves goods across borders: deep ocean tones, a live 3D globe with the routes and regions the site mentions, crisp data-like layout and mono labels.

- **Hero:** Dark hero with an interactive Three.js globe on the right (dots for landmasses, arcs for routes between places named on the site, slow auto-rotate, drag to turn) and on the left a statement from the site plus a 'Request a quote' button and real facts in mono labels.
- **Sequence:** Globe hero → Capabilities as a ruled grid with line icons → Products / markets as filterable chips or tabs (from the site) → How shipping works as a horizontal timeline (only if described) → Photo band of ports, warehouses or the products → Enquiry block with all contact details → Footer with offices
- **Grid:** 1200px container, 12 columns, 1px rules in 10% white, mono labels, 12px radii only on interactive elements.
- **Type:** Display 3.5–6rem, weight 600, tight tracking; mono labels 12px uppercase; body 16.5px/1.65. Pairings: Sora + Inter Tight (Technical geometric.); Space Grotesk + Space Mono (Logistic, data-like.); Manrope + JetBrains Mono (Clean with mono details.)
- **Palettes:** Deep Ocean (dark: bg #07131f, text #e8f0f7, accent #3fb0f0); Harbour Night (dark: bg #0b1418, text #ecf2f1, accent #2ed3a6); Container Orange (light: bg #f3f5f7, text #0d1b2a, accent #e8630a)
- **Imagery:** Ports, containers, warehouses and the actual products; desaturated with an accent-coloured overlay for consistency.
- **Signature components:** Three.js globe with route arcs, Mono labels, Ruled capability grid, Product tabs, Horizontal timeline
- **Motion:** Measured: the globe fades in and starts rotating, arcs draw along their path, grid cells reveal in a stagger, numbers tick only if in the text.
- **3D:** feature: Three.js globe (points sphere from a lat/lon grid, no external textures) with arcs between the business's city and places named on the site; lazy-init via IntersectionObserver; static SVG fallback when WebGL or motion is unavailable.
- **Conversion:** 'Request a quote' in the hero, header and enquiry block; email and phone as links.
- **Avoid:** Clip-art ships; Generic stock handshakes; Invented trade volumes or countries

## Bento Modern (`bento-modern`)

A contemporary product-company feel for a local business: a bento grid of real content tiles of different sizes, crisp sans, soft depth, interactive tiles that reward hovering, and one tasteful 3D or tilt moment.

- **Hero:** Headline and two buttons left; on the right a bento cluster of 4–5 tiles (a photo, the opening hours, the phone number, a service list, a location tile) with slight perspective tilt that straightens on scroll.
- **Sequence:** Bento hero → Services as a bento grid (one large feature tile, smaller tiles around) → Before/after or project gallery (only real images) → How it works in 3 cards (from the site) → Prices / packages table when the site lists them → FAQ from the site → Contact bento: map link, phone, email, hours → Footer
- **Grid:** 1200px container, CSS grid with 12 columns and dense auto-placement, 20px gaps, 20–28px radii, soft 1px borders and subtle shadows.
- **Type:** Display 3.5–6rem weight 600, tracking −0.035em; body 16px/1.6; tile titles 1.25rem. Pairings: Onest + Onest (Modern neo-grotesk.); Outfit + Inter (Friendly geometric with Inter.); Hanken Grotesk + Hanken Grotesk (Clean grotesk.)
- **Palettes:** Cloud & Indigo (light: bg #f6f7fb, text #0e1222, accent #4f46e5); Stone & Emerald (light: bg #f5f5f1, text #121612, accent #0f9d6b); Night & Coral (dark: bg #0d0f14, text #eef0f5, accent #ff6f59)
- **Imagery:** The business's own photos cropped tightly into tiles; product shots on clean backgrounds.
- **Signature components:** Bento grid, Tilt / spotlight tiles (UI kit), Perspective hero cluster, Pricing table, FAQ accordion
- **Motion:** Responsive and springy: tiles enter in a grid stagger, tilt follows the pointer (fine pointers only), the hero cluster flattens with scroll progress, buttons get a subtle shimmer.
- **3D:** optional: CSS 3D perspective on the hero bento cluster (no WebGL needed); optionally a small Three.js object representing the trade if it reads instantly.
- **Conversion:** Primary CTA in the hero and in the contact bento; sticky header button.
- **Avoid:** Text-only boxes; More than one accent colour; Gradient blobs everywhere

## Organic Wellness (`organic-wellness`)

Breathing room: earthy greens and clay, soft organic blob masks on photos, generous curves, gentle breathing motion. Calm, natural, restorative.

- **Hero:** Asymmetric hero: headline with an italic word, a calm paragraph and a booking button on the left; on the right a large photo inside an organic blob mask that slowly morphs, with a small leaf-line illustration in SVG.
- **Sequence:** Organic hero → Philosophy / story from the site in a centred calm block → Treatments or classes as soft cards with durations and prices (from the site) → A slow full-width photo band with one line of text → Practical details (hours, address, booking) in a rounded panel → Gallery in blob masks → Soft footer
- **Grid:** 1140px container, curved section edges (SVG), 28–40px radii, generous padding, asymmetric image placement.
- **Type:** Display 3.5–6rem, serif with italic accents; body 17px/1.75. Pairings: Gloock + Hanken Grotesk (Expressive serif with a calm grotesk.); Lora + Nunito Sans (Soft, organic.); Marcellus + Mulish (Classical calm.)
- **Palettes:** Sage & Clay (light: bg #f3f1ea, text #26302a, accent #a4593a); Moss & Sand (light: bg #efede4, text #1f2a20, accent #4c6b3c); Dusk Lavender (light: bg #f4f1f5, text #2a2430, accent #7a5c8e)
- **Imagery:** Natural light, plants, textures, hands, calm interiors.
- **Signature components:** Morphing blob mask, Curved section edges, Soft treatment cards, Line-art SVG accents
- **Motion:** Breathing: blob masks morph over 8–12s loops (paused for reduced motion), elements fade up slowly (700ms), no snapping.
- **3D:** none
- **Conversion:** Calm but clear 'Book' button repeated after treatments and in a sticky mobile bar.
- **Avoid:** Hard edges everywhere; Neon; Aggressive urgency

## Immersive Showcase (`immersive-showcase`)

Let the work speak: full-screen photography, scroll-driven chapters with sticky captions, a horizontal gallery and an image-led narrative. For businesses with strong visual material.

- **Hero:** Scroll-expanding media: a centred framed photo that grows to full screen as you scroll (UI kit scroll media expansion), with the business name splitting to either side.
- **Sequence:** Scroll-expanding hero → Chapters: 3–4 full-screen photo sections with sticky captions carrying the site's text → Horizontal gallery of the business's own photos (native scroll, scroll-linked translate) → Offer / menu summary in a clean two-column list → Visit / book over a full-bleed photo → Footer
- **Grid:** Full-bleed sections; captions in a 5-column sticky column; gallery cards at 60vw on desktop, 85vw on phones.
- **Type:** Display 4–9rem; captions 1.25rem; body 17px/1.7. Pairings: Syne + Inter (Expressive wide display.); Unbounded + Manrope (Wide, contemporary.); Playfair Display + Inter (Classic contrast.)
- **Palettes:** Gallery Black (dark: bg #0a0a0a, text #f2f0eb, accent #f0c35a); Gallery White (light: bg #fafaf8, text #111111, accent #111111); Deep Teal (dark: bg #0b1a1c, text #eef3f2, accent #f2a65a)
- **Imagery:** The business's own best photos at full size; only use stock where the site has none and keep it consistent.
- **Signature components:** Scroll media expansion (UI kit), Sticky captions, Scroll-linked horizontal gallery, Full-bleed CTA
- **Motion:** Scroll-driven: media expands with scroll progress, captions crossfade at chapter boundaries, the gallery translates with scroll. Native scrolling only; transforms and opacity only.
- **3D:** optional: A subtle WebGL (Three.js) image-plane ripple on the hero photo that follows the pointer on desktop; off on touch and for reduced motion.
- **Conversion:** A fixed small 'Book / Visit' pill bottom-right after the hero.
- **Avoid:** Using it when the site has fewer than 5 usable photos; Text over busy image areas without a scrim
