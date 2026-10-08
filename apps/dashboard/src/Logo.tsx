export default function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={`logo${inverse ? " inverse" : ""}`}>
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <circle className="logo-disc" cx="16" cy="16" r="14" />
        <circle className="logo-line" cx="16" cy="16" r="7" fill="none" strokeWidth="2.5" />
        <circle className="logo-dot" cx="16" cy="16" r="2.5" />
        <path className="logo-line" d="M16 16 L27 9" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      Revamp Radar
    </span>
  );
}
