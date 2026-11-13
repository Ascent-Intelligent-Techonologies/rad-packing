import { Archivo } from "next/font/google";
import { ClassicFooter } from "@/components/classic/ClassicFooter";
import { ClassicHeader } from "@/components/classic/ClassicHeader";

/** Stands in for the wide display face of the wordmark beside the logo. */
const wide = Archivo({ variable: "--font-wide", subsets: ["latin"], axes: ["wdth"], display: "swap" });

/**
 * The home page wears the header and footer of RAD's original landing page; every other page
 * keeps the newer ones (see `(modern)/layout.tsx`).
 */
export default function ClassicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`classic ${wide.variable} flex flex-1 flex-col`}>
      <ClassicHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <ClassicFooter />
    </div>
  );
}
