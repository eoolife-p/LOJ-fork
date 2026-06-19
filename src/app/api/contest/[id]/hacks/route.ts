import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contestId = parseInt(id);
  if (isNaN(contestId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const session = await auth();
  const isAdmin = session?.user?.isAdmin;
  const userId = session?.user?.id ? parseInt(session.user.id) : null;

  const hacks = await prisma.hack.findMany({
    where: { contestId },
    orderBy: { createdAt: "desc" },
    include: {
      submission: {
        select: {
          id: true,
          userId: true,
          status: true,
          language: true,
          problem: { select: { title: true, order: true } },
        },
      },
    },
  });

  const userIds = [...new Set(hacks.map((h) => h.hackerId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  });
  const userNameMap = new Map(users.map((u) => [u.id, u.name]));

  const result = hacks.map((h) => ({
    id: h.id,
    contestId: h.contestId,
    submissionId: h.submissionId,
    hackerId: h.hackerId,
    hackerName: userNameMap.get(h.hackerId) || "Unknown",
    testInput: isAdmin || h.hackerId === userId ? h.testInput : "[隐藏]",
    verdict: h.verdict,
    createdAt: h.createdAt,
    submission: {
      id: h.submission.id,
      userId: h.submission.userId,
      status: h.submission.status,
      language: h.submission.language,
      problemTitle: h.submission.problem.title,
      problemOrder: h.submission.problem.order,
    },
  }));

  return NextResponse.json({ hacks: result });
}
