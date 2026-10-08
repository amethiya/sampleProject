import { useCallback, useEffect, useState } from "react";
import Logo from "../Logo";
import { api, CATEGORY_LABELS, countryName, REGION_LABELS, Unauthorized } from "../api";
import { linkProps, navigate, usePath } from "../router";
import { applyTheme, getTheme, type ThemeChoice } from "../theme";
import appsScript from "../../../../integrations/google-apps-script/Code.gs?raw";

interface LeadRow {
  id: string;
  name: string;
  category: string;
  city: string;
  country: string;
  region: string;
  website: string;
  score: number;
  reasons: string[];
  emails: string[];
  phones: string[];
  contactPage?: string;
  auditedAt: string;
  status: string;
  sheetSynced: boolean;
  crawled: boolean;
  redesign: "pending" | "template" | "queued" | "running" | "done" | "failed";
}

interface Stats {
  pending: number;
  audited: number;
  qualified: number;
  today: number;
  unsynced: number;
  byStatus: Record<string, number>;
}

interface Pitch {
  to: string;
  subject: string;
  body: string;
  gmailUrl: string;
}

interface SheetState {
  connected: boolean;
  webhookUrl: string;
  viewUrl: string;
  secret: string;
  pending: number;
  last: { at: string; synced?: number; error?: string; skipped?: string } | null;
}

type Tab = "audit" | "redesign" | "pitch";
const TABS: Tab[] = ["audit", "redesign", "pitch"];
const leadPath = (id: string, tab: Tab) => `/app/leads/${encodeURIComponent(id)}/${tab}`;

const STATUSES = ["new", "contacted", "replied", "won", "lost", "ignored"];
const STATUS_LABELS: Record<string, string> = { new: "Ready to pitch", contacted: "Email sent", replied: "Replied", won: "Won", lost: "Lost", ignored: "Ignored" };
const SEGMENTS: { id: string; label: string }[] = [
  { id: "ready", label: "Ready to pitch" },
  { id: "contacted", label: "Email sent" },
  { id: "replied", label: "Replied" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
  { id: "ignored", label: "Ignored" },
  { id: "all", label: "All leads" },
];
const DAILY_GOAL = 10;
const REDESIGN_LABELS: Record<string, string> = {
  pending: "Not started",
  template: "Template ready",
  queued: "Claude queued",
  running: "Redesigning…",
  done: "Redesigned",
  failed: "Failed",
};

function RedesignChip({ state }: { state: string }) {
  return <span className={`chip rd-${state}`} title={state === "template" ? "Instant template redesign is ready; Claude redesign not done yet" : undefined}>{REDESIGN_LABELS[state] ?? state}</span>;
}

const domainOf = (u: string) => u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/.*$/, "");
const ago = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(iso).toLocaleDateString();
};

function Icon({ d, size = 18 }: { d: string; size?: number }) {
  return (
    <svg className="icon" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
const I = {
  search: "M11 18a7 7 0 1 0 0-14a7 7 0 0 0 0 14zM20 20l-4-4",
  radar: "M12 21a9 9 0 1 0 0-18a9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8a4 4 0 0 0 0 8zM12 12l6-4",
  plus: "M12 5v14M5 12h14",
  sheet: "M4 4h16v16H4zM4 9h16M4 14h16M10 4v16",
  download: "M12 4v11M7 10l5 5l5-5M5 20h14",
  external: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
  back: "M19 12H5M11 6l-6 6l6 6",
  close: "M6 6l12 12M18 6L6 18",
  menu: "M4 7h16M4 12h16M4 17h16",
  leads: "M4 6h16M4 12h16M4 18h10",
  logout: "M15 4h4v16h-4M10 8l-4 4l4 4M6 12h10",
  copy: "M8 8h11v11H8zM5 16V5h11",
  check: "M5 12l5 5L20 7",
  sun: "M12 17a5 5 0 1 0 0-10a5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
  monitor: "M3 4h18v12H3zM8 20h8M12 16v4",
};

function ThemeSwitch() {
  const [choice, setChoice] = useState<ThemeChoice>(getTheme);
  const opts: { id: ThemeChoice; label: string; icon: string }[] = [
    { id: "light", label: "Light", icon: I.sun },
    { id: "dark", label: "Dark", icon: I.moon },
    { id: "system", label: "System", icon: I.monitor },
  ];
  return (
    <div className="theme-switch" role="radiogroup" aria-label="Theme">
      {opts.map((o) => (
        <button key={o.id} role="radio" aria-checked={choice === o.id} className={choice === o.id ? "on" : ""} title={o.label}
          onClick={() => { applyTheme(o.id); setChoice(o.id); }}>
          <Icon d={o.icon} size={15} /><span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [me, setMe] = useState<string | null>(null);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [segment, setSegment] = useState("ready");
  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("");
  const [redesignFilter, setRedesignFilter] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const path = usePath();
  const route = path.match(/^\/app\/leads\/([^/]+)(?:\/(audit|redesign|pitch))?\/?$/);
  const [panel, setPanel] = useState<"" | "sheet" | "add">("");
  const [menu, setMenu] = useState(false);

  const guard = useCallback((e: unknown) => {
    if (e instanceof Unauthorized) navigate("/login");
    else setError((e as Error).message);
  }, []);

  useEffect(() => {
    api<{ email: string }>("/api/me").then((r) => setMe(r.email)).catch(guard);
  }, [guard]);

  const load = useCallback(async () => {
    const p = new URLSearchParams({ segment });
    if (category) p.set("category", category);
    if (region) p.set("region", region);
    if (redesignFilter) p.set("redesign", redesignFilter);
    if (q) p.set("q", q);
    api<Stats>("/api/stats").then(setStats).catch(() => {});
    try {
      setLeads(await api<LeadRow[]>(`/api/leads?${p}`));
      setError("");
    } catch (e) {
      guard(e);
    } finally {
      setLoading(false);
    }
  }, [segment, category, region, redesignFilter, q, guard]);

  useEffect(() => {
    const t = setTimeout(load, 120);
    const every = setInterval(load, 60_000); // new leads arrive every 10 minutes
    return () => { clearTimeout(t); clearInterval(every); };
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3600);
    return () => clearTimeout(t);
  }, [toast]);

  const findLeads = async () => {
    setBusy("find");
    try {
      const r = await api<{ audited?: number; newQualified?: string[] }>("/api/run", { method: "POST" });
      const n = r.newQualified?.length ?? 0;
      setToast(n ? `Found ${n} new ${n === 1 ? "lead" : "leads"} from ${r.audited} websites checked.` : `Checked ${r.audited ?? 0} websites. No new leads this round; try again or wait for the next run.`);
      await load();
    } catch (e) {
      guard(e);
    } finally {
      setBusy("");
    }
  };

  const updateStatus = async (id: string, next: string) => {
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status: next, sheetSynced: false } : l)));
    try {
      await api(`/api/leads/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status: next }) });
      setToast(`Marked as ${STATUS_LABELS[next]}.`);
      setTimeout(load, 2500);
    } catch (e) {
      guard(e);
    }
  };

  const exportCsv = async () => {
    setMenu(false);
    const res = await fetch("/api/export.csv", { credentials: "same-origin" });
    if (!res.ok) return setError("Export failed. Sign in again and retry.");
    const url = URL.createObjectURL(await res.blob());
    Object.assign(document.createElement("a"), { href: url, download: `revamp-radar-leads-${new Date().toISOString().slice(0, 10)}.csv` }).click();
    URL.revokeObjectURL(url);
  };

  const signOut = async () => {
    await api("/api/logout", { method: "POST" }).catch(() => {});
    navigate("/login");
  };

  const count = (s: string) => (s === "ready" ? stats?.byStatus?.new : s === "all" ? stats?.qualified : stats?.byStatus?.[s]) ?? 0;

  return (
    <div className="app">
      <aside className={`side${menu ? " open" : ""}`}>
        <div className="side-top">
          <Logo />
          <button className="icon-btn side-close" onClick={() => setMenu(false)} aria-label="Close menu"><Icon d={I.close} /></button>
        </div>
        <nav aria-label="Main">
          <a className="nav-item active" aria-current={route ? undefined : "page"} {...linkProps("/app")} onClickCapture={() => setMenu(false)}><Icon d={I.leads} />Leads</a>
          <button className="nav-item" onClick={() => { setPanel("sheet"); setMenu(false); }}><Icon d={I.sheet} />Google Sheet</button>
          <button className="nav-item" onClick={exportCsv}><Icon d={I.download} />Export CSV</button>
          <a className="nav-item" href="/templates" target="_blank" rel="noreferrer"><Icon d={I.external} />Templates</a>
          <a className="nav-item" href="/" target="_blank" rel="noreferrer"><Icon d={I.external} />Public page</a>
        </nav>
        <div className="side-foot">
          <ThemeSwitch />
          <span className="side-user" title={me ?? ""}>{me ?? "Signing in…"}</span>
          <button className="nav-item" onClick={signOut}><Icon d={I.logout} />Sign out</button>
        </div>
      </aside>
      {menu && <div className="scrim side-scrim" onClick={() => setMenu(false)} />}

      <div className="main">
        <header className="topbar">
          <button className="icon-btn" onClick={() => setMenu(true)} aria-label="Open menu"><Icon d={I.menu} /></button>
          <Logo />
          <button className="icon-btn" onClick={() => setPanel("add")} aria-label="Redesign any website"><Icon d={I.plus} /></button>
        </header>

        {route ? (
          <LeadPage id={decodeURIComponent(route[1])} tab={(route[2] as Tab) ?? "audit"} onStatus={updateStatus} onError={guard} onChanged={load} />
        ) : (
        <div className="content">
          <div className="page-head">
            <div>
              <h1>Leads</h1>
              <p className="muted">Businesses with outdated websites and a public email address, in the US, EU, Canada, Australia and New Zealand.</p>
            </div>
            <div className="head-actions">
              <button className="btn" onClick={() => setPanel("add")}><Icon d={I.plus} />Redesign any website</button>
              <button className="btn" onClick={() => setPanel("sheet")}><Icon d={I.sheet} />Google Sheet</button>
              <button className="btn btn-primary" onClick={findLeads} disabled={!!busy}><Icon d={I.radar} />{busy === "find" ? "Finding leads…" : "Find new leads"}</button>
            </div>
          </div>

          {error && <div className="banner" role="alert">{error}</div>}

          <section className="kpis" aria-label="Summary">
            <div className="kpi">
              <span className="kpi-label">Found today</span>
              <span className="kpi-value">{stats?.today ?? "–"}<small> / {DAILY_GOAL}</small></span>
              <span className="meter"><i style={{ width: `${Math.min(100, ((stats?.today ?? 0) / DAILY_GOAL) * 100)}%` }} /></span>
            </div>
            <div className="kpi"><span className="kpi-label">Ready to pitch</span><span className="kpi-value">{stats?.byStatus?.new ?? "–"}</span></div>
            <div className="kpi"><span className="kpi-label">Emails sent</span><span className="kpi-value">{stats?.byStatus?.contacted ?? 0}</span></div>
            <div className="kpi"><span className="kpi-label">Won</span><span className="kpi-value">{stats?.byStatus?.won ?? 0}</span></div>
          </section>

          <div className="segments" role="tablist" aria-label="Lead status">
            {SEGMENTS.map((s) => (
              <button key={s.id} role="tab" aria-selected={segment === s.id} className={segment === s.id ? "on" : ""} onClick={() => { setSegment(s.id); setLoading(true); }}>
                {s.label}<span className="count">{count(s.id)}</span>
              </button>
            ))}
          </div>

          <div className="toolbar">
            <label className="search">
              <Icon d={I.search} />
              <input type="search" placeholder="Search name, website or city" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search leads" />
            </label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
              <option value="">All categories</option>
              {Object.entries(CATEGORY_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
            <select value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Region">
              <option value="">All regions</option>
              {Object.entries(REGION_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
            <select value={redesignFilter} onChange={(e) => setRedesignFilter(e.target.value)} aria-label="Redesign">
              <option value="">Any redesign</option>
              <option value="done">Redesigned by Claude</option>
              <option value="pending">Redesign pending</option>
            </select>
          </div>

          {/* Desktop table */}
          <div className="table-card">
            <table className="leads">
              <thead>
                <tr><th>Business</th><th>Location</th><th>Score</th><th>Lead status</th><th>Redesign</th><th className="ta-r">Actions</th></tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <a className="link-strong" {...linkProps(leadPath(l.id, "audit"))}>{l.name}</a>
                      <span className="sub">{CATEGORY_LABELS[l.category] ?? l.category} · {domainOf(l.website)}</span>
                      <span className="sub ellipsis">{l.emails[0]}</span>
                    </td>
                    <td><span className="nowrap">{l.city || "—"}</span><span className="sub">{l.country ? countryName(l.country) : ""}</span></td>
                    <td><Score value={l.score} /></td>
                    <td><StatusSelect value={l.status} onChange={(s) => updateStatus(l.id, s)} label={l.name} /></td>
                    <td><RedesignChip state={l.redesign} /></td>
                    <td className="ta-r">
                      <div className="row-actions end">
                        <a className="btn btn-sm" {...linkProps(leadPath(l.id, "redesign"))}>Redesign</a>
                        <a className="btn btn-sm btn-primary" {...linkProps(leadPath(l.id, "pitch"))}>Pitch</a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="cards">
            {leads.map((l) => (
              <li key={l.id} className="card">
                <a className="card-main" {...linkProps(leadPath(l.id, "audit"))}>
                  <span className="card-top"><b>{l.name}</b><Score value={l.score} compact /></span>
                  <span className="sub">{CATEGORY_LABELS[l.category] ?? l.category} · {[l.city, l.country && countryName(l.country)].filter(Boolean).join(", ")}</span>
                  <span className="sub ellipsis">{l.emails[0]}</span>
                  <span className="card-chip"><RedesignChip state={l.redesign} /></span>
                </a>
                <div className="card-actions">
                  <StatusSelect value={l.status} onChange={(s) => updateStatus(l.id, s)} label={l.name} />
                  <a className="btn btn-sm" {...linkProps(leadPath(l.id, "redesign"))}>Redesign</a>
                  <a className="btn btn-sm btn-primary" {...linkProps(leadPath(l.id, "pitch"))}>Pitch</a>
                </div>
              </li>
            ))}
          </ul>

          {!loading && !leads.length && (
            <div className="empty">
              <h2>{segment === "ready" ? "No leads waiting to be pitched" : "Nothing here yet"}</h2>
              <p className="muted">New leads arrive automatically every 10 minutes. Find more now, or redesign a website you already have in mind.</p>
              <div className="row-actions center">
                <button className="btn btn-primary" onClick={findLeads} disabled={!!busy}>{busy === "find" ? "Finding leads…" : "Find new leads"}</button>
                <button className="btn" onClick={() => setPanel("add")}>Redesign any website</button>
              </div>
            </div>
          )}
          {loading && !leads.length && <div className="empty"><p className="muted">Loading leads…</p></div>}
        </div>
        )}

        {!route && <div className="mobile-bar">
          <button className="btn btn-primary btn-block" onClick={findLeads} disabled={!!busy}><Icon d={I.radar} />{busy === "find" ? "Finding leads…" : "Find new leads"}</button>
        </div>}
      </div>

      {panel === "sheet" && <SheetPanel onClose={() => setPanel("")} onError={guard} onToast={setToast} onSynced={load} />}
      {panel === "add" && (
        <AddWebsite
          onClose={() => setPanel("")}
          onAdded={async (id, name) => { setPanel(""); setToast(`${name} added.`); setSegment("all"); await load(); navigate(leadPath(id, "redesign")); }}
          onError={guard}
        />
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

function Score({ value, compact = false }: { value: number; compact?: boolean }) {
  const level = value >= 60 ? "high" : value >= 35 ? "mid" : "low";
  return (
    <span className={`score score-${level}${compact ? " compact" : ""}`} title="How outdated the current site is, out of 100">
      <b>{value}</b>
      {!compact && <span className="score-track"><i style={{ width: `${value}%` }} /></span>}
    </span>
  );
}

function StatusSelect({ value, onChange, label }: { value: string; onChange(s: string): void; label: string }) {
  return (
    <select className={`status st-${value}`} value={value} onChange={(e) => onChange(e.target.value)} aria-label={`Status for ${label}`}>
      {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
    </select>
  );
}

function Sheet({ title, onClose, children, wide = false, full = false }: { title: string; onClose(): void; children: React.ReactNode; wide?: boolean; full?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className={`drawer${wide ? " wide" : ""}${full ? " full" : ""}`} role="dialog" aria-label={title}>{children}</aside>
    </>
  );
}

/** A lead on its own page: /app/leads/<id>/<audit|redesign|pitch>. */
function LeadPage({ id, tab, onStatus, onError, onChanged }: { id: string; tab: Tab; onStatus(id: string, s: string): Promise<void>; onError(e: unknown): void; onChanged(): void }) {
  const [lead, setLead] = useState<LeadRow | null>(null);
  const [missing, setMissing] = useState(false);
  const reload = useCallback(() => {
    api<LeadRow[]>(`/api/leads?segment=all&id=${encodeURIComponent(id)}`)
      .then((r) => { setLead(r[0] ?? null); setMissing(!r.length); })
      .catch(onError);
  }, [id, onError]);
  useEffect(() => { setLead(null); reload(); }, [reload]);
  const changed = useCallback(() => { reload(); onChanged(); }, [reload, onChanged]);
  const setStatus = async (s: string) => { setLead((l) => (l ? { ...l, status: s } : l)); await onStatus(id, s); };

  const back = <a className="back-link" {...linkProps("/app")}><Icon d={I.back} size={16} />All leads</a>;
  if (missing) return <div className="content">{back}<div className="empty"><h2>Lead not found</h2><p className="muted">It may have been removed. Go back to the list to pick another.</p></div></div>;
  if (!lead) return <div className="content">{back}<p className="muted">Loading…</p></div>;
  return (
    <div className="content lead-page">
      {back}
      <header className="lead-head">
        <div className="drawer-title">
          <h1>{lead.name}</h1>
          <p className="muted">{CATEGORY_LABELS[lead.category] ?? lead.category}{lead.city ? ` · ${lead.city}` : ""}{lead.country ? `, ${countryName(lead.country)}` : ""}</p>
        </div>
        <div className="lead-meta">
          <StatusSelect value={lead.status} onChange={setStatus} label={lead.name} />
          <RedesignChip state={lead.redesign} />
          <a className="btn btn-sm" href={lead.website} target="_blank" rel="noreferrer">Current site<Icon d={I.external} size={14} /></a>
          <a className="btn btn-sm" href={`/preview/${encodeURIComponent(lead.id)}/`} target="_blank" rel="noreferrer">Open redesign<Icon d={I.external} size={14} /></a>
        </div>
      </header>
      <nav className="tabs page-tabs" aria-label="Lead sections">
        {TABS.map((t) => (
          <a key={t} {...linkProps(leadPath(lead.id, t))} aria-current={tab === t ? "page" : undefined} className={tab === t ? "on" : ""}>
            {t === "audit" ? "Audit" : t === "redesign" ? "Redesign" : "Pitch email"}
          </a>
        ))}
      </nav>
      <div className="lead-body">
        {tab === "audit" && <AuditTab lead={lead} />}
        {tab === "redesign" && <RedesignTab key={lead.id} lead={lead} onError={onError} onChanged={changed} />}
        {tab === "pitch" && <PitchTab lead={lead} onStatus={setStatus} onError={onError} />}
      </div>
    </div>
  );
}

function AuditTab({ lead }: { lead: LeadRow }) {
  return (
    <div className="stack">
      <div className="score-big"><Score value={lead.score} /><p className="muted">Outdated score out of 100, from {lead.reasons.length} issues on the current homepage.</p></div>
      <div>
        <h3>Issues found</h3>
        <ul className="list">{lead.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
      </div>
      <div>
        <h3>Contacts</h3>
        <ul className="list plain">
          {lead.emails.map((e) => <li key={e}><a href={`mailto:${e}`}>{e}</a></li>)}
          {lead.phones.map((p) => <li key={p}><a href={`tel:${p}`}>{p}</a></li>)}
        </ul>
        {lead.contactPage && <a className="text-link" href={lead.contactPage} target="_blank" rel="noreferrer">Their contact page</a>}
      </div>
      <p className="muted small">Found {ago(lead.auditedAt)} · {lead.sheetSynced ? "In Google Sheet" : "Not in Google Sheet yet"}</p>
    </div>
  );
}

interface BlueprintInfo { id: string; name: string; categories: string[]; object: string; motion: string }
interface RedesignStatus {
  templateStyle: string | null;
  claudeStyle: string | null;
  templateBlueprint: string | null;
  claudeBlueprint: string | null;
  blueprints: BlueprintInfo[];
  crawledAt: string | null;
  pages: { slug: string; label: string; url: string }[];
  job: { id: number; status: "queued" | "running" | "done" | "failed"; error: string | null; notes: string | null; mode: string; createdAt: string; startedAt: string | null; finishedAt: string | null } | null;
  claudePages: string[];
}

type View = "original" | "template" | "claude";

/** Template picker: this business type first, then everything else. */
function TemplateSelect({ value, onChange, blueprints, category, first, label }: { value: string; onChange(v: string): void; blueprints: BlueprintInfo[]; category: string; first: { value: string; label: string }[]; label: string }) {
  const mine = blueprints.filter((b) => b.categories.includes(category));
  const rest = blueprints.filter((b) => !b.categories.includes(category));
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {first.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        <optgroup label={`For ${CATEGORY_LABELS[category] ?? category}`}>{mine.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.object})</option>)}</optgroup>
        <optgroup label="Other templates">{rest.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.object})</option>)}</optgroup>
      </select>
    </label>
  );
}

function RedesignTab({ lead, onError, onChanged }: { lead: LeadRow; onError(e: unknown): void; onChanged(): void }) {
  const [st, setSt] = useState<RedesignStatus | null>(null);
  const [slug, setSlug] = useState("home");
  const [view, setView] = useState<View>("template");
  const [compare, setCompare] = useState(false);
  const [busy, setBusy] = useState("");
  const [rev, setRev] = useState(0); // reloads the preview after a new look
  const [look, setLook] = useState("auto");
  const [notes, setNotes] = useState("");
  const [mode, setMode] = useState<"revise" | "fresh">("revise");
  const [claudeTemplate, setClaudeTemplate] = useState("keep");
  const [msg, setMsg] = useState("");
  const base = `/api/leads/${encodeURIComponent(lead.id)}`;

  useEffect(() => {
    api<RedesignStatus>(`${base}/redesign`)
      .then(async (s) => (s.crawledAt ? s : api<RedesignStatus>(`${base}/crawl`, { method: "POST" })))
      .then((s) => { setSt(s); if (s.claudePages.length) setView("claude"); })
      .catch(onError);
  }, [base, onError]);

  const active = st?.job?.status === "queued" || st?.job?.status === "running";
  useEffect(() => {
    if (!active) return;
    const t = setInterval(async () => {
      const next = await api<RedesignStatus>(`${base}/redesign`).catch(() => null);
      if (next) {
        setSt(next);
        if (next.job?.status !== "queued" && next.job?.status !== "running") { onChanged(); setRev((r) => r + 1); }
        if (next.job?.status === "done") setView("claude");
      }
    }, 10_000);
    return () => clearInterval(t);
  }, [active, base, onChanged]);

  const restyle = async () => {
    setBusy("restyle"); setMsg("");
    try {
      setSt(await api<RedesignStatus>(`${base}/restyle`, { method: "POST", body: JSON.stringify({ blueprint: look === "auto" ? undefined : look }) }));
      setView("template"); setRev((r) => r + 1); onChanged();
    } catch (e) { onError(e); }
    setBusy("");
  };
  const sendToClaude = async () => {
    setBusy("claude"); setMsg("");
    const hasClaude = !!st?.claudePages.length;
    try {
      setSt(await api<RedesignStatus>(`${base}/redesign`, {
        method: "POST",
        body: JSON.stringify({ notes: notes.trim() || undefined, mode: hasClaude ? mode : "fresh", blueprint: claudeTemplate === "keep" || claudeTemplate === "auto" ? undefined : claudeTemplate }),
      }));
      setNotes(""); setMsg("Sent. Claude picks it up as soon as your Mac runner or a cloud session is running.");
      onChanged();
    } catch (e) { onError(e); }
    setBusy("");
  };
  const reread = async () => {
    setBusy("crawl");
    try { setSt(await api<RedesignStatus>(`${base}/crawl`, { method: "POST" })); setRev((r) => r + 1); onChanged(); } catch (e) { onError(e); }
    setBusy("");
  };

  if (!st) {
    return (
      <div className="stack">
        <div className="pv-frame"><iframe src={`/preview/${encodeURIComponent(lead.id)}/`} title={`Redesign of ${lead.name}`} /></div>
        <p className="muted small">Loading pages and Claude options…</p>
      </div>
    );
  }
  const hasClaude = st.claudePages.includes(slug);
  const page = st.pages.find((p) => p.slug === slug) ?? st.pages[0];
  const originalUrl = page?.url ?? lead.website;
  const redesignView: "template" | "claude" = view === "claude" && hasClaude ? "claude" : "template";
  const src = (engine: "template" | "claude") => `/preview/${encodeURIComponent(lead.id)}/${slug === "home" ? "" : encodeURIComponent(slug)}?engine=${engine}&v=${rev}`;
  const frame = (v: View) => v === "original"
    ? originalUrl.startsWith("https:")
      ? <iframe key={originalUrl} src={originalUrl} title={`Current website of ${lead.name}`} referrerPolicy="no-referrer" sandbox="allow-scripts allow-same-origin" />
      : <div className="pv-empty"><p>This site has no secure (HTTPS) address, so it can't be shown inside the portal.</p><a className="btn btn-sm" href={originalUrl} target="_blank" rel="noreferrer">Open current site<Icon d={I.external} size={14} /></a></div>
    : <iframe key={src(v)} src={src(v)} title={`${v === "claude" ? "Claude" : "Instant"} redesign of ${lead.name}`} />;
  const label = (v: View) => (v === "original" ? "Current site" : v === "claude" ? "Claude redesign" : "Instant redesign");
  const job = st.job;
  const bpName = (id: string | null) => st.blueprints.find((b) => b.id === id)?.name;
  const firstBp = (id: string | null) => (id && bpName(id) ? [{ value: "keep", label: `Keep: ${bpName(id)}` }] : []);

  return (
    <div className="stack">
      <div className="rd-bar">
        <div className="seg" role="group" aria-label="Version">
          <button className={!compare && view === "original" ? "on" : ""} onClick={() => { setCompare(false); setView("original"); }}>Current</button>
          <button className={!compare && view === "template" ? "on" : ""} onClick={() => { setCompare(false); setView("template"); }}>Instant</button>
          <button className={!compare && view === "claude" ? "on" : ""} onClick={() => { setCompare(false); setView("claude"); }} disabled={!hasClaude} title={hasClaude ? "" : "No Claude version for this page yet"}>Claude</button>
          <button className={compare ? "on" : ""} onClick={() => setCompare(!compare)}>Compare</button>
        </div>
        <select value={slug} onChange={(e) => setSlug(e.target.value)} aria-label="Page">
          {st.pages.map((p) => <option key={p.slug} value={p.slug}>{p.label}</option>)}
        </select>
        <a className="btn btn-sm" href={view === "original" && !compare ? originalUrl : src(redesignView)} target="_blank" rel="noreferrer">Full screen<Icon d={I.external} size={14} /></a>
      </div>

      {compare ? (
        <div className="compare">
          <figure><figcaption>{label("original")}</figcaption><div className="pv-frame">{frame("original")}</div></figure>
          <figure><figcaption>{label(redesignView)}</figcaption><div className="pv-frame">{frame(redesignView)}</div></figure>
        </div>
      ) : (
        <div className="pv-frame">{frame(view === "original" ? "original" : redesignView)}</div>
      )}
      {(compare || view === "original") && <p className="muted small">If the current site stays blank, it blocks being shown inside other pages. Use Full screen to open it.</p>}

      <section className="callout">
        <div>
          <h3>Instant redesign</h3>
          <p className="muted small">Built by Revamp Radar on Cloudflare in a second, from the site's own text and photos. Doesn't need your Mac.{st.templateBlueprint && ` Now: ${bpName(st.templateBlueprint)}.`}</p>
        </div>
        <TemplateSelect label="Template" value={look} onChange={setLook} blueprints={st.blueprints} category={lead.category} first={[{ value: "auto", label: "Surprise me (new look and scene)" }]} />
        <div className="row-actions">
          <button className="btn" onClick={restyle} disabled={!!busy}>{busy === "restyle" ? "Applying…" : "Apply new look"}</button>
          <a className="text-link small" href="/templates" target="_blank" rel="noreferrer">See all templates</a>
        </div>
      </section>

      <section className="callout">
        <div>
          <h3>Claude redesign</h3>
          <p className="muted small">Claude rebuilds all {st.pages.length} pages using the website-redesign skill. It runs on your Mac (<code>npm run redesign-runner</code>) or a Claude cloud session and takes about 10–15 minutes. You can leave this page while it works.</p>
          {job && (
            <div className={`job job-${job.status}`} role="status">
              {job.status === "queued" && "Queued. Waiting for your Mac runner or a cloud session to pick it up."}
              {job.status === "running" && `Claude is building the site (started ${new Date(job.startedAt + "Z").toLocaleTimeString()}).`}
              {job.status === "done" && `Claude version ready: ${st.claudePages.length} pages${st.claudeBlueprint ? `, ${bpName(st.claudeBlueprint)}` : ""}.`}
              {job.status === "failed" && `Last attempt didn't finish: ${job.error ?? "unknown error"}`}
              {job.notes && <p className="muted small job-notes">Your notes{job.mode === "revise" ? " (improving the previous version)" : ""}: “{job.notes}”</p>}
            </div>
          )}
        </div>
        {!active && (
          <>
            {st.claudePages.length > 0 && (
              <div className="seg" role="group" aria-label="What to do">
                <button className={mode === "revise" ? "on" : ""} onClick={() => setMode("revise")}>Improve this version</button>
                <button className={mode === "fresh" ? "on" : ""} onClick={() => setMode("fresh")}>Start a new design</button>
              </div>
            )}
            <label className="field">
              <span>What should Claude change? <span className="muted">(optional)</span></span>
              <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={4000}
                placeholder="For example: darker and more premium, bigger food photos at the top, make the menu easier to read, use the exploded burger scene, less animation on mobile." />
            </label>
            <TemplateSelect label="Template" value={claudeTemplate} onChange={setClaudeTemplate} blueprints={st.blueprints} category={lead.category}
              first={[...(st.claudePages.length && mode === "revise" ? firstBp(st.claudeBlueprint) : []), { value: "auto", label: "Choose automatically" }]} />
          </>
        )}
        <div className="row-actions">
          <button className="btn btn-primary" onClick={sendToClaude} disabled={!!busy || active}>
            {active ? "In progress…" : busy === "claude" ? "Sending…" : st.claudePages.length ? (mode === "revise" ? "Send changes to Claude" : "Redesign again with Claude") : "Redesign with Claude"}
          </button>
          <button className="btn" onClick={reread} disabled={!!busy || active}>{busy === "crawl" ? "Reading site…" : "Re-read website"}</button>
        </div>
        {msg && <p className="muted small" role="status">{msg}</p>}
      </section>
      <p className="muted small">
        {st.pages.length} pages read{st.crawledAt ? ` on ${new Date(st.crawledAt).toLocaleDateString()}` : ""}.
        {st.templateStyle && ` Instant look: ${st.templateStyle}.`}
        {st.claudeStyle && ` Claude look: ${st.claudeStyle}.`}
      </p>
    </div>
  );
}

function PitchTab({ lead, onStatus, onError }: { lead: LeadRow; onStatus(s: string): void; onError(e: unknown): void }) {
  const [pitch, setPitch] = useState<Pitch | null>(null);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    api<Pitch>(`/api/leads/${encodeURIComponent(lead.id)}/pitch`).then(setPitch).catch((e) => (e instanceof Unauthorized ? onError(e) : setErr((e as Error).message)));
  }, [lead.id, onError]);
  if (err) return <p className="muted">{err.includes("no email") ? "This lead has no public email address, so there's nothing to send." : err}</p>;
  if (!pitch) return <p className="muted">Writing the email…</p>;
  return (
    <div className="stack">
      <dl className="pitch-meta"><dt>To</dt><dd>{pitch.to}</dd><dt>Subject</dt><dd>{pitch.subject}</dd></dl>
      <pre className="pitch-body">{pitch.body}</pre>
      <div className="row-actions">
        <a className="btn btn-primary" href={pitch.gmailUrl} target="_blank" rel="noreferrer" onClick={() => lead.status === "new" && onStatus("contacted")}>Open draft in Gmail</a>
        <button className="btn" onClick={() => { navigator.clipboard?.writeText(`${pitch.subject}\n\n${pitch.body}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); }).catch(() => {}); }}>{copied ? "Copied" : "Copy email"}</button>
      </div>
      <p className="muted small">Nothing is sent automatically. Opening the draft marks the lead as Email sent; change it any time from the status menu.</p>
    </div>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="copy-field">
      <span className="copy-label">{label}</span>
      <div className="copy-row">
        <code>{value}</code>
        <button className="btn btn-sm" onClick={() => navigator.clipboard?.writeText(value).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); }).catch(() => {})}>
          <Icon d={done ? I.check : I.copy} size={14} />{done ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

function SheetPanel({ onClose, onError, onToast, onSynced }: { onClose(): void; onError(e: unknown): void; onToast(s: string): void; onSynced(): void }) {
  const [st, setSt] = useState<SheetState | null>(null);
  const [webhook, setWebhook] = useState("");
  const [view, setView] = useState("");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    api<SheetState>("/api/sheet").then((s) => { setSt(s); setWebhook(s.webhookUrl); setView(s.viewUrl); }).catch(onError);
  }, [onError]);

  const save = async () => {
    setBusy("save"); setErr("");
    try {
      setSt(await api<SheetState>("/api/sheet", { method: "POST", body: JSON.stringify({ webhookUrl: webhook.trim(), viewUrl: view.trim() }) }));
      onToast("Google Sheet settings saved.");
    } catch (e) {
      if (e instanceof Unauthorized) onError(e); else setErr((e as Error).message);
    }
    setBusy("");
  };

  const sync = async () => {
    setBusy("sync"); setErr("");
    try {
      const r = await api<{ synced?: number; error?: string; skipped?: string }>("/api/sync", { method: "POST" });
      if (r.error) setErr(r.error);
      else onToast(r.skipped ? "Connect the Sheet first." : `Synced ${r.synced ?? 0} ${r.synced === 1 ? "lead" : "leads"} to Google Sheets.`);
      setSt(await api<SheetState>("/api/sheet"));
      onSynced();
    } catch (e) {
      if (e instanceof Unauthorized) onError(e); else setErr((e as Error).message);
    }
    setBusy("");
  };

  const copyScript = () => navigator.clipboard?.writeText(appsScript).then(() => onToast("Script copied.")).catch(() => {});

  return (
    <Sheet title="Google Sheet" onClose={onClose}>
      <header className="drawer-head">
        <div className="drawer-title">
          <h2>Google Sheet</h2>
          <p className="muted">New leads are added as rows. When you change a status here, the same row updates in the Sheet.</p>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon d={I.close} /></button>
      </header>
      <div className="drawer-body stack">
        {!st ? <p className="muted">Loading…</p> : (
          <>
            <div className="status-card">
              <span className={`dot${st.connected ? " on" : ""}`} />
              <div>
                <b>{st.connected ? "Connected" : "Not connected yet"}</b>
                <p className="muted small">
                  {st.pending} {st.pending === 1 ? "lead" : "leads"} waiting to sync.
                  {st.last && ` Last sync ${ago(st.last.at)}: ${st.last.error ? `failed (${st.last.error})` : st.last.skipped ? "not connected" : `${st.last.synced ?? 0} rows`}.`}
                </p>
              </div>
            </div>
            <div className="row-actions">
              <button className="btn btn-primary" onClick={sync} disabled={!!busy || !st.connected}>{busy === "sync" ? "Syncing…" : "Sync now"}</button>
              {st.viewUrl && <a className="btn" href={st.viewUrl} target="_blank" rel="noreferrer">Open Sheet<Icon d={I.external} size={14} /></a>}
            </div>
            {err && <p className="form-error" role="alert">{err}</p>}

            <div className="divider" />
            <h3>{st.connected ? "Connection settings" : "Connect in 4 steps (about 3 minutes)"}</h3>
            <ol className="setup">
              <li>
                <span>Open your Google Sheet, then <b>Extensions → Apps Script</b>. Delete what's there and paste the script.</span>
                <button className="btn btn-sm" onClick={copyScript}><Icon d={I.copy} size={14} />Copy script</button>
              </li>
              <li>
                <span>In Apps Script, open <b>Project Settings → Script properties</b> and add a property named <code>SHEETS_SECRET</code> with this value:</span>
                <CopyField label="Secret" value={st.secret} />
              </li>
              <li><span>Click <b>Deploy → New deployment</b>, type <b>Web app</b>, Execute as <b>Me</b>, Who has access <b>Anyone</b>. Authorize, then copy the Web app URL.</span></li>
              <li>
                <span>Paste it here and save.</span>
                <label className="field">Web app URL<input type="url" placeholder="https://script.google.com/macros/s/…/exec" value={webhook} onChange={(e) => setWebhook(e.target.value)} /></label>
                <label className="field">Sheet address (optional, for the Open Sheet button)<input type="url" placeholder="https://docs.google.com/spreadsheets/d/…" value={view} onChange={(e) => setView(e.target.value)} /></label>
                <div><button className="btn btn-primary" onClick={save} disabled={!!busy}>{busy === "save" ? "Saving…" : "Save"}</button></div>
              </li>
            </ol>
          </>
        )}
      </div>
    </Sheet>
  );
}

function AddWebsite({ onClose, onAdded, onError }: { onClose(): void; onAdded(id: string, name: string): void; onError(e: unknown): void }) {
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("restaurant");
  const [city, setCity] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const r = await api<{ id: string; name: string }>("/api/leads/add", { method: "POST", body: JSON.stringify({ url, category, city }) });
      onAdded(r.id, r.name);
    } catch (e2) {
      if (e2 instanceof Unauthorized) onError(e2); else setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet title="Redesign any website" onClose={onClose}>
      <header className="drawer-head">
        <div className="drawer-title">
          <h2>Redesign any website</h2>
          <p className="muted">Paste an address. Revamp Radar reads all its pages and builds a redesign you can open right away.</p>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Close"><Icon d={I.close} /></button>
      </header>
      <form className="drawer-body stack" onSubmit={submit}>
        <label className="field">Website<input type="text" inputMode="url" placeholder="example.com" value={url} onChange={(e) => setUrl(e.target.value)} required autoFocus /></label>
        <label className="field">Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {Object.entries(CATEGORY_LABELS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </label>
        <label className="field">City (optional)<input type="text" value={city} onChange={(e) => setCity(e.target.value)} /></label>
        {err && <p className="form-error" role="alert">{err}</p>}
        <div className="row-actions">
          <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? "Reading website…" : "Add and redesign"}</button>
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Sheet>
  );
}
