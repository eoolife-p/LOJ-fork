import { PrismaClient } from "@/generated/prisma/client";

let _prisma: PrismaClient | null = null;

function interop(mod: any) {
  return mod.default && Object.keys(mod).length === 1 ? mod.default : mod;
}

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL || "";

  if (dbUrl.startsWith("postgres")) {
    try {
      const m = interop(require("@prisma/adapter-pg"));
      return new PrismaClient({ adapter: new m.PrismaPg(dbUrl) });
    } catch {}
  }

  if (process.env.TURSO_DATABASE_URL) {
    try {
      const m = interop(require("@prisma/adapter-libsql"));
      return new PrismaClient({
        adapter: new m.PrismaLibSql({
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
      const m = interop(require("@prisma/adapter-d1"));
      return new PrismaClient({ adapter: new m.PrismaD1(d1) });
    } catch {}
  }

  try {
    const m = interop(require("@prisma/adapter-better-sqlite3"));
    const path = require("path");
    const dbPath = path.join(process.cwd(), "dev.db");
    return new PrismaClient({ adapter: new m.PrismaBetterSqlite3({ url: "file:" + dbPath }) });
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
