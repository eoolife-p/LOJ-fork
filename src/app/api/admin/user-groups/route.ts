import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  try {
    const groups = await prisma.userGroup.findMany({
      orderBy: { priority: "desc" },
    });
    return NextResponse.json({ groups });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "服务器错误";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  try {
    const body = (await req.json()) as {
      name: string;
      isAdmin?: boolean;
      allowApiTokens?: boolean;
      storageLimit?: number;
      color?: string;
      priority?: number;
    };

    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json({ error: "名称不能为空" }, { status: 400 });
    }

    const group = await prisma.userGroup.create({
      data: {
        name: body.name.trim(),
        isAdmin: body.isAdmin ?? false,
        allowApiTokens: body.allowApiTokens ?? true,
        storageLimit: body.storageLimit ?? 2147483647,
        color: body.color || "#64748b",
        priority: body.priority ?? 0,
      },
    });

    return NextResponse.json({ group });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "创建失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  try {
    const body = (await req.json()) as {
      id: number;
      name?: string;
      isAdmin?: boolean;
      allowApiTokens?: boolean;
      storageLimit?: number;
      color?: string;
      priority?: number;
    };

    if (!body.id) {
      return NextResponse.json({ error: "缺少 ID" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name.trim();
    if (body.isAdmin !== undefined) data.isAdmin = body.isAdmin;
    if (body.allowApiTokens !== undefined) data.allowApiTokens = body.allowApiTokens;
    if (body.storageLimit !== undefined) data.storageLimit = body.storageLimit;
    if (body.color !== undefined) data.color = body.color;
    if (body.priority !== undefined) data.priority = body.priority;

    const group = await prisma.userGroup.update({
      where: { id: body.id },
      data,
    });

    return NextResponse.json({ group });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "更新失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "0");
    if (!id) return NextResponse.json({ error: "缺少 ID" }, { status: 400 });

    // 检查是否有用户属于该组
    const userCount = await prisma.user.count({ where: { userGroupId: id } });
    if (userCount > 0) {
      return NextResponse.json({ error: "该用户组下仍有用户，无法删除" }, { status: 400 });
    }

    await prisma.userGroup.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "删除失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
