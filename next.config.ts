import type { NextConfig } from "next";

/** Catalogue addresses from before the catalogue followed RAD's company profile. */
const oldCatalogue: [string, string][] = [
  ["/products/category/wooden", "/products/category/industrial-packaging/crates-and-boxes"],
  ["/products/category/wooden/pallets", "/products/category/wooden-pallets"],
  ["/products/category/wooden/crates-and-boxes", "/products/category/industrial-packaging/crates-and-boxes"],
  ["/products/category/turnkey", "/products/category/industrial-packaging/on-site-off-site-packaging"],
  ["/products/category/nailless-boxes", "/products/category/industrial-packaging"],
  ["/products/category/traditional", "/products/category/industrial-packaging"],
  ["/products/category/traditional/:rest*", "/products/category/industrial-packaging"],
  ["/products/category/preservation/:rest+", "/products/category/preservation"],
  // products that were removed with the starter catalogue
  ...[
    "rust-preventive-oil",
    "neutral-rust-remover",
    "rad-dry-desiccants",
    "rad-c-dry-desiccants",
    "temperature-humidity-indicator",
    "rad-honeycomb-paper",
    "rad-air-cushion-pillow-film",
    "rad-paper-mailers",
    "paper-cushion-pads",
    "protective-foams",
    "stretch-film",
    "water-activated-kraft-paper-tape",
    "strapping-materials",
    "corrugated-cartons",
    "nailless-collapsible-plywood-box",
    "e1-grade-nailless-box",
  ].map((slug): [string, string] => [`/products/${slug}`, "/products"]),
];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  redirects: async () => oldCatalogue.map(([source, destination]) => ({ source, destination, permanent: false })),
  partialPrefetching: true,
  experimental: {
    // Catalogue pages read the database while they are prerendered. Small databases (and the local
    // `prisma dev` one) drop connections when many build workers hit them at once, so build these
    // pages in one worker, a few at a time, and retry a page that failed on a dropped connection.
    staticGenerationMaxConcurrency: 3,
    staticGenerationMinPagesPerWorker: 500,
    staticGenerationRetryCount: 2,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
