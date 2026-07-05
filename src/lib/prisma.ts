import { PrismaClient } from "@/generated/prisma/client";

let _prisma: PrismaClient | null = null;

function interop(mod: any) {
  return mod.default && Object.keys(mod).length === 1 ? mod.default : mod;
}

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL || "";

  // 1. 优先尝试连接 PostgreSQL (Supabase)
  if (dbUrl.startsWith("postgres")) {
    try {
      const m = interop(require("@prisma/adapter-pg"));
      // 【修复点 1】：PrismaPg 需要传入一个包含 connectionString 的对象，而不是直接传字符串
      return new PrismaClient({ adapter: new m.PrismaPg({ connectionString: dbUrl }) });
    } catch (e) {
      // 【修复点 2】：打印错误日志，千万不要用空的 catch {}，否则出错了你根本不知道！
      console.error("[Prisma] Failed to connect to PostgreSQL:", e);
    }
  }

  // 2. 尝试连接 Turso
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

  // 3. 尝试连接 Cloudflare D1
  const d1 = (globalThis as any).DB;
  if (d1 && typeof d1.prepare === "function") {
    try {
      const m = interop(require("@prisma/adapter-d1"));
      return new PrismaClient({ adapter: new m.PrismaD1(d1) });
    } catch (e) {
      console.error("[Prisma] D1:", e);
    }
  }

  // 4. 最后兜底：连接本地 SQLite (仅限本地开发)
  try {
    const m = interop(require("@prisma/adapter-better-sqlite3"));
    const path = require("path");
    const dbPath = path.join(process.cwd(), "dev.db");
    return new PrismaClient({ adapter: new m.PrismaBetterSqlite3({ url: "file:" + dbPath }) });
  } catch (e) {
    console.error("[Prisma] Local SQLite:", e);
  }

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