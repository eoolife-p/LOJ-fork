import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isValidJson, ALLOWED_DIFFICULTIES, MAX_FIELD_LENGTH } from "@/lib/security";

export async function POST(request: Request) {
  const session = await auth();
  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = (await request.json()) as {
    title: string;
    slug: string;
    difficulty: string;
    description: string;
    inputDesc: string;
    outputDesc: string;
    sampleInput: string;
    sampleOutput: string;
    selfTestSamples?: string;
    testCases: string;
    timeLimit?: number;
    memoryLimit?: number;
    tags?: string;
    aiMode?: string;
    editorial?: string;
    spjLanguage?: string;
    spjCode?: string;
  };

  // 字段完整性校验
  if (!body.title || !body.slug || !body.difficulty || !body.testCases) {
    return NextResponse.json({ error: "标题、标识、难度和测试用例为必填" }, { status: 400 });
  }

  // 难度白名单
  if (!ALLOWED_DIFFICULTIES.includes(body.difficulty)) {
    return NextResponse.json({ error: "难度不合法" }, { status: 400 });
  }

  // testCases JSON 校验
  if (!isValidJson(body.testCases)) {
    return NextResponse.json({ error: "测试用例必须为合法 JSON" }, { status: 400 });
  }
  const parsedTestCases = JSON.parse(body.testCases);
  if (!Array.isArray(parsedTestCases) || parsedTestCases.length === 0) {
    return NextResponse.json({ error: "测试用例必须为非空数组" }, { status: 400 });
  }

  // selfTestSamples JSON 校验
  if (body.selfTestSamples && !isValidJson(body.selfTestSamples)) {
    return NextResponse.json({ error: "自测样例必须为合法 JSON" }, { status: 400 });
  }

  // tags JSON 校验
  if (body.tags && !isValidJson(body.tags)) {
    return NextResponse.json({ error: "标签必须为合法 JSON" }, { status: 400 });
  }

  // 大字段长度校验
  if (body.description && body.description.length > MAX_FIELD_LENGTH) {
    return NextResponse.json({ error: "题目描述过长" }, { status: 400 });
  }
  if (body.testCases.length > MAX_FIELD_LENGTH) {
    return NextResponse.json({ error: "测试用例过长" }, { status: 400 });
  }

  // 数值范围校验
  const timeLimit = body.timeLimit || 5;
  const memoryLimit = body.memoryLimit || 256;
  if (timeLimit < 1 || timeLimit > 60) {
    return NextResponse.json({ error: "时间限制不合法（1-60秒）" }, { status: 400 });
  }
  if (memoryLimit < 1 || memoryLimit > 1024) {
    return NextResponse.json({ error: "内存限制不合法（1-1024MB）" }, { status: 400 });
  }

  const problem = await prisma.problem.create({
    data: {
      title: body.title,
      slug: body.slug,
      difficulty: body.difficulty,
      description: body.description,
      inputDesc: body.inputDesc,
      outputDesc: body.outputDesc,
      sampleInput: body.sampleInput,
      sampleOutput: body.sampleOutput,
      selfTestSamples: body.selfTestSamples || "[]",
      testCases: body.testCases,
      timeLimit,
      memoryLimit,
      tags: body.tags || "[]",
      aiMode: body.aiMode || "",
      editorial: body.editorial || "",
      spjLanguage: body.spjLanguage || "",
      spjCode: body.spjCode || "",
    },
  });

  return NextResponse.json(problem, { status: 201 });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = (await request.json()) as {
    id: number;
    title?: string;
    slug?: string;
    difficulty?: string;
    description?: string;
    inputDesc?: string;
    outputDesc?: string;
    sampleInput?: string;
    sampleOutput?: string;
    selfTestSamples?: string;
    testCases?: string;
    timeLimit?: number;
    memoryLimit?: number;
    tags?: string;
    aiMode?: string;
    editorial?: string;
    spjLanguage?: string;
    spjCode?: string;
  };

  const { id, ...data } = body;

  if (!id || isNaN(id)) {
    return NextResponse.json({ error: "无效的题目 ID" }, { status: 400 });
  }

  // 难度白名单
  if (data.difficulty && !ALLOWED_DIFFICULTIES.includes(data.difficulty)) {
    return NextResponse.json({ error: "难度不合法" }, { status: 400 });
  }

  // testCases JSON 校验
  if (data.testCases && !isValidJson(data.testCases)) {
    return NextResponse.json({ error: "测试用例必须为合法 JSON" }, { status: 400 });
  }

  // selfTestSamples JSON 校验
  if (data.selfTestSamples && !isValidJson(data.selfTestSamples)) {
    return NextResponse.json({ error: "自测样例必须为合法 JSON" }, { status: 400 });
  }

  // tags JSON 校验
  if (data.tags && !isValidJson(data.tags)) {
    return NextResponse.json({ error: "标签必须为合法 JSON" }, { status: 400 });
  }

  // 数值范围校验
  if (data.timeLimit !== undefined && (data.timeLimit < 1 || data.timeLimit > 60)) {
    return NextResponse.json({ error: "时间限制不合法（1-60秒）" }, { status: 400 });
  }
  if (data.memoryLimit !== undefined && (data.memoryLimit < 1 || data.memoryLimit > 1024)) {
    return NextResponse.json({ error: "内存限制不合法（1-1024MB）" }, { status: 400 });
  }

  const problem = await prisma.problem.update({
    where: { id },
    data,
  });

  return NextResponse.json(problem);
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = parseInt(searchParams.get("id") || "0");

  if (!id || isNaN(id)) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  await prisma.problem.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
