import { PrismaClient } from "@/generated/prisma/client";

function safeRequire(name: string) {
  try {
    return require(name);
  } catch {
    return null;
  }
}

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL || "";

  // PostgreSQL / Supabase
  if (dbUrl.startsWith("postgres")) {
    const mod = safeRequire("@prisma/adapter-pg");
    if (mod) return new PrismaClient({ adapter: new mod.PrismaPg(dbUrl) });
  }

  // Turso / libSQL
  if (process.env.TURSO_DATABASE_URL) {
    const mod = safeRequire("@prisma/adapter-libsql");
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
    const mod = safeRequire("@prisma/adapter-d1");
    if (mod) return new PrismaClient({ adapter: new mod.PrismaD1(d1) });
  }

  // SQLite fallback
  const mod = safeRequire("@prisma/adapter-better-sqlite3");
  if (mod) {
    const path = require("path");
    const dbPath = path.join(process.cwd(), "dev.db");
    return new PrismaClient({ adapter: new mod.PrismaBetterSqlite3({ url: "file:" + dbPath }) });
  }

  throw new Error("No database adapter available. Set DATABASE_URL, TURSO_DATABASE_URL, or run locally.");
}

let _prisma: PrismaClient | null = null;

function getPrisma(): PrismaClient {
  if (_prisma) return _prisma;
  _prisma = createPrismaClient();
  return _prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getPrisma() as any)[prop];
  },
});

export default prisma;
