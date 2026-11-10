import { Plus } from "lucide-react";
import { faqs } from "@/lib/site";

/** Native <details> accordion: accessible, works without JS. Emits FAQPage JSON-LD. */
export function FAQ() {
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <div className="divide-y divide-line rounded-[28px] border border-line bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      {faqs.map((f) => (
        <details key={f.q} className="group px-6 py-5 sm:px-8 sm:py-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-[17px] font-semibold leading-snug [&::-webkit-details-marker]:hidden">
            {f.q}
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-brand transition group-open:rotate-45 group-open:bg-brand group-open:text-white">
              <Plus size={18} />
            </span>
          </summary>
          <p className="mt-4 max-w-3xl leading-relaxed text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
