/**
 * The catalogue pages open straight on the category list and the search box, with no banner above
 * them. This dark strip is only the backdrop for the site header, which is transparent with white
 * text until the page scrolls; it is exactly as tall as the header. The page title is kept for
 * screen readers and search engines.
 */
export function CatalogueTop({ title, children }: { title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <section className="on-dark relative isolate h-[68px] overflow-hidden bg-ink lg:h-[116px]">
      <div className="hero-scene" aria-hidden="true" />
      <h1 className="sr-only">{title}</h1>
      {children}
    </section>
  );
}
