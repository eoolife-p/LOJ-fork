import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { validatePasswordStrength, containsHtml, MAX_NAME_LENGTH } from "@/lib/security";
import { seedDefaultData } from "@/lib/seed-data";
import { autoMigrate } from "@/lib/migrate";

// 确保管理员组和默认用户组存在，返回管理员组
async function ensureGroups(prisma: any) {
  let adminGroup = await prisma.userGroup.findFirst({ where: { isAdmin: true } });
  if (!adminGroup) {
    adminGroup = await prisma.userGroup.create({
      data: { name: "管理员", isAdmin: true, color: "#ef4444", priority: 100 },
    });
  }
  const defaultGroup = await prisma.userGroup.findFirst({ where: { isDefault: true } });
  if (!defaultGroup) {
    await prisma.userGroup.create({
      data: { name: "默认用户", isDefault: true, color: "#64748b", priority: 0 },
    });
  }
  return adminGroup;
}

export async function GET() {
  try {
    const adminCount = await prisma.user.count({ where: { userGroup: { isAdmin: true } } });
    return NextResponse.json({ needsInit: adminCount === 0 });
  } catch (e) {
    // 尝试建表
    const migrateOk = await autoMigrate(prisma).then(() => true).catch(() => false);
    // 返回详细状态
    return NextResponse.json({
      needsInit: true,
      dbStatus: {
        hasTurso: !!process.env.TURSO_DATABASE_URL,
        hasSupabase: !!(process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("postgres")),
        hasD1: !!(globalThis as any).DB,
        migrateOk,
        error: e instanceof Error ? e.message : String(e),
      },
    });
  }
}

export async function POST(request: Request) {
  try {
    // 自动建表（如果还没有）
    try { await autoMigrate(prisma); } catch {}
    
    // 安全检查：如果系统已有管理员，需要管理员权限才能操作
    const existingAdminCount = await prisma.user.count({ where: { userGroup: { isAdmin: true }, deletedAt: null } });
    if (existingAdminCount > 0) {
      const session = await auth();
      if (!session || !session.user.isAdmin) {
        return NextResponse.json({ error: "系统已初始化，需要管理员权限" }, { status: 403 });
      }
    }

    // 没有管理员：直接执行（Turso/D1 不支持事务）
    const adminCount = await prisma.user.count({ where: { userGroup: { isAdmin: true } } });
    if (adminCount > 0) {
      return NextResponse.json({ error: "系统已初始化" }, { status: 400 });
    }

    const adminGroup = await ensureGroups(prisma);

    const body = (await request.json()) as {
      mode: "existing" | "new";
      userId?: number;
      name?: string;
      email?: string;
      password?: string;
    };

    let adminId: number;

    if (body.mode === "existing" && body.userId) {
      const user = await prisma.user.findUnique({ where: { id: body.userId } });
      if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 400 });
      await prisma.user.update({
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
      if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });
      const existing = await prisma.user.findUnique({
        where: { email: body.email.trim().toLowerCase() },
      });
      if (existing) return NextResponse.json({ error: "邮箱已注册" }, { status: 400 });
      const hashed = await bcrypt.hash(body.password, 10);
      const created = await prisma.user.create({
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

    const settingsCount = await prisma.settings.count();
    if (settingsCount === 0) {
      await prisma.settings.create({ data: {} });
    }
    await seedDefaultData(prisma, adminId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Init error:", err);
    return NextResponse.json({ error: "初始化失败" }, { status: 500 });
  }
}
