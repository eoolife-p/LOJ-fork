// src/lib/prisma.ts
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error("❌ 致命错误：环境变量 DATABASE_URL 为空！请检查部署平台设置。");
  }
  if (!dbUrl.startsWith("postgres")) {
    throw new Error(`❌ 致命错误：DATABASE_URL 格式错误，必须以 postgres 开头。当前前缀: ${dbUrl.substring(0, 10)}`);
  }

  console.log("[Prisma] ✅ 检测到有效的 PostgreSQL URL，正在连接 Supabase...");

  const adapter = new PrismaPg(dbUrl);
  return new PrismaClient({ adapter });
}

const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// 【关键修复】：同时提供命名导出和默认导出，完美兼容你项目里的所有导入写法！
export { prisma };
export default prisma; // <--- 加上这一行，解决 "export default was not found" 报错