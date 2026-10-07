import { useCallback, useEffect, useMemo, useState } from "react";
import Logo from "../Logo";
import { api, CATEGORY_LABELS, countryName, Unauthorized } from "../api";
import { navigate } from "../router";

interface LeadRow {
  id: string;
  name: string;
  category: string;
  city: string;
  country: string;
  website: string;
  score: number;
  reasons: string[];
  emails: string[];
  phones: string[];
  contactPage?: string;
  auditedAt: string;
  status: string;
  sheetSynced: boolean;
}

interface Stats {
  total: number;
  pending: number;
  audited: number;
  qualified: number;
  today: number;
  unsynced: number;
}

interface Pitch {
  to: string;
  subject: string;
  body: string;
  gmailUrl: string;
}

const STATUSES = ["new", "contacted", "replied", "won", "lost", "ignored"];
const STATUS_LABELS: Record<string, string> = { new: "New", contacted: "Contacted", replied: "Replied", won: "Won", lost: "Lost", ignored: "Ignored" };
const DAILY_GOAL = 10;

export default function Dashboard() {
  const [me, setMe] = useState<string | null>(null);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState("");
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const guard = useCallback((e: unknown) => {
    if (e instanceof Unauthorized) navigate("/login");
    else setError((e as Error).message);
  }, []);

  useEffect(() => {
    api<{ email: string }>("/api/me").then((r) => setMe(r.email)).catch(guard);
  }, [guard]);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    if (showAll) params.set("all", "1");
    try {
      const [l, s] = await Promise.all([api<LeadRow[]>(`/api/leads?${params}`), api<Stats>("/api/stats")]);
      setLeads(l);
      setStats(s);
      setError("");
    } catch (e) {
      guard(e);
    }
  }, [category, status, q, showAll, guard]);

  useEffect(() => {
    if (!me) return;
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [me, load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const runAction = async (kind: "run" | "sync") => {
    setBusy(kind);
    try {
      const r = await api<Record<string, unknown>>(kind === "run" ? "/api/run" : "/api/sync", { method: "POST" });
      if (kind === "run") {
        const n = (r.newQualified as string[] | undefined)?.length ?? 0;
        setToast(`Discovery run finished: ${r.audited ?? 0} sites audited, ${n} new ${n === 1 ? "lead" : "leads"}.`);
      } else {
        const sheet = r as { synced?: number; skipped?: string; error?: string };
        setToast(sheet.skipped ? "Google Sheet sync isn't connected yet." : sheet.error ? `Sheet sync failed: ${sheet.error}` : `Synced ${sheet.synced ?? 0} leads to Google Sheets.`);
      }
      await load();
    } catch (e) {
      guard(e);
    } finally {
      setBusy("");
    }
  };

  const updateStatus = async (id: string, next: string) => {
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status: next } : l)));
    try {
      await api(`/api/leads/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status: next }) });
    } catch (e) {
      guard(e);
    }
  };

  const exportCsv = async () => {
    const res = await fetch("/api/export.csv", { credentials: "same-origin" });
    if (!res.ok) return setError("Export failed. Try signing in again.");
    const url = URL.createObjectURL(await res.blob());
    const a = Object.assign(document.createElement("a"), { href: url, download: `revamp-radar-leads-${new Date().toISOString().slice(0, 10)}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  };

  const signOut = async () => {
    await api("/api/logout", { method: "POST" }).catch(() => {});
    navigate("/login");
  };

  const lead = useMemo(() => leads.find((l) => l.id === selected) ?? null, [leads, selected]);
  const goal = Math.min(100, ((stats?.today ?? 0) / DAILY_GOAL) * 100);

  if (!me) return <div className="boot"><Logo /></div>;

  return (
    <div className="app">
      <aside className="side">
        <Logo inverse />
        <nav aria-label="Main">
          <a className="active" aria-current="page">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10" /></svg>
            Leads
          </a>
          <a href="/" target="_blank" rel="noreferrer">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" /></svg>
            Public page
          </a>
        </nav>
        <div className="side-foot">
          <span className="side-user" title={me}>{me}</span>
          <button className="side-signout" onClick={signOut}>Sign out</button>
        </div>
      </aside>

      <main className="main">
        <header className="main-head">
          <div>
            <h1>Leads</h1>
            <p className="muted">Businesses with outdated websites and a redesign ready to pitch.</p>
          </div>
          <div className="head-actions">
            <button className="button button-quiet" onClick={() => setAdding(true)}>Redesign any website</button>
            <button className="button button-quiet" onClick={exportCsv}>Export CSV</button>
            <button className="button button-quiet" onClick={() => runAction("sync")} disabled={!!busy}>{busy === "sync" ? "Syncing…" : "Sync to Sheet"}</button>
            <button className="button" onClick={() => runAction("run")} disabled={!!busy}>{busy === "run" ? "Running discovery…" : "Run discovery"}</button>
          </div>
        </header>

        {error && <div className="banner" role="alert">{error}</div>}

        <section className="kpis" aria-label="Summary">
          <div className="kpi kpi-goal">
            <span className="kpi-label">Found today</span>
            <span className="kpi-value">{stats?.today ?? "–"}<small>of {DAILY_GOAL}</small></span>
            <span className="meter" role="progressbar" aria-valuenow={stats?.today ?? 0} aria-valuemax={DAILY_GOAL}><i style={{ width: `${goal}%` }} /></span>
          </div>
          <div className="kpi"><span className="kpi-label">Ready to pitch</span><span className="kpi-value">{stats?.qualified ?? "–"}</span></div>
          <div className="kpi"><span className="kpi-label">Websites audited</span><span className="kpi-value">{stats?.audited ?? "–"}</span></div>
          <div className="kpi"><span className="kpi-label">Waiting in queue</span><span className="kpi-value">{stats?.pending ?? "–"}</span></div>
          <div className="kpi"><span className="kpi-label">Not in Sheet yet</span><span className="kpi-value">{stats?.unsynced ?? "–"}</span></div>
        </section>

        <section className="filters" aria-label="Filters">
          <div className="search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 18a7 7 0 1 0 0-14a7 7 0 0 0 0 14zM20 20l-4-4" /></svg>
            <input type="search" placeholder="Search by name, website or city" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search leads" />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
            <option value="">All categories</option>
            {Object.entries(CATEGORY_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
            <option value="">Any status</option>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <label className="toggle">
            <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
            <span>Show sites that didn't qualify</span>
          </label>
        </section>

        <div className="table-card">
          <table className="leads">
            <thead>
              <tr><th>Business</th><th>Location</th><th>Outdated score</th><th>Contact</th><th>Status</th><th><span className="sr">Open</span></th></tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className={selected === l.id ? "is-selected" : ""} onClick={() => setSelected(l.id)}>
                  <td>
                    <button className="row-title" onClick={(e) => { e.stopPropagation(); setSelected(l.id); }}>{l.name}</button>
                    <span className="row-sub">{CATEGORY_LABELS[l.category] ?? l.category} · {l.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</span>
                  </td>
                  <td><span className="row-main">{l.city}</span><span className="row-sub">{countryName(l.country)}</span></td>
                  <td><Score value={l.score} /></td>
                  <td>
                    {l.emails[0] ? <span className="row-main ellipsis">{l.emails[0]}</span> : <span className="row-sub">No email found</span>}
                    {l.phones[0] && <span className="row-sub">{l.phones[0]}</span>}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select className={`status s-${l.status}`} value={l.status} onChange={(e) => updateStatus(l.id, e.target.value)} aria-label={`Status for ${l.name}`}>
                      {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                    </select>
                  </td>
                  <td className="row-go" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d="M9 6l6 6l-6 6" /></svg>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!leads.length && (
            <div className="empty">
              <h2>No leads match these filters</h2>
              <p>Clear the filters, or run discovery to audit the next batch of websites. New leads also arrive automatically every 10 minutes.</p>
              <button className="button" onClick={() => runAction("run")} disabled={!!busy}>Run discovery</button>
            </div>
          )}
        </div>
      </main>

      {lead && <LeadDrawer lead={lead} onClose={() => setSelected(null)} onStatus={(s) => updateStatus(lead.id, s)} onError={guard} />}
      {adding && (
        <AddWebsite
          onClose={() => setAdding(false)}
          onAdded={async (id, name) => { setAdding(false); setToast(`${name} added. Opening its redesign…`); await load(); setSelected(id); }}
          onError={guard}
        />
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

function Score({ value }: { value: number }) {
  const tone = value >= 60 ? "hot" : value >= 35 ? "warm" : "cool";
  return (
    <span className={`score ${tone}`} title="Higher means more outdated">
      <b>{value}</b>
      <span className="score-track"><i style={{ width: `${value}%` }} /></span>
    </span>
  );
}

function LeadDrawer({ lead, onClose, onStatus, onError }: { lead: LeadRow; onClose(): void; onStatus(s: string): void; onError(e: unknown): void }) {
  const [tab, setTab] = useState<"audit" | "redesign" | "pitch">("audit");
  const [pitch, setPitch] = useState<Pitch | null>(null);
  const [pitchError, setPitchError] = useState("");
  const [copied, setCopied] = useState(false);
  const preview = `/preview/${encodeURIComponent(lead.id)}/`;

  useEffect(() => {
    setPitch(null);
    setPitchError("");
    api<Pitch>(`/api/leads/${encodeURIComponent(lead.id)}/pitch`).then(setPitch).catch((e) => {
      if (e instanceof Unauthorized) onError(e);
      else setPitchError((e as Error).message);
    });
  }, [lead.id, onError]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label={lead.name}>
        <header className="drawer-head">
          <div>
            <h2>{lead.name}</h2>
            <p className="muted">{CATEGORY_LABELS[lead.category] ?? lead.category} in {lead.city}, {countryName(lead.country)}</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </header>

        <div className="drawer-links">
          <a className="button button-quiet" href={lead.website} target="_blank" rel="noreferrer">Current website</a>
          <a className="button" href={preview} target="_blank" rel="noreferrer">Open redesign</a>
        </div>

        <div className="tabs" role="tablist">
          {(["audit", "redesign", "pitch"] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
              {t === "audit" ? "Audit" : t === "redesign" ? "Redesign" : "Pitch email"}
            </button>
          ))}
        </div>

        <div className="drawer-body">
          {tab === "audit" && (
            <div className="audit">
              <div className="gauge">
                <Score value={lead.score} />
                <p className="muted">Outdated score out of 100, based on {lead.reasons.length} issues found on the homepage.</p>
              </div>
              <h3>What's wrong with the current site</h3>
              <ul className="issues">{lead.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
              <h3>Contacts</h3>
              <ul className="contacts">
                {lead.emails.map((e) => <li key={e}><a href={`mailto:${e}`}>{e}</a></li>)}
                {lead.phones.map((p) => <li key={p}><a href={`tel:${p}`}>{p}</a></li>)}
                {!lead.emails.length && !lead.phones.length && <li className="muted">No public contact details found.</li>}
              </ul>
              {lead.contactPage && <a className="text-link" href={lead.contactPage} target="_blank" rel="noreferrer">Open their contact page</a>}
              <p className="muted small">Audited {new Date(lead.auditedAt).toLocaleString()}. {lead.sheetSynced ? "Saved in Google Sheets." : "Not in Google Sheets yet."}</p>
            </div>
          )}

          {tab === "redesign" && <RedesignPanel lead={lead} onError={onError} />}

          {tab === "pitch" && (
            <div className="pitch">
              {pitch ? (
                <>
                  <dl className="pitch-meta"><dt>To</dt><dd>{pitch.to}</dd><dt>Subject</dt><dd>{pitch.subject}</dd></dl>
                  <pre>{pitch.body}</pre>
                  <div className="pitch-actions">
                    <a className="button" href={pitch.gmailUrl} target="_blank" rel="noreferrer" onClick={() => lead.status === "new" && onStatus("contacted")}>Open draft in Gmail</a>
                    <button className="button button-quiet" onClick={() => { navigator.clipboard?.writeText(pitch.body); setCopied(true); setTimeout(() => setCopied(false), 1800); }}>
                      {copied ? "Copied" : "Copy text"}
                    </button>
                  </div>
                  <p className="muted small">Nothing is sent automatically. Gmail opens with the draft filled in, and you press send.</p>
                </>
              ) : (
                <p className="muted">{pitchError ? (pitchError.includes("no email") ? "This lead has no public email address, so there's no email to draft. Use the phone number instead." : pitchError) : "Writing the pitch…"}</p>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function AddWebsite({ onClose, onAdded, onError }: { onClose(): void; onAdded(id: string, name: string): void; onError(e: unknown): void }) {
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("restaurant");
  const [city, setCity] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await api<{ id: string; name: string }>("/api/leads/add", { method: "POST", body: JSON.stringify({ url, category, city }) });
      onAdded(r.id, r.name);
    } catch (err) {
      if (err instanceof Unauthorized) onError(err);
      else setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <form className="modal" onSubmit={submit} role="dialog" aria-label="Redesign any website">
        <h2>Redesign any website</h2>
        <p className="muted">Paste a website address. Revamp Radar reads its pages, adds it to your leads and builds a redesign you can open right away.</p>
        <label>Website<input type="text" inputMode="url" placeholder="example.com" value={url} onChange={(e) => setUrl(e.target.value)} required autoFocus /></label>
        <div className="modal-row">
          <label>Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {Object.entries(CATEGORY_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </label>
          <label>City (optional)<input type="text" value={city} onChange={(e) => setCity(e.target.value)} /></label>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="button button-quiet" onClick={onClose}>Cancel</button>
          <button type="submit" className="button" disabled={busy}>{busy ? "Reading website…" : "Add and redesign"}</button>
        </div>
      </form>
    </>
  );
}

interface RedesignStatus {
  templateStyle: string | null;
  claudeStyle: string | null;
  crawledAt: string | null;
  pages: { slug: string; label: string; url: string }[];
  job: { id: number; status: "queued" | "running" | "done" | "failed"; error: string | null; createdAt: string; startedAt: string | null; finishedAt: string | null } | null;
  claudePages: string[];
  claudeCreatedAt: string | null;
}

function RedesignPanel({ lead, onError }: { lead: LeadRow; onError(e: unknown): void }) {
  const [st, setSt] = useState<RedesignStatus | null>(null);
  const [slug, setSlug] = useState("home");
  const [engine, setEngine] = useState<"template" | "claude">("template");
  const [busy, setBusy] = useState("");
  const base = `/api/leads/${encodeURIComponent(lead.id)}`;

  const refresh = useCallback(async (method: "GET" | "POST" = "GET", path = "/redesign") => {
    try {
      const next = await api<RedesignStatus>(base + path, { method });
      setSt(next);
    } catch (e) {
      onError(e);
    }
  }, [base, onError]);

  useEffect(() => {
    setSt(null);
    setSlug("home");
    setEngine("template");
    // First open crawls the whole site if it hasn't been crawled yet.
    api<RedesignStatus>(`${base}/redesign`).then(async (s) => {
      if (!s.crawledAt) s = await api<RedesignStatus>(`${base}/crawl`, { method: "POST" });
      setSt(s);
      if (s.claudePages.length) setEngine("claude");
    }).catch(onError);
  }, [base, onError]);

  const active = st?.job?.status === "queued" || st?.job?.status === "running";
  useEffect(() => {
    if (!active) return;
    const t = setInterval(async () => {
      const next = await api<RedesignStatus>(`${base}/redesign`).catch(() => null);
      if (next) {
        setSt(next);
        if (next.job?.status === "done") setEngine("claude");
      }
    }, 10_000);
    return () => clearInterval(t);
  }, [active, base]);

  const act = async (kind: "claude" | "crawl") => {
    setBusy(kind);
    await refresh("POST", kind === "claude" ? "/redesign" : "/crawl");
    setBusy("");
  };

  if (!st) return <p className="muted">Reading every page of {lead.website.replace(/^https?:\/\/(www\.)?/, "")}…</p>;

  const hasClaude = st.claudePages.includes(slug);
  const shownEngine = engine === "claude" && hasClaude ? "claude" : "template";
  const src = `/preview/${encodeURIComponent(lead.id)}/${slug === "home" ? "" : encodeURIComponent(slug)}?engine=${shownEngine}`;
  const job = st.job;

  return (
    <div className="redesign">
      <div className="rd-toolbar">
        <div className="segmented" role="group" aria-label="Redesign version">
          <button className={shownEngine === "template" ? "on" : ""} onClick={() => setEngine("template")}>Template</button>
          <button className={shownEngine === "claude" ? "on" : ""} onClick={() => setEngine("claude")} disabled={!hasClaude} title={hasClaude ? "" : "No Claude redesign for this page yet"}>Claude</button>
        </div>
        <select value={slug} onChange={(e) => setSlug(e.target.value)} aria-label="Page">
          {st.pages.map((p) => <option key={p.slug} value={p.slug}>{p.label}</option>)}
        </select>
        <a className="text-link" href={src} target="_blank" rel="noreferrer">Open full screen</a>
      </div>

      <div className="device"><iframe key={src} src={src} title={`Redesign of ${lead.name}`} /></div>

      <div className="rd-claude">
        <div>
          <h3>Bespoke redesign with Claude</h3>
          <p className="muted small">
            Claude rebuilds all {st.pages.length} pages using every piece of the site's own text and images, with custom layout, motion and 3D.
            Jobs run on your Mac through Claude Code with your subscription: keep <code>npm run redesign-runner</code> running.
          </p>
          {job && (
            <p className={`job job-${job.status}`} role="status">
              {job.status === "queued" && "Queued. Waiting for the redesign runner to pick it up."}
              {job.status === "running" && `Claude is building the site (started ${new Date(job.startedAt + "Z").toLocaleTimeString()}). This usually takes 5 to 15 minutes.`}
              {job.status === "done" && `Claude redesign ready, ${st.claudePages.length} pages (${new Date(job.finishedAt + "Z").toLocaleString()}).`}
              {job.status === "failed" && `The last attempt failed: ${job.error ?? "unknown error"}`}
            </p>
          )}
        </div>
        <div className="rd-actions">
          <button className="button" onClick={() => act("claude")} disabled={!!busy || active}>
            {active ? "In progress…" : st.claudePages.length ? "Redesign again with Claude" : "Redesign with Claude"}
          </button>
          <button className="button button-quiet" onClick={() => act("crawl")} disabled={!!busy || active}>{busy === "crawl" ? "Reading site…" : "Re-read website"}</button>
        </div>
      </div>
      <p className="muted small">
        Read {st.pages.length} pages from the current site{st.crawledAt ? ` on ${new Date(st.crawledAt).toLocaleDateString()}` : ""}.
        {st.templateStyle && ` Template look: ${st.templateStyle}.`}
        {st.claudeStyle && ` Claude look: ${st.claudeStyle}.`}
      </p>
    </div>
  );
}
