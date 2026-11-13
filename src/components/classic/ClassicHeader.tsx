"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, Phone, X } from "lucide-react";
import { isPlainClick } from "@/lib/catalogue/shared";
import { classicPhones } from "./content";

/** The menu as RAD's original site words it. */
const links = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Products & Solutions", href: "/products" },
  { label: "Contact", href: "/contact" },
] as const;

/**
 * Header of the home page, rebuilt from RAD's original site: a tall navy band with the logo and
 * wordmark, both phone numbers and an underlined menu. As on the original, the tall band slides
 * out of the way once the visitor has scrolled some way down and comes back when they scroll up
 * again. Below 1024px it folds into a compact bar with a menu button, which always stays put.
 */

/** How far the visitor scrolls one way before the tall header hides or returns, as on the original. */
const HIDE_AFTER = 400;
const SHOW_AFTER = 450;

export function ClassicHeader() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    let turnedAt = last; // where the visitor last changed direction
    let down = true;
    const onScroll = () => {
      const y = window.scrollY;
      if (y === last) return;
      const nowDown = y > last;
      if (nowDown !== down) {
        down = nowDown;
        turnedAt = last;
      }
      last = y;
      if (down && y - turnedAt >= HIDE_AFTER) setHidden(true);
      else if (!down && (turnedAt - y >= SHOW_AFTER || y <= 0)) setHidden(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  // this header only exists on the home page, so "Home" is a link to the page already open
  const toTop = (e: React.MouseEvent) => {
    if (isPlainClick(e)) window.scrollTo({ top: 0 });
  };

  return (
    <header
      // keyboard users tabbing into a hidden header get it back
      onFocusCapture={() => setHidden(false)}
      className={`sticky top-0 z-50 bg-[var(--c-navy)] text-white lg:transition-transform lg:duration-300 ${
        hidden ? "lg:-translate-y-full" : ""
      }`}
    >
      {/* ── desktop ── */}
      <div className="relative mx-auto hidden h-[209px] max-w-[1920px] lg:block">
        <div className="flex items-start pl-[clamp(24px,6.6vw,127px)] pt-[26px]">
          <Link href="/" onClick={toTop} aria-label="RAD Packing Solutions, home" className="flex shrink-0 items-start">
            <Image src="/home/logo.png" alt="" width={135} height={106} priority className="h-[106px] w-[135px]" />
            <span className="mt-[52px] block whitespace-nowrap">
              <span className="cl-wordmark block text-[20px] font-bold leading-[26px] tracking-[0.2px] text-[#f6f6f6]">
                RAD PACKING SOLUTIONS
              </span>
              <span className="cl-wordmark -mt-[3px] block text-[14px] leading-[21px] tracking-[2.45px]">
                Industrial Preservation Solutions
              </span>
            </span>
          </Link>

          <p className="ml-[clamp(24px,11.4vw,219px)] mt-[31px] flex h-[38px] shrink-0 items-center whitespace-nowrap text-[16px] text-[var(--c-paper)]">
            <span className="mr-[6px] grid h-[38px] w-[32px] place-items-center text-[#1d67cd]" aria-hidden="true">
              <Phone size={25} strokeWidth={1.5} />
            </span>
            {classicPhones.map((p, i) => (
              <span key={p.tel} className="cl-bold contents">
                {i > 0 && <span className="px-[4px]">|</span>}
                <a href={`tel:${p.tel}`} className="hover:underline">
                  {p.label}
                </a>
              </span>
            ))}
          </p>
        </div>

        <nav
          aria-label="Primary"
          className="absolute bottom-[11px] left-1/2 flex -translate-x-[calc(50%+2.55vw)] items-center gap-[62px] whitespace-nowrap text-[16px] leading-[24px] tracking-[0.8px]"
        >
          {links.map((l) => {
            const current = l.href === "/";
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={current ? toTop : undefined}
                aria-current={current ? "page" : undefined}
                className={`underline underline-offset-[3px] transition-colors hover:text-[var(--c-gold)] ${
                  current ? "text-[var(--c-gold)]" : "text-white"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── phones and tablets ── */}
      <div className="flex h-[68px] items-center justify-between gap-3 px-4 sm:px-6 lg:hidden">
        <Link
          href="/"
          onClick={(e) => {
            setOpen(false);
            toTop(e);
          }}
          aria-label="RAD Packing Solutions, home"
          className="flex min-w-0 items-center gap-2.5"
        >
          <Image src="/home/logo.png" alt="" width={61} height={48} priority className="h-12 w-[61px] shrink-0" />
          <span className="min-w-0">
            <span className="cl-wordmark block truncate text-[12.5px] font-bold leading-tight text-[#f6f6f6] sm:text-[15px]">
              RAD PACKING SOLUTIONS
            </span>
            <span className="cl-wordmark mt-0.5 block truncate text-[8.5px] leading-tight tracking-[0.9px] sm:text-[10.5px] sm:tracking-[1.2px]">
              Industrial Preservation Solutions
            </span>
          </span>
        </Link>
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="classic-menu"
          onClick={() => setOpen((v) => !v)}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/30"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div
          id="classic-menu"
          className="absolute inset-x-0 top-full border-t border-white/15 bg-[var(--c-navy)] px-5 pb-6 pt-1 shadow-[0_24px_40px_-20px_rgba(0,0,0,0.6)] sm:px-7 lg:hidden"
        >
          <nav aria-label="Mobile" className="flex flex-col">
            {links.map((l) => {
              const current = l.href === "/";
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={(e) => {
                    setOpen(false);
                    if (current) toTop(e);
                  }}
                  aria-current={current ? "page" : undefined}
                  className={`border-b border-white/12 py-4 text-[18px] tracking-[0.8px] underline underline-offset-4 ${
                    current ? "text-[var(--c-gold)]" : "text-white"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-5 flex flex-col gap-3 text-[16px] font-bold">
            {classicPhones.map((p) => (
              <a key={p.tel} href={`tel:${p.tel}`} className="flex items-center gap-3">
                <Phone size={20} strokeWidth={1.5} className="text-[#6ea2ee]" aria-hidden="true" /> {p.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
