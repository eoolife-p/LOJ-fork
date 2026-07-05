import { PrismaClient } from "@/generated/prisma/client";

let _prisma: PrismaClient | null = null;

function interop(mod: any) {
  return mod.default && Object.keys(mod).length === 1 ? mod.default : mod;
}

function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL || "";

  // 【调试日志 1】：打印环境变量状态（不打印完整密码，防泄露）
  console.log("=== [Prisma Debug] 环境变量检查 ===");
  console.log("DATABASE_URL 是否存在:", !!dbUrl);
  console.log("DATABASE_URL 长度:", dbUrl.length);
  console.log("是否以 postgres 开头:", dbUrl.startsWith("postgres"));
  console.log("=====================================");

  // 1. 优先尝试连接 PostgreSQL (Supabase)
  if (dbUrl.startsWith("postgres")) {
    try {
      console.log("[Prisma] 正在尝试连接 PostgreSQL...");
      const m = interop(require("@prisma/adapter-pg"));
      return new PrismaClient({ adapter: new m.PrismaPg({ connectionString: dbUrl }) });
    } catch (e) {
      // 【调试日志 2】：如果连不上，必须把错误打印出来！
      console.error("[Prisma] ❌ 连接 PostgreSQL 失败:", e);
    }
  } else {
    console.warn("[Prisma] ⚠️ DATABASE_URL 不是以 postgres 开头，跳过 PostgreSQL 连接！");
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

  // 4. 最后兜底：连接本地 SQLite
  console.warn("[Prisma] ⚠️ 所有云数据库连接失败，正在尝试兜底连接本地 SQLite (dev.db)...");
  try {
    const m = interop(require("@prisma/adapter-better-sqlite3"));
    const path = require("path");
    const dbPath = path.join(process.cwd(), "dev.db");
    return new PrismaClient({ adapter: new m.PrismaBetterSqlite3({ url: "file:" + dbPath }) });
  } catch (e) {
    console.error("[Prisma] ❌ 本地 SQLite 也失败了:", e);
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