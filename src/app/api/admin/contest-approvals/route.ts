import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user.isAdmin) return NextResponse.json({ error: "无权限" }, { status: 403 });
  const { searchParams } = new URL(request.url);
  const contestId = parseInt(searchParams.get("contestId") || "0");
  if (!contestId) return NextResponse.json({ error: "缺少比赛ID" }, { status: 400 });

  const list = await prisma.contestParticipant.findMany({
    where: { contestId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { joinedAt: "asc" },
  });
  return NextResponse.json(list);
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user.isAdmin) return NextResponse.json({ error: "无权限" }, { status: 403 });
  const { id, status } = await request.json() as { id: number; status: string };
  if (!id || !["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "无效参数" }, { status: 400 });
  }
  await prisma.contestParticipant.update({ where: { id }, data: { status } });
  return NextResponse.json({ success: true });
}
