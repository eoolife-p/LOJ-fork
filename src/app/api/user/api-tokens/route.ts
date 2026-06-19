import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const tokens = await prisma.apiToken.findMany({
    where: { userId: parseInt(session.user.id) },
    select: { id: true, name: true, token: true, scopes: true, createdAt: true, lastUsed: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ tokens });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const userId = parseInt(session.user.id);
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { userGroup: true } });
  if (!user?.userGroup?.allowApiTokens) return NextResponse.json({ error: "你所在的用户组不允许创建 API Token" }, { status: 403 });
  const count = await prisma.apiToken.count({ where: { userId } });
  if (count >= 10) return NextResponse.json({ error: "最多创建 10 个 Token" }, { status: 400 });
  const body = await request.json() as { name: string };
  if (!body.name?.trim()) return NextResponse.json({ error: "请输入 Token 名称" }, { status: 400 });
  const token = "loj_" + crypto.randomBytes(32).toString("hex");
  const created = await prisma.apiToken.create({
    data: { userId, name: body.name.trim(), token, scopes: "[]" },
    select: { id: true, name: true, token: true, scopes: true, createdAt: true },
  });
  return NextResponse.json(created, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id") || "0");
  const token = await prisma.apiToken.findUnique({ where: { id } });
  if (!token || token.userId !== parseInt(session.user.id)) return NextResponse.json({ error: "Token 不存在" }, { status: 404 });
  await prisma.apiToken.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
