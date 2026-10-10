/**
 * Redesign job lifecycle: queueing (one lead or a batch), claiming with a lease, progress heartbeats, completion with a
 * QA scorecard, failure with retries and backoff, review (approve / reject / retry / cancel), events and metrics.
 *
 * Status: queued → running → done | needs_review | failed | cancelled. A failed technical attempt goes back to
 * queued with run_after in the future ("retry scheduled"). One active job per lead is enforced by a unique partial
 * index (migrations/0006_pipeline.sql), so two clicks or two runners can never process the same lead twice.
 */
import {
  DIRECTIONS, chooseDirection, directionById, lookById, retryDelayMinutes, shouldRetry, siteSignals, snapshotFromLead, tradeFor,
  type FailureKind, type Lead, type SiteSnapshot,
} from "@rr/core";

interface Db {
  DB: D1Database;
}

/** A running job whose runner has not reported for this long is handed back (or failed after its last attempt). */
export const STALE_MINUTES = 20;
const ACTIVE = "status IN ('queued', 'running')";

export interface JobRow {
  id: number;
  lead_id: string;
  status: string;
  stage: string | null;
  progress: string | null;
  error: string | null;
  style: string | null;
  notes: string | null;
  mode: string;
  direction: string | null;
  forced_theme: string | null;
  attempts: number;
  max_attempts: number;
  run_after: string | null;
  failure_kind: string | null;
  qa: string | null;
  qa_score: number | null;
  cost_usd: number | null;
  duration_s: number | null;
  runner: string | null;
  created_at: string;
  started_at: string | null;
  heartbeat_at: string | null;
  finished_at: string | null;
  reviewed_at: string | null;
}

export async function event(env: Db, jobId: number, message: string, stage: string | null = null, level: "info" | "warn" | "error" = "info") {
  await env.DB.prepare("INSERT INTO job_events (job_id, stage, level, message) VALUES (?, ?, ?, ?)").bind(jobId, stage, level, message.slice(0, 2000)).run();
}

function isUniqueViolation(e: unknown): boolean {
  return /UNIQUE constraint failed/i.test(String((e as Error)?.message ?? e));
}

export interface QueueOptions {
  notes?: string | null;
  mode?: "fresh" | "revise";
  style: string;
  direction?: string | null;
  theme?: string | null;
}

/** Queue one job. Returns null when the lead already has an active job. */
export async function queueJob(env: Db, leadId: string, o: QueueOptions): Promise<number | null> {
  const direction = directionById(o.direction ?? undefined)?.id ?? null;
  const theme = o.theme && lookById(o.theme) ? o.theme : null;
  try {
    const r = await env.DB.prepare(
      "INSERT INTO redesign_jobs (lead_id, style, notes, mode, direction, forced_theme) VALUES (?, ?, ?, ?, ?, ?) RETURNING id",
    ).bind(leadId, o.style, o.notes ?? null, o.mode ?? "fresh", direction, theme).first<{ id: number }>();
    if (!r) return null;
    await event(env, r.id, `Queued${o.mode === "revise" ? " (revision)" : ""}${direction ? `, direction ${direction}` : ""}${theme ? `, theme ${theme}` : ""}.`);
    return r.id;
  } catch (e) {
    if (isUniqueViolation(e)) return null;
    throw e;
  }
}

/**
 * Queue redesigns for many leads at once: qualified leads with no Claude redesign and no job in progress, highest
 * outdated score first (or the given ids). No daily cap; the runners' concurrency sets the pace.
 */
export async function queueBatch(env: Db, body: { count?: number; leadIds?: string[]; category?: string; styleFor(id: string, category: string): string }) {
  const count = Math.max(1, Math.min(100, Math.floor(body.count ?? 10)));
  let rows: { id: string; category: string }[];
  if (body.leadIds?.length) {
    const ids = body.leadIds.slice(0, 100);
    rows = (await env.DB.prepare(`SELECT id, category FROM sites WHERE state = 'audited' AND id IN (${ids.map(() => "?").join(",")})`).bind(...ids).all<{ id: string; category: string }>()).results;
  } else {
    const where = ["state = 'audited'", "qualified = 1", "status IN ('new', 'contacted')",
      "NOT EXISTS (SELECT 1 FROM ai_pages a WHERE a.lead_id = sites.id)",
      "NOT EXISTS (SELECT 1 FROM redesign_jobs j WHERE j.lead_id = sites.id AND j.status IN ('queued', 'running', 'needs_review', 'done'))"];
    const binds: unknown[] = [];
    if (body.category) (where.push("category = ?"), binds.push(body.category));
    rows = (await env.DB.prepare(`SELECT id, category FROM sites WHERE ${where.join(" AND ")} ORDER BY score DESC, audited_at DESC LIMIT ?`).bind(...binds, count).all<{ id: string; category: string }>()).results;
  }
  const queued: string[] = [];
  const skipped: string[] = [];
  for (const r of rows) {
    const id = await queueJob(env, r.id, { style: body.styleFor(r.id, r.category) });
    (id ? queued : skipped).push(r.id);
  }
  return { queued, skipped };
}

/** Hand back running jobs whose runner went quiet; after the last attempt they fail for a person to look at. */
async function reclaimStale(env: Db) {
  const { results } = await env.DB.prepare(
    `SELECT id, attempts, max_attempts FROM redesign_jobs WHERE status = 'running' AND COALESCE(heartbeat_at, started_at) < datetime('now', '-${STALE_MINUTES} minutes')`,
  ).all<{ id: number; attempts: number; max_attempts: number }>();
  for (const j of results) {
    if (j.attempts >= j.max_attempts) {
      await env.DB.prepare("UPDATE redesign_jobs SET status = 'failed', failure_kind = 'technical', error = ?, finished_at = datetime('now') WHERE id = ? AND status = 'running'")
        .bind(`The runner stopped responding on the last attempt (${j.attempts}/${j.max_attempts}).`, j.id).run();
      await event(env, j.id, "Runner stopped responding; no attempts left.", null, "error");
    } else {
      await env.DB.prepare("UPDATE redesign_jobs SET status = 'queued', stage = NULL, run_after = NULL WHERE id = ? AND status = 'running'").bind(j.id).run();
      await event(env, j.id, `Runner stopped responding; queued again (attempt ${j.attempts} of ${j.max_attempts} used).`, null, "warn");
    }
  }
}

/** Direction ids of recent jobs, newest first (claimed jobs count from the moment they are claimed). */
async function recentDirections(env: Db, exceptJob: number): Promise<string[]> {
  const { results } = await env.DB.prepare(
    "SELECT direction FROM redesign_jobs WHERE direction IS NOT NULL AND id != ? ORDER BY COALESCE(started_at, created_at) DESC LIMIT 8",
  ).bind(exceptJob).all<{ direction: string }>();
  return results.map((r) => r.direction);
}

/**
 * Claim the next due job (optionally for one lead). The claim is a conditional UPDATE, so two runners asking at once
 * never get the same job. The creative direction is chosen here, at claim time, so it accounts for every redesign
 * claimed before it.
 */
export async function claimNext(env: Db, opts: { leadId?: string; runner?: string; load(id: string): Promise<{ lead: Lead; site: SiteSnapshot | null } | null>; ensure(id: string, lead: Lead, site: SiteSnapshot | null): Promise<SiteSnapshot> }) {
  await reclaimStale(env);
  const due = "status = 'queued' AND (run_after IS NULL OR run_after <= datetime('now'))";
  for (let tries = 0; tries < 3; tries++) {
    const job = await (opts.leadId
      ? env.DB.prepare(`SELECT * FROM redesign_jobs WHERE ${due} AND lead_id = ? ORDER BY created_at LIMIT 1`).bind(opts.leadId)
      : env.DB.prepare(`SELECT * FROM redesign_jobs WHERE ${due} ORDER BY created_at LIMIT 1`)
    ).first<JobRow>();
    if (!job) return null;
    const claimed = await env.DB.prepare(
      "UPDATE redesign_jobs SET status = 'running', stage = 'researching', progress = NULL, started_at = datetime('now'), heartbeat_at = datetime('now'), attempts = attempts + 1, runner = ?, error = NULL WHERE id = ? AND status = 'queued'",
    ).bind((opts.runner ?? "runner").slice(0, 80), job.id).run();
    if (!claimed.meta.changes) continue; // another runner won the race
    const data = await opts.load(job.lead_id);
    if (!data) {
      await finishJob(env, job.id, "failed", "Lead no longer exists", "unreachable");
      continue;
    }
    const site = await opts.ensure(job.lead_id, data.lead, data.site);
    const recent = await recentDirections(env, job.id);
    let direction = directionById(job.direction ?? undefined)?.id ?? null;
    // A revision keeps the direction of the version it improves.
    if (!direction && job.mode === "revise") {
      const prev = await env.DB.prepare("SELECT direction FROM redesign_jobs WHERE lead_id = ? AND id != ? AND status IN ('done', 'needs_review') AND direction IS NOT NULL ORDER BY id DESC LIMIT 1")
        .bind(job.lead_id, job.id).first<{ direction: string }>();
      direction = directionById(prev?.direction)?.id ?? null;
    }
    if (!direction) {
      const trade = tradeFor(data.lead.category, data.lead.name);
      const crawled = site.pages.length ? site : snapshotFromLead(data.lead);
      direction = chooseDirection(siteSignals(trade, crawled, { ...data.lead.contacts, openingHours: data.lead.openingHours }), recent, `${job.lead_id}:${job.id}`).id;
    }
    if (direction !== job.direction) await env.DB.prepare("UPDATE redesign_jobs SET direction = ? WHERE id = ?").bind(direction, job.id).run();
    await event(env, job.id, `Claimed by ${opts.runner ?? "a runner"} (attempt ${job.attempts + 1} of ${job.max_attempts}); direction ${direction}.`, "researching");
    return { job: { ...job, direction, attempts: job.attempts + 1 }, lead: data.lead, site, recentDirections: recent };
  }
  return null;
}

export async function finishJob(env: Db, id: number, status: string, error: string | null, kind: FailureKind | null = null) {
  await env.DB.prepare("UPDATE redesign_jobs SET status = ?, error = ?, failure_kind = ?, stage = NULL, finished_at = datetime('now'), duration_s = CAST((julianday('now') - julianday(COALESCE(started_at, created_at))) * 86400 AS INTEGER) WHERE id = ?")
    .bind(status, error, kind, id).run();
}

/** Progress from a runner. Tells the runner when the job was cancelled or reclaimed so it can stop. */
export async function progress(env: Db, id: number, body: { stage?: string; message?: string; level?: string }) {
  const job = await env.DB.prepare("SELECT status FROM redesign_jobs WHERE id = ?").bind(id).first<{ status: string }>();
  if (!job) return { status: 404, body: { error: "Job not found" } };
  if (job.status !== "running") return { status: 200, body: { stop: true, status: job.status } };
  const stage = body.stage && /^(researching|designing|building|qa|refining|uploading)$/.test(body.stage) ? body.stage : null;
  await env.DB.prepare("UPDATE redesign_jobs SET heartbeat_at = datetime('now'), stage = COALESCE(?, stage), progress = COALESCE(?, progress) WHERE id = ?")
    .bind(stage, body.message?.slice(0, 300) ?? null, id).run();
  if (body.message) await event(env, id, body.message, stage, body.level === "warn" || body.level === "error" ? body.level : "info");
  return { status: 200, body: { stop: false } };
}

/** A runner gives up on an attempt: technical failures retry with backoff, everything else stops for a person. */
export async function failJob(env: Db, id: number, body: { error?: string; kind?: string }) {
  const job = await env.DB.prepare("SELECT status, attempts, max_attempts FROM redesign_jobs WHERE id = ?").bind(id).first<{ status: string; attempts: number; max_attempts: number }>();
  if (!job) return { status: 404, body: { error: "Job not found" } };
  if (job.status !== "running") return { status: 409, body: { error: `Job is ${job.status}` } };
  const kind = (["technical", "unreachable", "quality", "cancelled"].includes(body.kind ?? "") ? body.kind : "technical") as FailureKind;
  const error = (body.error ?? "Unknown error").slice(0, 2000);
  if (shouldRetry(kind, job.attempts, job.max_attempts)) {
    const mins = retryDelayMinutes(job.attempts);
    await env.DB.prepare(`UPDATE redesign_jobs SET status = 'queued', stage = NULL, error = ?, failure_kind = ?, run_after = datetime('now', '+${mins} minutes') WHERE id = ?`).bind(error, kind, id).run();
    await event(env, id, `Attempt ${job.attempts} failed: ${error.slice(0, 300)}. Retry scheduled in ${mins} min.`, null, "warn");
    return { status: 200, body: { ok: true, retryInMinutes: mins } };
  }
  await finishJob(env, id, kind === "cancelled" ? "cancelled" : "failed", error, kind);
  await event(env, id, `Failed (${kind}): ${error.slice(0, 400)}`, null, "error");
  return { status: 200, body: { ok: true } };
}

/** Record the QA result and timings of a finished attempt; a pass is done, anything else waits for review. */
export async function completeJob(env: Db, id: number, body: { qa?: unknown; qaScore?: number; pass?: boolean; costUsd?: number; pages: number }) {
  const status = body.pass === true ? "done" : "needs_review";
  await env.DB.prepare("UPDATE redesign_jobs SET qa = ?, qa_score = ?, cost_usd = ? WHERE id = ?")
    .bind(body.qa ? JSON.stringify(body.qa).slice(0, 60_000) : null, typeof body.qaScore === "number" ? body.qaScore : null, typeof body.costUsd === "number" ? Math.round(body.costUsd * 10000) / 10000 : null, id).run();
  await finishJob(env, id, status, null, null);
  await event(env, id, status === "done"
    ? `Passed QA (${body.qaScore ?? "?"}/10); ${body.pages} pages published.`
    : `${body.pages} pages uploaded; ${body.qa ? `QA ${body.qaScore ?? "?"}/10 did not pass` : "no QA was run"}, so it needs your review.`, "uploading", status === "done" ? "info" : "warn");
  return status;
}

/** Owner decisions from the portal. */
export async function review(env: Db, id: number, action: string, body: { notes?: string; requeue?: string }, styleFor: (leadId: string) => Promise<string>) {
  const job = await env.DB.prepare("SELECT * FROM redesign_jobs WHERE id = ?").bind(id).first<JobRow>();
  if (!job) return { status: 404, body: { error: "Job not found" } };
  if (action === "approve") {
    if (!["needs_review", "done"].includes(job.status)) return { status: 409, body: { error: `Only finished redesigns can be approved (this one is ${job.status}).` } };
    await env.DB.prepare("UPDATE redesign_jobs SET status = 'done', reviewed_at = datetime('now') WHERE id = ?").bind(id).run();
    await event(env, id, "Approved by the owner.");
    return { status: 200, body: { ok: true } };
  }
  if (action === "cancel") {
    if (!["queued", "running"].includes(job.status)) return { status: 409, body: { error: `Job is already ${job.status}.` } };
    await finishJob(env, id, "cancelled", "Cancelled by the owner", "cancelled");
    await event(env, id, "Cancelled by the owner.", null, "warn");
    return { status: 200, body: { ok: true } };
  }
  if (action === "reject" || action === "retry") {
    if (["queued", "running"].includes(job.status)) return { status: 409, body: { error: "This redesign is still in progress." } };
    if (action === "reject") {
      await env.DB.prepare("UPDATE redesign_jobs SET status = 'failed', failure_kind = 'quality', error = ?, reviewed_at = datetime('now') WHERE id = ?")
        .bind(`Rejected by the owner${body.notes ? `: ${body.notes.slice(0, 500)}` : ""}`, id).run();
      await event(env, id, `Rejected by the owner${body.notes ? `: ${body.notes.slice(0, 300)}` : ""}.`, null, "warn");
      if (!body.requeue) return { status: 200, body: { ok: true } };
    }
    const mode = action === "retry" ? (job.mode as "fresh" | "revise") : body.requeue === "revise" ? "revise" : "fresh";
    const next = await queueJob(env, job.lead_id, {
      style: job.style ?? (await styleFor(job.lead_id)), mode,
      notes: (body.notes ?? job.notes)?.slice(0, 4000) ?? null,
      direction: action === "retry" || mode === "revise" ? job.direction : null,
      theme: job.forced_theme,
    });
    if (!next) return { status: 409, body: { error: "A redesign of this site is already queued or running." } };
    return { status: 200, body: { ok: true, jobId: next } };
  }
  return { status: 404, body: { error: "Unknown action" } };
}

export function publicJob(j: JobRow | null) {
  if (!j) return null;
  const retryAt = j.status === "queued" && j.run_after ? j.run_after : null;
  let qa: unknown = null;
  try { qa = j.qa ? JSON.parse(j.qa) : null; } catch { /* ignore */ }
  return {
    id: j.id, leadId: j.lead_id, status: j.status, stage: j.stage, progress: j.progress, error: j.error, notes: j.notes, mode: j.mode,
    direction: j.direction, directionName: directionById(j.direction)?.name ?? null, theme: j.forced_theme ? lookById(j.forced_theme)?.name ?? j.forced_theme : null,
    attempts: j.attempts, maxAttempts: j.max_attempts, retryAt, failureKind: j.failure_kind,
    qa, qaScore: j.qa_score, costUsd: j.cost_usd, durationS: j.duration_s, runner: j.runner,
    createdAt: j.created_at, startedAt: j.started_at, heartbeatAt: j.heartbeat_at, finishedAt: j.finished_at, reviewedAt: j.reviewed_at,
  };
}

export async function listJobs(env: Db, url: URL) {
  const status = url.searchParams.get("status");
  const limit = Math.min(200, Number(url.searchParams.get("limit")) || 100);
  const where = status === "active" ? `j.${ACTIVE}` : status ? "j.status = ?" : "1 = 1";
  const stmt = env.DB.prepare(
    `SELECT j.*, s.name AS lead_name, s.category AS lead_category, s.website AS lead_website, s.score AS lead_score
     FROM redesign_jobs j JOIN sites s ON s.id = j.lead_id WHERE ${where}
     ORDER BY CASE j.status WHEN 'running' THEN 0 WHEN 'queued' THEN 1 WHEN 'needs_review' THEN 2 ELSE 3 END, j.id DESC LIMIT ?`,
  );
  const { results } = await (status && status !== "active" ? stmt.bind(status, limit) : stmt.bind(limit))
    .all<JobRow & { lead_name: string; lead_category: string; lead_website: string; lead_score: number }>();
  return results.map((r) => ({ ...publicJob(r), qa: undefined, lead: { name: r.lead_name, category: r.lead_category, website: r.lead_website, score: r.lead_score } }));
}

export async function jobDetail(env: Db, id: number) {
  const job = await env.DB.prepare("SELECT * FROM redesign_jobs WHERE id = ?").bind(id).first<JobRow>();
  if (!job) return null;
  const { results: events } = await env.DB.prepare("SELECT at, stage, level, message FROM job_events WHERE job_id = ? ORDER BY id DESC LIMIT 60").bind(id).all();
  return { ...publicJob(job), events };
}

/** Pipeline metrics from real job data only (nothing estimated). */
export async function jobStats(env: Db) {
  const today = await env.DB.prepare(`SELECT
      COALESCE(SUM(status IN ('done', 'needs_review') AND date(finished_at) = date('now')), 0) AS finishedToday,
      COALESCE(SUM(status = 'done' AND date(finished_at) = date('now')), 0) AS passedToday,
      COALESCE(SUM(status = 'queued'), 0) AS queued,
      COALESCE(SUM(status = 'queued' AND run_after > datetime('now')), 0) AS retryScheduled,
      COALESCE(SUM(status = 'running'), 0) AS running,
      COALESCE(SUM(status = 'needs_review'), 0) AS needsReview,
      COALESCE(SUM(status = 'failed' AND finished_at > datetime('now', '-7 days')), 0) AS failed7d
    FROM redesign_jobs`).first();
  const week = await env.DB.prepare(`SELECT
      COUNT(*) AS finished,
      COALESCE(SUM(status = 'done'), 0) AS done,
      COALESCE(SUM(status = 'needs_review'), 0) AS needsReview,
      COALESCE(SUM(status = 'failed'), 0) AS failed,
      COALESCE(SUM(attempts > 1), 0) AS retried,
      AVG(CASE WHEN status IN ('done', 'needs_review') THEN duration_s END) AS avgDurationS,
      AVG(cost_usd) AS avgCostUsd,
      SUM(cost_usd) AS costUsd,
      AVG(qa_score) AS avgQa
    FROM redesign_jobs WHERE finished_at > datetime('now', '-7 days') AND status != 'cancelled'`).first();
  const { results: daily } = await env.DB.prepare(
    `SELECT date(finished_at) AS day, SUM(status = 'done') AS done, SUM(status = 'needs_review') AS review, SUM(status = 'failed') AS failed
     FROM redesign_jobs WHERE finished_at > datetime('now', '-14 days') GROUP BY day ORDER BY day`,
  ).all();
  const { results: byDirection } = await env.DB.prepare(
    "SELECT direction, COUNT(*) AS n, AVG(qa_score) AS avgQa FROM redesign_jobs WHERE direction IS NOT NULL AND status IN ('done', 'needs_review', 'failed') AND finished_at > datetime('now', '-30 days') GROUP BY direction ORDER BY n DESC",
  ).all();
  return { today, week, daily, byDirection, directions: DIRECTIONS.map((d) => ({ id: d.id, name: d.name })) };
}
