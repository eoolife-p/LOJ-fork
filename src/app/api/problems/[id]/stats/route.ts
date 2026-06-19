import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const problemId = parseInt(id);
  if (isNaN(problemId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const submissions = await prisma.submission.findMany({
    where: { problemId },
    select: { status: true, language: true },
  });

  const total = submissions.length;
  const acCount = submissions.filter((s) => s.status === "AC").length;
  const acceptRate = total > 0 ? (acCount / total) * 100 : 0;

  const statusBreakdown: Record<string, number> = {};
  for (const s of submissions) {
    statusBreakdown[s.status] = (statusBreakdown[s.status] || 0) + 1;
  }

  const languageDist: Record<string, number> = {};
  for (const s of submissions) {
    languageDist[s.language] = (languageDist[s.language] || 0) + 1;
  }

  return NextResponse.json({
    totalSubmissions: total,
    acCount,
    acceptRate: Math.round(acceptRate * 100) / 100,
    statusBreakdown,
    languageDistribution: languageDist,
  });
}
