import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const problemId = parseInt(searchParams.get("problemId") || "0");
  if (!problemId) return NextResponse.json({ error: "缺少题目ID" }, { status: 400 });

  const list = await prisma.editorial.findMany({
    where: { problemId },
    include: { user: { select: { id: true, name: true, avatar: true } } },
    orderBy: { upvotes: "desc" },
  });
  return NextResponse.json(list);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user.id) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { problemId, content } = await request.json() as { problemId: number; content: string };
  if (!problemId || !content?.trim()) return NextResponse.json({ error: "内容不能为空" }, { status: 400 });

  const editorial = await prisma.editorial.create({
    data: { problemId, userId: Number(session.user.id), content },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });
  return NextResponse.json(editorial, { status: 201 });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user.id) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const { id, content, action } = await request.json() as { id: number; content?: string; action?: string };
  if (!id) return NextResponse.json({ error: "缺少ID" }, { status: 400 });

  if (action === "upvote") {
    await prisma.editorial.update({ where: { id }, data: { upvotes: { increment: 1 } } });
    return NextResponse.json({ success: true });
  }

  if (content !== undefined) {
    const item = await prisma.editorial.findUnique({ where: { id } });
    if (!item || item.userId !== Number(session.user.id)) {
      return NextResponse.json({ error: "只能编辑自己的题解" }, { status: 403 });
    }
    await prisma.editorial.update({ where: { id }, data: { content } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "无效操作" }, { status: 400 });
}
