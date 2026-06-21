import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sanitizePage, sanitizePageSize } from "@/lib/security";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // CVE-13: 分页参数边界校验
  const page = sanitizePage(searchParams.get("page"));
  const pageSize = sanitizePageSize(searchParams.get("pageSize"));
  const difficulty = searchParams.get("difficulty") || undefined;
  const keyword = searchParams.get("keyword") || undefined;
  const tag = searchParams.get("tag") || undefined;

  const where: Record<string, unknown> = {};
  if (difficulty) where.difficulty = difficulty;
  if (keyword) {
    where.OR = [
      { title: { contains: keyword } },
      { pinyin: { contains: keyword } },
    ];
  }
  if (tag) {
    where.tags = { contains: tag };
  }

  const [problems, total] = await Promise.all([
    prisma.problem.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        difficulty: true,
        tags: true,
        createdAt: true,
        _count: { select: { submissions: true } },
      },
      orderBy: { id: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.problem.count({ where }),
  ]);

  return NextResponse.json({ problems, total, page, pageSize });
}
