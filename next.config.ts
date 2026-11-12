import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
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
