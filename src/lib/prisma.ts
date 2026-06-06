import { PrismaClient } from "@/generated/prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";

function createPrismaClient() {
  // Cloudflare Pages: D1 绑定在全局作用域
  const d1 = (globalThis as any).DB;
  if (d1 && typeof d1.prepare === "function") {
    return new PrismaClient({ adapter: new PrismaD1(d1) });
  }

  // 本地开发：require() 同步加载，Workers 打包不会进入此分支
  const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
  const path = require("path");
  const dbPath = path.join(process.cwd(), "dev.db");
  return new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: "file:" + dbPath }) });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
