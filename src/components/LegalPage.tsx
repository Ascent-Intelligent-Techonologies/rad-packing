import { PageHero } from "./PageHero";

export function LegalPage({
  eyebrow,
  title,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title}>
        <p>Last updated: {updated}</p>
      </PageHero>
      <section className="section !pt-6">
        <div className="container-x">
          <article className="card mx-auto max-w-3xl p-7 sm:p-12 [&_a]:font-semibold [&_a]:text-brand [&_a]:underline [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2:first-child]:mt-0 [&_li]:mt-2 [&_p]:mt-4 [&_p]:leading-relaxed [&_p]:text-muted [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-muted">
            {children}
          </article>
        </div>
      </section>
    </>
  );
}
