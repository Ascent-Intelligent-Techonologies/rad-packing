import Link from "next/link";
import { ArrowUpRight, MapPin, Phone } from "lucide-react";
import { nav, products, site } from "@/lib/site";
import { Logo } from "./Logo";
import { WhatsAppIcon } from "./Icon";

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink text-white">
      <div className="stripe-mark !opacity-25" />
      <div className="container-x relative pb-28 pt-16 lg:pb-12 lg:pt-24">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Link href="/" aria-label="RAD Packing Solutions, home">
              <Logo uid="ftr" />
            </Link>
            <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-white/65">
              Sharjah-based industrial packaging company, supplying reliable and customized packaging solutions
              across {site.serviceArea}.
            </p>
            <p className="mt-6 font-display text-xl font-bold leading-snug">
              Zero Rust. <span className="text-gradient">Zero Failures.</span>
              <br />
              Lasting Integrity.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">Explore</h3>
            <ul className="mt-5 grid gap-3 text-[15px]">
              {nav.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="text-white/80 transition hover:text-amber">
                    {n.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/privacy-policy" className="text-white/80 transition hover:text-amber">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/accessibility-statement" className="text-white/80 transition hover:text-amber">
                  Accessibility Statement
                </Link>
              </li>
              <li>
                <Link href="/photo-credits" className="text-white/80 transition hover:text-amber">
                  Photo credits
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">Solutions</h3>
            <ul className="mt-5 grid gap-3 text-[15px]">
              {products.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/products?interest=${p.slug}#quote`}
                    className="text-white/80 transition hover:text-amber"
                  >
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">Talk to us</h3>
            <ul className="mt-5 grid gap-4 text-[15px]">
              {site.phones.map((p) => (
                <li key={p.tel}>
                  <a href={`tel:${p.tel}`} className="group flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-amber transition group-hover:bg-amber group-hover:text-ink">
                      <Phone size={17} />
                    </span>
                    <span>
                      <span className="block text-xs text-white/50">{p.kind}</span>
                      <span className="font-semibold">{p.label}</span>
                    </span>
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={`https://wa.me/${site.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3"
                >
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-[#25D366] transition group-hover:bg-[#25D366] group-hover:text-ink">
                    <WhatsAppIcon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="font-semibold">Chat on WhatsApp</span>
                  <ArrowUpRight size={16} className="text-white/40" />
                </a>
              </li>
              <li className="flex items-center gap-3 text-white/80">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-amber">
                  <MapPin size={17} />
                </span>
                {site.location}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-[13px] text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {site.copyrightYear} by {site.legalName}. All rights reserved.
          </p>
          <p>www.radpacking.com</p>
        </div>
      </div>
    </footer>
  );
}
