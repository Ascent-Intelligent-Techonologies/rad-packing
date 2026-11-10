import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7 no longer reads the URL from schema.prisma. `prisma generate` does not
// need a live database, so fall back to a placeholder when none is configured.
const url =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  "postgresql://placeholder:placeholder@localhost:5432/placeholder";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url },
});
