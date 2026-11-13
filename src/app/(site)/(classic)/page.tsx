import Image from "next/image";
import Link from "next/link";
import { ClassicContactForm } from "@/components/classic/ClassicContactForm";
import { WhatWeDoGlyph } from "@/components/classic/ClassicIcons";
import { industriesWeSupport, whatWeDo } from "@/components/classic/content";

const breakFrom = { lg: "hidden lg:inline", xl: "hidden xl:inline" } as const;

/**
 * Text the original breaks by hand. The breaks only apply from the given screen width up, where
 * the column is as wide as the original's; below that the text flows freely.
 */
function Lines({ lines, from = "lg" }: { lines: string[]; from?: keyof typeof breakFrom }) {
  return lines.map((line, i) => (
    <span key={i}>
      {i > 0 && (
        <>
          {" "}
          <br className={breakFrom[from]} />
        </>
      )}
      {line}
    </span>
  ));
}

/**
 * Home page, rebuilt to match RAD's original landing page section for section: hero, Who We Are,
 * What We Do, Industries We Support and the contact form. The pixel values are the original's at
 * a 1920px-wide screen. The previous landing page lives on at /old-home.
 */
export default function Home() {
  return (
    <>
      {/* ───────────── HERO ───────────── */}
      <section className="grid bg-[var(--c-paper)] lg:grid-cols-2">
        <div className="relative h-[clamp(250px,74vw,560px)] overflow-hidden lg:h-auto lg:min-h-[804px]">
          <Image
            src="/home/woman-tablet.webp"
            alt="Smiling woman holding a tablet in an office"
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover object-[50%_18%] lg:scale-[1.18] lg:object-center"
          />
        </div>
        <div className="flex flex-col items-center px-5 pb-14 pt-11 text-center text-[var(--c-blue)] lg:pb-16 lg:pt-[197px]">
          <p className="cl-bold text-[clamp(21px,3vw,27px)] leading-[1.3] tracking-[-0.01em]">RAD Packing Solutions</p>
          <span aria-hidden="true" className="mt-[5px] block h-px w-[206px] max-w-[60%] bg-[var(--c-navy)]" />
          <h1 className="mt-[6px]">
            <span className="cl-hero-strong block">
              Providing you
              <br />
              Maximum
              <br />
              Protection.
            </span>
            <span className="cl-hero-light mt-[4px] block">
              Zero Rust.
              <br />
              Zero Failures.
              <br />
              Lasting Integrity.
            </span>
          </h1>
          <Link href="/products" className="cl-btn mt-9 !min-h-[50px] min-w-[207px] lg:mt-[46px]">
            Explore Our Products
          </Link>
        </div>
      </section>

      {/* ───────────── WHO WE ARE ───────────── */}
      <section className="cl-gradient">
        <div className="mx-auto max-w-[1920px] px-[var(--c-gutter)] pb-12 pt-12 lg:pb-[33px] lg:pt-[55px]">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,828fr)_minmax(0,807fr)] lg:gap-0">
            <div className="lg:pr-10">
              <h2 className="cl-display text-[var(--c-paper)]">Who We Are</h2>
              <div className="relative mt-5 aspect-[444/296] w-full max-w-[444px]">
                <Image
                  src="/home/worker.webp"
                  alt="Worker in a hard hat and face mask at a machine"
                  fill
                  sizes="(min-width: 1024px) 444px, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
            <div className="max-w-[500px] lg:pt-[4px]">
              <p>
                RAD Packing Solutions is a specialist in industrial packaging and preservation solutions, providing
                reliable, high-performance protection for valuable assets, machinery, equipment, and sensitive
                components. We deliver tailored solutions designed to prevent corrosion, moisture damage, and
                environmental deterioration, ensuring asset integrity throughout storage, handling, and transportation.
              </p>
              <p className="cl-bold mt-6 text-[18px] leading-[27px]">
                Shielding Your Assets. Extending Their Lifespan.
                <br />
                Securing Tomorrow.
              </p>
              <p className="mt-6">
                In an ever-moving global marketplace, the value of a product goes beyond its manufacturing. How it is
                stored, handled, transported, and preserved determines how well it performs when it reaches its
                destination.
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-start gap-7 lg:mt-[39px] lg:max-w-[1322px] lg:flex-row lg:items-end lg:justify-between lg:gap-6">
            <p className="cl-statement lg:ml-[clamp(0px,calc((100vw-1100px)*0.375),307px)]">
              Over 25 Years of
              <br />
              Proven Expertise in
              <br />
              Industrial Packaging &amp; Preservation
            </p>
            <Link href="/about" className="cl-btn shrink-0 lg:mb-[8px] lg:w-[196px] lg:!px-0">
              Discover More About Us
            </Link>
          </div>
        </div>
      </section>

      {/* ───────────── WHAT WE DO ───────────── */}
      <section className="bg-[var(--c-navy)]">
        <h2 className="cl-display mx-auto max-w-[1920px] px-[var(--c-gutter)] pb-10 pt-12 text-[var(--c-paper)] lg:pb-[60px] lg:pl-[clamp(32px,calc(50vw-531px),429px)] lg:pt-[58px]">
          What We Do
        </h2>
        <ul className="grid sm:grid-cols-2 lg:grid-cols-4">
          {whatWeDo.map((c) => (
            <li
              key={c.title}
              className="cl-gradient relative flex flex-col items-center px-6 pb-12 pt-12 text-center lg:h-[645px] lg:px-3 lg:pb-0 lg:pt-0"
            >
              <span
                className="grid h-[94px] place-items-center lg:absolute lg:left-[calc(50%+var(--dx))] lg:top-[var(--top)] lg:h-auto lg:-translate-x-1/2"
                style={{ "--top": `${c.iconTop}px`, "--dx": `${c.nudge[0]}px` } as React.CSSProperties}
              >
                <WhatWeDoGlyph name={c.icon} />
              </span>
              <h3
                className="cl-bold mt-7 max-w-[var(--w)] text-[20px] uppercase leading-[20px] lg:absolute lg:left-[calc(50%+var(--dx))] lg:top-[191px] lg:mt-0 lg:w-[var(--w)] lg:-translate-x-1/2"
                style={{ "--w": `${c.titleWidth}px`, "--dx": `${c.nudge[1]}px` } as React.CSSProperties}
              >
                {c.title}
              </h3>
              <p
                className="mt-6 max-w-[320px] text-[16px] leading-[22.4px] text-[var(--c-sky)] lg:absolute lg:left-[calc(50%+var(--dx))] lg:top-[var(--top)] lg:mt-0 lg:w-[var(--w)] lg:max-w-none lg:-translate-x-1/2"
                style={{ "--w": `${c.bodyWidth}px`, "--top": `${c.bodyTop}px`, "--dx": `${c.nudge[2]}px` } as React.CSSProperties}
              >
                <Lines lines={c.body} />
              </p>
              <Link
                href="/contact"
                aria-label={`Enquire about ${c.title}`}
                className="cl-bold mt-8 text-[14px] font-light leading-[14px] hover:underline lg:absolute lg:left-[calc(50%+var(--dx))] lg:top-[var(--top)] lg:mt-0 lg:-translate-x-1/2"
                style={{ "--top": `${c.linkTop}px`, "--dx": `${c.nudge[3]}px` } as React.CSSProperties}
              >
                Enquire&gt;
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ───────────── INDUSTRIES WE SUPPORT ───────────── */}
      <section className="bg-[var(--c-navy)]">
        <div className="mx-auto max-w-[1920px] px-[var(--c-gutter)] pb-16 pt-14 lg:px-[clamp(24px,4.17vw,80px)] lg:pb-[109px] lg:pt-[75px]">
          <h2 className="cl-display lg:max-w-[420px] lg:pl-[13px]">Industries We Support</h2>
          <ul className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:mt-[65px] lg:grid-cols-5 lg:gap-x-6 lg:gap-y-0 3xl:grid-cols-[426fr_425fr_349fr_349fr_196fr] 3xl:gap-0">
            {industriesWeSupport.map((x) => (
              <li key={x.image} className="grid grid-cols-[104px_minmax(0,1fr)] gap-x-5 sm:block">
                <div className="relative aspect-[195/477] w-full max-w-[195px] self-start">
                  <Image src={x.image} alt={x.alt} fill sizes="195px" className="object-cover" />
                </div>
                <div className="min-w-0 lg:max-w-[var(--w)]" style={{ "--w": `${x.width}px` } as React.CSSProperties}>
                  <h3
                    className={`font-light sm:mt-7 lg:mt-[55px] lg:min-h-[175px] lg:pl-[5px] ${
                      x.small
                        ? "text-[24px] leading-[1.3] tracking-[-0.03em] lg:text-[22px] xl:text-[26px]"
                        : "text-[24px] leading-[1.3] tracking-[-0.03em] xl:text-[29px]"
                    }`}
                  >
                    <Lines lines={x.title} from="xl" />
                  </h3>
                  <p className="mt-3 text-[16px] leading-[1.45] tracking-[-0.01em] sm:text-[18px] sm:leading-[23.4px] lg:mt-0">
                    <Lines lines={x.body} from="xl" />
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───────────── GET IN TOUCH ───────────── */}
      <section id="contact" className="scroll-mt-[68px] bg-[var(--c-sky)] text-[var(--c-blue)] lg:scroll-mt-[209px]">
        <div className="mx-auto max-w-[1920px] px-[var(--c-gutter)] pb-14 pt-12 lg:pb-[15px] lg:pl-[clamp(32px,calc(50vw-491px),469px)] lg:pt-[23px]">
          <h2 className="cl-display text-[var(--c-blue-soft)]">We are here to help!</h2>
          <p className="cl-subdisplay mt-3 lg:mt-[25px]">Get in Touch with Us</p>
          <div className="mt-9 grid gap-9 lg:mt-[42px] lg:grid-cols-[460px_minmax(0,401px)] lg:items-end lg:gap-[66px]">
            <ClassicContactForm />
            <p className="max-w-[460px] lg:mb-[86px]">
              For inquiries about our packaging materials or to discuss your packaging needs, please don&apos;t
              hesitate to contact us.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
