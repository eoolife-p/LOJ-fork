import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import {
  validateAuthSecret,
  checkLoginRateLimit,
  recordLoginFailure,
  clearLoginAttempts,
} from "@/lib/security";

// CVE-6: 生产环境弱密钥检测
validateAuthSecret();

// JWT 角色缓存：避免每次请求都查库，每 60 秒刷新一次
const roleCache = new Map<string, { role: string; userGroupId: number; isAdmin: boolean; updatedAt: number }>();
const ROLE_CACHE_TTL = 60 * 1000; // 60 秒

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = (credentials.email as string).trim().toLowerCase();

        // 获取客户端 IP（用于 IP 维度限频）
        let ip: string | undefined;
        try {
          const headersList = await headers();
          ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
            || headersList.get("x-real-ip")
            || undefined;
        } catch { /* headers 不可用时忽略 */ }

        // CVE-8: 登录暴力破解防护（email + IP 双维度）
        if (!checkLoginRateLimit(email, ip)) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: { userGroup: true },
        });

        if (!user) {
          recordLoginFailure(email, ip);
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          recordLoginFailure(email, ip);
          return null;
        }

        // 登录成功，清除失败计数
        clearLoginAttempts(email, ip);

        return {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          userGroupId: user.userGroupId.toString(),
          isAdmin: user.userGroup?.isAdmin ?? false,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
        token.userGroupId = (user as { userGroupId: string }).userGroupId;
        token.isAdmin = (user as { isAdmin: boolean }).isAdmin;
      }
      // CVE-4: 刷新 JWT 时从数据库获取最新角色（带缓存）
      if (token.id) {
        const userId = token.id as string;
        const cached = roleCache.get(userId);
        const now = Date.now();

        if (!cached || now - cached.updatedAt > ROLE_CACHE_TTL) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: parseInt(userId) },
              include: { userGroup: true },
            });
            if (dbUser) {
              token.role = dbUser.role;
              token.userGroupId = dbUser.userGroupId.toString();
              token.isAdmin = dbUser.userGroup?.isAdmin ?? false;
              roleCache.set(userId, { role: dbUser.role, userGroupId: dbUser.userGroupId, isAdmin: dbUser.userGroup?.isAdmin ?? false, updatedAt: now });
            }
          } catch { /* DB 不可用时保持现有 token 值 */ }
        } else {
          token.role = cached.role;
          token.userGroupId = cached.userGroupId.toString();
          token.isAdmin = cached.isAdmin;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.userGroupId = token.userGroupId as string;
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
});
