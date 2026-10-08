import {
  CATEGORIES, CITIES, SHEET_HEADERS, auditCandidate, buildPitch, discoverCandidates, leadToRow, sliceForCursor,
  type Candidate, type Lead,
} from "@rr/core";
import { currentUser, login, logout, type AuthEnv } from "./auth";
import { ensureSite, imageProxy, preview, redesignApi } from "./redesign";

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

async function api(req: Request, url: URL, env: Env, ctx: ExecutionContext): Promise<Response> {
  const path = url.pathname.replace(/\/+$/, "");
  const m = req.method;

  const redesign = await redesignApi(req, url, env);
  if (redesign) return redesign;

  if (m === "GET" && path === "/api/stats") return json(await stats(env));
  if (m === "GET" && path === "/api/meta") return json({ categories: CATEGORIES.map(({ id, label }) => ({ id, label })), cities: CITIES });
  if (m === "POST" && path === "/api/run") return json(await runCycle(env));
  if (m === "POST" && path === "/api/sync") return json(await syncSheet(env, publicBase(env, url), true));

  // Google Sheet connection, managed from the portal (stored in the meta table; Worker secrets still win).
  if (path === "/api/sheet" && m === "GET") return json(await sheetStatus(env));
  if (path === "/api/sheet" && m === "POST") {
    const { webhookUrl, viewUrl } = (await req.json().catch(() => ({}))) as { webhookUrl?: string; viewUrl?: string };
    if (webhookUrl !== undefined) {
      if (webhookUrl && !/^https:\/\/script\.google(usercontent)?\.com\//.test(webhookUrl)) return json({ error: "Paste the Web app URL that Apps Script shows after Deploy (it starts with https://script.google.com/)." }, 400);
      await setMeta(env, "sheet_webhook", webhookUrl);
    }
    if (viewUrl !== undefined) {
      if (viewUrl && !/^https:\/\/docs\.google\.com\/spreadsheets\//.test(viewUrl)) return json({ error: "Paste the Google Sheet's address (it starts with https://docs.google.com/spreadsheets/)." }, 400);
      await setMeta(env, "sheet_view", viewUrl);
    }
    return json(await sheetStatus(env));
  }

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
    const segment = url.searchParams.get("segment");
    if (segment === "ready") where.push("status = 'new'");
    else if (segment && segment !== "all" && STATUSES.includes(segment)) (where.push("status = ?"), binds.push(segment));
    const region = url.searchParams.get("region");
    if (region) (where.push("region = ?"), binds.push(region));
    const redesign = url.searchParams.get("redesign");
    if (redesign === "done") where.push("EXISTS (SELECT 1 FROM ai_pages a WHERE a.lead_id = sites.id)");
    if (redesign === "pending") where.push("NOT EXISTS (SELECT 1 FROM ai_pages a WHERE a.lead_id = sites.id)");
    const q = url.searchParams.get("q");
    if (q) (where.push("(name LIKE ? OR website LIKE ? OR city LIKE ?)"), binds.push(`%${q}%`, `%${q}%`, `%${q}%`));
    const { results } = await env.DB.prepare(
      `SELECT id, status, sheet_synced, region, site IS NOT NULL AS crawled, json_remove(lead, '$.content') AS lead,
         (SELECT j.status FROM redesign_jobs j WHERE j.lead_id = sites.id ORDER BY j.id DESC LIMIT 1) AS job_status,
         EXISTS (SELECT 1 FROM ai_pages a WHERE a.lead_id = sites.id) AS has_claude
       FROM sites WHERE ${where.join(" AND ")} ORDER BY audited_at DESC LIMIT 500`,
    ).bind(...binds).all<{ id: string; status: string; sheet_synced: number; region: string; crawled: number; lead: string; job_status: string | null; has_claude: number }>();
    return json(results.map((r) => ({
      ...summarize(JSON.parse(r.lead) as Lead, r.status, r.sheet_synced),
      region: r.region,
      crawled: !!r.crawled,
      redesign: redesignState(r.job_status, !!r.has_claude, !!r.crawled),
    })));
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
    // Mark the row for re-sync so the Google Sheet shows the new status, then push it straight away.
    await env.DB.prepare("UPDATE sites SET status = ?, sheet_synced = 0 WHERE id = ?").bind(status, decodeURIComponent(lm[1])).run();
    ctx.waitUntil(syncSheet(env, publicBase(env, url)).catch(() => {}));
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
    // Read new leads' whole sites now, so their redesigns open instantly.
    for (const lead of leads) if (lead?.qualified) await ensureSite(env, lead.id, lead, null).catch(() => null);
  }

  report.sheet = await syncSheet(env, env.PUBLIC_URL ?? "");
  return report;
}

function insertCandidate(env: Env, c: Candidate) {
  return env.DB.prepare(
    "INSERT OR IGNORE INTO sites (id, name, category, city, country, region, website, candidate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  ).bind(c.id, c.name, c.category, c.city, c.country, c.region, c.website, JSON.stringify(c));
}

async function getMeta(env: Env, key: string): Promise<string | null> {
  return (await env.DB.prepare("SELECT value FROM meta WHERE key = ?").bind(key).first<{ value: string }>())?.value ?? null;
}

async function setMeta(env: Env, key: string, value: string) {
  await env.DB.prepare("INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind(key, value).run();
}

/** Webhook address and shared secret: Worker secrets if set, otherwise what was saved from the portal. */
async function sheetConfig(env: Env) {
  let secret = env.SHEETS_SECRET || (await getMeta(env, "sheet_secret"));
  if (!secret) {
    secret = [...crypto.getRandomValues(new Uint8Array(18))].map((b) => b.toString(16).padStart(2, "0")).join("");
    await setMeta(env, "sheet_secret", secret);
  }
  return { webhook: env.SHEETS_WEBHOOK_URL || (await getMeta(env, "sheet_webhook")) || "", secret };
}

async function sheetStatus(env: Env) {
  const { webhook, secret } = await sheetConfig(env);
  const last = await getMeta(env, "sheet_last");
  const pending = (await env.DB.prepare("SELECT COUNT(*) AS n FROM sites WHERE qualified = 1 AND sheet_synced = 0").first<{ n: number }>())!.n;
  return {
    connected: !!webhook,
    webhookUrl: webhook,
    viewUrl: (await getMeta(env, "sheet_view")) || "",
    secret,
    pending,
    last: last ? JSON.parse(last) : null,
  };
}

async function syncSheet(env: Env, base: string, all = false) {
  const { webhook, secret } = await sheetConfig(env);
  if (!webhook) return { skipped: "Google Sheet isn't connected yet" };
  const result = await (async () => {
    let total = 0;
    // A manual sync sends everything pending (in batches); the 10-minute job sends one batch.
    for (let round = 0; round < (all ? 10 : 1); round++) {
      const { results } = await env.DB.prepare(
        "SELECT id, lead, status FROM sites WHERE qualified = 1 AND sheet_synced = 0 ORDER BY audited_at LIMIT 50",
      ).all<{ id: string; lead: string; status: string }>();
      if (!results.length) break;
      const rows = results.map((r) => leadToRow(JSON.parse(r.lead) as Lead, `${base}/preview/${r.id}/`, r.status));
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ secret, headers: SHEET_HEADERS, rows }),
      }).catch((e: Error) => new Response(e.message, { status: 599 }));
      const body = await res.text();
      if (!res.ok || !body.includes('"ok":true')) {
        const hint = body.includes("bad secret") ? "The secret in Apps Script doesn't match. Copy it again from the portal." : `${res.status} ${body.replace(/<[^>]+>/g, " ").slice(0, 160)}`;
        return { error: hint, synced: total };
      }
      await env.DB.batch(results.map((r) => env.DB.prepare("UPDATE sites SET sheet_synced = 1 WHERE id = ?").bind(r.id)));
      total += results.length;
    }
    return { synced: total };
  })();
  await setMeta(env, "sheet_last", JSON.stringify({ at: new Date().toISOString(), ...result }));
  return result;
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
  const { results: byStatus } = await env.DB.prepare(
    "SELECT status, COUNT(*) AS n FROM sites WHERE qualified = 1 GROUP BY status",
  ).all<{ status: string; n: number }>();
  return { ...totals, byCategory, daily, byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r.n])) };
}

/**
 * Where a lead's redesign stands: a Claude job in progress wins, then a finished Claude redesign, then the
 * instant template (once the site has been read), then failed / not started.
 */
function redesignState(job: string | null, hasClaude: boolean, crawled: boolean): string {
  if (job === "running") return "running";
  if (job === "queued") return "queued";
  if (hasClaude) return "done";
  if (job === "failed") return "failed";
  return crawled ? "template" : "pending";
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
