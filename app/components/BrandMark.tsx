export function BrandMark() {
  return (
    <svg
      className="brand-mark"
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="brand-plate" x1="0" y1="0" x2=".35" y2="1">
          <stop offset="0" stopColor="#232d3c" />
          <stop offset="1" stopColor="#0d1118" />
        </linearGradient>
        <linearGradient id="brand-trace" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#b45f2e" />
          <stop offset="1" stopColor="#f0b492" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="7.5" fill="url(#brand-plate)" />
      <g
        stroke="#c66e3c"
        strokeOpacity=".38"
        strokeWidth="1.1"
        strokeLinecap="round"
        fill="none"
      >
        <path d="M5.5 9.5v-4h4" />
        <path d="M26.5 22.5v4h-4" />
      </g>
      <path
        d="M6 23h7.5v-7h7.5v-7h3.75"
        fill="none"
        stroke="url(#brand-trace)"
        strokeWidth="3.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
