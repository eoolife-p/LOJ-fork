import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const problemId = parseInt(id);
  if (isNaN(problemId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    include: { subtasks: { orderBy: { order: "asc" } } },
  });

  if (!problem) {
    return NextResponse.json({ error: "Problem not found" }, { status: 404 });
  }

  // CVE-1: 对非管理员隐藏 testCases（含隐藏测试用例和答案）
  const session = await auth();
  const isAdmin = session?.user?.isAdmin;

  if (!isAdmin) {
    const { testCases, ...publicData } = problem;
    return NextResponse.json(publicData);
  }

  return NextResponse.json(problem);
}
