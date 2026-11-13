import { ChatWidget } from "@/components/ChatWidget";
import { StickyActionBar } from "@/components/StickyActionBar";
import { site } from "@/lib/site";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: site.name,
  legalName: site.legalName,
  url: site.url,
  telephone: site.phones.map((p) => p.tel),
  address: { "@type": "PostalAddress", addressLocality: "Sharjah", addressCountry: "AE" },
  areaServed: ["United Arab Emirates", "Gulf Cooperation Council"],
  description:
    "Sharjah-based industrial packaging company: wooden pallets, industrial skids, heavy-duty packaging, heat shrink wrapping, preservation and export packaging across the UAE and GCC.",
};

/**
 * Shared by every public page. The header, `<main>` and footer come from the group layouts below:
 * `(classic)` is the home page, rebuilt to match RAD's original landing page, and `(modern)` is
 * every other page.
 */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a
        href="#main"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-full bg-white px-5 py-3 font-semibold text-brand shadow-xl transition focus:translate-y-0"
      >
        Skip to content
      </a>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {children}
      <StickyActionBar />
      <ChatWidget />
    </>
  );
}
