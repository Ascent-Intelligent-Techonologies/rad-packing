import type { Metadata } from "next";
import { OpenChatButton } from "@/components/OpenChatButton";
import { LeadForm } from "@/components/LeadForm";
import { PageHero } from "@/components/PageHero";
import { ProductExplorer } from "@/components/ProductExplorer";
import { Reveal } from "@/components/Reveal";
import { site } from "@/lib/site";
import { Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "Products & Solutions",
  description:
    "Preservation packing, nail-less collapsible boxes, wooden and traditional packaging, and turnkey industrial packing contracting from RAD Packing Solutions.",
};

export default function Products() {
  return (
    <>
      <PageHero eyebrow="Our products & solutions" title={<>Industrial-grade protection, <span className="text-gradient">fit for purpose.</span></>}>
        <p>
          From high-barrier films and corrosion inhibitors to moisture-control systems and customized protective
          packaging, we deliver solutions that safeguard product integrity throughout storage, handling and
          transportation.
        </p>
      </PageHero>

      <section className="section !pt-8">
        <div className="container-x">
          <ProductExplorer />
        </div>
      </section>

      <section id="quote" className="on-dark section relative isolate scroll-mt-16 overflow-hidden bg-ink text-white">
        <div className="hero-scene" />
        <div className="stripe-mark" />
        <div className="container-x relative grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <Reveal>
            <span className="eyebrow">Request a quote</span>
            <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] sm:text-5xl">
              Contact us for a quote.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-white/70">
              Tell us what you are shipping or storing and which materials you need. Our team will recommend the right
              solution and get back to you shortly.
            </p>
            <div className="mt-8 grid gap-3">
              <a href={`tel:${site.phones[0].tel}`} className="btn btn-glass !justify-start">
                <Phone size={17} /> {site.phones[0].label}
              </a>
              <a href={`tel:${site.phones[1].tel}`} className="btn btn-glass !justify-start">
                <Phone size={17} /> {site.phones[1].label}
              </a>
              <OpenChatButton prompt="I need a tailored solution" className="btn btn-glass !justify-start" />
            </div>
          </Reveal>
          <Reveal delay={100}>
            <LeadForm variant="quote" dark />
          </Reveal>
        </div>
      </section>
    </>
  );
}
