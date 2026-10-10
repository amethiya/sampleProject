import { useCallback, useEffect, useState } from "react";
import { api, CATEGORY_LABELS } from "../api";
import { linkProps } from "../router";
import { I, Icon } from "../ui";

export interface QaCategory { id: string; label: string; score: number | null; source: string; criteria: string; notes: string[] }
export interface JobInfo {
  id: number;
  leadId: string;
  status: "queued" | "running" | "needs_review" | "done" | "failed" | "cancelled";
  stage: string | null;
  progress: string | null;
  error: string | null;
  notes: string | null;
  mode: string;
  direction: string | null;
  directionName: string | null;
  theme: string | null;
  attempts: number;
  maxAttempts: number;
  retryAt: string | null;
  failureKind: string | null;
  qa: { overall: number; pass: boolean; threshold: number; critical: string[]; warnings: string[]; categories: QaCategory[] } | null;
  qaScore: number | null;
  costUsd: number | null;
  durationS: number | null;
  runner: string | null;
  createdAt: string;
  startedAt: string | null;
  heartbeatAt: string | null;
  finishedAt: string | null;
  events?: { at: string; stage: string | null; level: string; message: string }[];
  lead?: { name: string; category: string; website: string; score: number };
}

interface Stats {
  today: { finishedToday: number; passedToday: number; queued: number; retryScheduled: number; running: number; needsReview: number; failed7d: number };
  week: { finished: number; done: number; needsReview: number; failed: number; retried: number; avgDurationS: number | null; avgCostUsd: number | null; costUsd: number | null; avgQa: number | null };
  byDirection: { direction: string; n: number; avgQa: number | null }[];
  directions: { id: string; name: string }[];
}

const DAILY_GOAL = 10;
const STAGES = [["researching", "Research"], ["designing", "Design"], ["building", "Build"], ["qa", "QA"], ["refining", "Refine"], ["uploading", "Publish"]] as const;
export const JOB_STATUS: Record<string, string> = {
  queued: "Queued", running: "Working", needs_review: "Needs review", done: "Done", failed: "Failed", cancelled: "Cancelled",
};
const FAILURE: Record<string, string> = { technical: "Technical error", unreachable: "Website unreachable", quality: "Rejected on quality", cancelled: "Cancelled" };

const utc = (s: string) => new Date(s.includes("T") ? s : s.replace(" ", "T") + "Z");
const since = (s: string) => {
  const m = Math.round((Date.now() - utc(s).getTime()) / 60_000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : utc(s).toLocaleDateString();
};
const dur = (s: number | null | undefined) => (s == null ? "–" : s < 90 ? `${Math.round(s)}s` : `${Math.round(s / 60)} min`);
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "–");

export function jobLabel(j: JobInfo): string {
  if (j.status === "queued" && j.retryAt && utc(j.retryAt).getTime() > Date.now()) return "Retry scheduled";
  if (j.status === "running" && j.stage) return STAGES.find(([id]) => id === j.stage)?.[1] ?? "Working";
  return JOB_STATUS[j.status] ?? j.status;
}

/** Where a job stands, what QA found, and the owner's actions on it. */
export function JobPanel({ job, onAction, busy }: { job: JobInfo; onAction(action: string, body?: Record<string, unknown>): void; busy: boolean }) {
  const [rejecting, setRejecting] = useState(false);
  const [why, setWhy] = useState("");
  const at = STAGES.findIndex(([id]) => id === job.stage);
  const finished = ["done", "needs_review"].includes(job.status);
  return (
    <div className={`job job-${job.status}`} role="status">
      <div className="job-head">
        <span className={`chip js-${job.status}`}>{jobLabel(job)}</span>
        {job.directionName && <span className="muted small">Direction: <b>{job.directionName}</b>{job.theme ? ` · theme ${job.theme}` : ""}</span>}
        <span className="muted small">Attempt {job.attempts}/{job.maxAttempts}{job.durationS != null ? ` · ${dur(job.durationS)}` : job.startedAt && job.status === "running" ? ` · started ${since(job.startedAt)}` : ""}{job.costUsd != null ? ` · Claude cost $${job.costUsd.toFixed(2)}` : ""}</span>
      </div>
      {(job.status === "running" || job.status === "queued") && (
        <ol className="stages" aria-label="Pipeline">
          {STAGES.map(([id, label], i) => <li key={id} className={job.status === "running" && i < at ? "past" : job.status === "running" && i === at ? "now" : ""}>{label}</li>)}
        </ol>
      )}
      {job.status === "queued" && <p className="small">{job.retryAt && utc(job.retryAt).getTime() > Date.now() ? `Retry ${since(job.retryAt).replace(" ago", "")} (${utc(job.retryAt).toLocaleTimeString()}). Last error: ${job.error ?? "unknown"}` : "Waiting for a runner (npm run redesign-runner on your Mac, or a Claude Code session)."}</p>}
      {job.status === "running" && job.progress && <p className="small">{job.progress}</p>}
      {job.status === "failed" && <p className="small danger">{FAILURE[job.failureKind ?? ""] ?? "Failed"}: {job.error ?? "unknown error"}</p>}
      {job.notes && <p className="muted small job-notes">Your notes{job.mode === "revise" ? " (improving the previous version)" : ""}: “{job.notes}”</p>}

      {job.qa && finished && <Scorecard qa={job.qa} />}
      {finished && !job.qa && <p className="small">No browser QA ran for this version, so it was not checked automatically. Review it before sending.</p>}

      <div className="row-actions">
        {job.status === "needs_review" && <button className="btn btn-sm btn-primary" disabled={busy} onClick={() => onAction("approve")}><Icon d={I.check} size={14} />Approve</button>}
        {finished && !rejecting && <button className="btn btn-sm" disabled={busy} onClick={() => setRejecting(true)}>Reject…</button>}
        {(job.status === "failed" || job.status === "cancelled") && <button className="btn btn-sm btn-primary" disabled={busy} onClick={() => onAction("retry")}>Retry</button>}
        {(job.status === "queued" || job.status === "running") && <button className="btn btn-sm" disabled={busy} onClick={() => onAction("cancel")}>Cancel</button>}
      </div>
      {rejecting && (
        <div className="stack reject">
          <label className="field"><span>What's wrong? <span className="muted">(sent to Claude if you redo it)</span></span>
            <textarea rows={3} value={why} onChange={(e) => setWhy(e.target.value)} maxLength={4000} placeholder="For example: hero photo is blurry, menu prices are hard to read, feels too dark for a clinic." /></label>
          <div className="row-actions">
            <button className="btn btn-sm btn-primary" disabled={busy} onClick={() => { onAction("reject", { notes: why || undefined, requeue: "revise" }); setRejecting(false); }}>Reject and improve it</button>
            <button className="btn btn-sm" disabled={busy} onClick={() => { onAction("reject", { notes: why || undefined, requeue: "fresh" }); setRejecting(false); }}>Reject and start over</button>
            <button className="btn btn-sm" disabled={busy} onClick={() => { onAction("reject", { notes: why || undefined }); setRejecting(false); }}>Just reject</button>
            <button className="btn btn-sm" onClick={() => setRejecting(false)}>Keep it</button>
          </div>
        </div>
      )}
      {!!job.events?.length && (
        <details className="events">
          <summary className="small">Activity ({job.events.length})</summary>
          <ol>{job.events.map((e, i) => <li key={i} className={`ev-${e.level}`}><time className="muted">{utc(e.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time> {e.message}</li>)}</ol>
        </details>
      )}
    </div>
  );
}

function Scorecard({ qa }: { qa: NonNullable<JobInfo["qa"]> }) {
  return (
    <div className="scorecard">
      <p className="small"><b>QA {qa.pass ? "passed" : "not passed"}: {qa.overall}/10</b> <span className="muted">(pass needs {qa.threshold}, no critical defect, every category at least 5)</span></p>
      {qa.critical.length > 0 && <ul className="list small danger">{qa.critical.slice(0, 6).map((c) => <li key={c}>{c}</li>)}</ul>}
      <table className="qa">
        <tbody>
          {qa.categories.map((c) => (
            <tr key={c.id} title={c.criteria}>
              <th scope="row">{c.label}</th>
              <td className="ta-r"><b>{c.score ?? "–"}</b></td>
              <td><span className="meter"><i style={{ width: `${(c.score ?? 0) * 10}%` }} /></span></td>
              <td className="muted small">{c.source === "model" ? "Claude's review" : c.source === "mixed" ? "measured + review" : "measured"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {qa.warnings.length > 0 && <p className="muted small">{qa.warnings.slice(0, 3).join(" ")}</p>}
    </div>
  );
}

const FILTERS = [["active", "In progress"], ["needs_review", "Needs review"], ["failed", "Failed"], ["done", "Done"], ["", "All"]] as const;

/** /app/queue: the redesign pipeline at a glance, batch queueing, and every job's state and actions. */
export function QueuePage({ onError, onToast }: { onError(e: unknown): void; onToast(s: string): void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [jobs, setJobs] = useState<JobInfo[]>([]);
  const [filter, setFilter] = useState<string>("active");
  const [count, setCount] = useState(10);
  const [category, setCategory] = useState("");
  const [busy, setBusy] = useState("");
  const [open, setOpen] = useState<JobInfo | null>(null);

  const load = useCallback(async () => {
    try {
      const [s, j] = await Promise.all([api<Stats>("/api/redesign-stats"), api<JobInfo[]>(`/api/redesign-jobs?${new URLSearchParams(filter ? { status: filter } : {})}`)]);
      setStats(s);
      setJobs(j);
    } catch (e) { onError(e); }
  }, [filter, onError]);
  useEffect(() => {
    load();
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, [load]);

  const queue = async () => {
    setBusy("batch");
    try {
      const r = await api<{ queued: string[]; skipped: string[] }>("/api/redesign-jobs/batch", { method: "POST", body: JSON.stringify({ count, category: category || undefined }) });
      onToast(r.queued.length ? `Queued ${r.queued.length} redesign${r.queued.length === 1 ? "" : "s"}.${r.skipped.length ? ` ${r.skipped.length} already in progress.` : ""}` : "No leads left without a redesign. Find more leads first.");
      setFilter("active");
      await load();
    } catch (e) { onError(e); }
    setBusy("");
  };
  const act = async (job: JobInfo, action: string, body?: Record<string, unknown>) => {
    setBusy(`job${job.id}`);
    try {
      await api(`/api/redesign-jobs/${job.id}/${action}`, { method: "POST", body: JSON.stringify(body ?? {}) });
      onToast(action === "approve" ? "Approved. It's ready to pitch." : action === "retry" ? "Queued again." : action === "cancel" ? "Cancelled." : "Rejected.");
      if (open?.id === job.id) setOpen(await api<JobInfo>(`/api/redesign-jobs/${job.id}`));
      await load();
    } catch (e) { onError(e); }
    setBusy("");
  };
  const openJob = async (j: JobInfo) => {
    if (open?.id === j.id) return setOpen(null);
    try { setOpen(await api<JobInfo>(`/api/redesign-jobs/${j.id}`)); } catch (e) { onError(e); }
  };

  const t = stats?.today, w = stats?.week;
  const name = (id: string) => stats?.directions.find((d) => d.id === id)?.name ?? id;
  return (
    <div className="content">
      <div className="page-head">
        <div>
          <h1>Redesign queue</h1>
          <p className="muted">Every lead's redesign: research, design, build, browser QA and refinement. No daily limit; runners work through the queue one job each (start more with <code>--concurrency</code>).</p>
        </div>
      </div>

      <section className="kpis kpis-5" aria-label="Today">
        <div className="kpi">
          <span className="kpi-label">Redesigned today</span>
          <span className="kpi-value">{t?.finishedToday ?? "–"}<small> / {DAILY_GOAL}</small></span>
          <span className="meter"><i style={{ width: `${Math.min(100, ((t?.finishedToday ?? 0) / DAILY_GOAL) * 100)}%` }} /></span>
        </div>
        <div className="kpi"><span className="kpi-label">Passed QA today</span><span className="kpi-value">{t?.passedToday ?? "–"}</span></div>
        <div className="kpi"><span className="kpi-label">In queue</span><span className="kpi-value">{t ? t.queued : "–"}{t?.retryScheduled ? <small> ({t.retryScheduled} retrying)</small> : null}</span></div>
        <div className="kpi"><span className="kpi-label">Working now</span><span className="kpi-value">{t?.running ?? "–"}</span></div>
        <div className="kpi"><span className="kpi-label">Needs review</span><span className="kpi-value">{t?.needsReview ?? "–"}</span></div>
      </section>
      {w && w.finished > 0 && (
        <p className="muted small metrics">
          Last 7 days: {w.finished} finished · {pct(w.done, w.finished)} passed QA first time · {pct(w.needsReview, w.finished)} needed review · {pct(w.failed, w.finished)} failed · {pct(w.retried, w.finished)} retried ·
          average {dur(w.avgDurationS)} per redesign{w.avgQa != null ? ` · average QA ${w.avgQa.toFixed(1)}/10` : ""}{w.avgCostUsd != null ? ` · Claude cost $${w.avgCostUsd.toFixed(2)} each ($${(w.costUsd ?? 0).toFixed(2)} total, as reported by Claude Code)` : ""}.
          {stats.byDirection.length > 0 && ` Directions (30 days): ${stats.byDirection.map((d) => `${name(d.direction)} ${d.n}`).join(", ")}.`}
        </p>
      )}

      <section className="callout batch">
        <div>
          <h3>Queue redesigns</h3>
          <p className="muted small">Takes the most outdated leads that have no Claude redesign yet. Each gets its own creative direction.</p>
        </div>
        <div className="row-actions">
          <label className="field inline"><span>How many</span><input type="number" min={1} max={100} value={count} onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value) || 1)))} /></label>
          <label className="field inline"><span>Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Any</option>
              {Object.entries(CATEGORY_LABELS).map(([id, l]) => <option key={id} value={id}>{l}</option>)}
            </select>
          </label>
          <button className="btn btn-primary" onClick={queue} disabled={!!busy}><Icon d={I.queue} />{busy === "batch" ? "Queueing…" : `Queue next ${count}`}</button>
        </div>
        {t && t.queued > 0 && t.running === 0 && <p className="small">Jobs are waiting and no runner is working. Start one: <code>npm run redesign-runner -- --concurrency 2</code></p>}
      </section>

      <div className="segments" role="tablist" aria-label="Job status">
        {FILTERS.map(([id, label]) => <button key={id} role="tab" aria-selected={filter === id} className={filter === id ? "on" : ""} onClick={() => setFilter(id)}>{label}</button>)}
      </div>

      <div className="table-card jobs-card">
        <table className="leads jobs">
          <thead><tr><th>Business</th><th>Status</th><th>Direction</th><th>QA</th><th>Time</th><th className="ta-r">Actions</th></tr></thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id} className={open?.id === j.id ? "sel" : ""}>
                <td>
                  <a className="link-strong" {...linkProps(`/app/leads/${encodeURIComponent(j.leadId)}/redesign`)}>{j.lead?.name ?? j.leadId}</a>
                  <span className="sub">{CATEGORY_LABELS[j.lead?.category ?? ""] ?? j.lead?.category} · #{j.id}{j.mode === "revise" ? " · revision" : ""}</span>
                </td>
                <td><span className={`chip js-${j.status}`}>{jobLabel(j)}</span>{j.status === "running" && j.progress && <span className="sub ellipsis" title={j.progress}>{j.progress}</span>}{j.status === "failed" && <span className="sub ellipsis danger" title={j.error ?? ""}>{FAILURE[j.failureKind ?? ""] ?? j.error}</span>}</td>
                <td className="small">{j.directionName ?? <span className="muted">chosen at start</span>}</td>
                <td>{j.qaScore != null ? <b>{j.qaScore}</b> : <span className="muted">–</span>}</td>
                <td className="small nowrap">{j.durationS != null ? dur(j.durationS) : j.startedAt ? since(j.startedAt) : since(j.createdAt)}</td>
                <td className="ta-r">
                  <div className="row-actions end">
                    {j.status === "needs_review" && <button className="btn btn-sm btn-primary" disabled={!!busy} onClick={() => act(j, "approve")}>Approve</button>}
                    {(j.status === "failed" || j.status === "cancelled") && <button className="btn btn-sm" disabled={!!busy} onClick={() => act(j, "retry")}>Retry</button>}
                    {["done", "needs_review"].includes(j.status) && <a className="btn btn-sm" href={`/preview/${encodeURIComponent(j.leadId)}/`} target="_blank" rel="noreferrer">Preview<Icon d={I.external} size={14} /></a>}
                    <button className="btn btn-sm" onClick={() => openJob(j)} aria-expanded={open?.id === j.id}>{open?.id === j.id ? "Close" : "Details"}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!jobs.length && <div className="empty"><p className="muted">{filter === "active" ? "Nothing in progress. Queue some redesigns above." : "No jobs here."}</p></div>}
      </div>
      {open && <section className="callout"><JobPanel job={open} busy={!!busy} onAction={(a, b) => act(open, a, b)} /></section>}
    </div>
  );
}
