import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

/** Header and footer for every public page except the home page. */
export default function ModernLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
