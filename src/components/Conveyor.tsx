/** Decorative packing-line animation: crates travel through a wrap gate. */
export function Conveyor() {
  return (
    <div aria-hidden="true" className="relative mt-14 h-28 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
      <div className="absolute inset-x-0 bottom-6 h-3 bg-linear-to-b from-white/25 to-white/5" />
      <div className="absolute inset-x-0 bottom-3 h-3 bg-white/10" />
      {/* wrap gate */}
      <div className="absolute inset-y-3 left-1/2 w-10 -translate-x-1/2 rounded-full bg-linear-to-b from-orange/70 via-pink/60 to-orange/70 opacity-80 blur-[1px]" />
      <div className="absolute inset-y-0 left-1/2 w-24 -translate-x-1/2 bg-linear-to-r from-transparent via-white/10 to-transparent" />
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="absolute bottom-[34px] h-12 w-16 rounded-md border border-white/30"
          style={{
            left: "-80px",
            animation: `crate-run 14s linear ${i * -2.8}s infinite`,
            background: "linear-gradient(135deg, rgba(255,176,46,.55), rgba(255,122,26,.35))",
          }}
        >
          <span className="absolute inset-x-0 top-1/2 h-px bg-white/40" />
          <span className="absolute inset-y-0 left-1/2 w-px bg-white/40" />
        </span>
      ))}
      <style>{`@keyframes crate-run{0%{transform:translateX(0);filter:none}48%{filter:none}52%{filter:drop-shadow(0 0 10px rgba(180,200,255,.9)) saturate(.4) brightness(1.5)}100%{transform:translateX(calc(100vw + 160px));filter:drop-shadow(0 0 10px rgba(180,200,255,.9)) saturate(.4) brightness(1.5)}}`}</style>
    </div>
  );
}
