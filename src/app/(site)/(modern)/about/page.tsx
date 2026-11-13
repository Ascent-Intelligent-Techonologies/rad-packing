import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Droplets, PackageCheck, ShieldCheck } from "lucide-react";
import { OpenChatButton } from "@/components/OpenChatButton";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { ProductGlyph } from "@/components/Icon";
import { products, site, whyRad } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "RAD Packing Solutions L.L.C is a Sharjah-based industrial packaging company serving the UAE and GCC: wooden pallets, industrial skids, heavy-duty packaging, heat shrink wrapping and preservation packaging.",
};

const pillars = [
  {
    icon: ShieldCheck,
    title: "VCI Packaging Solutions",
    body: "Volatile corrosion inhibitor (VCI) packaging that protects bare metal from rust without greasy coatings.",
  },
  {
    icon: PackageCheck,
    title: "Vacuum Packaging",
    body: "Goods sealed in barrier material with the air drawn out, for long storage and long journeys.",
  },
  {
    icon: Droplets,
    title: "Moisture Barrier Packaging",
    body: "Barrier materials that keep humidity and dust away from machinery, equipment and components.",
  },
];

export default function About() {
  return (
    <>
      <PageHero eyebrow="About RAD Packing" title={<>Delivered in the <span className="text-gradient">exact condition</span> it left your facility.</>}>
        <p>
          {site.legalName} is a Sharjah-based industrial packaging company providing reliable and customized packaging
          solutions across {site.serviceArea}.
        </p>
      </PageHero>

      <section className="section !pb-0">
        <div className="container-x grid gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <span className="eyebrow">Who we are</span>
            <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] sm:text-5xl">
              Quality, durability and packaging made to fit.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted">
              We specialize in wooden pallets, industrial skids, heavy-duty packaging, heat shrink wrapping and
              preservation packaging. Our focus is on delivering quality, durability and customized solutions to
              protect industrial goods, machinery and materials during transportation and storage.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <ul className="grid gap-3">
              {products.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/products/category/${p.slug}`}
                    className="card card-hover group flex items-center gap-4 p-4 sm:p-5"
                  >
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand">
                      <ProductGlyph name={p.icon} size={22} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-lg font-bold leading-snug">{p.title}</span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-muted">{p.highlights.join(" · ")}</span>
                    </span>
                    <ArrowRight size={18} className="shrink-0 text-brand transition group-hover:translate-x-1" />
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container-x grid gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <span className="eyebrow">Why preservation packaging matters</span>
            <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] sm:text-5xl">
              Standard packaging covers a product. Preservation packaging protects its integrity.
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="text-lg leading-relaxed text-muted">
              Whether you are protecting machinery, equipment, components or materials, our aim is simple: deliver
              your goods in the exact condition they left your facility.
            </p>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              Without the right protection, moisture and corrosion can damage valuable goods during transit or
              long-term storage. VCI, vacuum and moisture barrier packaging keep them out.
            </p>
          </Reveal>
        </div>

        <div className="container-x mt-14 grid gap-5 md:grid-cols-3">
          {pillars.map((p, i) => (
            <Reveal key={p.title} delay={i * 90}>
              <div className="card card-hover h-full p-8">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-linear-to-br from-orange to-pink text-white">
                  <p.icon size={26} />
                </span>
                <h3 className="mt-6 font-display text-xl font-bold leading-snug">{p.title}</h3>
                <p className="mt-3 leading-relaxed text-muted">{p.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-x grid gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <Reveal>
            <span className="eyebrow">Our commitment</span>
            <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] sm:text-5xl">
              Dependable, cost-effective and customized.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted">
              We are committed to providing dependable, cost-effective and customized packaging solutions that meet our
              clients&apos; industrial and export requirements.
            </p>
          </Reveal>
          <Reveal delay={100} className="grid gap-4 sm:grid-cols-2">
            {whyRad.map((w) => (
              <div key={w.title} className="rounded-[28px] border border-line bg-surface p-7">
                <span className="block h-1.5 w-12 rounded-full bg-linear-to-r from-amber via-orange to-pink" />
                <h3 className="mt-5 font-display text-lg font-bold leading-snug">{w.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{w.body}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container-x">
          <Reveal>
            <div className="on-dark relative isolate overflow-hidden rounded-[36px] bg-ink p-8 text-white sm:p-14 lg:p-20">
              <div className="hero-scene" />
              <div className="stripe-mark" />
              <div className="relative max-w-2xl">
                <span className="eyebrow">Partner with us</span>
                <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] sm:text-5xl">
                  Need a packaging partner?
                </h2>
                <p className="mt-5 text-lg leading-relaxed text-white/70">
                  Whether you need pallets every week, a crate for one machine or a full export packing job, tell
                  us what you are moving or storing and we will recommend the right solution.
                </p>
                <div className="mt-9 flex flex-wrap gap-3">
                  <Link href="/products#quote" className="btn btn-accent">
                    Enquire <ArrowRight size={17} />
                  </Link>
                  <OpenChatButton />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
