import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { validatePasswordStrength, containsHtml, MAX_NAME_LENGTH } from "@/lib/security";
import { seedDefaultData } from "@/lib/seed-data";
import { autoMigrate } from "@/lib/migrate";

export async function GET() {
  try {
    const adminCount = await prisma.user.count({ where: { userGroup: { isAdmin: true } } });
    return NextResponse.json({ needsInit: adminCount === 0 });
  } catch {
    // 数据库为空（新 Turso），自动建表后返回需要初始化
    try { await autoMigrate(prisma); } catch {}
    return NextResponse.json({ needsInit: true });
  }
}

export async function POST(request: Request) {
  try {
    // 自动建表（如果还没有）
    try { await autoMigrate(prisma); } catch {}
    
    // 安全检查：如果系统已有管理员，需要管理员权限才能操作
    const existingAdminCount = await prisma.user.count({ where: { userGroup: { isAdmin: true } } });
    if (existingAdminCount > 0) {
      const session = await auth();
      if (!session || !session.user.isAdmin) {
        return NextResponse.json({ error: "系统已初始化，需要管理员权限" }, { status: 403 });
      }
    }

    // CVE-3A: 使用事务防止竞态条件
    return await prisma.$transaction(async (tx) => {
      const adminCount = await tx.user.count({ where: { userGroup: { isAdmin: true } } });
      if (adminCount > 0) {
        return NextResponse.json({ error: "系统已初始化" }, { status: 400 });
      }

      const body = (await request.json()) as {
        mode: "existing" | "new";
        userId?: number;
        name?: string;
        email?: string;
        password?: string;
      };

      let adminId: number;

      if (body.mode === "existing" && body.userId) {
        const user = await tx.user.findUnique({ where: { id: body.userId } });
        if (!user) {
          return NextResponse.json({ error: "用户不存在" }, { status: 400 });
        }
        const adminGroup = await tx.userGroup.findFirst({ where: { isAdmin: true } });
        if (!adminGroup) {
          return NextResponse.json({ error: "未找到管理员用户组" }, { status: 500 });
        }
        if (user.userGroupId === adminGroup.id) {
          return NextResponse.json({ error: "该用户已是管理员" }, { status: 400 });
        }
        await tx.user.update({
          where: { id: body.userId },
          data: { userGroupId: adminGroup.id, role: "admin" },
        });
        adminId = body.userId;
      } else if (body.mode === "new") {
        if (!body.name || !body.email || !body.password) {
          return NextResponse.json({ error: "信息不完整" }, { status: 400 });
        }
        if (body.name.length > MAX_NAME_LENGTH || containsHtml(body.name)) {
          return NextResponse.json({ error: "用户名不合法" }, { status: 400 });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.email)) {
          return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
        }
        const passwordError = validatePasswordStrength(body.password);
        if (passwordError) {
          return NextResponse.json({ error: passwordError }, { status: 400 });
        }
        const existing = await tx.user.findUnique({
          where: { email: body.email.trim().toLowerCase() },
        });
        if (existing) {
          return NextResponse.json({ error: "邮箱已注册" }, { status: 400 });
        }
        const adminGroup = await tx.userGroup.findFirst({ where: { isAdmin: true } });
        if (!adminGroup) {
          return NextResponse.json({ error: "未找到管理员用户组" }, { status: 500 });
        }
        const hashed = await bcrypt.hash(body.password, 10);
        const created = await tx.user.create({
          data: {
            name: body.name.trim(),
            email: body.email.trim(),
            password: hashed,
            role: "admin",
            userGroupId: adminGroup.id,
          },
        });
        adminId = created.id;
      } else {
        return NextResponse.json({ error: "参数错误" }, { status: 400 });
      }

      const settingsCount = await tx.settings.count();
      if (settingsCount === 0) {
        await tx.settings.create({ data: {} });
      }

      await seedDefaultData(tx, adminId);

      return NextResponse.json({ success: true });
    });
  } catch (err) {
    console.error("Init error:", err);
    return NextResponse.json({ error: "初始化失败" }, { status: 500 });
  }
}
