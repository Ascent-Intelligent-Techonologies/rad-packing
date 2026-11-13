import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import { site } from "@/lib/site";
import { classicPhones } from "./content";

/** Footer of the home page, rebuilt from RAD's original site. */
export function ClassicFooter() {
  return (
    <footer className="bg-[var(--c-navy)] text-white">
      <div className="mx-auto flex max-w-[1920px] flex-col gap-8 px-[var(--c-gutter)] pb-28 pt-9 lg:flex-row lg:justify-between lg:gap-10 lg:pb-[30px] lg:pl-[clamp(24px,6.5vw,125px)] lg:pr-[clamp(24px,2.9vw,55px)] lg:pt-[22px]">
        <div>
          <Link href="/" className="block text-[26px] font-light leading-[36px] tracking-[-0.04em] sm:text-[30px]">
            RAD PACKING SOLUTIONS
          </Link>
          <p className="mt-[11px] flex min-h-[35px] items-center">
            <span className="grid h-[35px] w-[35px] shrink-0 place-items-center text-[#1d67cd]" aria-hidden="true">
              <Phone size={23} strokeWidth={1.5} />
            </span>
            <span className="ml-[2px] flex flex-wrap items-center">
              {classicPhones.map((p, i) => (
                <span key={p.tel} className="contents">
                  {i > 0 && <span className="px-[4px]">|</span>}
                  <a href={`tel:${p.tel}`} className="hover:underline">
                    {p.label}
                  </a>
                </span>
              ))}
            </span>
          </p>
          <p className="-ml-[3px] flex min-h-[41px] items-center">
            <span className="grid h-[41px] w-[41px] shrink-0 place-items-center text-[#1d67cd]" aria-hidden="true">
              <MapPin size={27} strokeWidth={1.4} />
            </span>
            <span className="-ml-px">{site.location}</span>
          </p>
          <p className="lg:pl-[10px]">
            <a href={site.url} className="hover:underline">
              {site.url.replace(/^https?:\/\//, "")}
            </a>
          </p>
        </div>

        <div className="flex flex-col gap-6 lg:w-[440px] lg:justify-between lg:gap-0 lg:pt-[14px]">
          <ul>
            <li>
              <Link href="/privacy-policy" className="hover:underline">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/accessibility-statement" className="hover:underline">
                Accessibility Statement
              </Link>
            </li>
          </ul>
          {/* kept narrow so the line clears the chat button that floats over this corner */}
          <p className="lg:max-w-[300px]">
            © {site.copyrightYear} by {site.legalName}, All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}
