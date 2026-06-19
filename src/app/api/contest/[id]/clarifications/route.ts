import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id ? parseInt(session.user.id) : null;
  const contestId = parseInt(id);
  const clarifications = await prisma.contestClarification.findMany({
    where: { contestId, OR: [{ isPublic: true }, ...(userId ? [{ userId }] : [])] },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ clarifications });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "请先登录" }, { status: 401 });
  const contestId = parseInt(id);
  const body = await request.json() as { question: string };
  if (!body.question?.trim()) return NextResponse.json({ error: "请输入问题" }, { status: 400 });
  const clarification = await prisma.contestClarification.create({
    data: { contestId, userId: parseInt(session.user.id), question: body.question.trim() },
  });
  return NextResponse.json(clarification, { status: 201 });
}
