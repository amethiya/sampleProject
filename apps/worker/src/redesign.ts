import {
  DIRECTIONS, LOOKS, USER_AGENT, auditCandidate, categoryById, lookById, makeDna, crawlSite, dnaFromKey, hostId, normalizeWebsite, pickDna, renderSitePage, snapshotFromLead,
  type DesignDna, type Lead, type SiteSnapshot,
  AI_CSP, TEMPLATE_CSP,
} from "@rr/core";
import { claimNext, completeJob, failJob, jobDetail, jobStats, listJobs, progress, publicJob, queueBatch, queueJob, review, type JobRow } from "./jobs";

interface Db {
  DB: D1Database;
}

const SLUG = /^[a-z0-9_-]{1,64}$/;
const MAX_PAGE_BYTES = 1_500_000;

interface SiteRow {
  lead: string;
  site: string | null;
  style: string | null;
}

async function loadLead(env: Db, id: string): Promise<{ lead: Lead; site: SiteSnapshot | null; style: string | null } | null> {
  const row = await env.DB.prepare("SELECT lead, site, style FROM sites WHERE id = ? AND state = 'audited'").bind(id).first<SiteRow>();
  if (!row) return null;
  return { lead: JSON.parse(row.lead) as Lead, site: row.site ? (JSON.parse(row.site) as SiteSnapshot) : null, style: row.style };
}

/** Design DNA keys of the most recent redesigns, newest first (template sites and Claude jobs). */
async function recentStyles(env: Db, limit = 12): Promise<string[]> {
  const { results } = await env.DB.prepare(
    `SELECT style FROM (
       SELECT style, styled_at AS at FROM sites WHERE style IS NOT NULL
       UNION ALL SELECT style, created_at AS at FROM redesign_jobs WHERE style IS NOT NULL
     ) ORDER BY at DESC LIMIT ?`,
  ).bind(limit).all<{ style: string }>();
  return results.map((r) => r.style);
}

/** Name and page text, so a pizzeria gets the pizza blueprint and a burger bar the burger one. */
function siteText(lead: Lead, site: SiteSnapshot | null): string {
  const pages = site?.pages ?? [];
  return [lead.name, lead.website, ...pages.flatMap((p) => [p.title, p.description ?? "", ...p.sections.flatMap((s) => [s.heading ?? "", ...s.paragraphs, ...s.items])])]
    .join(" ")
    .slice(0, 20000);
}

/** The site's DNA (theme + trade), assigning one that differs from recent redesigns the first time it is rendered. */
async function ensureDna(env: Db, id: string, lead: Lead, style: string | null, site: SiteSnapshot | null): Promise<DesignDna> {
  const existing = style ? dnaFromKey(style) : null;
  if (existing) return existing;
  const dna = pickDna(id, lead.category, await recentStyles(env), siteText(lead, site));
  await env.DB.prepare("UPDATE sites SET style = ?, styled_at = datetime('now') WHERE id = ?").bind(dna.key, id).run();
  return dna;
}

/** A DNA with a chosen theme, keeping the trade. */
function withTheme(key: string, theme: string): string {
  const d = dnaFromKey(key);
  const look = lookById(theme);
  return d && look ? makeDna(look, d.trade).key : key;
}

export function describeDna(key: string): string {
  const d = dnaFromKey(key);
  return d ? `${d.look.name} theme, designed as ${d.trade.replace("_", " ")}` : key;
}

/** Crawl the whole site once and keep it; later previews and Claude jobs reuse the snapshot. */
export async function ensureSite(env: Db, id: string, lead: Lead, existing: SiteSnapshot | null, force = false): Promise<SiteSnapshot> {
  if (existing && !force) return existing;
  const site = (await crawlSite(lead.website)) ?? existing ?? snapshotFromLead(lead);
  await env.DB.prepare("UPDATE sites SET site = ? WHERE id = ?").bind(JSON.stringify(site), id).run();
  return site;
}

/** GET /preview/<id>/ and /preview/<id>/<page>. Serves the Claude redesign when one exists, else the template. */
export async function preview(req: Request, url: URL, env: Db): Promise<Response> {
  const [, , rawId, rawSlug = "", ...rest] = url.pathname.split("/");
  const id = decodeURIComponent(rawId ?? "");
  if (!id || rest.length) return new Response("Not found", { status: 404 });
  if (url.pathname === `/preview/${rawId}`) {
    return Response.redirect(`${url.origin}/preview/${rawId}/${url.search}`, 301);
  }
  const slug = decodeURIComponent(rawSlug) || "home";
  if (!SLUG.test(slug)) return new Response("Not found", { status: 404 });

  const engine = url.searchParams.get("engine");
  if (engine !== "template") {
    const ai = await env.DB.prepare("SELECT html FROM ai_pages WHERE lead_id = ? AND slug = ?").bind(id, slug).first<{ html: string }>();
    if (ai) return html(ai.html, AI_CSP);
    if (engine === "claude") return new Response("This page has no Claude redesign yet.", { status: 404 });
  }

  const data = await loadLead(env, id);
  if (!data) return new Response("Preview not found", { status: 404 });
  const site = await ensureSite(env, id, data.lead, data.site);
  if (!site.pages.some((p) => p.slug === slug)) return new Response("Page not found", { status: 404 });
  const dna = await ensureDna(env, id, data.lead, data.style, site);
  return html(renderSitePage(data.lead, site, slug, { image: (u) => proxied(url.origin, u), dna }), TEMPLATE_CSP);
}

export function proxied(origin: string, u: string): string {
  return `${origin}/img?u=${encodeURIComponent(u)}`;
}

/** Copy of a snapshot with every image pointing at the HTTPS proxy (for Claude jobs). */
export function withProxiedImages(origin: string, site: SiteSnapshot): SiteSnapshot {
  return { ...site, pages: site.pages.map((p) => ({ ...p, sections: p.sections.map((s) => ({ ...s, images: s.images.map((i) => proxied(origin, i)) })) })) };
}

/**
 * GET /img?u=<url>: serves images from lead websites over HTTPS (many old sites are HTTP-only or have
 * expired certificates). Only hosts that belong to a known lead are allowed; responses are cached at the edge.
 */
export async function imageProxy(req: Request, url: URL, env: Db, ctx: ExecutionContext): Promise<Response> {
  const cache = caches.default;
  const hit = await cache.match(req);
  if (hit) return hit;
  let target: URL;
  try {
    target = new URL(url.searchParams.get("u") ?? "");
  } catch {
    return new Response("Bad image URL", { status: 400 });
  }
  if (!/^https?:$/.test(target.protocol)) return new Response("Bad image URL", { status: 400 });
  const host = target.hostname.replace(/^www\./, "");
  const known = await env.DB.prepare("SELECT 1 FROM sites WHERE id = ? OR ? LIKE '%.' || id LIMIT 1").bind(host, host).first();
  if (!known) return new Response("Not allowed", { status: 403 });

  let upstream: Response | null = null;
  const tried: string[] = []; // reported in x-upstream when the image is unavailable
  // Some hosts refuse Cloudflare's network outright; the public wsrv.nl image CDN is the last resort.
  const relay = `https://wsrv.nl/?url=${encodeURIComponent(target.href)}`;
  for (const candidate of [target.href, target.href.replace(/^https:/, "http:"), relay]) {
    upstream = await fetch(candidate, { headers: { accept: "image/*", "user-agent": USER_AGENT }, redirect: "follow" }).catch((e) => (tried.push(String(e).slice(0, 80)), null));
    if (upstream) tried.push(`${upstream.status} ${upstream.headers.get("content-type") ?? ""}`);
    if (upstream?.ok) break;
  }
  const type = upstream?.headers.get("content-type") ?? "";
  const size = Number(upstream?.headers.get("content-length") ?? 0);
  if (!upstream?.ok || !type.startsWith("image/") || size > 8_000_000) return new Response("Image unavailable", { status: 404, headers: { "x-upstream": tried.join(" | ") } });
  const res = new Response(upstream.body, {
    headers: { "content-type": type, "cache-control": "public, max-age=604800", "x-content-type-options": "nosniff", "content-security-policy": "default-src 'none'; sandbox", "access-control-allow-origin": "*" },
  });
  ctx.waitUntil(cache.put(req, res.clone()));
  return res;
}

export function html(body: string, csp: string): Response {
  return new Response(body, {
    headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex, nofollow", "content-security-policy": csp },
  });
}

/** Authenticated API routes for redesigns. Returns null when the path isn't one of them. */
export async function redesignApi(req: Request, url: URL, env: Db): Promise<Response | null> {
  const path = url.pathname.replace(/\/+$/, "");
  const m = req.method;

  const lm = path.match(/^\/api\/leads\/([^/]+)\/(redesign|crawl|restyle)$/);
  if (lm) {
    const id = decodeURIComponent(lm[1]);
    const data = await loadLead(env, id);
    if (!data) return json({ error: "Lead not found" }, 404);

    if (lm[2] === "crawl" && m === "POST") {
      const site = await ensureSite(env, id, data.lead, data.site, true);
      return json(await status(env, id, site));
    }
    if (lm[2] === "redesign" && m === "GET") {
      return json(await status(env, id, data.site));
    }
    if (lm[2] === "redesign" && m === "POST") {
      // Body (all optional): notes for Claude, a theme id, a creative direction id, and whether to improve the last version.
      const body = (await req.json().catch(() => ({}))) as { notes?: string; theme?: string; mode?: string; direction?: string };
      const notes = (body.notes ?? "").trim().slice(0, 4000) || null;
      const site = await ensureSite(env, id, data.lead, data.site);
      const lastDone = await env.DB.prepare("SELECT style FROM redesign_jobs WHERE lead_id = ? AND status IN ('done', 'needs_review') ORDER BY id DESC LIMIT 1").bind(id).first<{ style: string | null }>();
      const hasPages = await env.DB.prepare("SELECT 1 FROM ai_pages WHERE lead_id = ? LIMIT 1").bind(id).first();
      const mode = body.mode === "revise" && hasPages ? "revise" : "fresh";
      let key: string;
      if (mode === "revise" && lastDone?.style && dnaFromKey(lastDone.style)) {
        key = lastDone.style; // same look, refined with the notes
      } else {
        // A new look every time: avoid recent redesigns, including this site's current ones.
        const recent = await recentStyles(env);
        if (data.style) recent.unshift(data.style);
        if (lastDone?.style) recent.unshift(lastDone.style);
        key = pickDna(`${id}:${Date.now()}`, data.lead.category, recent, siteText(data.lead, site)).key;
      }
      const theme = body.theme && lookById(body.theme) ? body.theme : null;
      if (theme) key = withTheme(key, theme);
      const jobId = await queueJob(env, id, { style: key, notes, mode, theme, direction: body.direction });
      if (!jobId) return json({ error: "A Claude redesign of this site is already queued or running." }, 409);
      return json(await status(env, id, site));
    }
    // Instant: give the redesign a new theme (a chosen one, or the next one that suits the trade). No runner needed.
    if (lm[2] === "restyle" && m === "POST") {
      const body = (await req.json().catch(() => ({}))) as { theme?: string };
      const site = await ensureSite(env, id, data.lead, data.site);
      const recent = await recentStyles(env);
      if (data.style) recent.unshift(data.style);
      let key = pickDna(`${id}:${Date.now()}`, data.lead.category, recent, siteText(data.lead, site)).key;
      if (body.theme && lookById(body.theme)) key = withTheme(key, body.theme);
      await env.DB.prepare("UPDATE sites SET style = ?, styled_at = datetime('now') WHERE id = ?").bind(key, id).run();
      return json(await status(env, id, site));
    }
  }

  // Add any website by URL (not only discovered leads) so it can be redesigned.
  if (path === "/api/leads/add" && m === "POST") {
    const body = (await req.json().catch(() => ({}))) as { url?: string; category?: string; city?: string; name?: string };
    const website = normalizeWebsite(body.url ?? "");
    const category = categoryById(body.category ?? "");
    if (!website || !category) return json({ error: "Enter a website address and choose a category." }, 400);
    const id = hostId(website);
    const lead = await auditCandidate({
      id, name: body.name?.trim() || id, category: category.id, city: body.city?.trim() || "", country: "", region: "us", website,
    }, 0);
    if (!lead) return json({ error: "That website couldn't be reached. Check the address and try again." }, 422);
    if (!body.name?.trim()) lead.name = (lead.content.title.split(/[|\-–—:]/)[0] || id).trim().slice(0, 80) || id;
    lead.qualified = true;
    await env.DB.prepare(
      `INSERT INTO sites (id, name, category, city, country, region, website, candidate, state, score, qualified, lead, audited_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'audited', ?, 1, ?, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET state = 'audited', name = excluded.name, category = excluded.category, score = excluded.score,
         qualified = 1, lead = excluded.lead, site = NULL, audited_at = excluded.audited_at`,
    ).bind(id, lead.name, lead.category, lead.city, lead.country, lead.region, website, JSON.stringify(lead), lead.audit.score, JSON.stringify(lead)).run();
    await ensureSite(env, id, lead, null, true).catch(() => null);
    return json({ id, name: lead.name, score: lead.audit.score });
  }

  // Owner: queue many leads at once, list jobs, metrics.
  if (path === "/api/redesign-jobs/batch" && m === "POST") {
    const body = (await req.json().catch(() => ({}))) as { count?: number; leadIds?: string[]; category?: string };
    const recent = await recentStyles(env);
    const r = await queueBatch(env, {
      ...body,
      styleFor: (leadId, category) => {
        const key = pickDna(`${leadId}:${Date.now()}`, category, recent).key;
        recent.unshift(key);
        return key;
      },
    });
    return json(r);
  }
  if (path === "/api/redesign-jobs" && m === "GET") return json(await listJobs(env, url));
  if (path === "/api/redesign-stats" && m === "GET") return json(await jobStats(env));

  // Runner protocol (used by `npm run redesign-runner` and `npm run job` on a machine signed in to Claude Code).
  if (path === "/api/redesign-jobs/next" && m === "POST") {
    const { leadId, runner } = (await req.json().catch(() => ({}))) as { leadId?: string; runner?: string };
    const claimed = await claimNext(env, {
      leadId, runner,
      load: (id) => loadLead(env, id),
      ensure: (id, lead, site) => ensureSite(env, id, lead, site),
    });
    if (!claimed) return json({ job: null });
    const { job, lead, site, recentDirections } = claimed;
    const avoid = (await recentStyles(env, 8)).filter((k) => k !== job.style).slice(0, 5).map(describeDna);
    // Revisions start from the previous Claude pages.
    const previous = job.mode === "revise"
      ? (await env.DB.prepare("SELECT slug, html FROM ai_pages WHERE lead_id = ?").bind(job.lead_id).all<{ slug: string; html: string }>()).results
      : [];
    return json({
      job: { id: job.id, leadId: job.lead_id, style: job.style, notes: job.notes, mode: job.mode, direction: job.direction, theme: job.forced_theme, attempts: job.attempts, maxAttempts: job.max_attempts },
      lead, site: withProxiedImages(url.origin, site), avoid: job.mode === "revise" ? [] : avoid, recentDirections, previous,
    });
  }

  const jm = path.match(/^\/api\/redesign-jobs\/(\d+)(?:\/(progress|complete|fail|approve|reject|retry|cancel))?$/);
  if (jm) {
    const jobId = Number(jm[1]);
    const action = jm[2];
    if (!action && m === "GET") {
      const d = await jobDetail(env, jobId);
      return d ? json(d) : json({ error: "Job not found" }, 404);
    }
    if (m !== "POST" || !action) return null;
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    if (action === "progress") {
      const r = await progress(env, jobId, body as { stage?: string; message?: string; level?: string });
      return json(r.body, r.status);
    }
    if (action === "fail") {
      const r = await failJob(env, jobId, body as { error?: string; kind?: string });
      return json(r.body, r.status);
    }
    if (action === "complete") {
      const job = await env.DB.prepare("SELECT lead_id, status FROM redesign_jobs WHERE id = ?").bind(jobId).first<{ lead_id: string; status: string }>();
      if (!job) return json({ error: "Job not found" }, 404);
      // A runner that lost its lease (job reclaimed, cancelled or already finished) must not overwrite the result.
      if (job.status !== "running") return json({ error: `Job is ${job.status}; this upload was not applied.` }, 409);
      const { pages = [], qa, qaScore, pass, costUsd } = body as { pages?: { slug: string; html: string }[]; qa?: unknown; qaScore?: number; pass?: boolean; costUsd?: number };
      const valid = pages.filter((p) => SLUG.test(p.slug) && typeof p.html === "string" && p.html.length > 200 && p.html.length <= MAX_PAGE_BYTES);
      if (!valid.some((p) => p.slug === "home")) return json({ error: "A home page (index.html) is required" }, 400);
      // Point any direct links to the business's own images at the HTTPS proxy.
      const data = await loadLead(env, job.lead_id);
      const originals = [...new Set((data?.site?.pages ?? []).flatMap((p) => p.sections.flatMap((x) => x.images)))].sort((a, b) => b.length - a.length);
      for (const p of valid) {
        for (const u of originals) {
          const variants = [u, u.replace(/^http:/, "https:"), u.replace(/^https:/, "http:")];
          for (const v of new Set(variants)) p.html = p.html.split(v).join(proxied(url.origin, u));
        }
      }
      await env.DB.batch([
        env.DB.prepare("DELETE FROM ai_pages WHERE lead_id = ?").bind(job.lead_id),
        ...valid.slice(0, 25).map((p) => env.DB.prepare("INSERT INTO ai_pages (lead_id, slug, html) VALUES (?, ?, ?)").bind(job.lead_id, p.slug, p.html)),
      ]);
      const status = await completeJob(env, jobId, { qa, qaScore, pass, costUsd, pages: valid.length });
      return json({ ok: true, pages: valid.length, status });
    }
    // approve | reject | retry | cancel (owner only: runner tokens can't reach these paths)
    const r = await review(env, jobId, action, body as { notes?: string; requeue?: string }, async (leadId) => {
      const d = await loadLead(env, leadId);
      return pickDna(`${leadId}:${Date.now()}`, d?.lead.category ?? "services", await recentStyles(env)).key;
    });
    return json(r.body, r.status);
  }

  return null;
}

async function status(env: Db, id: string, site: SiteSnapshot | null) {
  const job = await env.DB.prepare("SELECT * FROM redesign_jobs WHERE lead_id = ? ORDER BY id DESC LIMIT 1").bind(id).first<JobRow>();
  const events = job
    ? (await env.DB.prepare("SELECT at, stage, level, message FROM job_events WHERE job_id = ? ORDER BY id DESC LIMIT 30").bind(job.id).all()).results
    : [];
  const { results: ai } = await env.DB.prepare("SELECT slug, created_at AS createdAt FROM ai_pages WHERE lead_id = ?").bind(id).all<{ slug: string; createdAt: string }>();
  const style = await env.DB.prepare("SELECT style FROM sites WHERE id = ?").bind(id).first<{ style: string | null }>();
  const done = await env.DB.prepare("SELECT style FROM redesign_jobs WHERE lead_id = ? AND status IN ('done', 'needs_review') ORDER BY id DESC LIMIT 1").bind(id).first<{ style: string | null }>();
  return {
    templateTheme: style?.style ? dnaFromKey(style.style)?.look.id ?? null : null,
    claudeTheme: done?.style ? dnaFromKey(done.style)?.look.id ?? null : null,
    themes: LOOKS.map((l) => ({ id: l.id, name: l.name, dark: l.dark, bg: l.bg, accent: l.accent })),
    directions: DIRECTIONS.map((d) => ({ id: d.id, name: d.name, concept: d.concept })),
    templateStyle: style?.style ? describeDna(style.style) : null,
    claudeStyle: job?.style ? describeDna(job.style) : null,
    crawledAt: site?.crawledAt ?? null,
    pages: site?.pages.map((p) => ({ slug: p.slug, label: p.label, url: p.url })) ?? [],
    job: job ? { ...publicJob(job), events } : null,
    claudePages: ai.map((a) => a.slug),
    claudeCreatedAt: ai[0]?.createdAt ?? null,
  };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}
