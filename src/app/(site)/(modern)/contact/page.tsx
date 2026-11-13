import type { Metadata } from "next";
import { Clock, MapPin, Phone } from "lucide-react";
import { LeadForm } from "@/components/LeadForm";
import { WhatsAppIcon } from "@/components/Icon";
import { OpenChatButton } from "@/components/OpenChatButton";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with RAD Packing Solutions in Sharjah, UAE. Call, WhatsApp, chat with our smart assistant or send an enquiry.",
};

export default function Contact() {
  return (
    <>
      <PageHero eyebrow="Contact us" title={<>Drop us <span className="text-gradient">a line.</span></>}>
        <p>
          Get in touch with RAD Packing today for all your packaging material needs. Our team is ready to help you find
          the perfect solution and ensure your products are well protected.
        </p>
      </PageHero>

      <section className="section !pt-6">
        <div className="container-x grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <Reveal className="grid content-start gap-4">
            {site.phones.map((p) => (
              <a key={p.tel} href={`tel:${p.tel}`} className="card card-hover group flex items-center gap-5 p-6">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand transition group-hover:bg-brand group-hover:text-white">
                  <Phone size={24} />
                </span>
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-muted">{p.kind}</span>
                  <span className="font-display text-xl font-bold">{p.label}</span>
                </span>
              </a>
            ))}
            <a
              href={`https://wa.me/${site.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="card card-hover group flex items-center gap-5 p-6"
            >
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#e7f9ee] text-[#128c4a]">
                <WhatsAppIcon className="h-6 w-6" />
              </span>
              <span>
                <span className="block text-xs font-semibold uppercase tracking-wider text-muted">WhatsApp</span>
                <span className="font-display text-xl font-bold">Chat with our team</span>
              </span>
            </a>
            <div className="card flex items-center gap-5 p-6">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand">
                <MapPin size={24} />
              </span>
              <span>
                <span className="block text-xs font-semibold uppercase tracking-wider text-muted">Location</span>
                <span className="font-display text-xl font-bold">{site.location}</span>
              </span>
            </div>
            <div className="card flex items-center gap-5 bg-linear-to-br from-brand to-[#0d1190] p-6 text-white !border-0">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15">
                <Clock size={24} />
              </span>
              <span>
                <span className="block font-display text-lg font-bold">Prefer instant answers?</span>
                <OpenChatButton className="mt-1 text-sm font-semibold underline underline-offset-4">
                  Chat with our assistant
                </OpenChatButton>
              </span>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <LeadForm variant="contact" />
          </Reveal>
        </div>
      </section>
    </>
  );
}
