# Themes

Generated from packages/core/src/redesign/system.ts by `npm run skill:catalog`. Do not edit by hand.

Every site gets one theme in `content.json → designDirection.theme`. Use its colours and fonts exactly; the
starter pages already contain its CSS variables. Navy leads for most trades; themes rotate so neighbours differ.

| Theme | Mode | Background | Text | Accent | Fonts |
|---|---|---|---|---|---|
| Midnight Navy & Brass (`midnight-navy`) | dark | #0c1424 | #eef0f4 | #c8a96a / #e3c88f | 'Marcellus' + 'Jost' |
| Espresso & Gold (`espresso-gold`) | dark | #0e0e0d | #ece6da | #c9a55b / #e4c27c | 'Marcellus' + 'Jost' |
| Forest & Copper (`forest-copper`) | dark | #0f1c16 | #edf0ea | #c98a5a / #e2ab80 | 'Cormorant Garamond' + 'Manrope' |
| Burgundy & Champagne (`burgundy-champagne`) | dark | #1c0c11 | #f3e9e4 | #d8bc8c / #ecd6aa | 'Playfair Display' + 'Jost' |
| Ocean & Sand (`ocean-sand`) | dark | #0a1e25 | #eef2f1 | #d9b98a / #ecd3ab | 'Italiana' + 'Manrope' |
| Plum & Rose Gold (`plum-rosegold`) | dark | #1a111f | #f2ebf2 | #d4a194 / #e8c0b3 | 'Cormorant Garamond' + 'Manrope' |
| Slate & Sage (`slate-sage`) | dark | #141a1c | #edf0ee | #9fbb9e / #c4d8c2 | 'Marcellus' + 'Manrope' |
| Ivory & Navy (`ivory-navy`) | light | #f6f1e8 | #14213a | #a8802f / #8a6624 | 'Marcellus' + 'Jost' |

## CSS variables per theme

### Midnight Navy & Brass

```css
:root{
  --bg:#0c1424;
  --bg-2:#111b2e;
  --bg-3:#172338;
  --bg-deep:#080e1a;
  --text:#eef0f4;
  --soft:#cdd3dd;
  --muted:#97a3b6;
  --faint:#6c7789;
  --gold:#c8a96a;
  --gold-2:#e3c88f;
  --line:rgba(238,240,244,.12);
  --ink-rgb:238,240,244;
  --bg-rgb:12,20,36;
  --accent-rgb:200,169,106;
  --accent2-rgb:227,200,143;
  --dust:245,240,230;
  --logo-filter:brightness(0) invert(.92);
  --pad:clamp(20px,5vw,72px);
  --display:'Marcellus', Georgia, serif;
  --body:'Jost', system-ui, sans-serif;
  --body-weight:300}
```

### Espresso & Gold

```css
:root{
  --bg:#0e0e0d;
  --bg-2:#151513;
  --bg-3:#1b1a18;
  --bg-deep:#080807;
  --text:#ece6da;
  --soft:#cfc8bb;
  --muted:#9a948a;
  --faint:#6f6a61;
  --gold:#c9a55b;
  --gold-2:#e4c27c;
  --line:rgba(236,230,218,.12);
  --ink-rgb:236,230,218;
  --bg-rgb:14,14,13;
  --accent-rgb:201,165,91;
  --accent2-rgb:228,194,124;
  --dust:245,240,230;
  --logo-filter:brightness(0) invert(.92);
  --pad:clamp(20px,5vw,72px);
  --display:'Marcellus', Georgia, serif;
  --body:'Jost', system-ui, sans-serif;
  --body-weight:300}
```

### Forest & Copper

```css
:root{
  --bg:#0f1c16;
  --bg-2:#14251d;
  --bg-3:#1a2e24;
  --bg-deep:#09130e;
  --text:#edf0ea;
  --soft:#cfd8cf;
  --muted:#9cafa1;
  --faint:#6f8274;
  --gold:#c98a5a;
  --gold-2:#e2ab80;
  --line:rgba(237,240,234,.12);
  --ink-rgb:237,240,234;
  --bg-rgb:15,28,22;
  --accent-rgb:201,138,90;
  --accent2-rgb:226,171,128;
  --dust:245,240,230;
  --logo-filter:brightness(0) invert(.92);
  --pad:clamp(20px,5vw,72px);
  --display:'Cormorant Garamond', Georgia, serif;
  --body:'Manrope', system-ui, sans-serif;
  --body-weight:300}
```

### Burgundy & Champagne

```css
:root{
  --bg:#1c0c11;
  --bg-2:#251117;
  --bg-3:#2e161d;
  --bg-deep:#12070b;
  --text:#f3e9e4;
  --soft:#dccbc6;
  --muted:#b49c9d;
  --faint:#836d6f;
  --gold:#d8bc8c;
  --gold-2:#ecd6aa;
  --line:rgba(243,233,228,.12);
  --ink-rgb:243,233,228;
  --bg-rgb:28,12,17;
  --accent-rgb:216,188,140;
  --accent2-rgb:236,214,170;
  --dust:245,240,230;
  --logo-filter:brightness(0) invert(.92);
  --pad:clamp(20px,5vw,72px);
  --display:'Playfair Display', Georgia, serif;
  --body:'Jost', system-ui, sans-serif;
  --body-weight:300}
```

### Ocean & Sand

```css
:root{
  --bg:#0a1e25;
  --bg-2:#0f272f;
  --bg-3:#143039;
  --bg-deep:#06151a;
  --text:#eef2f1;
  --soft:#cfd9d8;
  --muted:#96abae;
  --faint:#6a7f82;
  --gold:#d9b98a;
  --gold-2:#ecd3ab;
  --line:rgba(238,242,241,.12);
  --ink-rgb:238,242,241;
  --bg-rgb:10,30,37;
  --accent-rgb:217,185,138;
  --accent2-rgb:236,211,171;
  --dust:245,240,230;
  --logo-filter:brightness(0) invert(.92);
  --pad:clamp(20px,5vw,72px);
  --display:'Italiana', Georgia, serif;
  --body:'Manrope', system-ui, sans-serif;
  --body-weight:300}
```

### Plum & Rose Gold

```css
:root{
  --bg:#1a111f;
  --bg-2:#221729;
  --bg-3:#2a1d33;
  --bg-deep:#120b16;
  --text:#f2ebf2;
  --soft:#d9ccda;
  --muted:#b0a0b4;
  --faint:#7e6e82;
  --gold:#d4a194;
  --gold-2:#e8c0b3;
  --line:rgba(242,235,242,.12);
  --ink-rgb:242,235,242;
  --bg-rgb:26,17,31;
  --accent-rgb:212,161,148;
  --accent2-rgb:232,192,179;
  --dust:245,240,230;
  --logo-filter:brightness(0) invert(.92);
  --pad:clamp(20px,5vw,72px);
  --display:'Cormorant Garamond', Georgia, serif;
  --body:'Manrope', system-ui, sans-serif;
  --body-weight:300}
```

### Slate & Sage

```css
:root{
  --bg:#141a1c;
  --bg-2:#1a2124;
  --bg-3:#21292d;
  --bg-deep:#0d1213;
  --text:#edf0ee;
  --soft:#d0d7d3;
  --muted:#9ea9a4;
  --faint:#707b77;
  --gold:#9fbb9e;
  --gold-2:#c4d8c2;
  --line:rgba(237,240,238,.12);
  --ink-rgb:237,240,238;
  --bg-rgb:20,26,28;
  --accent-rgb:159,187,158;
  --accent2-rgb:196,216,194;
  --dust:245,240,230;
  --logo-filter:brightness(0) invert(.92);
  --pad:clamp(20px,5vw,72px);
  --display:'Marcellus', Georgia, serif;
  --body:'Manrope', system-ui, sans-serif;
  --body-weight:300}
```

### Ivory & Navy

```css
:root{
  --bg:#f6f1e8;
  --bg-2:#efe8dc;
  --bg-3:#e8dfd0;
  --bg-deep:#efe7da;
  --text:#14213a;
  --soft:#2a3754;
  --muted:#5b6476;
  --faint:#8a8f99;
  --gold:#a8802f;
  --gold-2:#8a6624;
  --line:rgba(20,33,58,.12);
  --ink-rgb:20,33,58;
  --bg-rgb:246,241,232;
  --accent-rgb:168,128,47;
  --accent2-rgb:138,102,36;
  --dust:168,128,47;
  --logo-filter:brightness(0);
  --pad:clamp(20px,5vw,72px);
  --display:'Marcellus', Georgia, serif;
  --body:'Jost', system-ui, sans-serif;
  --body-weight:400}
```

