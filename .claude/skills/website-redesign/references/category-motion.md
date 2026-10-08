# Category → motion profile

Pick the row for `business.category` (or the closest one), then let `designDirection.concept` push it further.
Each profile names a **signature moment** (one per home page), a **3D subject**, the **motion character**, and
**section ideas** that suit typical content of that kind of business.

| Category | Signature moment | 3D subject (primitives) | Motion character | Section ideas |
|---|---|---|---|---|
| Restaurant | Pinned chapter: a plate/cloche or brass rings turning slowly while dishes or menu headings appear | Brass rings, plate + cloche, wine glass (lathe) | Slow, warm, candle-lit; long eases, soft parallax on food photos | Priced menu with category sidebar, chef/story editorial, opening hours card, reservation call-to-action band |
| Café / coffee | Steam particles rising from a cup as the headline sharpens | Cup + saucer + floating beans | Gentle, cosy, morning light; small playful hovers | Drinks board list, pastry gallery, "visit us" with map, loyalty/opening hours |
| Gym / fitness | Kinetic headline (letters slam in, stagger) over a rotating chrome dumbbell | Dumbbell, kettlebell (sphere + torus) | Fast, punchy, high contrast; snappy eases, velocity-skewed marquee | Class timetable table, trainer grid, membership list, before/after counters only if real |
| Salon / beauty | Faceted gem or silk ribbon turning in soft light while services fade in | Gem (octahedron, transmission), ribbon (tube along curve) | Soft, elegant, airy; blur-to-focus text, slow scale reveals | Services & prices list, stylist portraits, gallery of work, booking band |
| Clothing / fashion | Editorial horizontal pinned gallery of the shop's photos with oversized type | Gem or fabric plane with gentle wave (vertex sine) | Editorial, confident; large type moves, mask reveals on images | Collection grid, lookbook horizontal scroll, store info, brand story |
| Retail shop | Product turntable: hero object rotates as you scroll, captions on alternate sides | Gem / gift box (boxes + ribbon tori) | Friendly, crisp; hover lifts, staggered grid reveals | Category tiles, featured products from content, store hours, location |
| Healthcare | Calm chapter: capsules and a cross float apart and reassemble | Capsules, cross, soft blobs (spheres) | Calm, reassuring, precise; no aggressive motion | Services list with icons, team, first-visit info, insurance/payment info, contact |
| Accounting / finance | Precise grid: coin stacks rise, real numbers count up | Coin stacks (cylinders), bar blocks | Exact, measured; linear-ish eases, clean wipes | Services, process timeline (only if sequential), credentials, contact form-free CTA |
| Import / export | Globe with containers orbiting and route arcs | Wire globe, container boxes, arc tubes | Global, logistical; orbit camera, line-drawing routes | Services, sectors served, process, countries (only if in content) |
| Local services (law, real estate, trades, photography) | Swiss-style headline with a single precise object or icon set animating in | Gem / simple tool forms (boxes, cylinders) | Clean, trustworthy, Swiss grid; restrained | Services list, about, portfolio/cases from content, contact |

## Concept modifiers

| Concept | Push the profile towards |
|---|---|
| Cinematic | Full-bleed imagery, slow camera moves, dark grading, letterbox-like sections |
| Editorial magazine | Oversized serif headlines, columns, pull quotes, thin rules, asymmetric grids |
| Swiss modern | Strict grid, flush-left type, numbered sections only when the content is a sequence |
| Quiet luxury | Whitespace, small refined type, slow fades, few elements per screen |
| Bold poster | Huge condensed type, colour blocks, kinetic text, velocity marquee |
| Warm organic | Rounded shapes, warm tones, gentle parallax, flowing transitions |
| Precise tech | Thin borders, monochrome base + one accent, data-like detail, snappy motion |
| Gallery | Photography first, pinned horizontal sequences, captions, minimal chrome |

## Motion styles observed on prompt-motion.com

prompt-motion.com collects motion pieces made with Claude, with their creators' prompts and skills (those prompts
belong to their creators — learn the techniques, don't copy the text). Most entries are **showreels, product
launch/promo films, concept explainers and animated data pieces**, built mainly with **SVG/HTML** and planned as
**scenes or beats**, with some Three.js, grain, risograph and line-art looks. The styles worth borrowing:
- **Storyboard first** — plan each page as 4–6 beats (hook, who they are, what they offer, proof from the content,
  visit/contact), each with one clear motion idea and timing, instead of random effects.
- **Showreel hook** — the home page opens like a reel: a fast, confident title sequence (kinetic type, mask wipes)
  that settles into the hero within ~2 seconds.
- **Product-promo reveals** — services or products introduced one at a time with a focused reveal (scale-in,
  clip wipe, a short caption), like feature cards in a launch film.
- **Kinetic typography** — words and letters as the main actors: staggered entrances, masks, scale/skew, rhythm.
- **SVG motion graphics** — line drawing (stroke-dashoffset), morphing shapes, icon choreography, route lines.
- **Animated data** — only for real numbers in the content (years, prices, opening hours): count-ups, bars that
  grow, timelines that draw.
- **Three.js scenes** — a single hero object, studio lighting, slow camera moves, particles.
- **Graphic print looks** — grain, halftone/risograph textures, oscilloscope-style line art, used sparingly.
- **Loops** — seamless short loops for ambient elements (marquees, idle object rotation).

Translate these into scroll-driven web motion with the recipes in `motion-recipes.md`.

## Patterns from 3D-website showcase reels

Studied from short design-showcase videos of 3D scroll websites (fashion, watches, tailoring, sarees, food). What
makes them land, and the recipe that builds each:
- **Exploded product**: a burger, a garment or a device comes apart into its layers as you scroll, each layer
  captioned, then reassembles (recipe 16, blueprints `burger-stack`, `deconstructed`, `plate-slide`).
- **Type sandwich**: the brand name in giant type split around the product, which turns in the gap; tiny spec labels
  in the corners like "Model / 146GR" (recipe 17, every `*-turntable` blueprint).
- **Dark spotlight stage**: a single cone of light, fog, serif headline set beside the object (recipe 18).
- **Particle figure**: a figure or logo made of glowing points on a reflective floor, title in a large serif over it
  (recipe 22 with the business's own logo or photo).
- **Layered cut-outs**: several photos of people or products at different depths in front of a framed colour block
  (recipe 19, blueprint `lookbook-scenes`).
- **Scene cards**: a numbered scene counter, a floating product card with fabric ribbons flowing past, one large real
  number beside it (recipe 20 and 21).

The common thread: **one hero object, one idea per scroll beat, big confident type, everything else quiet.**
