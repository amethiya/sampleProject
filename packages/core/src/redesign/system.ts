/**
 * The Revamp Radar design system ("House Editorial"): every redesign (instant and Claude) is built on it.
 *
 * It is the system of the approved Union Oyster House redesign: an editorial page in Libre Caslon and Instrument
 * Sans, seven house colour themes the visitor can switch between (with a circular reveal), and one motion language:
 * a short opening curtain, headlines that rise out of a mask, a hero photograph that expands to full screen as you
 * scroll and reveals its caption with rolling figures, a ribbon of the business's facts, a statement that lights up
 * word by word, a horizontal scroll-driven track, a page index whose photo follows the pointer, parallax photographs,
 * an inverse contact band and a large footer wordmark. Each site opens in one theme; themes rotate so neighbours
 * differ, Classic Monochrome first.
 */
import type { CategoryId } from "../types";

export interface Look {
  id: string;
  name: string;
  /** The colours the theme is made of, for the picker. */
  note: string;
  dark: boolean;
  bg: string; bgMuted: string; surface: string; surfaceStrong: string;
  text: string; textMuted: string; textSubtle: string;
  /** Buttons, highlights and selected states; onAccent is text on it. accent2 is the quieter second colour (rules, dots). */
  accent: string; onAccent: string; accent2: string;
  line: string; lineStrong: string;
  /** Header background (translucent). */
  nav: string;
  /** The inverse band and footer. */
  invBg: string; invText: string; invMuted: string; invLine: string;
  selection: string;
  /** Google Fonts css2 query; display, italic serif and body families. */
  fonts: string; display: string; serif: string; body: string;
}

/** One type system for every theme: Caslon (the type of colonial printing) for display, Instrument Sans for text. */
export const HOUSE_FONTS = "family=Libre+Caslon+Display&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Instrument+Sans:wght@400;500;600";
const DISPLAY = "'Libre Caslon Display', 'Libre Caslon Text', Georgia, serif";
const SERIF = "'Libre Caslon Text', Georgia, serif";
const BODY = "'Instrument Sans', system-ui, sans-serif";

type Colours = Omit<Look, "id" | "name" | "note" | "fonts" | "display" | "serif" | "body">;
const L = (id: string, name: string, note: string, c: Colours): Look => ({ id, name, note, ...c, fonts: HOUSE_FONTS, display: DISPLAY, serif: SERIF, body: BODY });

/** The seven house themes, in picker order. Every text pair passes WCAG AA (4.5:1). Classic Monochrome is the default. */
export const LOOKS: Look[] = [
  L("classic", "Classic Monochrome", "White, black and neutral gray", { dark: false,
    bg: "#ffffff", bgMuted: "#f4f4f2", surface: "#fafaf9", surfaceStrong: "#ebebe8", text: "#111111", textMuted: "#555553", textSubtle: "#707070",
    accent: "#111111", onAccent: "#ffffff", accent2: "#8c8c89", line: "#e4e4e1", lineStrong: "#c9c9c5", nav: "rgba(255,255,255,.86)",
    invBg: "#111111", invText: "#f2f2f0", invMuted: "#a6a6a2", invLine: "#2c2c2b", selection: "#dcdcd8" }),
  L("noir", "Dark Monochrome", "Black, white and charcoal", { dark: true,
    bg: "#0b0b0b", bgMuted: "#141414", surface: "#191919", surfaceStrong: "#242424", text: "#f4f4f2", textMuted: "#b0b0ac", textSubtle: "#8e8e8a",
    accent: "#f4f4f2", onAccent: "#0b0b0b", accent2: "#3d3d3b", line: "#262626", lineStrong: "#3a3a3a", nav: "rgba(11,11,11,.82)",
    invBg: "#050505", invText: "#f4f4f2", invMuted: "#9a9a96", invLine: "#222222", selection: "#3a3a3a" }),
  L("latte", "Cosmic Latte", "Latte, mocha cream and deep burgundy", { dark: false,
    bg: "#fff8e7", bgMuted: "#f3e6d0", surface: "#fbf1dc", surfaceStrong: "#e8d6bd", text: "#2e1c16", textMuted: "#6b5548", textSubtle: "#806a5c",
    accent: "#6d1a2a", onAccent: "#fff8e7", accent2: "#b89a7e", line: "#e6d4ba", lineStrong: "#ceb497", nav: "rgba(255,248,231,.88)",
    invBg: "#3b0f19", invText: "#fff8e7", invMuted: "#d3b7a6", invLine: "#5a2230", selection: "#ebcfc6" }),
  L("sage", "Sage & Amber", "Sage green, concrete gray and burnt amber", { dark: false,
    bg: "#eef0ea", bgMuted: "#dce4d4", surface: "#f6f7f3", surfaceStrong: "#cdd5c4", text: "#1e2620", textMuted: "#4e5a51", textSubtle: "#626c64",
    accent: "#9c4410", onAccent: "#fbf8f3", accent2: "#8a9a86", line: "#d3d9cc", lineStrong: "#aab3a3", nav: "rgba(238,240,234,.88)",
    invBg: "#263129", invText: "#eef0ea", invMuted: "#a9b3a7", invLine: "#3d4a40", selection: "#d7c4ad" }),
  L("cobalt", "Cobalt", "Black, white and cobalt blue", { dark: false,
    bg: "#ffffff", bgMuted: "#f3f4f7", surface: "#f9fafc", surfaceStrong: "#e6e9f0", text: "#0a0a0a", textMuted: "#51535a", textSubtle: "#6a6c73",
    accent: "#0047ab", onAccent: "#ffffff", accent2: "#0a0a0a", line: "#e2e4ea", lineStrong: "#c3c7d1", nav: "rgba(255,255,255,.88)",
    invBg: "#0a0a0a", invText: "#f5f6f8", invMuted: "#a3a6ad", invLine: "#26282d", selection: "#cddcf3" }),
  L("cocoa", "Chocolate & Cream", "Chocolate brown, cream and burnt orange", { dark: false,
    bg: "#fbf3e4", bgMuted: "#f1e2c9", surface: "#fff9ee", surfaceStrong: "#e6d1b0", text: "#3b2416", textMuted: "#6c5040", textSubtle: "#7f6352",
    accent: "#a84a16", onAccent: "#fff9ee", accent2: "#c9a27c", line: "#e8d5b8", lineStrong: "#cfb18d", nav: "rgba(251,243,228,.88)",
    invBg: "#3b2416", invText: "#fbf3e4", invMuted: "#cdb39c", invLine: "#573826", selection: "#efc9a8" }),
  L("rose", "Burgundy Rose", "Burgundy, cream and dusty pink", { dark: false,
    bg: "#fbf5ef", bgMuted: "#f4e1de", surface: "#fffaf6", surfaceStrong: "#ecd0cd", text: "#45131d", textMuted: "#74464e", textSubtle: "#855a61",
    accent: "#7b1e2e", onAccent: "#fbf5ef", accent2: "#cf9e9e", line: "#ecd9d3", lineStrong: "#d6b4ae", nav: "rgba(251,245,239,.88)",
    invBg: "#45131d", invText: "#fbf5ef", invMuted: "#d9b3b3", invLine: "#612532", selection: "#ecc9c9" }),
];

export const DEFAULT_LOOK = "classic";

/** Themes that suit each trade, best first. Classic Monochrome leads; the rotation keeps neighbours apart. */
const BY_TRADE: Record<CategoryId, string[]> = {
  restaurant: ["classic", "latte", "cocoa", "rose", "noir"],
  cafe: ["classic", "cocoa", "latte", "sage"],
  gym: ["classic", "noir", "cobalt", "sage"],
  salon: ["classic", "rose", "latte", "sage"],
  clothing: ["classic", "noir", "rose", "cobalt"],
  retail: ["classic", "cobalt", "sage", "cocoa"],
  healthcare: ["classic", "sage", "cobalt", "latte"],
  accounting: ["classic", "cobalt", "noir", "sage"],
  import_export: ["classic", "cobalt", "noir", "sage"],
  services: ["classic", "sage", "cobalt", "noir"],
};

export function lookById(id: string | undefined | null): Look | undefined {
  return id ? LOOKS.find((l) => l.id === id) : undefined;
}

/** The trade's favourite theme, unless one of the last two redesigns already used it. */
export function pickLook(category: CategoryId, recentIds: string[] = []): Look {
  const list = BY_TRADE[category] ?? LOOKS.map((l) => l.id);
  const recent = new Set(recentIds.slice(0, 2));
  return lookById(list.find((id) => !recent.has(id)) ?? list[0])!;
}

/** What to build for each trade on the house system: the expanding photograph, imagery, section mapping, tone. */
export interface TradePrompt { hero: string; imagery: string; sections: string; tone: string }
export const TRADE_PROMPTS: Record<CategoryId, TradePrompt> = {
  restaurant: { hero: "The dining room, the bar or the house speciality as the wide photograph that expands to full screen; the caption names the place and its real year or address.", imagery: "Warm, appetising: the room, the counter, dishes shot close; the business's own photos first.", sections: "Hero → fact ribbon → statement + story with two photos → the menus as a horizontal track (or price lists) → signature dishes → rooms / private dining as a bento → honours or press from the site in the inverse band → visit → footer.", tone: "Hospitable, assured, a little literary." },
  cafe: { hero: "The counter, the coffee or the bakes as the expanding photograph; the caption names the café and its street.", imagery: "Latte art, bakes, the room in morning light.", sections: "Hero → ribbon → statement + story → drinks and food as a track → favourites → the room as a bento → visit band → footer.", tone: "Warm, neighbourly, unhurried." },
  gym: { hero: "Training in the space (rig, platform, a class) as the expanding photograph; the caption names the gym and its real numbers (classes, years) only if the site has them.", imagery: "Real training moments in strong light.", sections: "Hero → ribbon → statement + story → programmes or classes as a track with prices if listed → timetable / membership → facilities bento → join band → footer.", tone: "Confident and clear, never shouty." },
  salon: { hero: "The craft or the calm interior as the expanding photograph; the caption names the salon and its street.", imagery: "Results, products, calm interiors.", sections: "Hero → ribbon → statement + story → services as a track with prices → signature treatments → the space as a bento → booking band → footer.", tone: "Refined, calm, personal." },
  clothing: { hero: "A signature piece or the shop as the expanding photograph; the caption names the label.", imagery: "Editorial product and lookbook photography.", sections: "Hero → ribbon → statement + story → collections as a track → featured pieces → lookbook bento → visit band → footer.", tone: "Editorial, confident." },
  retail: { hero: "The shopfront or the best-known product as the expanding photograph.", imagery: "Products, the shopfront, details.", sections: "Hero → ribbon → statement + story → categories as a track → featured items → the shop as a bento → visit band → footer.", tone: "Friendly, curated." },
  healthcare: { hero: "The calm, bright practice as the expanding photograph; the caption names the practice and how to book.", imagery: "Bright, calm, real practice photos.", sections: "Hero → ribbon → statement + story → treatments as a track → team or key treatments → practical details (hours, insurance, emergencies if listed) → booking band → footer.", tone: "Reassuring, clear, plain language." },
  accounting: { hero: "The office or the city as the expanding photograph; the caption names the firm and its real years if stated.", imagery: "Offices, people at work, the city.", sections: "Hero → ribbon → statement + story → services as a track → specialisms → the team or office → contact band → footer.", tone: "Measured, trustworthy." },
  import_export: { hero: "Port, warehouse or the products traded as the expanding photograph.", imagery: "Ports, warehouses, products, a global feel.", sections: "Hero → ribbon → statement + story → products / services as a track → markets → process → enquiry band → footer.", tone: "Global, dependable." },
  services: { hero: "The work itself (a finished project, the workshop, the team on site) as the expanding photograph.", imagery: "Real work, before/after, the team.", sections: "Hero → ribbon → statement + story → services as a track → projects bento → area served / guarantees if listed → contact band → footer.", tone: "Trustworthy, direct." },
};

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(",");

/** The colour tokens of one theme (no selector). */
export function themeTokens(l: Look): string {
  return `--bg:${l.bg};--bg-muted:${l.bgMuted};--surface:${l.surface};--surface-strong:${l.surfaceStrong};--text:${l.text};--text-muted:${l.textMuted};--text-subtle:${l.textSubtle};` +
    `--accent:${l.accent};--on-accent:${l.onAccent};--accent-2:${l.accent2};--line:${l.line};--line-strong:${l.lineStrong};--nav-bg:${l.nav};` +
    `--inv-bg:${l.invBg};--inv-text:${l.invText};--inv-muted:${l.invMuted};--inv-line:${l.invLine};--selection:${l.selection};color-scheme:${l.dark ? "dark" : "light"};` +
    // Aliases the UI kit reads.
    `--gold:${l.accent};--gold-2:${l.accent};--ink-rgb:${rgb(l.text)};--bg-rgb:${rgb(l.bg)};--accent-rgb:${rgb(l.accent)};--accent2-rgb:${rgb(l.accent2)}`;
}

/** Every theme as a [data-theme] block, so the picker (and its swatches) can show any of them. */
export const THEME_CSS = LOOKS.map((l) => `[data-theme="${l.id}"]{${themeTokens(l)}}`).join("");

/** CSS variables for a page: its own theme on :root, fonts and spacing, then all seven themes for the picker. */
export function lookVars(l: Look): string {
  return `:root{${themeTokens(l)};--display:${l.display};--serif:${l.serif};--body:${l.body};--pad:20px;--gut:max(var(--pad),calc((100vw - 84rem)/2 + var(--pad)));--ease:cubic-bezier(.22,1,.36,1)}` +
    `@media (min-width:768px){:root{--pad:40px}}${THEME_CSS}`;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** The header's theme button and the picker panel (place the panel once, right after the header). */
export function themePicker(): { button: string; panel: string } {
  const button = `<button class="theme-btn" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="theme-panel" aria-label="Colour theme"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4A5.6 5.6 0 0 0 22 9.8C22 5.5 17.5 2 12 2z"/></svg><span class="tb-l">Theme</span><span class="sw" aria-hidden="true"></span></button>`;
  const opts = LOOKS.map((l, i) => `<button class="tp-opt" type="button" role="radio" aria-checked="false" data-id="${l.id}"><span class="tp-sw" data-theme="${l.id}" aria-hidden="true"><i></i></span><span><b>${esc(l.name)}${i === 0 ? ' <em class="tp-def">Default</em>' : ""}</b><small>${esc(l.note)}</small></span><span class="tp-check" aria-hidden="true"></span></button>`).join("");
  const panel = `<div class="theme-panel" id="theme-panel" role="dialog" aria-modal="false" aria-labelledby="tp-title"><div class="tp-head"><div><p class="tp-title" id="tp-title">Colour theme</p><p class="tp-note">Seven palettes, one design. Your choice is remembered.</p></div><button class="tp-close" type="button" aria-label="Close theme picker">&times;</button></div><div class="tp-list" role="radiogroup" aria-labelledby="tp-title">${opts}</div></div>`;
  return { button, panel };
}

/**
 * The "choose your colours" section: every house theme as a live card the client can preview and mark as their
 * favourite, then copy their choice (with a link that opens the page in that theme) to send to us by email.
 * `no` is the section number shown in its head.
 */
export function themeChooser(no: string): string {
  const heart = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/></svg>';
  const cards = LOOKS.map((l) => `<li class="th-card" data-theme="${l.id}" data-id="${l.id}" data-name="${esc(l.name)}">
<div class="th-mini" aria-hidden="true"><span class="th-dots"><i style="background:var(--bg)"></i><i style="background:var(--accent)"></i><i style="background:var(--accent-2)"></i><i style="background:var(--inv-bg)"></i></span><span class="aa">A<em>a</em></span><span class="ln"></span><span class="ln s"></span><span class="bt">Book now</span><span class="now">Showing</span></div>
<div class="th-meta"><b>${esc(l.name)}</b><small>${esc(l.note)}</small></div>
<div class="th-act"><button class="th-try" type="button" aria-pressed="false">Preview<span class="sr-only"> ${esc(l.name)}</span></button><button class="th-fav" type="button" aria-pressed="false" aria-label="Make ${esc(l.name)} my favourite">${heart}<span> Love it</span></button></div>
</li>`).join("");
  return `<section class="themes" id="themes" aria-labelledby="themes-title"><div class="wrap">
<div class="head"><span class="no">No. ${no}</span><span class="eyebrow">Colour themes</span></div>
<h2 id="themes-title"><span class="line"><span>Choose the <em>colours</em> you love.</span></span></h2>
<p class="th-lead muted rise">See this design in each of our seven colour themes. Preview any of them on the whole page, mark the one you like most, then copy your choice and send it to us by email.</p>
<ul class="th-grid">${cards}</ul>
<div class="th-pick rise" aria-live="polite"><p>Your favourite: <b class="th-name">none yet</b></p><label class="sr-only" for="th-text">Your theme choice</label><input class="th-text" id="th-text" readonly value="" placeholder="Mark a favourite above"><button class="btn th-copy" type="button" disabled>Copy my choice</button><span class="th-note"></span></div>
</div></section>`;
}

export const SYSTEM_CSS = `
*,*::before,*::after{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-padding-top:88px}
body{margin:0;background:var(--bg);color:var(--text);font:400 16.5px/1.7 var(--body);-webkit-font-smoothing:antialiased;overflow-x:clip}
::selection{background:var(--selection);color:var(--text)}
img{max-width:100%;display:block}
a{color:inherit}
:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
h1,h2,h3{font-family:var(--display);font-weight:400;line-height:1.04;letter-spacing:-.015em;margin:0 0 .4em;text-wrap:balance}
h1{font-size:clamp(3.1rem,9.2vw,9.5rem);line-height:.96;letter-spacing:-.03em}
h2{font-size:clamp(2.2rem,4.6vw,4rem)}
h3{font-size:clamp(1.4rem,1.9vw,1.75rem)}
em{font-family:var(--serif);font-style:italic}
p{margin:0 0 1em}
.wrap{max-width:84rem;margin:0 auto;padding:0 var(--pad)}
.eyebrow{font:600 .72rem/1.5 var(--body);letter-spacing:.2em;text-transform:uppercase;color:var(--text-muted);margin:0}
.muted{color:var(--text-muted)}
.small{font-size:.92rem}
.fine{font-size:.75rem;color:var(--text-subtle);max-width:70ch}
section{padding:clamp(88px,10vw,144px) 0;position:relative}
.head{display:flex;align-items:baseline;gap:16px;border-top:1px solid var(--accent-2);padding-top:16px;margin:0 0 28px}
.head .no{font:italic 400 .9rem/1 var(--serif);color:var(--text-muted)}
.concept{background:var(--inv-bg);color:var(--inv-muted);font-size:12px;text-align:center;padding:7px 16px;letter-spacing:.02em}
.concept a{color:var(--inv-text)}
/* header */
header.site{position:sticky;top:0;z-index:40;background:var(--nav-bg);-webkit-backdrop-filter:blur(14px) saturate(1.4);backdrop-filter:blur(14px) saturate(1.4);border-bottom:1px solid transparent;transition:border-color .5s,box-shadow .5s}
header.site.scrolled{border-color:var(--line);box-shadow:0 10px 30px -24px rgba(0,0,0,.4)}
.bar{display:flex;align-items:center;gap:22px;min-height:72px}
.logo-text{font:400 1.45rem/1.1 var(--display);letter-spacing:-.01em;text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:min(30ch,48vw)}
.links{display:flex;gap:24px;margin-left:auto;align-items:center}
.links a{text-decoration:none;font-size:.82rem;font-weight:500;letter-spacing:.03em;padding:4px 0;white-space:nowrap;background:linear-gradient(currentColor,currentColor) 0 100%/0 1px no-repeat;transition:background-size .35s var(--ease)}
.links a:hover,.links a[aria-current]{background-size:100% 1px}
.tools{display:flex;gap:10px;align-items:center}
.links+.tools{margin-left:4px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:48px;padding:0 24px;background:var(--accent);color:var(--on-accent);border:1px solid var(--accent);font:600 .78rem/1 var(--body);letter-spacing:.14em;text-transform:uppercase;text-decoration:none;cursor:pointer;white-space:nowrap;transition:opacity .3s,border-color .3s,background-color .3s,transform .3s var(--ease)}
.btn:hover{opacity:.86}
.btn:active{transform:scale(.98)}
.btn.ghost{background:transparent;color:var(--text);border-color:var(--line-strong)}
.btn.ghost:hover{border-color:var(--text);opacity:1}
.btn svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.6;transition:transform .3s}
.btn:hover svg{transform:translate(2px,-2px)}
.ulink{display:inline-flex;gap:8px;align-items:center;text-decoration:none;font:600 .78rem/1 var(--body);letter-spacing:.14em;text-transform:uppercase;padding:6px 0;background:linear-gradient(currentColor,currentColor) 0 100%/0 1px no-repeat;transition:background-size .35s var(--ease)}
.ulink:hover{background-size:100% 1px}
.menu-toggle{display:none;background:none;border:1px solid var(--line);color:var(--text);min-height:44px;padding:0 16px;font:600 .75rem var(--body);letter-spacing:.14em;text-transform:uppercase;cursor:pointer}
.mobile{display:none;padding:12px var(--pad) 28px;border-top:1px solid var(--line);background:var(--bg)}
.mobile a{display:block;padding:14px 0;border-bottom:1px solid var(--line);text-decoration:none;font:400 1.75rem/1.2 var(--display)}
.mobile .btn{margin-top:20px;width:100%;font:600 .78rem var(--body);border-bottom:0}
@media (max-width:1100px){.links,.tools>.btn{display:none}.tools{margin-left:auto}.menu-toggle{display:inline-flex;align-items:center}.mobile.open{display:block}}
@media (max-width:520px){.tb-l{display:none}}
/* theme picker */
.theme-btn{display:inline-flex;align-items:center;gap:10px;min-height:44px;padding:0 12px;border:1px solid var(--line);background:none;color:var(--text);font:600 .72rem var(--body);letter-spacing:.14em;text-transform:uppercase;cursor:pointer}
.theme-btn:hover{border-color:var(--text)}
.theme-btn svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.6}
.sw{width:20px;height:20px;border:1px solid var(--line-strong);background:linear-gradient(90deg,var(--bg) 50%,var(--accent) 50%);flex:none}
.theme-panel{position:fixed;z-index:70;top:84px;right:var(--gut);width:min(23rem,calc(100vw - 32px));max-height:80vh;overflow:auto;background:var(--bg);color:var(--text);border:1px solid var(--line);box-shadow:0 30px 80px -30px rgba(0,0,0,.45);padding:16px;display:none}
.theme-panel.open{display:block;animation:tp-in .28s var(--ease)}
@keyframes tp-in{from{opacity:0;transform:translateY(10px)}}
.tp-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin:0 4px 10px}
.tp-title{font:400 1.25rem/1.2 var(--display);margin:0}
.tp-note{font-size:.75rem;color:var(--text-muted);margin:2px 0 0}
.tp-close{background:none;border:0;color:var(--text-muted);font-size:1.6rem;line-height:1;width:40px;height:40px;cursor:pointer}
.tp-list{display:grid;gap:4px}
.tp-opt{display:flex;align-items:center;gap:14px;width:100%;padding:8px 10px;border:1px solid transparent;background:none;color:var(--text);text-align:left;font:inherit;cursor:pointer}
.tp-opt:hover{background:var(--bg-muted)}
.tp-opt[aria-checked="true"]{border-color:var(--text);background:var(--surface)}
.tp-sw{position:relative;width:56px;height:44px;flex:none;border:1px solid var(--line-strong);background:var(--bg);overflow:hidden}
.tp-sw::before{content:"Aa";position:absolute;left:8px;top:6px;font:400 .9rem/1 var(--display);color:var(--text)}
.tp-sw::after{content:"";position:absolute;left:0;right:0;bottom:0;height:10px;background:var(--accent)}
.tp-sw i{position:absolute;right:6px;top:6px;width:10px;height:10px;border-radius:50%;background:var(--accent-2)}
.tp-opt b{display:block;font-size:.88rem;font-weight:600}
.tp-def{font:600 .6rem var(--body);letter-spacing:.14em;text-transform:uppercase;color:var(--text-muted);margin-left:6px}
.tp-opt small{display:block;font-size:.74rem;line-height:1.35;color:var(--text-muted)}
.tp-check{margin-left:auto;width:22px;height:22px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;font-size:12px}
.tp-opt[aria-checked="true"] .tp-check{background:var(--text);color:var(--bg)}
.tp-opt[aria-checked="true"] .tp-check::before{content:"\\2713"}
@media (max-width:760px){.theme-panel{top:auto;bottom:0;left:0;right:0;width:auto;max-height:85vh;border-width:1px 0 0;padding:20px}}
::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal}
::view-transition-old(root){z-index:1}
::view-transition-new(root){z-index:2}
html.theme-fade,html.theme-fade *{transition:background-color .45s,color .45s,border-color .45s!important}
/* masked lines: each rises out of its own mask */
.line{display:block;overflow:hidden;padding-bottom:.1em;margin-bottom:-.1em}
.line>span{display:block}
html.anim .line>span{transform:translateY(108%)}
html.anim .rise{opacity:0;transform:translateY(28px)}
/* hero */
.hx{padding:clamp(28px,4vw,56px) 0 0}
.hx-top{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
.hx-top a{text-decoration:none}
.hx-body{position:relative}
.hx h1{margin:24px 0 0}
.hx h1[data-long]{font-size:clamp(2.6rem,6.4vw,6.5rem)}
.hx h1 em{color:var(--accent);font-size:.9em;letter-spacing:-.02em}
.hx-side{margin-top:32px;max-width:27rem}
.hx-side p{color:var(--text-muted)}
.ctas{display:flex;gap:12px;flex-wrap:wrap;margin-top:24px}
@media (min-width:900px){.hx-body:not(.hx-stack) .hx-side{position:absolute;right:0;bottom:1.4vw;margin:0;width:min(27rem,38%)}}
@media (max-width:560px){.ctas .btn{width:100%}}
/* expanding photograph */
.xp{height:190vh;padding:0;margin-top:clamp(36px,4vw,56px)}
.xp-stick{position:sticky;top:0;height:100vh;overflow:hidden}
.xp-frame{position:absolute;inset:0;overflow:hidden;background:var(--surface-strong)}
.xp-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.xp-shade{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.88),rgba(0,0,0,.55) 32%,rgba(0,0,0,.18) 62%,rgba(0,0,0,.1))}
.xp-cap{position:absolute;left:0;right:0;bottom:0;padding-bottom:clamp(28px,4vw,56px);color:#fff}
.xp-cap .wrap{display:grid;gap:28px;align-items:end}
@media (min-width:900px){.xp-cap .wrap{grid-template-columns:7fr 5fr;gap:40px}}
.xp-cap .eyebrow{color:rgba(255,255,255,.85)}
.xp-cap .big{font:400 clamp(2.2rem,5vw,4.5rem)/1 var(--display);margin:14px 0 0;max-width:16ch;color:#fff}
.facts{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:16px;border-top:1px solid rgba(255,255,255,.3);padding-top:18px;margin:0}
.facts dd{margin:0}
.facts .f{font:400 clamp(1.3rem,2.4vw,2.2rem)/1.1 var(--display);overflow-wrap:anywhere;font-variant-numeric:tabular-nums}
.facts .f:not([data-roll]){font-size:clamp(1.05rem,1.6vw,1.45rem);line-height:1.25}
.facts .l{margin-top:8px;font-size:.68rem;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.82)}
.facts a{color:#fff;text-decoration:none}
.seal{position:absolute;top:96px;right:var(--gut);width:128px;height:128px;color:#fff;display:none}
.seal svg{width:100%;height:100%}
@media (min-width:900px){.seal{display:block}}
.xp-credit{position:absolute;right:12px;bottom:12px;background:rgba(0,0,0,.45);color:rgba(255,255,255,.82);font-size:.62rem;padding:3px 8px;margin:0}
html.anim .xp-frame{clip-path:inset(0 var(--gut));opacity:0}
html.anim .xp-img{transform:scale(1.18)}
html.anim .xp-shade,html.anim .xp-cap,html.anim .seal{opacity:0}
html:not(.anim) .xp{height:auto}
html:not(.anim) .xp-stick{position:relative;height:min(100vh,820px);min-height:520px}
/* rolling figures */
.rc{display:inline-block;height:1em;overflow:hidden;line-height:1;vertical-align:-.12em}
.rcol{display:flex;flex-direction:column}
.rcol>span{display:block;height:1em;line-height:1}
/* fact ribbon */
.ribbon{overflow:hidden;border-block:1px solid var(--line);padding:22px 0;background:var(--bg)}
.ribbon-track{display:flex;width:max-content;animation:ribbon 48s linear infinite}
.ribbon:hover .ribbon-track{animation-play-state:paused}
.ribbon-row{display:flex;align-items:center;flex:none}
.ribbon-row span{font:400 clamp(1.5rem,2.6vw,2.25rem)/1.2 var(--display);white-space:nowrap}
.ribbon-row span:nth-of-type(even){font-family:var(--serif);font-style:italic;color:var(--text-muted)}
.ribbon-row svg{width:12px;height:12px;margin:0 32px;fill:var(--accent);flex:none}
@keyframes ribbon{to{transform:translateX(-50%)}}
/* statement and story */
.statement{font:400 clamp(2rem,4.6vw,4.25rem)/1.08 var(--display);letter-spacing:-.015em;max-width:24ch;margin:0}
.split{display:grid;gap:56px;margin-top:clamp(56px,7vw,110px)}
@media (min-width:1000px){.split{grid-template-columns:4fr 8fr;gap:48px}.split>.txt{padding-top:96px}}
.split .txt p{color:var(--text-muted);font-size:1.06rem;line-height:1.8}
.ph{position:relative;overflow:hidden;background:var(--surface-strong);margin:0}
.ph img{width:100%;height:100%;object-fit:cover}
.ph[data-parallax] img{position:absolute;left:0;right:0;top:0;height:100%}
.pics .a{aspect-ratio:3/2}
.pics .b{position:relative;width:46%;aspect-ratio:4/5;margin-top:-16%;border:12px solid var(--bg)}
.cap{font-size:.7rem;color:var(--text-subtle);margin:10px 0 0}
.pull{border-left:2px solid var(--accent-2);padding-left:20px;font:italic 400 clamp(1.2rem,1.8vw,1.55rem)/1.4 var(--serif);margin:32px 0 0}
.block{display:grid;gap:40px}
@media (min-width:1000px){.block.with-ph{grid-template-columns:7fr 5fr;gap:56px;align-items:start}.block.with-ph.flip{grid-template-columns:5fr 7fr}.block.with-ph.flip>.ph{order:-1}}
.block .ph{aspect-ratio:4/5}
.prose{max-width:68ch}
.prose p{color:var(--text-muted)}
/* horizontal track */
.track{padding:0;border-block:1px solid var(--line);background:var(--surface)}
.track-stick{display:flex;flex-direction:column;padding:clamp(88px,10vw,144px) 0}
.track-top{display:flex;justify-content:space-between;align-items:flex-end;gap:40px;width:100%}
.track-top h2{margin:10px 0 0;font-size:clamp(2rem,3.4vw,3.25rem)}
.track-count{display:none;width:16rem;flex:none;text-align:right;font:italic 400 .9rem var(--serif);color:var(--text-muted)}
.track-count b{font:400 1.5rem var(--display);color:var(--text)}
.track-bar{height:1px;background:var(--line);margin-top:12px}
.track-bar i{display:block;height:100%;background:var(--accent);transform-origin:left;transform:scaleX(0)}
.track-list{list-style:none;margin:40px auto 0;padding:0 var(--pad);max-width:84rem}
.panel{border-top:1px solid var(--line);padding:32px 0;display:grid;gap:4px 32px}
@media (min-width:700px){.panel{grid-template-columns:minmax(5rem,9rem) 1fr}}
.panel .pn{margin:0;font:400 clamp(2rem,4vw,3rem)/1 var(--display);color:var(--accent);letter-spacing:-.02em}
.panel h3{margin:0 0 10px}
.panel p{font-size:.96rem;color:var(--text-muted);line-height:1.7}
.track.is-h .track-stick{position:sticky;top:0;height:100vh;overflow:hidden;padding:100px 0 32px}
.track.is-h .track-count{display:block}
.track.is-h .track-list{display:flex;flex:1;min-height:0;width:max-content;max-width:none;margin:40px 0 0;padding:0 var(--gut)}
.track.is-h .panel{display:block;width:min(30rem,36vw);flex:none;border-top:0;border-left:1px solid var(--line);padding:0 40px;overflow:hidden}
.track.is-h .panel .pn{font-size:clamp(3.5rem,10vh,7.5rem);line-height:.9;letter-spacing:-.03em;color:transparent;-webkit-text-stroke:1px var(--text);transition:color .7s,-webkit-text-stroke-color .7s}
.track.is-h .panel.on .pn{color:var(--accent);-webkit-text-stroke-color:var(--accent)}
.track.is-h .panel h3{margin-top:20px}
/* page index with a following photo */
.index{list-style:none;margin:0;padding:0;border-top:1px solid var(--text)}
.index li{border-bottom:1px solid var(--line)}
.index a{display:grid;grid-template-columns:2.5rem 1fr auto;align-items:baseline;gap:16px;padding:24px 0;text-decoration:none}
@media (min-width:700px){.index a{grid-template-columns:4rem 1fr 1fr auto;padding:24px 12px}}
.index .i{font:italic .9rem var(--serif);color:var(--text-subtle)}
.index .t{font:400 clamp(1.75rem,3vw,2.5rem)/1 var(--display);transition:transform .5s var(--ease),color .3s}
.index a:hover .t{transform:translateX(12px);color:var(--accent)}
.index .d{display:none;font-size:.9rem;color:var(--text-muted)}
@media (min-width:700px){.index .d{display:block}}
.index .go{font:600 .72rem var(--body);letter-spacing:.14em;text-transform:uppercase}
.index .go svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.6;vertical-align:-3px}
.preview{position:absolute;left:0;top:0;width:14rem;height:18rem;overflow:hidden;pointer-events:none;z-index:5;opacity:0;clip-path:inset(100% 0 0 0);box-shadow:0 30px 60px -20px rgba(0,0,0,.45);transition:opacity .3s,clip-path .55s var(--ease)}
.preview.on{opacity:1;clip-path:inset(0)}
.preview img{width:100%;height:100%;object-fit:cover;transform:scale(1.1)}
/* bento */
.bento{list-style:none;margin:48px 0 0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:12px}
.bento li{position:relative;overflow:hidden;aspect-ratio:1;background:var(--surface-strong)}
.bento li:first-child{grid-column:span 2;aspect-ratio:4/5}
.bento img{width:100%;height:100%;object-fit:cover;transition:transform 1.2s var(--ease)}
.bento li:hover img{transform:scale(1.06)}
@media (min-width:768px){.bento{grid-template-columns:repeat(12,1fr);grid-auto-rows:17rem;gap:16px}.bento li,.bento li:first-child{aspect-ratio:auto;grid-column:span 4}.bento li:nth-child(5n+1){grid-column:span 5;grid-row:span 2}.bento li:nth-child(5n+2){grid-column:span 4}.bento li:nth-child(5n+3),.bento li:nth-child(5n+4){grid-column:span 3}}
@media (min-width:1024px){.bento{grid-auto-rows:20rem}}
/* inverse band and visit */
.inverse{background:var(--inv-bg);color:var(--inv-text)}
.inverse .muted,.inverse .eyebrow,.inverse .head .no{color:var(--inv-muted)}
.inverse .head{border-color:var(--inv-line)}
.inverse .btn{background:var(--inv-text);color:var(--inv-bg);border-color:var(--inv-text)}
.inverse .btn.ghost{background:none;color:var(--inv-text);border-color:var(--inv-line)}
.inverse .btn.ghost:hover{border-color:var(--inv-text)}
.visit{display:grid;gap:48px}
@media (min-width:1000px){.visit{grid-template-columns:5fr 7fr}}
.addr{font:400 clamp(2rem,3.6vw,2.75rem)/1.05 var(--display);margin:0;font-style:normal}
.facts-list{border-top:1px solid var(--inv-line)}
.facts-list>div{display:grid;grid-template-columns:2rem 1fr;gap:12px;padding:20px 0;border-bottom:1px solid var(--inv-line)}
.facts-list svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.6;margin-top:3px}
.facts-list b{display:block;font-weight:600}
.facts-list span{display:block;color:var(--inv-muted);font-size:.95rem}
.facts-list a{color:var(--inv-text)}
/* inner pages */
.page-top{padding:clamp(48px,6vw,96px) 0 clamp(48px,6vw,80px);border-bottom:1px solid var(--line)}
.page-top .wrap{display:grid;gap:40px;align-items:end}
@media (min-width:900px){.page-top .wrap{grid-template-columns:7fr 5fr}}
.page-top h1{font-size:clamp(2.8rem,7vw,6.5rem)}
.page-top .ph{aspect-ratio:4/3}
/* content */
.price-list{list-style:none;margin:0;padding:0}
.price-list li{display:grid;grid-template-columns:auto 1fr auto;align-items:baseline;gap:2px 12px;padding:11px 0;border-bottom:1px solid var(--line)}
.price-list .n{grid-column:1;grid-row:1}
.price-list .p{grid-column:3;grid-row:1;color:var(--accent);font-variant-numeric:tabular-nums}
.price-list .desc{grid-column:1/-1;color:var(--text-muted);font-size:.9rem}
.list-cols{columns:2;column-gap:60px}
.list-cols li{break-inside:avoid}
@media (max-width:760px){.list-cols{columns:1}}
.two{display:grid;grid-template-columns:1fr 1fr;gap:0 60px}
@media (max-width:760px){.two{grid-template-columns:1fr}}
table.drinks{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}
table.drinks th,table.drinks td{padding:11px 6px;border-bottom:1px solid var(--line);text-align:right}
table.drinks th:first-child,table.drinks td:first-child{text-align:left;padding-left:0}
table.drinks thead th{font:600 .7rem var(--body);letter-spacing:.14em;text-transform:uppercase;color:var(--text-muted)}
details{border-bottom:1px solid var(--line)}
details:first-child{border-top:1px solid var(--line)}
summary{list-style:none;cursor:pointer;padding:22px 50px 22px 0;position:relative;font:400 clamp(1.15rem,1.6vw,1.4rem)/1.35 var(--display)}
summary::-webkit-details-marker{display:none}
summary::after{content:"+";position:absolute;right:6px;top:18px;font:300 26px var(--body);color:var(--accent);transition:transform .35s}
details[open] summary::after{transform:rotate(45deg)}
details .a{padding:0 0 24px;color:var(--text-muted);max-width:64ch}
.gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:32px}
.gallery figure{margin:0;aspect-ratio:4/3;overflow:hidden;background:var(--surface-strong)}
.gallery img{width:100%;height:100%;object-fit:cover;transition:transform 1.1s var(--ease)}
.gallery figure:hover img{transform:scale(1.06)}
@media (max-width:760px){.gallery{grid-template-columns:1fr 1fr}}
.map-frame{border:1px solid var(--line);overflow:hidden;aspect-ratio:4/3}
.map-frame iframe{width:100%;height:100%;border:0;filter:grayscale(.9) contrast(1.05)}
/* footer */
footer.site{background:var(--inv-bg);color:var(--inv-text);padding:clamp(72px,8vw,112px) 0 32px}
.foot-top{display:grid;gap:48px;padding-bottom:56px;border-bottom:1px solid var(--inv-line)}
@media (min-width:1000px){.foot-top{grid-template-columns:5fr 7fr}}
.wordmark{font:400 clamp(2.75rem,6vw,4.75rem)/.98 var(--display);letter-spacing:-.02em;margin:0;overflow-wrap:anywhere}
.foot-tag{font:italic 400 1.1rem var(--serif);color:var(--inv-muted);margin:18px 0 28px}
footer.site .btn{background:var(--inv-text);color:var(--inv-bg);border-color:var(--inv-text)}
.foot-cols{display:grid;grid-template-columns:repeat(2,1fr);gap:32px}
@media (min-width:640px){.foot-cols{grid-template-columns:repeat(3,1fr)}}
.foot-cols h4{font:600 .68rem var(--body);letter-spacing:.2em;text-transform:uppercase;color:var(--inv-muted);margin:0 0 16px}
.foot-cols a,.foot-cols p{display:block;font-size:.94rem;text-decoration:none;margin:0 0 8px;color:var(--inv-text);overflow-wrap:anywhere}
.foot-cols a:hover{text-decoration:underline}
.foot-bottom{display:flex;flex-wrap:wrap;justify-content:space-between;gap:16px;padding-top:28px;font-size:.75rem;color:var(--inv-muted)}
.foot-bottom a{color:var(--inv-text)}
/* theme chooser section */
.themes{background:var(--bg-muted);border-block:1px solid var(--line)}
.th-lead{max-width:60ch;margin-top:8px}
.th-grid{list-style:none;margin:40px 0 0;padding:0;display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(15.5rem,1fr))}
.th-card{background:var(--bg);color:var(--text);border:1px solid var(--line-strong);display:flex;flex-direction:column;transition:transform .45s var(--ease),box-shadow .45s var(--ease)}
.th-card:hover{transform:translateY(-4px);box-shadow:0 26px 50px -30px rgba(0,0,0,.45)}
.th-card.fav{outline:2px solid var(--accent);outline-offset:3px}
.th-mini{position:relative;padding:22px 20px 20px;border-bottom:1px solid var(--line);overflow:hidden}
.th-mini .aa{display:block;font:400 3.2rem/1 var(--display);letter-spacing:-.02em}
.th-mini .aa em{color:var(--accent)}
.th-mini .ln{display:block;height:6px;width:82%;margin-top:14px;background:var(--text-muted);opacity:.28}
.th-mini .ln.s{width:56%;margin-top:8px}
.th-mini .bt{display:inline-block;margin-top:16px;padding:8px 12px;background:var(--accent);color:var(--on-accent);font:600 .6rem/1 var(--body);letter-spacing:.14em;text-transform:uppercase}
.th-dots{position:absolute;top:20px;right:18px;display:flex;gap:6px}
.th-dots i{width:14px;height:14px;border-radius:50%;border:1px solid var(--line-strong)}
.th-mini .now{display:none;position:absolute;right:18px;bottom:20px;font:600 .6rem/1 var(--body);letter-spacing:.14em;text-transform:uppercase;color:var(--text-muted)}
.th-card.showing .now{display:block}
.th-meta{padding:14px 20px 0}
.th-meta b{display:block;font-size:.95rem;font-weight:600}
.th-meta small{display:block;font-size:.78rem;line-height:1.4;color:var(--text-muted)}
.th-act{display:flex;gap:8px;padding:14px 20px 20px;margin-top:auto}
.th-act button{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:44px;padding:0 8px;border:1px solid var(--line-strong);background:none;color:var(--text);font:600 .66rem/1.2 var(--body);letter-spacing:.1em;text-transform:uppercase;cursor:pointer;transition:border-color .3s,background-color .3s,color .3s}
.th-act button:hover{border-color:var(--text)}
.th-act svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.8;flex:none}
.th-try[aria-pressed="true"]{border-color:var(--text)}
.th-fav[aria-pressed="true"]{background:var(--accent);color:var(--on-accent);border-color:var(--accent)}
.th-fav[aria-pressed="true"] svg{fill:currentColor}
.th-pick{display:grid;gap:12px;align-items:center;margin-top:36px;padding-top:24px;border-top:1px solid var(--line)}
.th-pick p{margin:0}
@media (min-width:900px){.th-pick{grid-template-columns:auto 1fr auto}.th-note{grid-column:1/-1}}
.th-text{width:100%;min-height:48px;padding:0 14px;border:1px solid var(--line-strong);background:var(--bg);color:var(--text);font:400 .85rem var(--body)}
.th-copy[disabled]{opacity:.45;cursor:not-allowed}
.th-note{font-size:.82rem;color:var(--text-muted);min-height:1.2em}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
/* opening curtain (once per session) */
.intro{position:fixed;inset:0;z-index:200;background:var(--inv-bg);color:var(--inv-text);display:none;flex-direction:column;align-items:center;justify-content:center;gap:18px;pointer-events:none;text-align:center;padding:0 20px}
html.anim .intro.play{display:flex}
.intro .s{font:italic .82rem/1.4 var(--serif);letter-spacing:.3em;text-transform:uppercase;color:var(--inv-muted)}
.intro .n{font:400 clamp(2.4rem,7vw,5.5rem)/1.02 var(--display);letter-spacing:-.02em}
.intro .r{width:12rem;height:1px;background:var(--inv-muted);transform-origin:left}
@media (prefers-reduced-motion:reduce){.ribbon-track{animation:none}.preview{transition:none}.theme-panel.open{animation:none}}
`;

/** Menu, header state, image clean-up, the theme picker and the page index preview: works without any library. */
export const SYSTEM_BASE_JS = `(function(){
  var d = document.documentElement;
  var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var t = document.querySelector('.menu-toggle'), m = document.getElementById('mobile-menu');
  if (t && m) t.addEventListener('click', function(){ var o = t.getAttribute('aria-expanded') !== 'true'; t.setAttribute('aria-expanded', String(o)); m.classList.toggle('open', o); t.textContent = o ? 'Close' : 'Menu'; });
  var h = document.querySelector('header.site');
  if (h) { var sc = function(){ h.classList.toggle('scrolled', scrollY > 12); }; sc(); addEventListener('scroll', sc, { passive: true }); }
  // Keep the site's own photos, but drop tiny, broken or logo-like images.
  $$('img:not([data-keep])').forEach(function(i){
    function bad(){ if (i.dataset.fallback) { i.src = i.dataset.fallback; delete i.dataset.fallback; return; } i.style.display = 'none'; }
    function c(){ var w = i.naturalWidth, hh = i.naturalHeight || 1; if (w && (w < 240 || w / hh > 2.8 || hh / w > 2.8)) bad(); }
    if (i.complete) c(); else i.addEventListener('load', c);
    i.addEventListener('error', bad);
  });
  // Themes: seven house palettes, remembered per site, revealed in a circle from the chosen swatch.
  var site = d.getAttribute('data-site') || location.pathname.split('/').slice(0, 3).join('/');
  var store = function(k, v){ try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} return null; };
  var btn = document.querySelector('.theme-btn'), panel = document.getElementById('theme-panel');
  var opts = panel ? $$('.tp-opt', panel) : [];
  var cards = $$('.th-card');
  var sync = function(){
    var cur = d.getAttribute('data-theme');
    opts.forEach(function(o){ var on = o.getAttribute('data-id') === cur; o.setAttribute('aria-checked', String(on)); o.tabIndex = on ? 0 : -1; });
    cards.forEach(function(c){ var on = c.getAttribute('data-id') === cur; c.classList.toggle('showing', on); var t = c.querySelector('.th-try'); if (t) t.setAttribute('aria-pressed', String(on)); });
    var s = btn && btn.querySelector('.sw'); if (s) s.setAttribute('data-theme', cur);
  };
  var apply = function(id, from){
    if (d.getAttribute('data-theme') === id) return;
    store('rr-theme:' + site, id);
    var rc = from ? from.getBoundingClientRect() : null;
    var x = rc ? rc.left + rc.width / 2 : innerWidth / 2, y = rc ? rc.top + rc.height / 2 : innerHeight / 2;
    var set = function(){ d.setAttribute('data-theme', id); sync(); };
    if (document.startViewTransition && !reduce) {
      var rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      var tr = document.startViewTransition(set);
      tr.ready.then(function(){ d.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + rad + 'px at ' + x + 'px ' + y + 'px)'] }, { duration: 850, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' }); }).catch(function(){});
    } else { d.classList.add('theme-fade'); set(); setTimeout(function(){ d.classList.remove('theme-fade'); }, 500); }
  };
  if (btn && panel) {
    var isOpen = function(){ return panel.classList.contains('open'); };
    var open = function(){ panel.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); var c = opts.filter(function(o){ return o.getAttribute('aria-checked') === 'true'; })[0] || opts[0]; setTimeout(function(){ c.focus(); }, 30); };
    var close = function(back){ panel.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); if (back) btn.focus(); };
    btn.addEventListener('click', function(){ if (isOpen()) close(); else open(); });
    var x0 = panel.querySelector('.tp-close'); if (x0) x0.addEventListener('click', function(){ close(true); });
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && isOpen()) close(true); });
    document.addEventListener('pointerdown', function(e){ if (isOpen() && !panel.contains(e.target) && !btn.contains(e.target)) close(); });
    opts.forEach(function(o, i){
      o.addEventListener('click', function(){ apply(o.getAttribute('data-id'), o.querySelector('.tp-sw')); });
      o.addEventListener('keydown', function(e){
        var last = opts.length - 1, n = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = i === last ? 0 : i + 1;
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = i === 0 ? last : i - 1;
        if (e.key === 'Home') n = 0;
        if (e.key === 'End') n = last;
        if (n === null) return;
        e.preventDefault(); apply(opts[n].getAttribute('data-id'), opts[n].querySelector('.tp-sw')); opts[n].focus();
      });
    });
  }
  // Theme chooser section: preview each theme, mark a favourite, copy the choice to send by email.
  var chooser = document.querySelector('.themes');
  if (chooser && cards.length) {
    var nameEl = chooser.querySelector('.th-name'), text = chooser.querySelector('.th-text'), copy = chooser.querySelector('.th-copy'), note = chooser.querySelector('.th-note');
    var siteName = (document.querySelector('.logo-text') || {}).textContent || document.title;
    var page = location.href.split('#')[0].split('?')[0];
    var setFav = function(id, save){
      var card = cards.filter(function(c){ return c.getAttribute('data-id') === id; })[0];
      cards.forEach(function(c){ var on = c === card; c.classList.toggle('fav', on); var f = c.querySelector('.th-fav'); if (f) { f.setAttribute('aria-pressed', String(on)); f.lastChild.textContent = on ? ' Favourite' : ' Love it'; } });
      if (!card) return;
      var nm = card.getAttribute('data-name');
      if (nameEl) nameEl.textContent = nm;
      if (text) text.value = siteName.trim() + ': my favourite theme is ' + nm + ' (' + id + '). ' + page + '?theme=' + id;
      if (copy) copy.disabled = false;
      if (note) note.textContent = '';
      if (save) store('rr-fav:' + site, id);
    };
    cards.forEach(function(c){
      var id = c.getAttribute('data-id');
      var t = c.querySelector('.th-try'); if (t) t.addEventListener('click', function(){ apply(id, c.querySelector('.th-mini')); });
      var f = c.querySelector('.th-fav'); if (f) f.addEventListener('click', function(){ setFav(id, true); apply(id, c.querySelector('.th-mini')); });
    });
    if (copy && text) copy.addEventListener('click', function(){
      var done = function(){ if (note) note.textContent = 'Copied. Paste it into an email to us.'; };
      var fallback = function(){ text.focus(); text.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (e) {} if (ok) done(); else if (note) note.textContent = 'Select the text and copy it.'; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text.value).then(done, fallback); else fallback();
    });
    var saved = store('rr-fav:' + site);
    if (saved) setFav(saved, false);
  }
  sync();
  // Page index: a photograph follows the pointer and changes with the row under it (mouse only).
  if (!reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) $$('.index[data-previews]').forEach(function(list){
    var host = list.parentNode; if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    var box = document.createElement('div'); box.className = 'preview'; box.setAttribute('aria-hidden', 'true');
    var im = document.createElement('img'); im.alt = ''; im.setAttribute('referrerpolicy', 'no-referrer'); im.setAttribute('data-keep', ''); box.appendChild(im); host.appendChild(box);
    var tx = 0, ty = 0, x = 0, y = 0, raf = 0, on = false;
    var loop = function(){ x += (tx - x) * 0.18; y += (ty - y) * 0.18; box.style.transform = 'translate3d(' + (x - 112) + 'px,' + (y - 144) + 'px,0)'; raf = on || Math.abs(tx - x) + Math.abs(ty - y) > 1 ? requestAnimationFrame(loop) : 0; };
    list.addEventListener('pointermove', function(e){ var r = host.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; if (!raf) raf = requestAnimationFrame(loop); });
    $$('a[data-preview]', list).forEach(function(a){ a.addEventListener('pointerenter', function(){ var src = a.getAttribute('data-preview'); if (!src) return; if (im.getAttribute('src') !== src) im.src = src; on = true; box.classList.add('on'); if (!raf) raf = requestAnimationFrame(loop); }); });
    list.addEventListener('pointerleave', function(){ on = false; box.classList.remove('on'); });
  });
})();`;

/**
 * The house motion language (Motion, Framer Motion's engine): opening curtain, masked lines, the expanding hero
 * photograph with rolling figures, fade-ups, the horizontal track and parallax. Content is visible without it.
 */
export const SYSTEM_MOTION_JS = `(function(){
  var d = document.documentElement;
  var intro = document.querySelector('.intro');
  var M = window.Motion;
  var $$ = function(s, r){ return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var touched = [];
  var showAll = function(){ d.classList.remove('anim'); if (intro && intro.parentNode) intro.remove(); touched.forEach(function(el){ el.style.transform = ''; el.style.opacity = ''; el.style.clipPath = ''; }); };
  if (!M || !M.animate || !M.inView || !M.scroll || !d.classList.contains('anim')) { showAll(); return; }
  var animate = M.animate, inView = M.inView, scroll = M.scroll, stagger = M.stagger;
  var EXPO = [0.16, 1, 0.3, 1], EASE = [0.22, 1, 0.36, 1], IN_OUT = [0.65, 0, 0.35, 1];
  var clamp = function(v){ return v < 0 ? 0 : v > 1 ? 1 : v; };
  var top = function(el){ return !!el.closest('.hx, .page-top'); };
  var mark = function(el){ touched.push(el); return el; };
  try {
    // 1. Opening curtain: once per browser session (on every page when storage is unavailable and the visit is new).
    var first = true;
    try { first = !sessionStorage.getItem('rr-intro'); sessionStorage.setItem('rr-intro', '1'); } catch (e) { first = !document.referrer || document.referrer.indexOf(location.host) < 0; }
    var t0 = 0.05;
    if (intro && first) {
      intro.classList.add('play');
      animate(intro.querySelector('.s'), { opacity: [0, 1], y: [16, 0] }, { duration: 0.8, ease: EXPO, delay: 0.1 });
      animate(intro.querySelector('.n'), { opacity: [0, 1], y: [40, 0] }, { duration: 1, ease: EXPO, delay: 0.2 });
      animate(intro.querySelector('.r'), { scaleX: [0, 1] }, { duration: 1.15, ease: IN_OUT, delay: 0.15 });
      animate(intro, { clipPath: ['inset(0% 0% 0% 0%)', 'inset(0% 0% 100% 0%)'] }, { duration: 0.9, ease: EXPO, delay: 1.35 }).then(function(){ intro.remove(); });
      t0 = 1.6;
    } else if (intro) intro.remove();

    // 2. Headlines rise out of their masks: the first screen at once, the rest as they arrive.
    var lines = $$('.line > span').map(mark);
    lines.filter(top).forEach(function(s, i){ animate(s, { y: ['108%', '0%'] }, { duration: 1.1, ease: EXPO, delay: t0 + 0.05 + i * 0.1 }); });
    lines.filter(function(s){ return !top(s); }).forEach(function(s){ inView(s.parentNode, function(){ animate(s, { y: ['108%', '0%'] }, { duration: 1.1, ease: EXPO }); }, { margin: '0px 0px -10% 0px' }); });

    // 3. Supporting copy fades up: the first screen after the headline, the rest in arriving groups.
    var rises = $$('.rise').map(mark);
    var firstRises = rises.filter(top);
    if (firstRises.length) animate(firstRises, { opacity: [0, 1], y: [28, 0] }, { duration: 1, ease: EASE, delay: stagger(0.1, { startDelay: t0 + 0.45 }) });
    var queue = [], queued = false;
    rises.filter(function(el){ return !top(el); }).forEach(function(el){ inView(el, function(){
      queue.push(el); if (queued) return; queued = true;
      requestAnimationFrame(function(){ var b = queue; queue = []; queued = false; animate(b, { opacity: [0, 1], y: [28, 0] }, { duration: 1, ease: EASE, delay: stagger(0.08) }); });
    }, { margin: '0px 0px -8% 0px' }); });

    // 4. Rolling figures (odometer): digits roll into place.
    var roll = function(scope){
      $$('[data-roll]', scope).forEach(function(el, k){
        if (el.dataset.rolled) return; el.dataset.rolled = '1';
        var text = el.textContent; el.setAttribute('aria-label', text); el.textContent = '';
        text.split('').forEach(function(ch, i){
          var n = '0123456789'.indexOf(ch);
          if (n < 0) { var s = document.createElement('span'); s.textContent = ch; s.setAttribute('aria-hidden', 'true'); el.appendChild(s); return; }
          var w = document.createElement('span'); w.className = 'rc'; w.setAttribute('aria-hidden', 'true');
          var col = document.createElement('span'); col.className = 'rcol';
          for (var j = 0; j < 10; j++) { var x = document.createElement('span'); x.textContent = String(j); col.appendChild(x); }
          w.appendChild(col); el.appendChild(w);
          animate(col, { y: ['0em', -n + 'em'] }, { duration: 1.6, ease: EXPO, delay: k * 0.15 + i * 0.09 });
        });
      });
    };

    // 5. The hero photograph grows to full bleed while the headline drifts away; then shade, caption and figures.
    $$('.xp').forEach(function(xp){
      var host = xp.closest('.hero-x') || xp;
      var frame = mark(xp.querySelector('.xp-frame')), img = mark(xp.querySelector('.xp-img')), shade = mark(xp.querySelector('.xp-shade')), cap = mark(xp.querySelector('.xp-cap')), seal = xp.querySelector('.seal'), head = host.querySelector('.hx');
      if (seal) mark(seal); if (head) mark(head);
      var gut = function(){ var w = innerWidth, p = w >= 768 ? 40 : 20; return Math.max(p, (w - 1344) / 2 + p); };
      var rolled = false;
      animate(frame, { opacity: [0, 1] }, { duration: 1.2, ease: EASE, delay: t0 + 0.25 });
      scroll(function(p){
        var g = gut() * (1 - clamp(p / 0.42));
        frame.style.clipPath = 'inset(0px ' + g.toFixed(1) + 'px 0px ' + g.toFixed(1) + 'px)';
        if (img) img.style.transform = 'scale(' + (1.18 - 0.18 * clamp(p / 0.5)).toFixed(4) + ')';
        if (head) { head.style.transform = 'translateY(' + (-90 * clamp(p / 0.35)).toFixed(1) + 'px)'; head.style.opacity = (1 - clamp((p - 0.05) / 0.25)).toFixed(3); }
        if (shade) shade.style.opacity = clamp((p - 0.3) / 0.25).toFixed(3);
        var c = clamp((p - 0.42) / 0.18);
        if (cap) { cap.style.opacity = c.toFixed(3); cap.style.transform = 'translateY(' + (48 * (1 - clamp((p - 0.42) / 0.2))).toFixed(1) + 'px)'; }
        if (seal) { seal.style.opacity = c.toFixed(3); seal.style.transform = 'rotate(' + (140 * p).toFixed(1) + 'deg)'; }
        if (!rolled && p > 0.45) { rolled = true; roll(xp); }
      }, { target: host, offset: ['start start', 'end end'] });
    });
    $$('[data-roll]').forEach(function(el){ if (!el.closest('.xp')) inView(el, function(){ roll(el.parentNode); }); });

    // 6. The track: vertical scrolling moves it sideways; each panel's number fills in as it arrives (desktop).
    if (matchMedia('(min-width: 1024px) and (min-height: 640px)').matches) $$('.track').forEach(function(sec){
      var list = sec.querySelector('.track-list'), panels = $$('.panel', sec), bar = sec.querySelector('.track-bar i'), count = sec.querySelector('.track-count b');
      if (!list || panels.length < 3) return;
      sec.classList.add('is-h'); mark(list);
      var dist = 0;
      var size = function(){ dist = Math.max(0, list.scrollWidth - innerWidth); sec.style.height = (dist + innerHeight) + 'px'; };
      size(); addEventListener('resize', size); if (window.ResizeObserver) new ResizeObserver(size).observe(list);
      var act = -1;
      scroll(function(p){
        list.style.transform = 'translate3d(' + (-p * dist).toFixed(1) + 'px,0,0)';
        if (bar) bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
        var a = Math.min(panels.length - 1, Math.max(0, Math.round(p * (panels.length - 1))));
        if (a !== act) { act = a; panels.forEach(function(x, i){ x.classList.toggle('on', i === a); }); if (count) count.textContent = (a < 9 ? '0' : '') + (a + 1); }
      }, { target: sec, offset: ['start start', 'end end'] });
    });

    // 7. Parallax: photographs drift slowly against the scroll inside their frames.
    $$('[data-parallax]').forEach(function(el){
      var im = el.querySelector('img'); if (!im) return;
      var amt = parseFloat(el.getAttribute('data-parallax')) || 8;
      im.style.top = (-amt) + '%'; im.style.height = (100 + 2 * amt) + '%'; mark(im);
      scroll(function(p){ im.style.transform = 'translate3d(0,' + ((p * 2 - 1) * amt * 0.8).toFixed(2) + '%,0)'; }, { target: el, offset: ['start end', 'end start'] });
    });
  } catch (err) {
    // Never leave content hidden: show everything as it is, without motion.
    if (window.console) console.error('[motion]', err);
    showAll();
  }
})();`;

/** Motion (motion.dev): the vanilla-JS build of Framer Motion, exposed as window.Motion. */
export const SYSTEM_LIBRARIES = [
  "https://cdn.jsdelivr.net/npm/motion@13.4.4/dist/motion.js",
];

/** In <head>, before anything paints: the theme from the link (?theme=), else this site's remembered one; motion on unless the visitor asked for less. */
export const HEAD_JS = `(function(){var d=document.documentElement,ok=/^(${LOOKS.map((l) => l.id).join("|")})$/;var q=(location.search.match(/[?&]theme=([a-z]+)/)||[])[1];try{var t=q&&ok.test(q)?q:localStorage.getItem('rr-theme:'+(d.getAttribute('data-site')||location.pathname.split('/').slice(0,3).join('/')));if(t&&ok.test(t))d.setAttribute('data-theme',t)}catch(e){if(q&&ok.test(q))d.setAttribute('data-theme',q)}if(!matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('anim');setTimeout(function(){if(!window.Motion)d.classList.remove('anim')},3500)}})();`;
