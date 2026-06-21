import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getJudgeEngine } from "@/lib/judge";
import { getJudgeConfig } from "@/lib/judge-config";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user.isAdmin) return NextResponse.json({ error: "无权限" }, { status: 403 });

  const { submissionId } = await request.json() as { submissionId: number };
  if (!submissionId) return NextResponse.json({ error: "缺少提交ID" }, { status: 400 });

  const sub = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { problem: { select: { testCases: true, timeLimit: true, memoryLimit: true, spjLanguage: true, spjCode: true } } },
  });
  if (!sub) return NextResponse.json({ error: "提交不存在" }, { status: 404 });

  try {
    const testCases = JSON.parse(sub.problem.testCases || "[]") as { input: string; output: string }[];
    if (!testCases.length) return NextResponse.json({ error: "题目无测试用例" }, { status: 400 });

    const config = await getJudgeConfig();
    const engine = getJudgeEngine(config);

    let finalStatus = "AC";
    let totalTime = 0;
    let totalMemory = 0;
    let finalStdout = "";
    let finalStderr = "";

    for (const tc of testCases) {
      const result = await engine.submit(
        sub.code, sub.language, tc.input, tc.output,
        sub.problem.timeLimit || 5,
        sub.problem.memoryLimit || 256
      );
      totalTime = Math.max(totalTime, result.time || 0);
      totalMemory = Math.max(totalMemory, result.memory || 0);
      if (result.status !== "AC") {
        finalStatus = result.status;
        finalStdout = result.stdout || "";
        finalStderr = result.stderr || "";
        break;
      }
    }

    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: finalStatus,
        stdout: finalStdout,
        stderr: finalStderr,
        time: totalTime,
        memory: totalMemory,
      },
    });

    return NextResponse.json({ success: true, status: finalStatus });
  } catch {
    return NextResponse.json({ error: "重测失败" }, { status: 500 });
  }
}
