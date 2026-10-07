import { crawlSite, renderSitePage, snapshotFromLead, type Lead, type SiteSnapshot } from "@rr/core";

interface Db {
  DB: D1Database;
}

const TEMPLATE_CSP =
  "default-src 'none'; script-src 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src https: http: data: blob:; frame-src https://www.openstreetmap.org; frame-ancestors 'self'; base-uri 'none'; form-action 'none'";
// Claude-written pages run in a sandbox with an opaque origin: they can't read cookies or call the API as the user.
const AI_CSP =
  "sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox; default-src 'none'; script-src 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src https: http: data: blob:; frame-src https://www.openstreetmap.org; connect-src 'none'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'";

const SLUG = /^[a-z0-9_-]{1,64}$/;
const MAX_PAGE_BYTES = 1_500_000;
const STALE_MINUTES = 45;

interface SiteRow {
  lead: string;
  site: string | null;
}

async function loadLead(env: Db, id: string): Promise<{ lead: Lead; site: SiteSnapshot | null } | null> {
  const row = await env.DB.prepare("SELECT lead, site FROM sites WHERE id = ? AND state = 'audited'").bind(id).first<SiteRow>();
  if (!row) return null;
  return { lead: JSON.parse(row.lead) as Lead, site: row.site ? (JSON.parse(row.site) as SiteSnapshot) : null };
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
  return html(renderSitePage(data.lead, site, slug, { image: (u) => proxied(url.origin, u) }), TEMPLATE_CSP);
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
  for (const candidate of [target.href, target.href.replace(/^https:/, "http:")]) {
    upstream = await fetch(candidate, { headers: { accept: "image/*" }, redirect: "follow" }).catch(() => null);
    if (upstream?.ok) break;
  }
  const type = upstream?.headers.get("content-type") ?? "";
  const size = Number(upstream?.headers.get("content-length") ?? 0);
  if (!upstream?.ok || !type.startsWith("image/") || size > 8_000_000) return new Response("Image unavailable", { status: 404 });
  const res = new Response(upstream.body, {
    headers: { "content-type": type, "cache-control": "public, max-age=604800", "x-content-type-options": "nosniff", "content-security-policy": "default-src 'none'; sandbox" },
  });
  ctx.waitUntil(cache.put(req, res.clone()));
  return res;
}

function html(body: string, csp: string): Response {
  return new Response(body, {
    headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex, nofollow", "content-security-policy": csp },
  });
}

/** Authenticated API routes for redesigns. Returns null when the path isn't one of them. */
export async function redesignApi(req: Request, url: URL, env: Db): Promise<Response | null> {
  const path = url.pathname.replace(/\/+$/, "");
  const m = req.method;

  const lm = path.match(/^\/api\/leads\/([^/]+)\/(redesign|crawl)$/);
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
      const site = await ensureSite(env, id, data.lead, data.site);
      const active = await env.DB.prepare("SELECT id FROM redesign_jobs WHERE lead_id = ? AND status IN ('queued', 'running')").bind(id).first();
      if (!active) await env.DB.prepare("INSERT INTO redesign_jobs (lead_id) VALUES (?)").bind(id).run();
      return json(await status(env, id, site));
    }
  }

  // Runner protocol (used by `npm run redesign-runner` on a machine signed in to Claude Code).
  if (path === "/api/redesign-jobs/next" && m === "POST") {
    await env.DB.prepare(
      `UPDATE redesign_jobs SET status = 'queued', started_at = NULL WHERE status = 'running' AND started_at < datetime('now', '-${STALE_MINUTES} minutes')`,
    ).run();
    const job = await env.DB.prepare("SELECT id, lead_id FROM redesign_jobs WHERE status = 'queued' ORDER BY created_at LIMIT 1").first<{ id: number; lead_id: string }>();
    if (!job) return json({ job: null });
    const claimed = await env.DB.prepare("UPDATE redesign_jobs SET status = 'running', started_at = datetime('now') WHERE id = ? AND status = 'queued'").bind(job.id).run();
    if (!claimed.meta.changes) return json({ job: null });
    const data = await loadLead(env, job.lead_id);
    if (!data) {
      await finish(env, job.id, "failed", "Lead no longer exists");
      return json({ job: null });
    }
    const site = await ensureSite(env, job.lead_id, data.lead, data.site);
    return json({ job: { id: job.id, leadId: job.lead_id }, lead: data.lead, site: withProxiedImages(url.origin, site) });
  }

  const jm = path.match(/^\/api\/redesign-jobs\/(\d+)\/(complete|fail)$/);
  if (jm && m === "POST") {
    const jobId = Number(jm[1]);
    const job = await env.DB.prepare("SELECT lead_id, status FROM redesign_jobs WHERE id = ?").bind(jobId).first<{ lead_id: string; status: string }>();
    if (!job) return json({ error: "Job not found" }, 404);
    if (jm[2] === "fail") {
      const { error = "Unknown error" } = (await req.json().catch(() => ({}))) as { error?: string };
      await finish(env, jobId, "failed", error.slice(0, 2000));
      return json({ ok: true });
    }
    const { pages = [] } = (await req.json().catch(() => ({}))) as { pages?: { slug: string; html: string }[] };
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
      ...valid.slice(0, 20).map((p) => env.DB.prepare("INSERT INTO ai_pages (lead_id, slug, html) VALUES (?, ?, ?)").bind(job.lead_id, p.slug, p.html)),
    ]);
    await finish(env, jobId, "done", null);
    return json({ ok: true, pages: valid.length });
  }

  return null;
}

async function finish(env: Db, id: number, status: string, error: string | null) {
  await env.DB.prepare("UPDATE redesign_jobs SET status = ?, error = ?, finished_at = datetime('now') WHERE id = ?").bind(status, error, id).run();
}

async function status(env: Db, id: string, site: SiteSnapshot | null) {
  const job = await env.DB.prepare(
    "SELECT id, status, error, created_at AS createdAt, started_at AS startedAt, finished_at AS finishedAt FROM redesign_jobs WHERE lead_id = ? ORDER BY id DESC LIMIT 1",
  ).bind(id).first();
  const { results: ai } = await env.DB.prepare("SELECT slug, created_at AS createdAt FROM ai_pages WHERE lead_id = ?").bind(id).all<{ slug: string; createdAt: string }>();
  return {
    crawledAt: site?.crawledAt ?? null,
    pages: site?.pages.map((p) => ({ slug: p.slug, label: p.label, url: p.url })) ?? [],
    job: job ?? null,
    claudePages: ai.map((a) => a.slug),
    claudeCreatedAt: ai[0]?.createdAt ?? null,
  };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}
