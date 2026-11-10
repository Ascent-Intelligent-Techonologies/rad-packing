import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PageHero } from "@/components/PageHero";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <PageHero eyebrow="Error 404" title={<>This page has been <span className="text-gradient">shipped elsewhere.</span></>}>
          <p>The page you are looking for does not exist or has moved.</p>
          <Link href="/" className="btn btn-accent mt-8">
            Back to home <ArrowRight size={17} />
          </Link>
        </PageHero>
      </main>
      <Footer />
    </>
  );
}
