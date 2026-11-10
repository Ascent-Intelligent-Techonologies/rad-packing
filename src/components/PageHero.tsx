import { HeroScene } from "./HeroScene";

export function PageHero({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="on-dark relative isolate overflow-hidden bg-ink pb-16 pt-[140px] text-white sm:pb-24 sm:pt-[170px] lg:pt-[190px]">
      <HeroScene />
      <div className="container-x relative">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="mt-5 max-w-4xl font-display text-[2.4rem] font-extrabold leading-[1.05] sm:text-6xl lg:text-7xl">
          {title}
        </h1>
        {children && <div className="mt-6 max-w-2xl text-lg leading-relaxed text-white/75">{children}</div>}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-surface to-transparent" />
    </section>
  );
}
