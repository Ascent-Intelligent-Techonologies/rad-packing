import { HeroScene } from "./HeroScene";

export function PageHero({
  eyebrow,
  title,
  children,
  compact = false,
  top,
}: {
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  children?: React.ReactNode;
  /** shorter hero for inner pages (category and product pages) */
  compact?: boolean;
  /** rendered above the eyebrow, e.g. breadcrumbs */
  top?: React.ReactNode;
}) {
  return (
    <section
      className={`on-dark relative isolate overflow-hidden bg-ink text-white ${
        compact
          ? "pb-12 pt-[124px] sm:pb-16 sm:pt-[150px]"
          : "pb-16 pt-[140px] sm:pb-24 sm:pt-[170px] lg:pt-[190px]"
      }`}
    >
      <HeroScene />
      <div className="container-x relative">
        {top && <div className="mb-5">{top}</div>}
        <span className="eyebrow">{eyebrow}</span>
        <h1
          className={`mt-5 max-w-4xl font-display font-extrabold leading-[1.05] ${
            compact ? "text-[2rem] sm:text-5xl lg:text-6xl" : "text-[2.4rem] sm:text-6xl lg:text-7xl"
          }`}
        >
          {title}
        </h1>
        {children && <div className="mt-6 max-w-2xl text-lg leading-relaxed text-white/75">{children}</div>}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-surface to-transparent" />
    </section>
  );
}
