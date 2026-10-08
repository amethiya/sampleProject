# Page patterns

Building blocks for the layout templates. Numbers are referenced by templates in blueprints.md. Adapt freely; keep
the restraint.

## Base (every page)

```html
<html lang="…" class="no-js"><head><script>document.documentElement.className='js'</script>
```
```css
:root { --bg; --surface; --ink; --muted; --line; --accent; --on-accent; --r; --pad: clamp(16px, 4vw, 48px) }
body { margin: 0; background: var(--bg); color: var(--ink); font: 400 17px/1.65 var(--body) }
h1, h2, h3 { font-family: var(--display); line-height: 1.1; margin: 0 0 .5em }
.wrap { max-width: 1200px; margin: 0 auto; padding: 0 var(--pad) }
section { padding: clamp(56px, 8vw, 112px) 0 }
.btn { display: inline-flex; align-items: center; min-height: 48px; padding: 0 24px; border-radius: var(--r);
       background: var(--accent); color: var(--on-accent); font-weight: 600; text-decoration: none }
.js .fade { opacity: 0; transform: translateY(12px); transition: opacity .6s ease, transform .6s ease }
.js .fade.in { opacity: 1; transform: none }
@media (prefers-reduced-motion: reduce) { .js .fade { opacity: 1; transform: none; transition: none } }
```
```js
// Sticky header turns solid; mobile menu; one fade-in per element.
const header = document.querySelector('header');
addEventListener('scroll', () => header.classList.toggle('solid', scrollY > 20), { passive: true });
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }));
document.querySelectorAll('.fade').forEach(el => io.observe(el));
```

## 1. Hero (layout from the template)

- **fullbleed:** photo fills the first screen (min 80vh), dark gradient from the bottom-left, name + one line +
  one or two buttons bottom-left.
- **split:** two columns; text (name, line, hours/address, buttons) left, photo right at 4:5 or 1:1.
- **editorial:** large headline across the top, a wide photo below it (16:7), small facts row beneath.
- **centered:** centred name and line, generous space, one photo below or none.
The hero headline is the business name or the page title, never invented copy.

## 2. Introduction / prose

The site's own intro paragraph in large type (22–28 px), max 32 em wide; longer text in a single readable column.
A photo beside it only when the site has one.

## 3. Menu, services and price lists

```css
.price-list li { display: grid; grid-template-columns: 1fr auto; gap: 4px 24px; padding: 14px 0; border-bottom: 1px solid var(--line) }
.price-list .desc { grid-column: 1 / -1; color: var(--muted); font-size: 15px }
```
Group under the site's own category headings; two columns on desktop for long lists.

## 4. Tables (timetables, hours)

A real `<table>` with a header row, zebra or ruled rows, horizontally scrollable wrapper on phones.

## 5. Photo grid / gallery

CSS grid of the site's photos, consistent aspect ratio (4:5 or 3:2), 8–16 px gaps, captions only from the site.

## 6. Visit / contact and footer

Two columns: address, hours (as a table), phone, email, directions link; an OpenStreetMap embed or link on the
other side. Footer repeats name, address, phone, email and page links.

## 7. Contact strip

For services and healthcare: a slim band right under the hero with phone, hours and a booking or quote button.

## 8. Booking band

A full-width band near the end with one sentence from the site and the primary action.
