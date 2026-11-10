import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { HeroScene } from "@/components/HeroScene";
import { Logo } from "@/components/Logo";
import { getCurrentUser } from "@/lib/crm/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

async function RedirectIfSignedIn() {
  if (await getCurrentUser()) redirect("/admin");
  return null;
}

export default function LoginPage() {
  return (
    <div className="on-dark relative isolate grid min-h-dvh place-items-center overflow-hidden bg-ink px-5 py-12 text-white">
      <HeroScene />
      <Suspense>
        <RedirectIfSignedIn />
      </Suspense>
      <div className="relative w-full max-w-md">
        <Link href="/" aria-label="Back to the RAD Packing website" className="mb-8 flex justify-center">
          <Logo uid="login" />
        </Link>
        <div className="rounded-[28px] border border-white/15 bg-white/[0.07] p-7 shadow-2xl backdrop-blur-xl sm:p-9">
          <span className="eyebrow">Team sign-in</span>
          <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight">RAD CRM</h1>
          <p className="mt-2 text-sm text-white/65">Manage enquiries, customers, quotes and tasks.</p>
          <div className="mt-7">
            <LoginForm />
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-white/45">Authorised RAD Packing staff only.</p>
      </div>
    </div>
  );
}
