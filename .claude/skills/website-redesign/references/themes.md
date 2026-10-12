# House themes

Generated from packages/core/src/redesign/system.ts by `npm run skill:catalog`. Do not edit by hand.

Every redesign uses these seven colour themes and nothing else. The page opens in `content.json →
designDirection.theme` (`<html data-theme="...">`) and ships the tokens of all seven, so the theme picker in the header can
switch between them (see house-style.md). Classic Monochrome is the default; themes rotate per trade so neighbouring
redesigns differ. Every text pair passes WCAG AA. Use only these tokens; never hard-code another colour.

| Theme | Colours | Mode | Background | Text | Accent | Inverse band |
|---|---|---|---|---|---|---|
| Classic Monochrome (`classic`) | White, black and neutral gray | light | #ffffff | #111111 | #111111 on #ffffff | #111111 / #f2f2f0 |
| Dark Monochrome (`noir`) | Black, white and charcoal | dark | #0b0b0b | #f4f4f2 | #f4f4f2 on #0b0b0b | #050505 / #f4f4f2 |
| Cosmic Latte (`latte`) | Latte, mocha cream and deep burgundy | light | #fff8e7 | #2e1c16 | #6d1a2a on #fff8e7 | #3b0f19 / #fff8e7 |
| Sage & Amber (`sage`) | Sage green, concrete gray and burnt amber | light | #eef0ea | #1e2620 | #9c4410 on #fbf8f3 | #263129 / #eef0ea |
| Cobalt (`cobalt`) | Black, white and cobalt blue | light | #ffffff | #0a0a0a | #0047ab on #ffffff | #0a0a0a / #f5f6f8 |
| Chocolate & Cream (`cocoa`) | Chocolate brown, cream and burnt orange | light | #fbf3e4 | #3b2416 | #a84a16 on #fff9ee | #3b2416 / #fbf3e4 |
| Burgundy Rose (`rose`) | Burgundy, cream and dusty pink | light | #fbf5ef | #45131d | #7b1e2e on #fbf5ef | #45131d / #fbf5ef |

Fonts for every theme: Libre Caslon Display (display), Libre Caslon Text (italic accents), Instrument Sans (text).

## Tokens

| Token | Use |
|---|---|
| --bg, --bg-muted, --surface, --surface-strong | page, quiet bands, panels, image placeholders |
| --text, --text-muted, --text-subtle | headings and body, secondary copy, captions |
| --accent, --on-accent | buttons, italic accent words, active states; text on accent fills |
| --accent-2 | the quieter second colour: section rules, dots, details |
| --line, --line-strong | hairlines, outlined buttons |
| --nav-bg | the translucent header |
| --inv-bg, --inv-text, --inv-muted, --inv-line | the visit band and footer |
| --selection | text selection |

## CSS (all seven, copy into every page after :root)

```css
[data-theme="classic"]{--bg:#ffffff;--bg-muted:#f4f4f2;--surface:#fafaf9;--surface-strong:#ebebe8;--text:#111111;--text-muted:#555553;--text-subtle:#707070;--accent:#111111;--on-accent:#ffffff;--accent-2:#8c8c89;--line:#e4e4e1;--line-strong:#c9c9c5;--nav-bg:rgba(255,255,255,.86);--inv-bg:#111111;--inv-text:#f2f2f0;--inv-muted:#a6a6a2;--inv-line:#2c2c2b;--selection:#dcdcd8;color-scheme:light;--gold:#111111;--gold-2:#111111;--ink-rgb:17,17,17;--bg-rgb:255,255,255;--accent-rgb:17,17,17;--accent2-rgb:140,140,137}
[data-theme="noir"]{--bg:#0b0b0b;--bg-muted:#141414;--surface:#191919;--surface-strong:#242424;--text:#f4f4f2;--text-muted:#b0b0ac;--text-subtle:#8e8e8a;--accent:#f4f4f2;--on-accent:#0b0b0b;--accent-2:#3d3d3b;--line:#262626;--line-strong:#3a3a3a;--nav-bg:rgba(11,11,11,.82);--inv-bg:#050505;--inv-text:#f4f4f2;--inv-muted:#9a9a96;--inv-line:#222222;--selection:#3a3a3a;color-scheme:dark;--gold:#f4f4f2;--gold-2:#f4f4f2;--ink-rgb:244,244,242;--bg-rgb:11,11,11;--accent-rgb:244,244,242;--accent2-rgb:61,61,59}
[data-theme="latte"]{--bg:#fff8e7;--bg-muted:#f3e6d0;--surface:#fbf1dc;--surface-strong:#e8d6bd;--text:#2e1c16;--text-muted:#6b5548;--text-subtle:#806a5c;--accent:#6d1a2a;--on-accent:#fff8e7;--accent-2:#b89a7e;--line:#e6d4ba;--line-strong:#ceb497;--nav-bg:rgba(255,248,231,.88);--inv-bg:#3b0f19;--inv-text:#fff8e7;--inv-muted:#d3b7a6;--inv-line:#5a2230;--selection:#ebcfc6;color-scheme:light;--gold:#6d1a2a;--gold-2:#6d1a2a;--ink-rgb:46,28,22;--bg-rgb:255,248,231;--accent-rgb:109,26,42;--accent2-rgb:184,154,126}
[data-theme="sage"]{--bg:#eef0ea;--bg-muted:#dce4d4;--surface:#f6f7f3;--surface-strong:#cdd5c4;--text:#1e2620;--text-muted:#4e5a51;--text-subtle:#626c64;--accent:#9c4410;--on-accent:#fbf8f3;--accent-2:#8a9a86;--line:#d3d9cc;--line-strong:#aab3a3;--nav-bg:rgba(238,240,234,.88);--inv-bg:#263129;--inv-text:#eef0ea;--inv-muted:#a9b3a7;--inv-line:#3d4a40;--selection:#d7c4ad;color-scheme:light;--gold:#9c4410;--gold-2:#9c4410;--ink-rgb:30,38,32;--bg-rgb:238,240,234;--accent-rgb:156,68,16;--accent2-rgb:138,154,134}
[data-theme="cobalt"]{--bg:#ffffff;--bg-muted:#f3f4f7;--surface:#f9fafc;--surface-strong:#e6e9f0;--text:#0a0a0a;--text-muted:#51535a;--text-subtle:#6a6c73;--accent:#0047ab;--on-accent:#ffffff;--accent-2:#0a0a0a;--line:#e2e4ea;--line-strong:#c3c7d1;--nav-bg:rgba(255,255,255,.88);--inv-bg:#0a0a0a;--inv-text:#f5f6f8;--inv-muted:#a3a6ad;--inv-line:#26282d;--selection:#cddcf3;color-scheme:light;--gold:#0047ab;--gold-2:#0047ab;--ink-rgb:10,10,10;--bg-rgb:255,255,255;--accent-rgb:0,71,171;--accent2-rgb:10,10,10}
[data-theme="cocoa"]{--bg:#fbf3e4;--bg-muted:#f1e2c9;--surface:#fff9ee;--surface-strong:#e6d1b0;--text:#3b2416;--text-muted:#6c5040;--text-subtle:#7f6352;--accent:#a84a16;--on-accent:#fff9ee;--accent-2:#c9a27c;--line:#e8d5b8;--line-strong:#cfb18d;--nav-bg:rgba(251,243,228,.88);--inv-bg:#3b2416;--inv-text:#fbf3e4;--inv-muted:#cdb39c;--inv-line:#573826;--selection:#efc9a8;color-scheme:light;--gold:#a84a16;--gold-2:#a84a16;--ink-rgb:59,36,22;--bg-rgb:251,243,228;--accent-rgb:168,74,22;--accent2-rgb:201,162,124}
[data-theme="rose"]{--bg:#fbf5ef;--bg-muted:#f4e1de;--surface:#fffaf6;--surface-strong:#ecd0cd;--text:#45131d;--text-muted:#74464e;--text-subtle:#855a61;--accent:#7b1e2e;--on-accent:#fbf5ef;--accent-2:#cf9e9e;--line:#ecd9d3;--line-strong:#d6b4ae;--nav-bg:rgba(251,245,239,.88);--inv-bg:#45131d;--inv-text:#fbf5ef;--inv-muted:#d9b3b3;--inv-line:#612532;--selection:#ecc9c9;color-scheme:light;--gold:#7b1e2e;--gold-2:#7b1e2e;--ink-rgb:69,19,29;--bg-rgb:251,245,239;--accent-rgb:123,30,46;--accent2-rgb:207,158,158}
```

### Classic Monochrome

```css
[data-theme="classic"] {
  --bg:#ffffff;
  --bg-muted:#f4f4f2;
  --surface:#fafaf9;
  --surface-strong:#ebebe8;
  --text:#111111;
  --text-muted:#555553;
  --text-subtle:#707070;
  --accent:#111111;
  --on-accent:#ffffff;
  --accent-2:#8c8c89;
  --line:#e4e4e1;
  --line-strong:#c9c9c5;
  --nav-bg:rgba(255,255,255,.86);
  --inv-bg:#111111;
  --inv-text:#f2f2f0;
  --inv-muted:#a6a6a2;
  --inv-line:#2c2c2b;
  --selection:#dcdcd8;
  color-scheme:light;
  --gold:#111111;
  --gold-2:#111111;
  --ink-rgb:17,17,17;
  --bg-rgb:255,255,255;
  --accent-rgb:17,17,17;
  --accent2-rgb:140,140,137;
}
```

### Dark Monochrome

```css
[data-theme="noir"] {
  --bg:#0b0b0b;
  --bg-muted:#141414;
  --surface:#191919;
  --surface-strong:#242424;
  --text:#f4f4f2;
  --text-muted:#b0b0ac;
  --text-subtle:#8e8e8a;
  --accent:#f4f4f2;
  --on-accent:#0b0b0b;
  --accent-2:#3d3d3b;
  --line:#262626;
  --line-strong:#3a3a3a;
  --nav-bg:rgba(11,11,11,.82);
  --inv-bg:#050505;
  --inv-text:#f4f4f2;
  --inv-muted:#9a9a96;
  --inv-line:#222222;
  --selection:#3a3a3a;
  color-scheme:dark;
  --gold:#f4f4f2;
  --gold-2:#f4f4f2;
  --ink-rgb:244,244,242;
  --bg-rgb:11,11,11;
  --accent-rgb:244,244,242;
  --accent2-rgb:61,61,59;
}
```

### Cosmic Latte

```css
[data-theme="latte"] {
  --bg:#fff8e7;
  --bg-muted:#f3e6d0;
  --surface:#fbf1dc;
  --surface-strong:#e8d6bd;
  --text:#2e1c16;
  --text-muted:#6b5548;
  --text-subtle:#806a5c;
  --accent:#6d1a2a;
  --on-accent:#fff8e7;
  --accent-2:#b89a7e;
  --line:#e6d4ba;
  --line-strong:#ceb497;
  --nav-bg:rgba(255,248,231,.88);
  --inv-bg:#3b0f19;
  --inv-text:#fff8e7;
  --inv-muted:#d3b7a6;
  --inv-line:#5a2230;
  --selection:#ebcfc6;
  color-scheme:light;
  --gold:#6d1a2a;
  --gold-2:#6d1a2a;
  --ink-rgb:46,28,22;
  --bg-rgb:255,248,231;
  --accent-rgb:109,26,42;
  --accent2-rgb:184,154,126;
}
```

### Sage & Amber

```css
[data-theme="sage"] {
  --bg:#eef0ea;
  --bg-muted:#dce4d4;
  --surface:#f6f7f3;
  --surface-strong:#cdd5c4;
  --text:#1e2620;
  --text-muted:#4e5a51;
  --text-subtle:#626c64;
  --accent:#9c4410;
  --on-accent:#fbf8f3;
  --accent-2:#8a9a86;
  --line:#d3d9cc;
  --line-strong:#aab3a3;
  --nav-bg:rgba(238,240,234,.88);
  --inv-bg:#263129;
  --inv-text:#eef0ea;
  --inv-muted:#a9b3a7;
  --inv-line:#3d4a40;
  --selection:#d7c4ad;
  color-scheme:light;
  --gold:#9c4410;
  --gold-2:#9c4410;
  --ink-rgb:30,38,32;
  --bg-rgb:238,240,234;
  --accent-rgb:156,68,16;
  --accent2-rgb:138,154,134;
}
```

### Cobalt

```css
[data-theme="cobalt"] {
  --bg:#ffffff;
  --bg-muted:#f3f4f7;
  --surface:#f9fafc;
  --surface-strong:#e6e9f0;
  --text:#0a0a0a;
  --text-muted:#51535a;
  --text-subtle:#6a6c73;
  --accent:#0047ab;
  --on-accent:#ffffff;
  --accent-2:#0a0a0a;
  --line:#e2e4ea;
  --line-strong:#c3c7d1;
  --nav-bg:rgba(255,255,255,.88);
  --inv-bg:#0a0a0a;
  --inv-text:#f5f6f8;
  --inv-muted:#a3a6ad;
  --inv-line:#26282d;
  --selection:#cddcf3;
  color-scheme:light;
  --gold:#0047ab;
  --gold-2:#0047ab;
  --ink-rgb:10,10,10;
  --bg-rgb:255,255,255;
  --accent-rgb:0,71,171;
  --accent2-rgb:10,10,10;
}
```

### Chocolate & Cream

```css
[data-theme="cocoa"] {
  --bg:#fbf3e4;
  --bg-muted:#f1e2c9;
  --surface:#fff9ee;
  --surface-strong:#e6d1b0;
  --text:#3b2416;
  --text-muted:#6c5040;
  --text-subtle:#7f6352;
  --accent:#a84a16;
  --on-accent:#fff9ee;
  --accent-2:#c9a27c;
  --line:#e8d5b8;
  --line-strong:#cfb18d;
  --nav-bg:rgba(251,243,228,.88);
  --inv-bg:#3b2416;
  --inv-text:#fbf3e4;
  --inv-muted:#cdb39c;
  --inv-line:#573826;
  --selection:#efc9a8;
  color-scheme:light;
  --gold:#a84a16;
  --gold-2:#a84a16;
  --ink-rgb:59,36,22;
  --bg-rgb:251,243,228;
  --accent-rgb:168,74,22;
  --accent2-rgb:201,162,124;
}
```

### Burgundy Rose

```css
[data-theme="rose"] {
  --bg:#fbf5ef;
  --bg-muted:#f4e1de;
  --surface:#fffaf6;
  --surface-strong:#ecd0cd;
  --text:#45131d;
  --text-muted:#74464e;
  --text-subtle:#855a61;
  --accent:#7b1e2e;
  --on-accent:#fbf5ef;
  --accent-2:#cf9e9e;
  --line:#ecd9d3;
  --line-strong:#d6b4ae;
  --nav-bg:rgba(251,245,239,.88);
  --inv-bg:#45131d;
  --inv-text:#fbf5ef;
  --inv-muted:#d9b3b3;
  --inv-line:#612532;
  --selection:#ecc9c9;
  color-scheme:light;
  --gold:#7b1e2e;
  --gold-2:#7b1e2e;
  --ink-rgb:69,19,29;
  --bg-rgb:251,245,239;
  --accent-rgb:123,30,46;
  --accent2-rgb:207,158,158;
}
```

