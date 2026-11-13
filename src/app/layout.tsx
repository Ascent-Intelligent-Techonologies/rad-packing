import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

const display = Sora({ variable: "--font-display", subsets: ["latin"], display: "swap" });
const body = Inter({ variable: "--font-body", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "RAD Packing Solutions | Industrial Packaging, Pallets & Preservation, Sharjah UAE",
    template: "%s | RAD Packing Solutions",
  },
  description:
    "Sharjah-based industrial packaging company serving the UAE and GCC. Wooden pallets, crates and heavy-duty skids, heat shrink wrapping, VCI and preservation packaging, and ISPM-15 export packaging.",
  keywords: [
    "industrial packaging UAE",
    "wooden pallets Sharjah",
    "Euro pallets UAE",
    "heavy-duty skids",
    "heat shrink wrapping UAE",
    "preservation packaging Sharjah",
    "VCI packaging",
    "export crates UAE",
    "ISPM 15 heat-treated packaging",
    "industrial packaging GCC",
  ],
  openGraph: {
    type: "website",
    siteName: site.name,
    title: "RAD Packing Solutions | Maximum Protection. Zero Rust. Zero Failures.",
    description:
      "Wooden pallets, industrial packaging, heat shrink wrapping, preservation and export packaging for customers across the UAE and GCC.",
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
