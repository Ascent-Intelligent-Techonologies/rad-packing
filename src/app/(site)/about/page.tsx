import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Droplets, Ruler, ShieldCheck } from "lucide-react";
import { OpenChatButton } from "@/components/OpenChatButton";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { industries, whyRad } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "RAD Packing Solutions engineers industrial-grade, high-barrier preservation packaging that stops degradation before it starts.",
};

const pillars = [
  {
    icon: Droplets,
    title: "Advanced Barrier Foils & Films",
    body: "Moisture-vapor and gas-tight shielding that locks out humidity and contaminants.",
  },
  {
    icon: ShieldCheck,
    title: "VCI (Volatile Corrosion Inhibitor) Technology",
    body: "Active molecular protection that shields bare metals from rust without greasy coatings.",
  },
  {
    icon: Ruler,
    title: "Custom Engineered Crates & 3D Liners",
    body: "Tailor-fitted packaging built to absorb shock, prevent movement and withstand extreme supply-chain conditions.",
  },
];

export default function About() {
  return (
    <>
      <PageHero eyebrow="About RAD Packing" title={<>Delivered in the <span className="text-gradient">exact condition</span> it left your facility.</>}>
        <p>
          At RAD Packaging Solutions we specialize in industrial-grade and high-barrier preservation packaging engineered
          to stop degradation before it starts.
        </p>
      </PageHero>

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
              Whether you are safeguarding sensitive electronics, critical machinery, aerospace components or perishable
              goods, our mission is simple: deliver your product in the exact condition it left your facility.
            </p>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              Without the right environmental controls, moisture, oxygen and static discharge can destroy high-value
              assets during transit or long-term storage. We bridge the gap between heavy-duty logistics and scientific
              preservation.
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
            <span className="eyebrow">Our promise</span>
            <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] sm:text-5xl">
              From turbines to microelectronics, we remove the risk.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted">
              When standard packaging isn&apos;t enough to withstand time, humidity and volatile transit conditions, our
              scientific shielding solutions ensure your products arrive, or remain in storage, in exact factory
              condition. From massive heavy industrial turbines to static-sensitive microelectronics, we eliminate the
              risks of corrosion, moisture degradation and environmental decay.
            </p>
            <ul className="mt-8 flex flex-wrap gap-2">
              {industries.map((i) => (
                <li key={i.id} className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold">
                  {i.short.split(" · ")[0].split(" & ")[0]}
                </li>
              ))}
            </ul>
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
                  Need a preservation expert to support you?
                </h2>
                <p className="mt-5 text-lg leading-relaxed text-white/70">
                  Whether you are shipping sensitive electronic components across the globe or mothballing heavy
                  machinery for multi-year storage, RAD Packing Solutions turns environmental vulnerability into total
                  logistical certainty.
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
