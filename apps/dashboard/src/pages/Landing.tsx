import { useEffect, useRef, useState } from "react";
import Logo from "../Logo";
import { api, CATEGORY_LABELS, countryName, type PublicStats } from "../api";
import { linkProps } from "../router";

const STEPS = [
  { title: "Discover", text: "Pulls restaurants, gyms, clinics, accountants and traders with websites from OpenStreetMap across 30 US and EU cities." },
  { title: "Score", text: "Checks about 25 signs of an aging site, from missing HTTPS and no mobile layout to table layouts and old copyright years." },
  { title: "Redesign", text: "Rebuilds the site from its own content with smooth motion and 3D, on a link you can share." },
  { title: "Pitch", text: "Drafts a personal email in Gmail with the redesign link. You review it and press send." },
];

export default function Landing() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  useEffect(() => {
    api<PublicStats>("/api/public/stats").then(setStats).catch(() => {});
  }, []);
  const feature = stats?.showcase[0];

  return (
    <div className="landing">
      <header className="l-nav">
        <a {...linkProps("/")} aria-label="Revamp Radar home"><Logo /></a>
        <nav>
          <a href="#how">How it works</a>
          <a href="#showcase">Redesigns</a>
        </nav>
        <a className="button" href="#showcase">See redesigns</a>
      </header>

      <section className="l-hero">
        <div className="l-hero-copy">
          <h1>Find the websites time forgot.</h1>
          <p>
            Revamp Radar scans local businesses across the US and Europe, scores how dated their websites are,
            and builds a modern redesign from their own content, ready for you to pitch.
          </p>
          <div className="l-hero-actions">
            {feature && (
              <a className="button button-lg" href={`/preview/${encodeURIComponent(feature.id)}/`} target="_blank" rel="noreferrer">
                View a live redesign
              </a>
            )}
            <a className="button button-lg button-quiet" href="#how">How it works</a>
          </div>
          {stats && (
            <p className="l-live">
              <span className="pulse" aria-hidden="true" />
              {stats.audited} websites audited so far, {stats.qualified} ready to pitch, in {stats.cities} cities.
            </p>
          )}
        </div>
        <BeforeAfter lead={feature} />
      </section>

      <section className="l-steps" id="how">
        <h2>From an old website to a signed client</h2>
        <ol>
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="l-step-n">{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {stats && stats.showcase.length > 0 && (
        <section className="l-showcase" id="showcase">
          <div className="l-showcase-head">
            <h2>Redesigns generated this week</h2>
            <p>Each one is built automatically from the business's current site. Open any of them full screen.</p>
          </div>
          <div className="l-cards">
            {stats.showcase.slice(0, 3).map((s) => (
              <a key={s.id} className="l-card" href={`/preview/${encodeURIComponent(s.id)}/`} target="_blank" rel="noreferrer">
                <ScaledFrame src={`/preview/${encodeURIComponent(s.id)}/`} title={`Redesign of ${s.name}`} />
                <div className="l-card-meta">
                  <strong>{s.name}</strong>
                  <span>{CATEGORY_LABELS[s.category] ?? s.category} in {s.city}, {countryName(s.country)}</span>
                  <span className="l-card-score">Old site scored {s.score}/100</span>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="l-cta">
        <h2>Ten new leads every day, each with a redesign attached.</h2>
        {stats?.showcase[0] && (
          <a className="button button-lg button-inverse" href={`/preview/${encodeURIComponent(stats.showcase[0].id)}/`} target="_blank" rel="noreferrer">View a live redesign</a>
        )}
      </section>

      <footer className="l-foot">
        <Logo />
        <span>Business data © OpenStreetMap contributors. Redesigns are concepts and are not affiliated with the businesses shown.</span>
      </footer>
    </div>
  );
}

/** A full-size page rendered inside a smaller box, scaled to fit its width. */
function ScaledFrame({ src, title, interactive = false }: { src: string; title: string; interactive?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / 1440));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div className="frame" ref={box}>
      <iframe
        src={src}
        title={title}
        loading="lazy"
        tabIndex={interactive ? 0 : -1}
        style={{ transform: `scale(${scale})`, pointerEvents: interactive ? "auto" : "none" }}
      />
    </div>
  );
}

function BeforeAfter({ lead }: { lead?: PublicStats["showcase"][number] }) {
  const [pos, setPos] = useState(52);
  const wrap = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const move = (clientX: number) => {
    const r = wrap.current!.getBoundingClientRect();
    setPos(Math.min(96, Math.max(4, ((clientX - r.left) / r.width) * 100)));
  };

  const name = lead?.name ?? "Joe's Family Restaurant";
  return (
    <figure className="ba">
      <div
        className="ba-stage"
        ref={wrap}
        onPointerDown={(e) => { dragging.current = true; (e.target as Element).setPointerCapture?.(e.pointerId); move(e.clientX); }}
        onPointerMove={(e) => dragging.current && move(e.clientX)}
        onPointerUp={() => (dragging.current = false)}
      >
        <div className="ba-after">
          {lead ? <ScaledFrame src={`/preview/${encodeURIComponent(lead.id)}/`} title={`Redesign of ${name}`} /> : <div className="ba-placeholder" />}
        </div>
        <div className="ba-before" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} aria-hidden="true">
          <div className="old">
            <div className="old-top">
              <span className="old-logo">{name}</span>
              <span className="old-counter">Visitors: 004172</span>
            </div>
            <div className="old-marquee">*** Welcome to our homepage!!! *** Best viewed in Internet Explorer 6 at 800x600 ***</div>
            <table className="old-table">
              <tbody>
                <tr>
                  <td className="old-side">
                    <a>Home</a><a>About us</a><a>Menu / Services</a><a>Guestbook</a><a>Links</a><a>Contact</a>
                  </td>
                  <td>
                    <p className="old-h">Welcome!!</p>
                    <p>Thank you for visiting the homepage of {name}. This site is under construction. Please come back soon for updates.</p>
                    <div className="old-img">photo.jpg</div>
                    <p className="old-small">Copyright © 2009. Last updated 03/14/2011.</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <button
          className="ba-handle"
          style={{ left: `${pos}%` }}
          aria-label="Drag to compare the old site with the redesign"
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setPos((p) => Math.max(4, p - 4));
            if (e.key === "ArrowRight") setPos((p) => Math.min(96, p + 4));
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l-6 6l6 6M15 6l6 6l-6 6" /></svg>
        </button>
      </div>
      <figcaption>
        <span>Before: the kind of site we find</span>
        <span>After: {lead ? `the generated redesign for ${name}` : "a generated redesign"}</span>
      </figcaption>
    </figure>
  );
}
