"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, MapPin, Menu, Phone, X } from "lucide-react";
import { nav, site } from "@/lib/site";
import { Logo } from "./Logo";
import { WhatsAppIcon } from "./Icon";

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [openFor, setOpenFor] = useState<string | null>(null);
  // the sheet is open only for the page it was opened on, so navigating closes it
  const open = openFor === pathname;
  const setOpen = (v: boolean | ((c: boolean) => boolean)) =>
    setOpenFor((cur) => ((typeof v === "function" ? v(cur === pathname) : v) ? pathname : null));

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  // lock body scroll while the sheet is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <header className={`fixed inset-x-0 top-0 ${open ? "z-[56]" : "z-50"}`}>
        {/* Top info bar: phone numbers + location, like the current site header */}
        <div
          className={`hidden border-b border-white/10 bg-ink/70 text-[13px] text-white/80 backdrop-blur-md transition-all duration-300 lg:block ${
            scrolled ? "h-0 overflow-hidden border-transparent opacity-0" : "h-10 opacity-100"
          }`}
        >
          <div className="container-x flex h-10 items-center justify-between">
            <span className="flex items-center gap-2">
              <MapPin size={14} className="text-amber" /> {site.location}
            </span>
            <span className="flex items-center gap-6">
              {site.phones.map((p) => (
                <a key={p.tel} href={`tel:${p.tel}`} className="flex items-center gap-2 font-semibold text-white transition hover:text-amber">
                  <Phone size={14} className="text-amber" /> {p.label}
                </a>
              ))}
            </span>
          </div>
        </div>

        <div
          className={`transition-all duration-300 ${
            scrolled
              ? "border-b border-line bg-white/80 shadow-[0_8px_30px_-18px_rgba(11,14,51,0.35)] backdrop-blur-xl"
              : "bg-transparent"
          }`}
        >
          <div className="container-x flex h-[68px] items-center justify-between gap-6 lg:h-[76px]">
            <Link href="/" aria-label="RAD Packing Solutions, home" className="shrink-0">
              <Logo uid="hdr" tone={scrolled ? "dark" : "light"} />
            </Link>

            <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
              {nav.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={isActive(n.href) ? "page" : undefined}
                  className={`relative whitespace-nowrap rounded-full px-4 py-2 text-[15px] font-semibold transition ${
                    scrolled ? "text-text hover:bg-brand-50" : "text-white/90 hover:bg-white/10"
                  } ${isActive(n.href) ? (scrolled ? "bg-brand-50 text-brand" : "bg-white/12 text-white") : ""}`}
                >
                  {n.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${site.phones[0].tel}`}
                className={`btn hidden !min-h-[44px] !px-5 xl:inline-flex ${scrolled ? "btn-outline" : "btn-glass"}`}
              >
                <Phone size={16} /> Call now
              </a>
              <Link href="/products#quote" className="btn btn-accent hidden !min-h-[44px] !px-5 sm:inline-flex">
                Get a Quote <ArrowRight size={16} />
              </Link>
              <button
                type="button"
                aria-label={open ? "Close menu" : "Open menu"}
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className={`grid h-11 w-11 place-items-center rounded-full border transition lg:hidden ${
                  scrolled ? "border-line text-text" : "border-white/25 text-white"
                }`}
              >
                {open ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile sheet */}
      <div
        className={`fixed inset-0 z-[55] bg-ink text-white transition-all duration-300 lg:hidden ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
        aria-hidden={!open}
      >
        <div className="hero-scene !opacity-60" />
        <div className="relative flex h-full flex-col px-6 pb-8 pt-28">
          <nav aria-label="Mobile" className="flex flex-col">
            {nav.map((n, i) => (
              <Link
                key={n.href}
                href={n.href}
                tabIndex={open ? 0 : -1}
                onClick={() => setOpen(false)}
                style={{ transitionDelay: open ? `${80 + i * 50}ms` : "0ms" }}
                className={`flex items-center justify-between border-b border-white/10 py-5 font-display text-[28px] font-bold transition-all duration-500 ${
                  open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                } ${isActive(n.href) ? "text-amber" : ""}`}
              >
                {n.label} <ArrowRight size={22} className="text-white/40" />
              </Link>
            ))}
          </nav>

          <div className="mt-auto grid gap-3">
            <Link href="/products#quote" tabIndex={open ? 0 : -1} className="btn btn-accent w-full">
              Get a Quote <ArrowRight size={18} />
            </Link>
            <div className="grid grid-cols-2 gap-3">
              <a href={`tel:${site.phones[0].tel}`} tabIndex={open ? 0 : -1} className="btn btn-glass">
                <Phone size={17} /> Office
              </a>
              <a href={`tel:${site.phones[1].tel}`} tabIndex={open ? 0 : -1} className="btn btn-glass">
                <Phone size={17} /> Mobile
              </a>
            </div>
            <a
              href={`https://wa.me/${site.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={open ? 0 : -1}
              className="btn w-full bg-[#25D366] text-[#05301a]"
            >
              <WhatsAppIcon className="h-5 w-5" /> WhatsApp us
            </a>
            <p className="mt-2 flex items-center justify-center gap-2 text-sm text-white/60">
              <MapPin size={14} /> {site.location}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
