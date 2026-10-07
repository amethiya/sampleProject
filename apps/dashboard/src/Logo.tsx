export default function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={`logo${inverse ? " inverse" : ""}`}>
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="14" className="logo-disc" />
        <circle cx="16" cy="16" r="7" fill="none" stroke="#fff" strokeWidth="2.5" />
        <circle cx="16" cy="16" r="2.5" fill="#fff" />
        <path d="M16 16 L27 9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      Revamp Radar
    </span>
  );
}
