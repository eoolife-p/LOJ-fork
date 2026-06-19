import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(_req: Request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const reports = await prisma.plagiarismReport.findMany({
    orderBy: { similarity: "desc" },
  });

  const submissionIds = [...new Set(reports.flatMap((r) => [r.submissionId, r.similarToId]))];
  const submissions = await prisma.contestSubmission.findMany({
    where: { id: { in: submissionIds } },
    select: { id: true, userId: true, language: true, status: true, contestId: true },
  });
  const subMap = new Map(submissions.map((s) => [s.id, s]));

  const userIds = [...new Set(submissions.map((s) => s.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  });
  const userNameMap = new Map(users.map((u) => [u.id, u.name]));

  return NextResponse.json({
    reports: reports.map((r) => ({
      ...r,
      submission: subMap.get(r.submissionId) || null,
      similarTo: subMap.get(r.similarToId) || null,
      submissionUserName: userNameMap.get(subMap.get(r.submissionId)?.userId ?? 0) || "Unknown",
      similarToUserName: userNameMap.get(subMap.get(r.similarToId)?.userId ?? 0) || "Unknown",
    })),
  });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { id } = (await request.json()) as { id: number };
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await prisma.plagiarismReport.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
