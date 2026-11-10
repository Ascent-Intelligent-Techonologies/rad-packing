import { ChatWidget } from "@/components/ChatWidget";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
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
  description:
    "Specialist in industrial packaging and preservation solutions: VCI, barrier packaging, export crates and onsite packing.",
};

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
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <StickyActionBar />
      <ChatWidget />
    </>
  );
}
