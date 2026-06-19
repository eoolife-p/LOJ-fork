import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

function tokenize(code: string): string[] {
  return code
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/"[^"]*"/g, '"str"')
    .replace(/'[^']*'/g, "'str'")
    .replace(/\s+/g, " ")
    .trim()
    .split(/\b/)
    .filter(Boolean);
}

function lcsSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 100;
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  const lcsLen = dp[m][n];
  const maxLen = Math.max(m, n);
  return maxLen > 0 ? (lcsLen / maxLen) * 100 : 0;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { contestId } = (await request.json()) as { contestId: number };
  if (!contestId) return NextResponse.json({ error: "contestId is required" }, { status: 400 });

  const submissions = await prisma.contestSubmission.findMany({
    where: { contestId },
    select: { id: true, code: true },
  });

  if (submissions.length < 2) {
    return NextResponse.json({ pairsFound: 0 });
  }

  const tokens: { id: number; tokens: string[] }[] = submissions.map((s) => ({
    id: s.id,
    tokens: tokenize(s.code),
  }));

  const threshold = 50;
  const reports: { submissionId: number; similarToId: number; similarity: number }[] = [];

  for (let i = 0; i < tokens.length; i++) {
    for (let j = i + 1; j < tokens.length; j++) {
      const sim = lcsSimilarity(tokens[i].tokens, tokens[j].tokens);
      if (sim > threshold) {
        reports.push({
          submissionId: tokens[i].id,
          similarToId: tokens[j].id,
          similarity: Math.round(sim * 100) / 100,
        });
      }
    }
  }

  if (reports.length > 0) {
    await prisma.plagiarismReport.createMany({ data: reports });
  }

  return NextResponse.json({ pairsFound: reports.length });
}
