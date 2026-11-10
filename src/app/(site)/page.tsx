import Link from "next/link";
import { ArrowRight, ArrowUpRight, MapPin, Phone, Sparkles } from "lucide-react";
import { Conveyor } from "@/components/Conveyor";
import { CountUp } from "@/components/CountUp";
import { FAQ } from "@/components/FAQ";
import { HeroScene } from "@/components/HeroScene";
import { ProductGlyph } from "@/components/Icon";
import { IndustryExplorer } from "@/components/IndustryExplorer";
import { LeadForm } from "@/components/LeadForm";
import { OpenChatButton } from "@/components/OpenChatButton";
import { Reveal } from "@/components/Reveal";
import { process, products, services, site, whyRad } from "@/lib/site";

const marquee = [
  "VCI Films",
  "High-Barrier Foils",
  "Desiccants",
  "Vacuum-Sealed Crating",
  "ISPM 15 Compliant",
  "Nail-Less Collapsible Boxes",
  "3D Liners",
  "Export Crates",
  "ESD Shielding",
  "Onsite & Mobile Packing",
];

export default function Home() {
  return (
    <>
      {/* ───────────── HERO ───────────── */}
      <section className="on-dark relative isolate flex min-h-[100svh] items-end overflow-hidden bg-ink pb-14 pt-32 text-white sm:pb-20 lg:items-center lg:pb-24 lg:pt-44">
        <HeroScene />
        <div className="container-x relative grid items-end gap-12 lg:grid-cols-[1.25fr_0.75fr]">
          <div>
            <span className="eyebrow">Industrial Preservation Solutions · Sharjah, UAE</span>
            <h1 className="mt-6 font-display text-[2.7rem] font-extrabold leading-[1.02] sm:text-6xl lg:text-[5.2rem]">
              Maximum Protection.
              <br />
              <span className="text-gradient">Zero Rust.</span> Zero Failures.
            </h1>
            <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-white/75 sm:text-lg">
              RAD Packing Solutions protects valuable machinery, equipment and sensitive components from corrosion,
              moisture and environmental damage, from the factory floor to the far side of the ocean.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/products" className="btn btn-accent !min-h-[54px] !px-8 text-base">
                Explore Our Products <ArrowRight size={18} />
              </Link>
              <Link href="/products#quote" className="btn btn-glass !min-h-[54px] !px-8 text-base">
                Get a Quote
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-white/70">
              <a href={`tel:${site.phones[0].tel}`} className="flex items-center gap-2 font-semibold text-white hover:text-amber">
                <Phone size={16} className="text-amber" /> {site.phones[0].label}
              </a>
              <a href={`tel:${site.phones[1].tel}`} className="flex items-center gap-2 font-semibold text-white hover:text-amber">
                <Phone size={16} className="text-amber" /> {site.phones[1].label}
              </a>
              <span className="flex items-center gap-2">
                <MapPin size={16} className="text-amber" /> {site.location}
              </span>
            </div>
          </div>

          {/* AI teaser card */}
          <div className="hidden lg:block">
            <div className="relative rounded-[28px] border border-white/15 bg-white/[0.07] p-7 shadow-2xl backdrop-blur-xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-amber">
                <Sparkles size={14} /> RAD Smart Chat
              </span>
              <p className="mt-5 font-display text-2xl font-bold leading-snug">
                Not sure what your equipment needs?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                Ask our smart assistant. It knows our full range and can connect you with the team.
              </p>
              <div className="mt-6 grid gap-2.5">
                {[
                  "How do I protect machinery for sea shipping?",
                  "Do you pack on-site at our facility?",
                  "I need a quote for export crates",
                ].map((q) => (
                  <OpenChatButton
                    key={q}
                    prompt={q}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/12 bg-white/[0.05] px-4 py-3 text-left text-sm font-medium transition hover:bg-white/12"
                  >
                    {q} <ArrowUpRight size={16} className="shrink-0 text-amber" />
                  </OpenChatButton>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── MARQUEE ───────────── */}
      <div className="marquee overflow-hidden border-y border-line bg-white py-5" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map((k) => (
            <ul key={k} className="flex shrink-0 items-center">
              {marquee.map((m) => (
                <li key={m + k} className="flex items-center whitespace-nowrap px-6 font-display text-lg font-bold text-text/80">
                  {m}
                  <span className="ml-12 h-2 w-2 rotate-45 bg-linear-to-br from-orange to-pink" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      {/* ───────────── WHO WE ARE ───────────── */}
      <section className="section">
        <div className="container-x grid gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <Reveal>
            <span className="eyebrow">Who we are</span>
            <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] sm:text-5xl">
              Shielding your assets.
              <br />
              <span className="text-brand">Extending their lifespan.</span>
            </h2>
            <p className="mt-7 text-lg leading-relaxed text-muted">
              RAD Packing Solutions is a specialist in industrial packaging and preservation solutions, providing
              reliable, high-performance protection for valuable assets, machinery, equipment and sensitive components.
              We deliver tailored solutions designed to prevent corrosion, moisture damage and environmental
              deterioration, ensuring asset integrity throughout storage, handling and transportation.
            </p>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              In an ever-moving global marketplace, the value of a product goes beyond its manufacturing. How it is
              stored, handled, transported and preserved determines how well it performs when it reaches its destination.
            </p>
            <Link href="/about" className="btn btn-outline mt-9">
              Discover more about us <ArrowRight size={17} />
            </Link>
          </Reveal>

          <Reveal delay={120} className="grid grid-cols-2 gap-4 self-center">
            <div className="card col-span-2 bg-linear-to-br from-brand to-[#0d1190] p-8 text-white !border-0">
              <p className="font-display text-7xl font-extrabold leading-none sm:text-8xl">
                <CountUp to={25} suffix="+" />
              </p>
              <p className="mt-4 text-lg font-semibold">Years of proven expertise</p>
              <p className="mt-1 text-sm text-white/70">in industrial packaging &amp; preservation</p>
            </div>
            <div className="card p-6">
              <p className="font-display text-5xl font-extrabold text-brand">
                <CountUp to={5} />
              </p>
              <p className="mt-2 text-sm font-semibold text-muted">Industries supported</p>
            </div>
            <div className="card p-6">
              <p className="font-display text-5xl font-extrabold text-brand">
                <CountUp to={5} />
              </p>
              <p className="mt-2 text-sm font-semibold text-muted">Product &amp; solution lines</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────────── WHAT WE DO ───────────── */}
      <section className="section bg-white">
        <div className="container-x">
          <Reveal className="max-w-2xl">
            <span className="eyebrow">What we do</span>
            <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] sm:text-5xl">
              Protection engineered around your asset.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s, i) => (
              <Reveal key={s.title} delay={i * 80}>
                <article className="card card-hover group flex h-full flex-col bg-surface p-7">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-brand shadow-sm transition group-hover:bg-linear-to-br group-hover:from-orange group-hover:to-pink group-hover:text-white">
                    <ProductGlyph name={s.icon} size={26} />
                  </span>
                  <h3 className="mt-6 font-display text-xl font-bold uppercase leading-snug tracking-tight">{s.title}</h3>
                  <p className="mt-3 flex-1 text-[15px] leading-relaxed text-muted">{s.body}</p>
                  <Link
                    href={`/products?interest=${s.interest}#quote`}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand"
                  >
                    Enquire
                    <ArrowRight size={16} className="transition group-hover:translate-x-1" />
                  </Link>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── PROCESS / MACHINERY ───────────── */}
      <section className="on-dark section relative isolate overflow-hidden bg-ink text-white">
        <HeroScene />
        <div className="container-x relative">
          <Reveal className="max-w-2xl">
            <span className="eyebrow">Turnkey packing</span>
            <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] sm:text-5xl">
              From site assessment to <span className="text-gradient">export-ready</span>.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-white/70">
              One accountable partner for the whole job: planning, materials, on-site packing, preservation, crating
              and export preparation.
            </p>
          </Reveal>

          <ol className="mt-14 grid gap-4 md:grid-cols-5">
            {process.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 90}>
                <div className="relative h-full rounded-3xl border border-white/12 bg-white/[0.06] p-6 backdrop-blur-md">
                  <span className="font-display text-5xl font-extrabold text-gradient">0{i + 1}</span>
                  <h3 className="mt-4 font-display text-xl font-bold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
          <Conveyor />
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/products#turnkey" className="btn btn-accent">
              See turnkey contracting <ArrowRight size={17} />
            </Link>
            <OpenChatButton prompt="Tell me about onsite packing" className="btn btn-glass">
              <Sparkles size={17} /> Tell me about onsite packing
            </OpenChatButton>
          </div>
        </div>
      </section>

      {/* ───────────── INDUSTRIES ───────────── */}
      <section className="section">
        <div className="container-x">
          <Reveal className="max-w-2xl">
            <span className="eyebrow">Industries we support</span>
            <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] sm:text-5xl">
              From jet engines to life-saving drugs.
            </h2>
          </Reveal>
          <Reveal className="mt-12" delay={100}>
            <IndustryExplorer />
          </Reveal>
        </div>
      </section>

      {/* ───────────── WHY RAD ───────────── */}
      <section className="section bg-white">
        <div className="container-x">
          <Reveal className="max-w-2xl">
            <span className="eyebrow">Why RAD</span>
            <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] sm:text-5xl">
              Lasting integrity, delivered.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {whyRad.map((w, i) => (
              <Reveal key={w.title} delay={i * 80}>
                <div className="h-full rounded-[28px] border border-line bg-surface p-7">
                  <span className="block h-1.5 w-12 rounded-full bg-linear-to-r from-amber via-orange to-pink" />
                  <h3 className="mt-6 font-display text-xl font-bold leading-snug">{w.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted">{w.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── PRODUCTS PREVIEW ───────────── */}
      <section className="section">
        <div className="container-x">
          <Reveal className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <span className="eyebrow">Products &amp; solutions</span>
              <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] sm:text-5xl">
                Everything to protect and ship.
              </h2>
            </div>
            <Link href="/products" className="btn btn-outline shrink-0">
              View all products <ArrowRight size={17} />
            </Link>
          </Reveal>

          <div className="-mx-5 mt-12 flex snap-x gap-5 overflow-x-auto px-5 pb-4 [scrollbar-width:none] sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
            {products.map((p) => (
              <Link
                key={p.slug}
                href={`/products#${p.slug}`}
                className="card card-hover group flex w-[280px] shrink-0 snap-start flex-col p-6 lg:w-auto"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand transition group-hover:bg-linear-to-br group-hover:from-orange group-hover:to-pink group-hover:text-white">
                  <ProductGlyph name={p.icon} size={24} />
                </span>
                <h3 className="mt-5 font-display text-lg font-bold leading-snug">{p.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{p.short}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand">
                  Learn more <ArrowRight size={15} className="transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── FAQ ───────────── */}
      <section className="section bg-white">
        <div className="container-x grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <Reveal>
            <span className="eyebrow">FAQs</span>
            <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] sm:text-5xl">Quick answers.</h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              Can&apos;t find what you need? Our smart assistant answers instantly, and our team is a call away.
            </p>
            <OpenChatButton className="btn btn-brand mt-8">
              <Sparkles size={17} /> Ask the smart assistant
            </OpenChatButton>
          </Reveal>
          <Reveal delay={100}>
            <FAQ />
          </Reveal>
        </div>
      </section>

      {/* ───────────── GET IN TOUCH ───────────── */}
      <section id="contact" className="on-dark section relative isolate scroll-mt-20 overflow-hidden bg-ink text-white">
        <HeroScene />
        <div className="container-x relative grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <Reveal>
            <span className="eyebrow">We are here to help</span>
            <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] sm:text-5xl">
              Get in touch with us.
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-white/70">
              For inquiries about our packaging materials, or to discuss your packaging needs, don&apos;t hesitate to
              contact us.
            </p>
            <ul className="mt-10 grid gap-4">
              {site.phones.map((p) => (
                <li key={p.tel}>
                  <a href={`tel:${p.tel}`} className="group flex items-center gap-4">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-amber transition group-hover:bg-amber group-hover:text-ink">
                      <Phone size={20} />
                    </span>
                    <span>
                      <span className="block text-xs uppercase tracking-wider text-white/50">{p.kind}</span>
                      <span className="font-display text-xl font-bold">{p.label}</span>
                    </span>
                  </a>
                </li>
              ))}
              <li className="flex items-center gap-4">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-white/10 text-amber">
                  <MapPin size={20} />
                </span>
                <span>
                  <span className="block text-xs uppercase tracking-wider text-white/50">Location</span>
                  <span className="font-display text-xl font-bold">{site.location}</span>
                </span>
              </li>
            </ul>
          </Reveal>
          <Reveal delay={120}>
            <LeadForm variant="contact" dark />
          </Reveal>
        </div>
      </section>
    </>
  );
}
