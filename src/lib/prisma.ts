// src/lib/prisma.ts
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL;

  // SQLite: file:./dev.db
  // PostgreSQL: postgresql://...
  // Turso: libsql://... or turso://...
  // Cloudflare D1: 通过 wrangler d1 绑定

  if (dbUrl && dbUrl.startsWith("postgres")) {
    // PostgreSQL — 使用 pg 适配器
    const { PrismaPg } = require("@prisma/adapter-pg");
    const adapter = new PrismaPg(dbUrl);
    console.log("[Prisma] ✅ 使用 PostgreSQL 适配器");
    return new PrismaClient({ adapter });
  }

  if (dbUrl && (dbUrl.startsWith("libsql://") || dbUrl.startsWith("turso://"))) {
    // Turso / libSQL — 使用 libsql 适配器
    const { PrismaLibSQL } = require("@prisma/adapter-libsql");
    const { createClient } = require("@libsql/client");
    const libsql = createClient({ url: dbUrl, authToken: process.env.TURSO_AUTH_TOKEN });
    const adapter = new PrismaLibSQL(libsql);
    console.log("[Prisma] ✅ 使用 libSQL/Turso 适配器");
    return new PrismaClient({ adapter });
  }

  if (dbUrl && dbUrl.startsWith("file:")) {
    // SQLite（本地开发）— 使用 better-sqlite3 适配器
    const { PrismaBetterSQLite3 } = require("@prisma/adapter-better-sqlite3");
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Database = require("better-sqlite3");
    const sqlite = new Database(dbUrl.replace("file:", ""));
    const adapter = new PrismaBetterSQLite3(sqlite);
    console.log("[Prisma] ✅ 使用 SQLite 适配器 (better-sqlite3)");
    return new PrismaClient({ adapter });
  }

  // 兜底：没有 DATABASE_URL 或者未知格式，尝试直接用 PrismaClient 默认行为（适合 D1 等）
  console.warn("[Prisma] ⚠️ 未检测到已知数据库 URL 格式，使用默认 PrismaClient");
  return new PrismaClient({} as any);
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export { prisma };
export default prisma;