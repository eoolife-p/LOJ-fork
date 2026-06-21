import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user.isAdmin) return NextResponse.json({ error: "无权限" }, { status: 403 });
  const list = await prisma.announcement.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(list);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user.isAdmin) return NextResponse.json({ error: "无权限" }, { status: 403 });
  const { title, content, isActive, priority } = await request.json() as {
    title: string; content?: string; isActive?: boolean; priority?: number;
  };
  if (!title?.trim()) return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
  const a = await prisma.announcement.create({
    data: { title, content: content || "", isActive: isActive ?? true, priority: priority ?? 0 },
  });
  return NextResponse.json(a, { status: 201 });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user.isAdmin) return NextResponse.json({ error: "无权限" }, { status: 403 });
  const { id, title, content, isActive, priority } = await request.json() as {
    id: number; title?: string; content?: string; isActive?: boolean; priority?: number;
  };
  if (!id) return NextResponse.json({ error: "缺少 ID" }, { status: 400 });
  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = title;
  if (content !== undefined) data.content = content;
  if (isActive !== undefined) data.isActive = isActive;
  if (priority !== undefined) data.priority = priority;
  const a = await prisma.announcement.update({ where: { id }, data });
  return NextResponse.json(a);
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user.isAdmin) return NextResponse.json({ error: "无权限" }, { status: 403 });
  const { id } = await request.json() as { id: number };
  await prisma.announcement.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
