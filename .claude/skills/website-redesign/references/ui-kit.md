# UI kit

Generated from packages/core/src/redesign/ui-kit.ts by `npm run skill:catalog`. Do not edit by hand.

Components from Magic UI (magicui.design) and Smooth UI (smoothui.dev), both MIT, ported from React + Tailwind
+ Motion to plain CSS and JavaScript, plus effects after popular 21st.dev community components, so they run in the static, CSP-locked redesign pages. Every starter page already
includes ui-kit.css (in its <style>) and ui-kit.js (an inline <script> after the base script): keep both, and add a
component by putting its class or data attribute on your markup. Never load React, Tailwind or the libraries.

Rules: colours come from the theme variables; a few effects per page, where they serve the content; never on text the
motion script already animates (.hero / .page-top content, .echo, .zig, .info); never invent content for them (the
ticker only animates a number already in the text). Everything respects prefers-reduced-motion; hover effects only
run on fine pointers.

## Magic UI

### Marquee (`marquee`)

An endless, pausable strip of the business's own photos, logos (brands stocked, partners, certifications) or short real labels such as service names. data-reverse flips it; data-repeat (default 4) sets copies. No ids inside the track: it is cloned.

```html
<div class="mu-marquee" style="--duration:40s;--gap:2.5rem"><div class="mu-marquee-track"><img src="..." alt="..."> <img src="..." alt="..."></div></div>
```

### Border Beam (`border-beam`)

A spark of light that travels around a box's border: the opening-hours card, a booking box or the main offer. One per page at most. Options: --beam-size, --beam-duration.

```html
<div class="mu-beam" style="border-radius:4px">...</div>
```

### Shine Border (`shine-border`)

A slow, shimmering gradient border: price cards, the visit box, a featured quote. Options: --shine-width, --shine-duration.

```html
<div class="mu-shine">...</div>
```

### Shimmer Button (`shimmer-button`)

A light that runs around a button's outline. Only the page's primary call to action (on .btn.gold).

```html
<a class="btn gold mu-shimmer" href="...">Book a table</a>
```

### Animated Shiny Text (`animated-shiny-text`)

A light sweep across a short line: the small "Discover" label or a one-line tagline. Never on body text.

```html
<span class="mu-shiny">Welcome to</span>
```

### Magic Card (spotlight) (`magic-card`)

A soft accent spotlight that follows the pointer over a card: dish cards, team, service or page cards. Option: --spot-size.

```html
<a class="dish-card mu-spotlight" href="...">...</a>
```

### Number Ticker (`number-ticker`)

Counts up to a number already in the site's text when it scrolls into view ("Since 1987", "25 years"); the final text is exactly the original. Only on elements with text and no child elements. Never for invented figures. data-start sets the start value (e.g. 1950 for a year), data-duration the seconds.

```html
<span data-mu-ticker data-start="1950">Since 1987</span>
```

### Blur Fade (`blur-fade`)

Fades and un-blurs an element in when it scrolls into view. For content the motion script does not already animate (not .hero/.page-top content, .echo, .zig, .info). data-delay (s), data-direction (up|down|left|right), data-offset (px).

```html
<div data-mu-blur-fade data-delay="0.1">...</div>
```

### Dot Pattern (`dot-pattern`)

A faint dot grid behind a section, fading out towards the edges. Put it first inside a position:relative container.

```html
<section style="position:relative"><div class="mu-dots" aria-hidden="true"></div>...</section>
```

### Scroll Progress (`scroll-progress`)

A hairline accent bar at the top of the window showing how far down the page you are. Once per page, right after <body>.

```html
<div class="mu-progress" aria-hidden="true"></div>
```

## Smooth UI

### Magnetic Button (`magnetic-button`)

The button leans towards the pointer as it approaches. Hero and call-to-action buttons. data-strength (default 0.25), data-radius (px, default 100). Not on .page-top .btn (the motion script moves those).

```html
<a class="btn gold" data-su-magnetic href="...">Order online</a>
```

### Tilt Card (`tilt-card`)

A card that tilts in 3D towards the pointer with a soft glare. Photo cards and featured items. data-tilt-max (degrees, default 8); children with data-tilt-depth="0..1" float with parallax.

```html
<div class="dish-card" data-su-tilt data-tilt-max="6">...</div>
```

### Glow Hover Cards (`glow-hover-card`)

On a grid: every card's border lights up where the pointer is, across the whole grid. Option: --glow-size.

```html
<div class="cards" data-su-glow><a class="dish-card">...</a><a class="dish-card">...</a></div>
```

### Mask Reveal Up (`mask-reveal-up`)

Each line of a heading rises out of a mask when it scrolls into view; <br> separates lines. Section headings that are not .echo headings, and short statements. data-delay (s), data-stagger (ms, default 90).

```html
<h2 data-su-mask-reveal>Fresh every<br>morning</h2>
```

### Shimmer Sweep (`shimmer-sweep`)

A word or short line slides in from the left out of a blur when it scrolls into view. Labels, prices, small captions. data-delay (s).

```html
<span data-su-sweep>Discover</span>
```

### Scroll Reveal Paragraph (`scroll-reveal-paragraph`)

The words of a paragraph light up one by one as you scroll through it. One strong paragraph per page (the story); never long lists or menus.

```html
<p data-su-scroll-reveal>...</p>
```

## 21st.dev

### Scroll Media Expansion (`scroll-expand-media`)

A framed photo opens up to full width as it scrolls into view (after 21st.dev's scroll-expansion hero). One per page, for the business's best wide photo: the dining room, the clinic, the workshop. Not inside .hero or the cloud reveal.

```html
<div class="tw-expand"><div class="tw-expand-frame"><img src="..." alt="..." loading="lazy" referrerpolicy="no-referrer"></div></div>
```

### Background Paths (`background-paths`)

Fine lines in the theme's accent that drift slowly behind a calm band (after 21st.dev's background paths): the footer call-to-action band, a quiet intro or quote section. Never behind photos or long text. Option: data-lines (default 18).

```html
<div class="foot-cta"><div class="tw-paths" aria-hidden="true"></div> ...the band's content... </div>
```

