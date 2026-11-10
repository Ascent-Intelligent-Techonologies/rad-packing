import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

const display = Sora({ variable: "--font-display", subsets: ["latin"], display: "swap" });
const body = Inter({ variable: "--font-body", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "RAD Packing Solutions | Industrial Preservation & Export Packaging, Sharjah UAE",
    template: "%s | RAD Packing Solutions",
  },
  description:
    "Industrial packaging and preservation specialists in Sharjah, UAE. VCI films, barrier packaging, export crates, nail-less boxes and onsite packing. Zero rust. Zero failures.",
  keywords: [
    "industrial packaging UAE",
    "preservation packaging Sharjah",
    "VCI packaging",
    "export crates UAE",
    "machinery packing",
    "ISPM 15",
  ],
  openGraph: {
    type: "website",
    siteName: site.name,
    title: "RAD Packing Solutions | Maximum Protection. Zero Rust. Zero Failures.",
    description:
      "Industrial preservation packaging, export crating and onsite packing for machinery, aerospace, electronics and pharma.",
    locale: "en_AE",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#05071f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${display.variable} ${body.variable}`}>
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
