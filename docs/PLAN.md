# Product plan

## Phase 1: lead engine (built)
- Discovery from OpenStreetMap (free, no key): restaurants, gyms, import/export, healthcare,
  accounting across 14 US and 16 EU cities, rotating through every (category, city) slice.
- Outdatedness audit (0–100) with human-readable reasons.
- Public contact extraction: mailto/tel links, page text, Cloudflare-obfuscated emails,
  contact/Impressum page fallback, OSM email/phone tags.
- Cloudflare Worker + D1 with a cron every 10 minutes; target ≥ 10 qualified leads/day.
- Google Sheet append via Apps Script webhook, deduplicated by website.
- Dashboard: stats, filters, status pipeline, CSV export, manual run/sync.

## Phase 2: redesign generator (built)
- `/preview/<domain>` renders a concept redesign from the site's own content (name, headings,
  copy, images, logo, phone, email, address, opening hours).
- Category themes (typography, palette, curated Unsplash photography), WebGL hero where the photo
  ripples in 3D around the pointer, a category 3D object (brass rings, dumbbell, capsules, coin
  stacks, globe with containers) that turns as you scroll, GSAP + ScrollTrigger + Lenis smooth
  scrolling, pinned horizontal gallery, clip-path reveals, velocity marquee, magnetic buttons;
  honours `prefers-reduced-motion` and works without WebGL.
- Marked as concept, `noindex`, strict CSP.

### Full-site redesign (built)
- Crawls up to 8 pages per site (nav links first), strips repeated site chrome, and renders every page with the
  business's own text and images in order: statements, split image/text sections, menus/price lists, galleries.
- "Redesign with Claude": a D1 job queue + `npm run redesign-runner`, which runs Claude Code headless with the
  user's subscription and uploads a bespoke multi-page site (served sandboxed).

## Phase 3: outreach (built)
- Personalised pitch email per lead (top audit issues in plain language + preview link + opt-out
  line), opened as a pre-filled **Gmail draft** from the dashboard. Nothing is auto-sent; opening a
  draft moves the lead to `contacted`.
- Status pipeline: new → contacted → replied → won / lost / ignored (ignored = suppression).
- Backup lead feed: `npm run discover -- --push` / `--upload` and a daily GitHub Action, for when
  Overpass is unreachable from Cloudflare.

## Phase 4: quality & scale (next)
- Claude API engine for the redesign queue (runs on Cloudflare, no Mac needed; API key, billed per use).
- Before/after screenshots (Cloudflare Browser Rendering) attached to the Sheet and email.
- Claude API pass to rewrite scraped copy into cleaner marketing copy and pick hero images.
- PageSpeed Insights score as an extra signal (free API key).
- Suppression list + unsubscribe link; per-country compliance notes (GDPR / CAN-SPAM).
- Custom domain for previews; per-lead static export to Cloudflare Pages when a client signs.
- More sources: Google Places (paid beyond free tier), Yelp Fusion, local business registries.
