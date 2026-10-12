# House style: components

Generated from packages/core/src/redesign/system.ts by `npm run skill:catalog`. Do not edit by hand.

Every redesign is built in this one style (the approved Union Oyster House redesign). The starter pages implement all of
it; this is the reference for each piece. CSS: system.css (after the theme tokens, see themes.md). Scripts, in this
order: HEAD_JS inline at the top of <head>, then base.js, ui-kit.js, Motion (https://cdn.jsdelivr.net/npm/motion@13.4.4/dist/motion.js) and motion.js before </body>.

## Page frame

- `<html lang="..." data-theme="<designDirection.theme.id>" data-site="<domain>">`; inline HEAD_JS first in <head>:

```html
<script>(function(){var d=document.documentElement;try{var t=localStorage.getItem('rr-theme:'+(d.getAttribute('data-site')||location.pathname.split('/').slice(0,3).join('/')));if(t&&/^(classic|noir|latte|sage|cobalt|cocoa|rose)$/.test(t))d.setAttribute('data-theme',t)}catch(e){}if(!matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('anim');setTimeout(function(){if(!window.Motion)d.classList.remove('anim')},3500)}})();</script>
```

- Right after <body>: `<div class="mu-progress" aria-hidden="true"></div>`, the opening curtain `<div class="intro" aria-hidden="true"><span class="s">Trade · City</span><span class="n">Name</span><span class="r"></span></div>`, the concept banner, the header.
- Header: `<header class="site"><div class="wrap bar">` logo text, `<nav class="links">`, `<div class="tools">` theme button + primary `.btn` + `.menu-toggle`, then `<nav class="mobile" id="mobile-menu">`. The theme panel goes right after the header.

## Theme picker (keep exactly)

```html
<button class="theme-btn" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="theme-panel" aria-label="Colour theme"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4A5.6 5.6 0 0 0 22 9.8C22 5.5 17.5 2 12 2z"/></svg><span class="tb-l">Theme</span><span class="sw" aria-hidden="true"></span></button>

<div class="theme-panel" id="theme-panel" role="dialog" aria-modal="false" aria-labelledby="tp-title"><div class="tp-head"><div><p class="tp-title" id="tp-title">Colour theme</p><p class="tp-note">Seven palettes, one design. Your choice is remembered.</p></div><button class="tp-close" type="button" aria-label="Close theme picker">&times;</button></div><div class="tp-list" role="radiogroup" aria-labelledby="tp-title"><button class="tp-opt" type="button" role="radio" aria-checked="false" data-id="classic"><span class="tp-sw" data-theme="classic" aria-hidden="true"><i></i></span><span><b>Classic Monochrome <em class="tp-def">Default</em></b><small>White, black and neutral gray</small></span><span class="tp-check" aria-hidden="true"></span></button><button class="tp-opt" type="button" role="radio" aria-checked="false" data-id="noir"><span class="tp-sw" data-theme="noir" aria-hidden="true"><i></i></span><span><b>Dark Monochrome</b><small>Black, white and charcoal</small></span><span class="tp-check" aria-hidden="true"></span></button><button class="tp-opt" type="button" role="radio" aria-checked="false" data-id="latte"><span class="tp-sw" data-theme="latte" aria-hidden="true"><i></i></span><span><b>Cosmic Latte</b><small>Latte, mocha cream and deep burgundy</small></span><span class="tp-check" aria-hidden="true"></span></button><button class="tp-opt" type="button" role="radio" aria-checked="false" data-id="sage"><span class="tp-sw" data-theme="sage" aria-hidden="true"><i></i></span><span><b>Sage &amp; Amber</b><small>Sage green, concrete gray and burnt amber</small></span><span class="tp-check" aria-hidden="true"></span></button><button class="tp-opt" type="button" role="radio" aria-checked="false" data-id="cobalt"><span class="tp-sw" data-theme="cobalt" aria-hidden="true"><i></i></span><span><b>Cobalt</b><small>Black, white and cobalt blue</small></span><span class="tp-check" aria-hidden="true"></span></button><button class="tp-opt" type="button" role="radio" aria-checked="false" data-id="cocoa"><span class="tp-sw" data-theme="cocoa" aria-hidden="true"><i></i></span><span><b>Chocolate &amp; Cream</b><small>Chocolate brown, cream and burnt orange</small></span><span class="tp-check" aria-hidden="true"></span></button><button class="tp-opt" type="button" role="radio" aria-checked="false" data-id="rose"><span class="tp-sw" data-theme="rose" aria-hidden="true"><i></i></span><span><b>Burgundy Rose</b><small>Burgundy, cream and dusty pink</small></span><span class="tp-check" aria-hidden="true"></span></button></div></div>
```

## Components

- **Masked lines:** `<h2><span class="line"><span>Heading</span></span></h2>`; one `.line` per visual line in the hero. They rise out of the mask (motion.js).
- **Fade-ups:** add `rise` to supporting blocks (paragraph groups, button rows, lists).
- **Section head:** `<div class="head"><span class="no">No. 01</span><span class="eyebrow">Label</span></div>`, numbered in order down the page.
- **Hero:** `<section class="hero-x" style="padding:0">` containing `<div class="hx"><div class="wrap">` (`.hx-top` eyebrow row, `.hx-body` with the h1 of two `.line`s, last word in `<em>`, and `.hx-side.rise` with a real paragraph and `.ctas`) and the expanding photograph `<div class="xp"><div class="xp-stick"><div class="xp-frame"><img class="xp-img" fetchpriority="high" ...><div class="xp-shade"></div><div class="xp-cap"><div class="wrap">...caption + <dl class="facts">...</dl></div></div><div class="seal">svg</div></div></div></div>`. Use `.hx-stack` on .hx-body when a headline line is long.
- **Rolling figures:** `<dd class="f" data-roll>1826</dd>`: only real numbers from content.json.
- **Fact ribbon:** `<div class="ribbon"><div class="ribbon-track"><div class="ribbon-row"><span>Fact</span><svg>star</svg>...</div><div class="ribbon-row" aria-hidden="true">(same)</div></div></div>`.
- **Statement:** `<p class="statement" data-su-scroll-reveal>The opening sentence of the story.</p>` then `<div class="split"><div class="txt rise">rest</div><div class="pics"><figure class="ph a" data-parallax="7">img</figure><figure class="ph b" data-parallax="12">img</figure></div></div>`.
- **Track:** `<section class="track"><div class="track-stick"><div class="wrap track-top">head + h2 + <div class="track-count"><b>01</b> / 06<div class="track-bar"><i></i></div></div></div><ol class="track-list"><li class="panel"><p class="pn">01</p><div><h3>..</h3>..</div></li>...</ol></div></section>`. Three or more short panels (a panel must fit the screen height); motion.js makes it horizontal on desktop.
- **Content block:** `<div class="block with-ph [flip]"><div class="prose rise">..</div><figure class="ph" data-parallax="8">img</figure></div>`; long lists as `<ul class="price-list">`.
- **Bento:** `<ul class="bento"><li>img</li>×5</ul>` (repeats every five).
- **Page index:** `<ul class="index" data-previews><li><a href="./page" data-preview="<photo url>"><span class="i">01</span><span class="t">Label</span><span class="d">Line</span><span class="go">View</span></a></li></ul>`.
- **Visit band:** `<section class="inverse" id="visit">` with head, masked name, `<address class="addr">`, `.ctas` and `<div class="facts-list">` rows (icon, label, value).
- **Footer:** `<footer class="site">` with `.foot-top` (`<p class="wordmark"><span class="line"><span>Name</span></span></p>`, `.foot-tag`, primary button) and `.foot-cols`, then `.foot-bottom` with the concept credit.
- **Inner pages:** `<section class="page-top">` (eyebrow, masked h1, lead, parallax photo), then content blocks, the visit band and the footer.
