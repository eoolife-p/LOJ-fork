import { PrismaClient } from "@/generated/prisma/client";

let _prisma: PrismaClient | null = null;

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL || "";

  if (dbUrl.startsWith("postgres")) {
    try {
      const { PrismaPg } = require("@prisma/adapter-pg");
      return new PrismaClient({ adapter: new PrismaPg(dbUrl) });
    } catch {}
  }

  if (process.env.TURSO_DATABASE_URL) {
    try {
      const { PrismaLibSql } = require("@prisma/adapter-libsql");
      return new PrismaClient({
        adapter: new PrismaLibSql({
          url: process.env.TURSO_DATABASE_URL,
          authToken: process.env.TURSO_AUTH_TOKEN,
        }),
      });
    } catch (e) {
      console.error("[Prisma] Turso:", e);
    }
  }

  const d1 = (globalThis as any).DB;
  if (d1 && typeof d1.prepare === "function") {
    try {
      const { PrismaD1 } = require("@prisma/adapter-d1");
      return new PrismaClient({ adapter: new PrismaD1(d1) });
    } catch {}
  }

  try {
    const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
    const path = require("path");
    const dbPath = path.join(process.cwd(), "dev.db");
    return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: "file:" + dbPath }) });
  } catch {}

  throw new Error("No database adapter available");
}

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
