"use client";

import { useState } from "react";
import { ArrowRight, Cog, Cpu, Pill, Plane, Ship } from "lucide-react";
import { industries } from "@/lib/site";
import { openChat } from "./OpenChatButton";

const icons = { aerospace: Plane, "heavy-machinery": Cog, electronics: Cpu, pharma: Pill, maritime: Ship } as const;

export function IndustryExplorer() {
  const [active, setActive] = useState(industries[0].id);
  const current = industries.find((i) => i.id === active)!;
  const CurrentIcon = icons[current.id as keyof typeof icons];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-10">
      {/* list: horizontal scroller on phones, stacked on desktop */}
      <div
        role="tablist"
        aria-label="Industries we support"
        className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden"
      >
        {industries.map((i) => {
          const Icon = icons[i.id as keyof typeof icons];
          const on = i.id === active;
          return (
            <button
              key={i.id}
              role="tab"
              id={`tab-${i.id}`}
              aria-selected={on}
              aria-controls={`panel-${i.id}`}
              onClick={() => setActive(i.id)}
              className={`flex w-[260px] shrink-0 snap-start items-center gap-4 rounded-3xl border p-4 text-left transition lg:w-auto ${
                on
                  ? "border-transparent bg-brand text-white shadow-[0_24px_50px_-24px_rgba(32,38,224,0.9)]"
                  : "border-line bg-white hover:border-brand/30"
              }`}
            >
              <span
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${
                  on ? "bg-white/15" : "bg-brand-50 text-brand"
                }`}
              >
                <Icon size={22} />
              </span>
              <span>
                <span className="block font-display text-[15px] font-bold leading-snug">{i.title}</span>
                <span className={`mt-0.5 block text-xs ${on ? "text-white/70" : "text-muted"}`}>{i.short}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`panel-${current.id}`}
        aria-labelledby={`tab-${current.id}`}
        key={current.id}
        className="chat-msg relative overflow-hidden rounded-[32px] bg-ink p-7 text-white sm:p-10 lg:p-12"
      >
        <div className="stripe-mark !opacity-30" />
        <div className="relative">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-linear-to-br from-orange to-pink text-white">
            <CurrentIcon size={26} />
          </span>
          <h3 className="mt-6 font-display text-2xl font-bold leading-tight sm:text-3xl">{current.title}</h3>
          <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-white/75">{current.body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={`/products?interest=preservation#quote`} className="btn btn-accent">
              Get a quote <ArrowRight size={17} />
            </a>
            <button
              type="button"
              className="btn btn-glass"
              onClick={() => openChat(`What packaging do you recommend for ${current.title.toLowerCase()}?`)}
            >
              Ask our AI about this
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
