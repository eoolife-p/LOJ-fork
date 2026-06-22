import { PrismaClient } from "@/generated/prisma/client";

function safeRequire<T>(name: string): T | null {
  try {
    return require(name);
  } catch {
    console.warn(`[Prisma] Cannot require "${name}"`);
    return null;
  }
}

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || "";

  // PostgreSQL / Supabase
  if (dbUrl.startsWith("postgres")) {
    const mod = safeRequire<any>("@prisma/adapter-pg");
    if (mod) {
      return new PrismaClient({ adapter: new mod.PrismaPg(dbUrl) });
    }
  }

  // Turso / libSQL
  if (process.env.TURSO_DATABASE_URL) {
    const mod = safeRequire<any>("@prisma/adapter-libsql");
    if (mod) {
      return new PrismaClient({
        adapter: new mod.PrismaLibSql({
          url: process.env.TURSO_DATABASE_URL,
          authToken: process.env.TURSO_AUTH_TOKEN,
        }),
      });
    }
  }

  // Cloudflare D1
  const d1 = (globalThis as any).DB;
  if (d1 && typeof d1.prepare === "function") {
    const mod = safeRequire<any>("@prisma/adapter-d1");
    if (mod) {
      return new PrismaClient({ adapter: new mod.PrismaD1(d1) });
    }
  }

  // 本地开发 fallback — SQLite
  const mod = safeRequire<any>("@prisma/adapter-better-sqlite3");
  if (mod) {
    const path = require("path");
    const dbPath = path.join(process.cwd(), "dev.db");
    return new PrismaClient({ adapter: new mod.PrismaBetterSqlite3({ url: "file:" + dbPath }) });
  }

  throw new Error("No database adapter available. Set DATABASE_URL, TURSO_DATABASE_URL, or run locally.");
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
