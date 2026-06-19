import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getJudgeEngine } from "@/lib/judge";
import { getJudgeConfig } from "@/lib/judge-config";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.isAdmin)
    return NextResponse.json({ error: "无权限" }, { status: 403 });

  const { id } = await params;
  const problemId = parseInt(id);

  const problem = await prisma.problem.findUnique({ where: { id: problemId } });
  if (!problem) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const submissions = await prisma.submission.findMany({ where: { problemId } });
  if (submissions.length === 0)
    return NextResponse.json({ message: "没有需要重判的提交" });

  let testCases: { input: string; output: string }[] = [];
  try {
    testCases = JSON.parse(problem.testCases);
  } catch {
    return NextResponse.json({ error: "测试用例解析失败" }, { status: 500 });
  }

  const engine = getJudgeEngine(await getJudgeConfig());
  let rejudged = 0;

  for (const sub of submissions) {
    let passed = 0;
    let time = 0;
    let mem = 0;
    let status = "AC";
    for (const tc of testCases) {
      const result = await engine.submit(
        sub.code,
        sub.language,
        tc.input,
        tc.output,
        problem.timeLimit,
        problem.memoryLimit
      );
      time += result.time;
      mem = Math.max(mem, result.memory);
      if (result.status === "AC") passed++;
      else if (status === "AC") status = result.status;
    }
    await prisma.submission.update({
      where: { id: sub.id },
      data: {
        status,
        time,
        memory: mem,
        stdout: passed === testCases.length ? "All passed" : null,
        stderr: status === "AC" ? null : `${passed}/${testCases.length}`,
      },
    });
    rejudged++;
  }

  return NextResponse.json({ message: `重判完成：${rejudged} 条提交` });
}
