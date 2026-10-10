# Revamp Radar

Finds small businesses (restaurants, cafés, gyms, salons, clothing and retail shops, import/export, healthcare, accounting, local services) in the US, EU, Canada, Australia and New Zealand
whose websites look outdated, collects their **publicly listed** contact details, appends them to a
Google Sheet, and generates an animated concept redesign of each site from its own content.

**Live:** https://revamp-radar.amethiyavivek.workers.dev — public page at `/`, sign in at `/login`,
dashboard at `/app`, redesigns at `/preview/<domain>`.

```
OpenStreetMap (Overpass)  ──►  Cloudflare Worker (cron every 10 min)  ──►  D1 database
   businesses with websites      audit → score → extract contacts            │
                                                                             ├─► Google Sheet (Apps Script webhook)
                                                                             ├─► Dashboard (React, same Worker)
                                                                             └─► /preview/<domain>  (professional redesign) 
```

## Repo layout

| Path | What |
|---|---|
| `packages/core` | Shared logic: discovery, outdated-site scoring, contact/content extraction, redesign renderer. Runs in Node and Workers. |
| `apps/worker` | Cloudflare Worker: cron job, REST API, preview pages, serves the dashboard. D1 schema in `schema.sql`. |
| `apps/dashboard` | React + Vite: public landing page (before/after slider, live showcase), sign-in, and the leads dashboard with a per-lead drawer (audit, live redesign, pitch email). |
| `apps/cli` | Local runner: `npm run discover` writes CSV/JSON + preview HTML to `out/`. |
| `integrations/google-apps-script` | `Code.gs` webhook that appends rows to the Google Sheet. |
| `docs/PLAN.md` | Phase 1 / 2 / 3 product plan. |

## Quick start

```bash
npm install
npm test                                   # core unit tests
npm run discover -- --target 10            # local run → out/leads-<date>.csv + out/previews/*.html
npm run discover -- --category gym --city berlin --target 5

# feed the deployed Worker (RR_TOKEN = ADMIN_TOKEN)
RR_URL=https://revamp-radar.amethiyavivek.workers.dev RR_TOKEN=… npm run discover -- --target 10 --upload
RR_URL=… RR_TOKEN=… npm run discover -- --push --slices 6   # discovery only, Worker audits
```

### Full-site redesigns

Opening a redesign crawls the business's site (home page plus up to 7 linked pages), keeps every heading,
paragraph, list and image in order, and renders each page in a professional, photo-led layout:
`/preview/<domain>/` and `/preview/<domain>/<page>`. Add `?engine=template` or `?engine=claude` to pick a version.

Every page also carries the **UI kit** (`packages/core/src/redesign/ui-kit.ts`): components from
[Magic UI](https://magicui.design) and [Smooth UI](https://smoothui.dev) (marquee, border beam, shine border, shimmer
button, spotlight cards, number ticker, blur fade, magnetic buttons, tilt/glow cards, mask reveals, scroll-reveal
paragraph, scroll progress) ported to plain CSS/JS so they run in the static, CSP-locked previews, plus effects after
popular [21st.dev](https://21st.dev/community/components) components (scroll media expansion, background paths). The
instant renderer uses a few; Claude redesigns use the rest via the skill's `references/ui-kit.md`.

Motion runs on [Motion](https://motion.dev) (`motion` on npm: Framer Motion's engine for plain HTML), loaded from a
pinned jsdelivr URL. Claude redesign jobs also get `uiux.md`: guidance for the business's trade from the
[UI UX Pro Max](https://uupm.cc) skill (`.claude/skills/ui-ux-pro-max/`; needs `python3` on the runner machine).

**Redesign with Claude** (dashboard → lead → Redesign, or **Redesign queue** → *Queue next N*) queues jobs. A runner
on your Mac has Claude Code, signed in with your Claude subscription, work through them as a staged pipeline:

| Stage | What happens | Where |
|---|---|---|
| Research | The original site is opened in a real browser (desktop + phone screenshots, measured brand colours, fonts, logo, mobile problems, script errors, load time) behind an SSRF guard | `apps/cli/src/research.ts`, `browser.ts` |
| UX audit | Findings from the audit score, the crawl and the browser | `packages/core/src/redesign/quality.ts` |
| Creative direction | One of 12 directions (layout, type, palette, motion, 3D policy) chosen for the trade, the site's material and brand, never the same as the last two redesigns; palette built from the brand accent and contrast-checked | `packages/core/src/redesign/directions.ts` |
| Build | Claude Code writes every page following `brief.ts` and the `website-redesign` skill (Read/Write/Edit only) | `apps/cli/src/redesign-runner.ts` |
| QA | Every page rendered at 1440/820/390px under the production CSP: overflow, broken images/links, script errors, CSP blocks, content coverage vs the crawl, placeholders, tap targets, alt text, contrast, stuck animations, LCP | `apps/cli/src/qa.ts` |
| Refine | Claude reviews the screenshots + QA report, fixes what it finds and scores visual quality, brand fit, originality and UX | `REVIEW_PROMPT` in `brief.ts` |
| Validate | QA again. A pass (no critical defect, every category ≥ 5, weighted ≥ 7) is published as **done**; anything else is published as **needs review** | `scoreRedesign` in `quality.ts` |

```bash
claude            # once: sign in to Claude Code with your Claude account
RR_URL=https://revamp-radar.amethiyavivek.workers.dev RR_TOKEN=<RUNNER_TOKEN> npm run redesign-runner -- --concurrency 2
#   --passes 2  review/refine passes   --budget 6  stop refining at $6 reported Claude cost per job
#   --once  --keep  --timeout 30  --no-research  --no-qa
```

Jobs move through `queued → running (researching, designing, building, qa, refining, uploading) → done | needs_review |
failed | cancelled`. One active job per lead is enforced by a unique index. Every runner report is a heartbeat; a job
whose runner goes quiet for 20 minutes is handed back. Technical failures retry with backoff (5, 10, 20 min, max 3
attempts); an unreachable website or an owner rejection stops for a person. Every step is recorded in `job_events`
and shown in the portal, with the QA scorecard, duration and the cost Claude Code reports. There is no daily cap on
redesigns: queue 10 or 100, run more workers to go faster.

Browser research and QA use Google Chrome if installed, else `RR_CHROMIUM=<path to a Chromium>`. The runner only lets
Claude read and write files in a temporary folder (no shell, no web access). Claude-built pages are served with a
sandboxed CSP, so they can't touch the dashboard's session. A Claude subscription can't be called from Cloudflare
directly; to run jobs without your Mac on, the same brief can be sent through the Claude API with an API key (billed
per use).

### Outreach (Phase 3)

Click a lead in the dashboard to see why it scored as outdated plus a ready-made pitch email.
"Open draft in Gmail" opens a pre-filled compose window. Nothing is sent automatically.
Set the signature with `SENDER_NAME` in `apps/worker/wrangler.jsonc`.

### How a site is scored (0–100, higher = more outdated)

No HTTPS, no mobile viewport, legacy doctype, table layouts, `<font>/<center>/<marquee>/frames`, Flash,
old jQuery/Bootstrap/WordPress, legacy Google Analytics, IE hacks, old copyright year, old generators
(FrontPage, Dreamweaver…), dated builders, fixed-width layouts, slider plugins, no semantic HTML.
Modern stacks (Next.js, Webflow, Squarespace, Wix…) subtract points. A lead **qualifies** at
`MIN_SCORE` (default 35) and needs at least one email or phone number.

## Deploying (Cloudflare free plan)

```bash
npx wrangler login
npx wrangler d1 create revamp-radar        # put database_id into apps/worker/wrangler.jsonc
npm run db:init -w @rr/worker              # apply schema
npm run db:migrate -w @rr/worker           # full-site crawl + Claude redesign tables + pipeline (0006)
# existing deployments: npm run db:migrate:pipeline -w @rr/worker
npx wrangler secret put ADMIN_EMAIL        # (in apps/worker) dashboard sign-in email
npm run hash-password -w @rr/worker -- '<password>' | npx wrangler secret put ADMIN_PASSWORD_HASH
openssl rand -hex 32 | npx wrangler secret put SESSION_SECRET
npx wrangler secret put ADMIN_TOKEN        # bearer token for the CLI / GitHub Action
npx wrangler secret put RUNNER_TOKEN       # limited token for redesign runners: claim and report on jobs only
npm run deploy
```

The cron (`*/10 * * * *`) refills the queue from one (category, city) slice when it runs low,
audits 6 sites per run (≤ ~15 subrequests, under the free 50 limit), and stops auditing for the day
once it reaches `MAX_QUALIFIED_PER_DAY` qualified leads (default 3× `DAILY_TARGET`; `"0"` removes the cap, e.g. on a
paid plan). This only paces lead discovery; redesigns have no daily limit.

### Google Sheet sync

1. Open the Google Sheet → Extensions → Apps Script → paste `integrations/google-apps-script/Code.gs`.
2. Project Settings → Script properties → `SHEETS_SECRET` = a long random string.
3. Deploy → New deployment → Web app → Execute as **Me**, access **Anyone** → copy the `/exec` URL.
4. In `apps/worker`: `npx wrangler secret put SHEETS_WEBHOOK_URL` and `npx wrangler secret put SHEETS_SECRET`.

New qualified leads are appended every cron run (deduplicated by website). "Sync to Sheet" in the
dashboard forces it.

## Responsible use

- Only contact details the business publishes on its own site or in OpenStreetMap are collected.
- Previews are labelled "Concept redesign, not the official website", served `noindex`, and link to
  the real site. Use them in one-to-one pitches, not as public replacements.
- Outreach to EU contacts falls under GDPR (legitimate-interest B2B, clear opt-out); US under CAN-SPAM.
  Honour opt-outs by setting a lead's status to `ignored`.
- OpenStreetMap data © OpenStreetMap contributors (ODbL). Be gentle with the public Overpass API.
