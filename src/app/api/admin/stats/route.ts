import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user.isAdmin) return NextResponse.json({ error: "无权限" }, { status: 403 });

  const [
    userCount, problemCount, submissionCount, acCount,
    contestCount, discussionCount, trainingCount,
    todaySubmissions, todayUsers,
    recentSubmissions,
    waCount, ceCount, reCount, tleCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.problem.count(),
    prisma.submission.count(),
    prisma.submission.count({ where: { status: "AC" } }),
    prisma.contest.count(),
    prisma.discussion.count(),
    prisma.training.count(),
    prisma.submission.count({
      where: { createdAt: { gte: new Date(Date.now() - 86400000) } },
    }),
    prisma.user.count({
      where: { createdAt: { gte: new Date(Date.now() - 86400000) } },
    }),
    prisma.submission.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true, status: true, language: true, createdAt: true,
        problem: { select: { id: true, title: true } },
        user: { select: { id: true, name: true } },
      },
    }),
    prisma.submission.count({ where: { status: "WA" } }),
    prisma.submission.count({ where: { status: "CE" } }),
    prisma.submission.count({ where: { status: "RE" } }),
    prisma.submission.count({ where: { status: "TLE" } }),
  ]);

  return NextResponse.json({
    userCount, problemCount, submissionCount, acCount,
    contestCount, discussionCount, trainingCount,
    todaySubmissions, todayUsers,
    recentSubmissions,
    statusCounts: [
      { name: "AC", count: acCount, color: "#22c55e" },
      { name: "WA", count: waCount, color: "#ef4444" },
      { name: "CE", count: ceCount, color: "#f59e0b" },
      { name: "RE", count: reCount, color: "#f97316" },
      { name: "TLE", count: tleCount, color: "#8b5cf6" },
    ],
  });
}
