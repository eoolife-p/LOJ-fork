import { PrismaClient } from "@/generated/prisma/client";

function createPrismaClient() {
  try {
    const dbUrl = process.env.DATABASE_URL || "";

    // Supabase / PostgreSQL
    if (dbUrl.startsWith("postgres")) {
      const { PrismaPg } = require("@prisma/adapter-pg");
      return new PrismaClient({ adapter: new PrismaPg({ connectionString: dbUrl }) });
    }

    // Turso / libSQL
    if (process.env.TURSO_DATABASE_URL) {
      const { PrismaLibSql } = require("@prisma/adapter-libsql");
      return new PrismaClient({
        adapter: new PrismaLibSql({
          url: process.env.TURSO_DATABASE_URL,
          authToken: process.env.TURSO_AUTH_TOKEN,
        }),
      });
    }

    // Cloudflare D1
    const d1 = (globalThis as any).DB;
    if (d1 && typeof d1.prepare === "function") {
      const { PrismaD1 } = require("@prisma/adapter-d1");
      return new PrismaClient({ adapter: new PrismaD1(d1) });
    }

    // 本地开发
    const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
    const path = require("path");
    const dbPath = path.join(process.cwd(), "dev.db");
    return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: "file:" + dbPath }) });
  } catch (e) {
    console.error("[Prisma] init failed:", e);
    const msg = `Database not available: ${e instanceof Error ? e.message : String(e)}`;
    return new Proxy({} as PrismaClient, {
      get(_target, _prop) {
        return () => { throw new Error(msg); };
      },
    });
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
