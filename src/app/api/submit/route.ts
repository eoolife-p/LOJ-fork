import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getJudgeEngine } from "@/lib/judge";
import { getJudgeConfig } from "@/lib/judge-config";
import { auth } from "@/lib/auth";
import { validateCodeAndLanguage } from "@/lib/security";
import { dispatchWebhooks } from "@/lib/webhook-dispatch";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      problemId: number;
      code: string;
      language?: string;
    };

    const { problemId, code, language = "cpp" } = body;

    if (!problemId || !code) {
      return NextResponse.json(
        { error: "problemId and code are required" },
        { status: 400 }
      );
    }

    // CVE-11 + CVE-12: 代码长度限制 + 语言白名单
    const validationError = validateCodeAndLanguage(code, language);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const settings = await prisma.settings.findFirst();
    const userId = parseInt(session.user.id);

    // Check submit cooldown
    if (settings && settings.submitCooldown > 0) {
      const latest = await prisma.submission.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      if (latest) {
        const secondsSince =
          (Date.now() - new Date(latest.createdAt).getTime()) / 1000;
        if (secondsSince < settings.submitCooldown) {
          return NextResponse.json(
            {
              error: `提交太频繁，请等待 ${Math.ceil(
                settings.submitCooldown - secondsSince
              )} 秒`,
            },
            { status: 429 }
          );
        }
      }
    }

    // Check hourly limit
    if (settings && settings.maxSubmitsPerHour > 0) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const count = await prisma.submission.count({
        where: { userId, createdAt: { gte: oneHourAgo } },
      });
      if (count >= settings.maxSubmitsPerHour) {
        return NextResponse.json(
          { error: "每小时提交次数已达上限" },
          { status: 429 }
        );
      }
    }

    // Get problem
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
    });

    if (!problem) {
      return NextResponse.json(
        { error: "Problem not found" },
        { status: 404 }
      );
    }

    // Parse test cases with error handling
    let testCases: Array<{ input: string; output: string }>;
    try {
      testCases = JSON.parse(problem.testCases);
      if (!Array.isArray(testCases) || testCases.length === 0) {
        return NextResponse.json(
          { error: "No test cases configured" },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "题目测试用例配置错误" },
        { status: 500 }
      );
    }

    const engine = getJudgeEngine(await getJudgeConfig());

    // Run against all test cases
    let finalStatus = "AC";
    let stdout = "";
    let stderr = "";
    let totalTime = 0;
    let maxMemory = 0;
    let passedCount = 0;
    let failedResult: { status: string; stdout: string; stderr: string } | null = null;

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const result = await engine.submit(
        code,
        language,
        tc.input,
        tc.output,
        problem.timeLimit,
        problem.memoryLimit
      );

      totalTime += result.time;
      maxMemory = Math.max(maxMemory, result.memory);

      if (result.status === "AC") {
        passedCount++;
        stdout = result.stdout;
      } else {
        // Record the first failing result
        if (!failedResult) {
          failedResult = { status: result.status, stdout: result.stdout, stderr: result.stderr };
        }
        // Continue running remaining test cases for PAC detection
      }
    }

    if (passedCount === testCases.length) {
      // All passed
      finalStatus = "AC";
      stdout = "All test cases passed!";
      stderr = "";
    } else if (passedCount > 0 && failedResult) {
      // Some passed, some didn't → PAC (unless it's a CE which affects all)
      finalStatus = failedResult.status === "CE" ? "CE" : "PAC";
      stdout = "";
      if (finalStatus === "CE") {
        stderr = failedResult.stderr || "编译错误";
      } else {
        stderr = `通过了 ${passedCount}/${testCases.length} 个测试用例`;
      }
    } else if (failedResult) {
      // None passed
      finalStatus = failedResult.status;
      stdout = "";
      if (finalStatus === "CE") {
        stderr = failedResult.stderr || "编译错误";
      } else if (finalStatus === "WA") {
        stderr = "答案错误";
      } else if (finalStatus === "RE") {
        stderr = failedResult.stderr || "运行时错误";
      } else if (finalStatus === "TLE") {
        stderr = "运行超时";
      } else if (finalStatus === "MLE") {
        stderr = "内存超限";
      } else {
        stderr = failedResult.stderr || "";
      }
    }

    // Save submission
    const submission = await prisma.submission.create({
      data: {
        problemId,
        userId: parseInt(session.user.id),
        language,
        code,
        status: finalStatus,
        stdout,
        stderr,
        time: totalTime,
        memory: maxMemory,
      },
      select: {
        id: true,
        problemId: true,
        userId: true,
        language: true,
        status: true,
        time: true,
        memory: true,
        createdAt: true,
      },
    });

    // 触发 Webhook
    dispatchWebhooks("submission.created", {
      submissionId: submission.id,
      problemId: submission.problemId,
      userId: submission.userId,
      status: submission.status,
    }).catch(() => {});

    return NextResponse.json(submission);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
