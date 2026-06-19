import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getJudgeEngine } from "@/lib/judge";
import { getJudgeConfig } from "@/lib/judge-config";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;
  const contestId = parseInt(id);
  if (isNaN(contestId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = (await request.json()) as { submissionId: number; testInput: string };
  const { submissionId, testInput } = body;
  if (!submissionId || !testInput) {
    return NextResponse.json({ error: "submissionId and testInput are required" }, { status: 400 });
  }

  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    select: { allowHack: true, id: true },
  });
  if (!contest) return NextResponse.json({ error: "Contest not found" }, { status: 404 });
  if (!contest.allowHack) {
    return NextResponse.json({ error: "Hack is not allowed for this contest" }, { status: 403 });
  }

  const submission = await prisma.contestSubmission.findFirst({
    where: { id: submissionId, contestId },
    include: { problem: true },
  });
  if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });

  if (submission.userId === parseInt(session.user.id)) {
    return NextResponse.json({ error: "不能 Hack 自己的提交" }, { status: 400 });
  }

  const hack = await prisma.hack.create({
    data: {
      contestId,
      submissionId,
      hackerId: parseInt(session.user.id),
      testInput,
      verdict: "Pending",
    },
  });

  try {
    const config = await getJudgeConfig();
    const engine = getJudgeEngine(config);
    const result = await engine.submit(
      submission.code,
      submission.language,
      testInput,
      "",
      submission.problem.timeLimit,
      submission.problem.memoryLimit
    );

    const statusMapping: Record<string, string> = {
      AC: "Success",
      WA: "Success",
      CE: "Invalid",
      RE: "Success",
      TLE: "Success",
      MLE: "Success",
      PAC: "Success",
    };
    const verdict = statusMapping[result.status] || "Pending";

    if (result.status === "AC" || result.status === "WA") {
      const expected = testInput;
      const got = result.stdout;
      const normalizedExpected = expected.trim().replace(/\r\n/g, "\n");
      const normalizedGot = got.trim().replace(/\r\n/g, "\n");
      if (normalizedExpected === normalizedGot) {
        await prisma.hack.update({
          where: { id: hack.id },
          data: { verdict: "Invalid" },
        });
        return NextResponse.json({ ...hack, verdict: "Invalid", message: "输出与预期一致，非有效 Hack" });
      }
    }

    await prisma.hack.update({
      where: { id: hack.id },
      data: { verdict },
    });

    return NextResponse.json({ ...hack, verdict, result });
  } catch {
    await prisma.hack.update({
      where: { id: hack.id },
      data: { verdict: "Error" },
    });
    return NextResponse.json({ ...hack, verdict: "Error" }, { status: 500 });
  }
}
