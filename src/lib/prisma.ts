// src/lib/prisma.ts (请根据实际路径调整)
import { PrismaClient } from "@/generated/prisma/client";
// 【关键修改 1】：直接使用静态 import，彻底抛弃 require 和 interop！
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL;

  // 1. 严格校验环境变量，不对就直接报错，绝不兜底！
  if (!dbUrl) {
    throw new Error("❌ 致命错误：环境变量 DATABASE_URL 为空！请检查部署平台设置。");
  }
  if (!dbUrl.startsWith("postgres")) {
    throw new Error(`❌ 致命错误：DATABASE_URL 格式错误，必须以 postgres 开头。当前前缀: ${dbUrl.substring(0, 10)}`);
  }

  console.log("[Prisma] ✅ 检测到有效的 PostgreSQL URL，正在连接 Supabase...");

  // 【关键修改 2】：直接实例化，传入字符串。
  // 【关键修改 3】：故意不加 try-catch！如果连不上，让错误直接暴露出来，不再悄悄 fallback！
  const adapter = new PrismaPg(dbUrl);
  
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}