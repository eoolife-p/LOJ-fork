import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user.isAdmin) return NextResponse.json({ error: "无权限" }, { status: 403 });
  const tags = await prisma.tag.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(tags);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user.isAdmin) return NextResponse.json({ error: "无权限" }, { status: 403 });
  const { name, color } = await request.json() as { name: string; color?: string };
  if (!name?.trim()) return NextResponse.json({ error: "标签名不能为空" }, { status: 400 });
  if (name.length > 20) return NextResponse.json({ error: "标签名过长" }, { status: 400 });
  const existing = await prisma.tag.findUnique({ where: { name } });
  if (existing) return NextResponse.json({ error: "标签已存在" }, { status: 409 });
  const tag = await prisma.tag.create({ data: { name: name.trim(), color: color || "#64748b" } });
  return NextResponse.json(tag, { status: 201 });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user.isAdmin) return NextResponse.json({ error: "无权限" }, { status: 403 });
  const { id, name, color } = await request.json() as { id: number; name?: string; color?: string };
  if (!id) return NextResponse.json({ error: "缺少标签 ID" }, { status: 400 });
  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (color !== undefined) data.color = color;
  const tag = await prisma.tag.update({ where: { id }, data });
  return NextResponse.json(tag);
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user.isAdmin) return NextResponse.json({ error: "无权限" }, { status: 403 });
  const { id } = await request.json() as { id: number };
  if (!id) return NextResponse.json({ error: "缺少标签 ID" }, { status: 400 });
  await prisma.tag.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
