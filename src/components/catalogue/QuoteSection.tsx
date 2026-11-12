import { Phone } from "lucide-react";
import { LeadForm } from "@/components/LeadForm";
import { OpenChatButton } from "@/components/OpenChatButton";
import { Reveal } from "@/components/Reveal";
import { site } from "@/lib/site";

/** The dark "contact us for a quote" block shared by the catalogue pages. */
export function QuoteSection({
  heading = "Contact us for a quote.",
  intro = "Tell us what you are shipping or storing and which materials you need. Our team will recommend the right solution and get back to you shortly.",
  defaultMessage,
  defaultInterest,
}: {
  heading?: string;
  intro?: string;
  defaultMessage?: string;
  defaultInterest?: string;
}) {
  return (
    <section id="quote" className="on-dark section relative isolate scroll-mt-16 overflow-hidden bg-ink text-white">
      <div className="hero-scene" />
      <div className="stripe-mark" />
      <div className="container-x relative grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <Reveal>
          <span className="eyebrow">Request a quote</span>
          <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.08] sm:text-5xl">{heading}</h2>
          <p className="mt-5 text-lg leading-relaxed text-white/70">{intro}</p>
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
          <LeadForm variant="quote" dark defaultMessage={defaultMessage} defaultInterest={defaultInterest} />
        </Reveal>
      </div>
    </section>
  );
}
