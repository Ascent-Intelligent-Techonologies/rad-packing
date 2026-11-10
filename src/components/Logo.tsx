/**
 * RAD mark: an "R" drawn as concentric stripes in the brand's amber → pink
 * gradient, echoing the logo on radpacking.com.
 */
export function LogoMark({ size = 44, uid = "a" }: { size?: number; uid?: string }) {
  const path = "M17 54V10h19a14 14 0 0 1 0 28H17M34 38l15 16";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`rad-g-${uid}`} x1="8" y1="8" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFC24A" />
          <stop offset="0.5" stopColor="#FF7A1A" />
          <stop offset="1" stopColor="#FF3D7F" />
        </linearGradient>
        <mask id={`rad-m-${uid}`} maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
          <path d={path} stroke="#fff" strokeWidth="13" strokeLinejoin="round" />
          <path d={path} stroke="#000" strokeWidth="8.5" strokeLinejoin="round" />
          <path d={path} stroke="#fff" strokeWidth="4" strokeLinejoin="round" />
        </mask>
      </defs>
      <rect width="64" height="64" fill={`url(#rad-g-${uid})`} mask={`url(#rad-m-${uid})`} />
    </svg>
  );
}

export function Logo({
  uid = "a",
  tone = "light",
}: {
  uid?: string;
  tone?: "light" | "dark";
}) {
  const main = tone === "light" ? "text-white" : "text-text";
  const sub = tone === "light" ? "text-white/65" : "text-muted";
  return (
    <span className="flex items-center gap-3">
      <LogoMark uid={uid} />
      <span className="flex flex-col leading-none">
        <span className={`font-display text-[15px] font-extrabold tracking-[0.06em] sm:text-base ${main}`}>
          RAD PACKING
        </span>
        <span className={`mt-1 text-[9.5px] font-semibold uppercase tracking-[0.22em] sm:text-[10px] ${sub}`}>
          Industrial Preservation
        </span>
      </span>
    </span>
  );
}
