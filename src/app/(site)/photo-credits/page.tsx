import type { Metadata } from "next";
import Link from "next/link";
import { CatalogPhoto } from "@/components/catalogue/CatalogPhoto";
import { LegalPage } from "@/components/LegalPage";
import { getPhotoCredits } from "@/lib/catalogue/public";
import { productHref } from "@/lib/catalogue/shared";

export const metadata: Metadata = {
  title: "Photo credits",
  description: "Credits and licences for the representative photos used in the RAD Packing Solutions product catalogue.",
  alternates: { canonical: "/photo-credits" },
};

/** "…, CC BY-SA 4.0" -> the licence deed, so the licence name on this page can link to it. */
function licenceUrl(credit: string): string | null {
  const cc = credit.match(/CC (BY(?:-SA)?) (\d\.\d)/i);
  if (cc) return `https://creativecommons.org/licenses/${cc[1]!.toLowerCase()}/${cc[2]}/`;
  if (/\bCC0\b/i.test(credit)) return "https://creativecommons.org/publicdomain/zero/1.0/";
  return null;
}

export default async function PhotoCredits() {
  const credits = await getPhotoCredits();

  return (
    <LegalPage eyebrow="Legal" title="Photo credits" updated="13 November 2026">
      <h2>Representative photos</h2>
      <p>
        Some pictures in our product catalogue are representative photos by other photographers, shared under free
        licences. They show the type of product, not necessarily the exact item we supply. Each one is credited below
        and on its product page.
      </p>
      <p>
        The photos have been resized for this website. Photos under a Creative Commons Attribution-ShareAlike licence
        remain available under that same licence; follow the source link for the original file and its full licence
        terms.
      </p>

      {credits.length === 0 ? (
        <p>There are no credited photos on the site at the moment.</p>
      ) : (
        <ul className="!mt-8 !list-none !pl-0">
          {credits.map((c) => {
            const licence = licenceUrl(c.credit);
            return (
              <li key={c.image.id} className="!mt-0 flex items-center gap-4 border-t border-line py-4 first:border-t-0">
                <span className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-surface">
                  <CatalogPhoto image={c.image} alt={c.productTitle} className="h-full w-full" sizes="80px" />
                </span>
                <span className="min-w-0 text-[15px] leading-relaxed">
                  <Link href={productHref(c.productSlug)}>{c.productTitle}</Link>
                  <span className="block text-muted">
                    Photo:{" "}
                    {c.creditUrl ? (
                      <a href={c.creditUrl} target="_blank" rel="noopener noreferrer nofollow">
                        {c.credit}
                      </a>
                    ) : (
                      c.credit
                    )}
                    {licence && (
                      <>
                        {" "}
                        (
                        <a href={licence} target="_blank" rel="noopener noreferrer nofollow">
                          licence
                        </a>
                        )
                      </>
                    )}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </LegalPage>
  );
}
