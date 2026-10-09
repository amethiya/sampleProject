# Visual styles

Each redesign gets one primary style in `designDirection.visualStyle`. Use it with restraint: it should make the
site feel crafted, never get in the way of reading or acting.

| Style | How to build it | Good for | Avoid |
|---|---|---|---|
| Minimalism | Strict 12-column grid, 1–2 typefaces, one accent, big margins | Every trade, especially professional services | Empty pages: keep all content |
| Bento grid | CSS grid of tiles of different spans (`grid-template-columns: repeat(6, 1fr)`; tiles span 2–4), each holding one thing: a photo, hours, a list, a fact from the site | Restaurants, cafés, retail, gyms | Identical tiles; tiles with invented content |
| Glassmorphism | `background: rgba(255,255,255,.12); backdrop-filter: blur(18px) saturate(1.4); border: 1px solid rgba(255,255,255,.25)` panels over a photo | Hero card, sticky header over photos | Glass on plain backgrounds; low-contrast text |
| Liquid glass | A floating pill-shaped translucent header (`border-radius: 999px`, blur, inner highlight `box-shadow: inset 0 1px 0 rgba(255,255,255,.4)`) over full-bleed photos | Premium salons, studios, services | Glass everywhere |
| Neumorphism | Same-colour surfaces with paired shadows (`8px 8px 16px` darker, `-8px -8px 16px` lighter) | Small cards, buttons in calm light sites (clinics, salons) | Body text on neumorphic surfaces with low contrast |
| Claymorphism | Rounded 24–32 px cards, soft pastel fills, inner + outer shadow, friendly | Cafés, bakeries, kids, pets | Corporate sites |
| Skeuomorphism | One real-material element: a paper menu card with subtle texture, a chalkboard specials board | Restaurants, cafés, bars | Textures behind body text everywhere |
| Brutalism | Thick black borders, raw blocks, big condensed type, high contrast, visible grid | Gyms, streetwear, bold brands | Fragile or premium brands |
| Maximalism | Bold colour, layered photography, oversized type, rich sections | Fashion, nightlife, art | Healthcare, finance |
| Spatial UI | Overlapping layered cards with depth and soft long shadows, slight offsets | Services, tech-leaning, retail | Clutter |
