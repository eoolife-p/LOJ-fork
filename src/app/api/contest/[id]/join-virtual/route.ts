import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;
  const contestId = parseInt(id);
  if (isNaN(contestId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const contest = await prisma.contest.findUnique({ where: { id: contestId } });
  if (!contest) return NextResponse.json({ error: "Contest not found" }, { status: 404 });

  const now = new Date();
  const end = new Date(contest.endTime);
  if (now < end) {
    return NextResponse.json({ error: "比赛尚未结束，不能虚拟参赛" }, { status: 400 });
  }

  const userId = parseInt(session.user.id);
  const existing = await prisma.virtualParticipation.findUnique({
    where: { contestId_userId: { contestId, userId } },
  });
  if (existing) return NextResponse.json(existing);

  const duration = Math.round((end.getTime() - new Date(contest.startTime).getTime()) / 60000);
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + duration * 60000);

  const vp = await prisma.virtualParticipation.create({
    data: {
      contestId,
      userId,
      startTime,
      endTime,
    },
  });

  return NextResponse.json(vp, { status: 201 });
}
