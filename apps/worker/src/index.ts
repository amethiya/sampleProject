import {
  CATEGORIES, CITIES, SHEET_HEADERS, auditCandidate, buildPitch, discoverCandidates, leadToRow, sliceForCursor,
  type Candidate, type Lead,
} from "@rr/core";
import { currentUser, login, logout, type AuthEnv } from "./auth";
import { imageProxy, preview, redesignApi } from "./redesign";

export interface Env extends AuthEnv {
  DB: D1Database;
  ASSETS: Fetcher;
  DAILY_TARGET: string;
  MIN_SCORE: string;
  BATCH_SIZE: string;
  PUBLIC_URL?: string;
  SENDER_NAME?: string;
  SHEETS_WEBHOOK_URL?: string;
  SHEETS_SECRET?: string;
}

const STATUSES = ["new", "contacted", "replied", "won", "lost", "ignored"];

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    try {
      if (url.pathname.startsWith("/preview/")) return await preview(req, url, env);
      if (url.pathname === "/img") return await imageProxy(req, url, env, ctx);
      if (url.pathname.startsWith("/api/")) {
        if (url.pathname === "/api/login" && req.method === "POST") return await login(req, env);
        if (url.pathname === "/api/logout" && req.method === "POST") return logout();
        if (url.pathname === "/api/public/stats" && req.method === "GET") return json(await publicStats(env));
        const user = await currentUser(req, env);
        if (url.pathname === "/api/me") return user ? json({ email: user === "token" ? "API token" : user }) : json({ error: "unauthorized" }, 401);
        if (!user) return json({ error: "unauthorized" }, 401);
        return await api(req, url, env, ctx);
      }
      return env.ASSETS.fetch(req);
    } catch (e) {
      console.error(e);
      return json({ error: (e as Error).message }, 500);
    }
  },

  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runCycle(env).then((r) => console.log("cycle", JSON.stringify(r))));
  },
} satisfies ExportedHandler<Env>;

async function api(req: Request, url: URL, env: Env, _ctx: ExecutionContext): Promise<Response> {
  const path = url.pathname.replace(/\/+$/, "");
  const m = req.method;

  const redesign = await redesignApi(req, url, env);
  if (redesign) return redesign;

  if (m === "GET" && path === "/api/stats") return json(await stats(env));
  if (m === "GET" && path === "/api/meta") return json({ categories: CATEGORIES.map(({ id, label }) => ({ id, label })), cities: CITIES });
  if (m === "POST" && path === "/api/run") return json(await runCycle(env));
  if (m === "POST" && path === "/api/sync") return json(await syncSheet(env, publicBase(env, url)));

  // Lets the CLI / GitHub Actions feed candidates when Overpass is unreachable from Workers.
  if (m === "POST" && path === "/api/candidates") {
    const cands = ((await req.json()) as Candidate[]).filter((c) => c?.id && c.name && c.website && c.category).slice(0, 500);
    if (cands.length) await env.DB.batch(cands.map((c) => insertCandidate(env, c)));
    return json({ received: cands.length });
  }

  // Import leads already audited locally by the CLI (`npm run discover -- --upload`).
  if (m === "POST" && path === "/api/import") {
    const leads = ((await req.json()) as Lead[]).filter((l) => l?.id && l.audit && l.contacts && l.content).slice(0, 200);
    if (leads.length) await env.DB.batch(leads.map((l) => env.DB.prepare(
      `INSERT INTO sites (id, name, category, city, country, region, website, candidate, state, score, qualified, lead, audited_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'audited', ?, ?, ?, datetime('now'))
       ON CONFLICT(id) DO UPDATE SET state = 'audited', score = excluded.score, qualified = excluded.qualified, lead = excluded.lead, audited_at = excluded.audited_at`,
    ).bind(l.id, l.name, l.category, l.city, l.country, l.region, l.website, JSON.stringify(l), l.audit.score, l.qualified ? 1 : 0, JSON.stringify(l))));
    return json({ imported: leads.length });
  }

  if (m === "GET" && path === "/api/leads") {
    const where = ["state = 'audited'"];
    const binds: unknown[] = [];
    if (url.searchParams.get("all") !== "1") where.push("qualified = 1");
    const cat = url.searchParams.get("category");
    if (cat) (where.push("category = ?"), binds.push(cat));
    const status = url.searchParams.get("status");
    if (status) (where.push("status = ?"), binds.push(status));
    const q = url.searchParams.get("q");
    if (q) (where.push("(name LIKE ? OR website LIKE ? OR city LIKE ?)"), binds.push(`%${q}%`, `%${q}%`, `%${q}%`));
    const { results } = await env.DB.prepare(
      `SELECT id, status, sheet_synced, lead FROM sites WHERE ${where.join(" AND ")} ORDER BY audited_at DESC LIMIT 500`,
    ).bind(...binds).all<{ id: string; status: string; sheet_synced: number; lead: string }>();
    return json(results.map((r) => summarize(JSON.parse(r.lead) as Lead, r.status, r.sheet_synced)));
  }

  const pm = path.match(/^\/api\/leads\/([^/]+)\/pitch$/);
  if (pm && m === "GET") {
    const id = decodeURIComponent(pm[1]);
    const row = await env.DB.prepare("SELECT lead FROM sites WHERE id = ?").bind(id).first<{ lead: string | null }>();
    if (!row?.lead) return json({ error: "not found" }, 404);
    const pitch = buildPitch(JSON.parse(row.lead) as Lead, `${publicBase(env, url)}/preview/${id}/`, env.SENDER_NAME || "Revamp Radar");
    return pitch ? json(pitch) : json({ error: "no email address for this lead" }, 404);
  }

  const lm = path.match(/^\/api\/leads\/([^/]+)$/);
  if (lm && m === "PATCH") {
    const { status } = (await req.json()) as { status?: string };
    if (!status || !STATUSES.includes(status)) return json({ error: "invalid status" }, 400);
    await env.DB.prepare("UPDATE sites SET status = ? WHERE id = ?").bind(status, decodeURIComponent(lm[1])).run();
    return json({ ok: true });
  }

  if (m === "GET" && path === "/api/export.csv") {
    const { results } = await env.DB.prepare(
      "SELECT lead, status FROM sites WHERE qualified = 1 ORDER BY audited_at DESC",
    ).all<{ lead: string; status: string }>();
    const base = publicBase(env, url);
    const rows = [SHEET_HEADERS, ...results.map((r) => {
      const l = JSON.parse(r.lead) as Lead;
      return leadToRow(l, `${base}/preview/${l.id}/`, r.status);
    })];
    return new Response(rows.map((r) => r.map(csvCell).join(",")).join("\n"), {
      headers: { "content-type": "text/csv", "content-disposition": 'attachment; filename="revamp-radar-leads.csv"' },
    });
  }

  return json({ error: "not found" }, 404);
}

/** One unit of work: refill the queue if needed, audit a batch, push new leads to Sheets. */
export async function runCycle(env: Env) {
  const batchSize = Number(env.BATCH_SIZE) || 6;
  const minScore = Number(env.MIN_SCORE) || 35;
  const target = Number(env.DAILY_TARGET) || 10;
  const report: Record<string, unknown> = {};

  const pending = (await env.DB.prepare("SELECT COUNT(*) AS n FROM sites WHERE state = 'pending'").first<{ n: number }>())!.n;
  if (pending < batchSize) {
    const cursor = Number((await env.DB.prepare("SELECT value FROM meta WHERE key = 'cursor'").first<{ value: string }>())?.value ?? 0);
    const { category, city } = sliceForCursor(cursor);
    report.discovered = { category: category.id, city: city.id };
    try {
      const cands = await discoverCandidates(category, city, 3);
      report.found = cands.length;
      if (cands.length) await env.DB.batch(cands.map((c) => insertCandidate(env, c)));
    } catch (e) {
      report.discoverError = (e as Error).message;
    }
    await env.DB.prepare("INSERT INTO meta (key, value) VALUES ('cursor', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
      .bind(String(cursor + 1)).run();
  }

  // Stop auditing for the day once we're well past the target, to stay inside free-tier limits.
  const today = (await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM sites WHERE qualified = 1 AND date(audited_at) = date('now')",
  ).first<{ n: number }>())!.n;
  report.qualifiedToday = today;

  if (today < target * 3) {
    const { results } = await env.DB.prepare(
      "SELECT id, candidate FROM sites WHERE state = 'pending' ORDER BY RANDOM() LIMIT ?",
    ).bind(batchSize).all<{ id: string; candidate: string }>();
    const leads = await Promise.all(results.map((r) => auditCandidate(JSON.parse(r.candidate) as Candidate, minScore)));
    if (results.length) await env.DB.batch(results.map((r, i) => {
      const lead = leads[i];
      return lead
        ? env.DB.prepare("UPDATE sites SET state = 'audited', score = ?, qualified = ?, lead = ?, audited_at = datetime('now') WHERE id = ?")
            .bind(lead.audit.score, lead.qualified ? 1 : 0, JSON.stringify(lead), r.id)
        : env.DB.prepare("UPDATE sites SET state = 'failed', audited_at = datetime('now') WHERE id = ?").bind(r.id);
    }));
    report.audited = results.length;
    report.newQualified = leads.filter((l) => l?.qualified).map((l) => l!.id);
  }

  report.sheet = await syncSheet(env, env.PUBLIC_URL ?? "");
  return report;
}

function insertCandidate(env: Env, c: Candidate) {
  return env.DB.prepare(
    "INSERT OR IGNORE INTO sites (id, name, category, city, country, region, website, candidate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  ).bind(c.id, c.name, c.category, c.city, c.country, c.region, c.website, JSON.stringify(c));
}

async function syncSheet(env: Env, base: string) {
  if (!env.SHEETS_WEBHOOK_URL || !env.SHEETS_SECRET) return { skipped: "SHEETS_WEBHOOK_URL / SHEETS_SECRET not set" };
  const { results } = await env.DB.prepare(
    "SELECT id, lead, status FROM sites WHERE qualified = 1 AND sheet_synced = 0 ORDER BY audited_at LIMIT 50",
  ).all<{ id: string; lead: string; status: string }>();
  if (!results.length) return { synced: 0 };
  const rows = results.map((r) => leadToRow(JSON.parse(r.lead) as Lead, `${base}/preview/${r.id}/`, r.status));
  const res = await fetch(env.SHEETS_WEBHOOK_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ secret: env.SHEETS_SECRET, headers: SHEET_HEADERS, rows }),
  });
  const body = await res.text();
  if (!res.ok || !body.includes('"ok":true')) return { error: `sheet ${res.status}: ${body.slice(0, 200)}` };
  await env.DB.batch(results.map((r) => env.DB.prepare("UPDATE sites SET sheet_synced = 1 WHERE id = ?").bind(r.id)));
  return { synced: results.length };
}

/** Counts and a few showcase previews for the public landing page. No contact details. */
async function publicStats(env: Env) {
  const totals = await env.DB.prepare(
    "SELECT COUNT(*) AS audited, COALESCE(SUM(qualified), 0) AS qualified, COUNT(DISTINCT city) AS cities FROM sites WHERE state = 'audited'",
  ).first();
  const { results } = await env.DB.prepare(
    "SELECT id, name, category, city, country, score FROM sites WHERE qualified = 1 ORDER BY score DESC LIMIT 6",
  ).all();
  return { ...totals, showcase: results };
}

async function stats(env: Env) {
  const totals = await env.DB.prepare(`SELECT
      COUNT(*) AS total,
      COALESCE(SUM(state = 'pending'), 0) AS pending,
      COALESCE(SUM(state = 'audited'), 0) AS audited,
      COALESCE(SUM(qualified), 0) AS qualified,
      COALESCE(SUM(qualified = 1 AND date(audited_at) = date('now')), 0) AS today,
      COALESCE(SUM(qualified = 1 AND sheet_synced = 0), 0) AS unsynced
    FROM sites`).first();
  const { results: byCategory } = await env.DB.prepare(
    "SELECT category, COUNT(*) AS n FROM sites WHERE qualified = 1 GROUP BY category",
  ).all();
  const { results: daily } = await env.DB.prepare(
    "SELECT date(audited_at) AS day, COUNT(*) AS n FROM sites WHERE qualified = 1 GROUP BY day ORDER BY day DESC LIMIT 14",
  ).all();
  return { ...totals, byCategory, daily };
}

function summarize(l: Lead, status: string, synced: number) {
  return {
    id: l.id, name: l.name, category: l.category, city: l.city, country: l.country, website: l.website,
    score: l.audit.score, reasons: l.audit.reasons, emails: l.contacts.emails, phones: l.contacts.phones,
    contactPage: l.contacts.contactPage, auditedAt: l.auditedAt, status, sheetSynced: !!synced,
  };
}

function publicBase(env: Env, url: URL): string {
  return env.PUBLIC_URL || url.origin;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}

function csvCell(s: string): string {
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
