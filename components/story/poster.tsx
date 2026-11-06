/** Statisches Bild der Box: sofort sichtbar, bis die 3D-Szene geladen ist (und als Fallback) */
export function BoxPoster({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 240" className={className} aria-hidden>
      <defs>
        <linearGradient id="poster-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff6a48" />
          <stop offset="1" stopColor="#ec4321" />
        </linearGradient>
        <linearGradient id="poster-lid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff5a36" />
          <stop offset="1" stopColor="#d93a19" />
        </linearGradient>
      </defs>
      <ellipse cx="120" cy="214" rx="74" ry="11" fill="#2b2942" opacity="0.14" />
      <rect x="52" y="104" width="136" height="100" rx="12" fill="url(#poster-body)" />
      <rect x="110" y="104" width="20" height="100" fill="#fff7f1" />
      <rect x="44" y="84" width="152" height="32" rx="9" fill="url(#poster-lid)" />
      <rect x="110" y="84" width="20" height="32" fill="#fff7f1" />
      <path
        d="M120 30 l7.9 16 17.6 2.6 -12.8 12.4 3 17.5 -15.7 -8.3 -15.7 8.3 3 -17.5 -12.8 -12.4 17.6 -2.6 z"
        fill="#ffffff"
        stroke="#ffe2a3"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
