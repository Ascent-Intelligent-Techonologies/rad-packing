import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** Connection string injected by the Vercel + Prisma Postgres integration, or set locally. */
export function databaseUrl() {
  return process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? null;
}

export const dbConfigured = () => Boolean(databaseUrl());

/** Returns a shared Prisma client, or null when no database is configured. */
export function getDb(): PrismaClient | null {
  const url = databaseUrl();
  if (!url) return null;
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      // small pool: serverless instances and parallel build workers share a small database
      adapter: new PrismaPg({ connectionString: url, max: 4 }),
    });
  }
  return globalForPrisma.prisma;
}
