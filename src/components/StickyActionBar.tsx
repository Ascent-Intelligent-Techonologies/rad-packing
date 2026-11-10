import Link from "next/link";
import { FileText, Phone } from "lucide-react";
import { site } from "@/lib/site";
import { WhatsAppIcon } from "./Icon";

/** Thumb-reach Call / WhatsApp / Quote bar, mobile only. */
export function StickyActionBar() {
  const base =
    "flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-2.5 text-[11.5px] font-bold tracking-wide transition active:scale-95";
  return (
    <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/90 px-3 pt-2.5 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-md gap-2">
        <a href={`tel:${site.phones[0].tel}`} className={`${base} bg-brand-50 text-brand`}>
          <Phone size={20} /> Call
        </a>
        <a
          href={`https://wa.me/${site.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${base} bg-[#e7f9ee] text-[#128c4a]`}
        >
          <WhatsAppIcon className="h-5 w-5" /> WhatsApp
        </a>
        <Link href="/products#quote" className={`${base} bg-linear-to-br from-orange to-pink text-white`}>
          <FileText size={20} /> Get a Quote
        </Link>
      </div>
    </div>
  );
}
