import type { Metadata } from "next";
import prisma from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const problem = await prisma.problem.findUnique({
      where: { id: parseInt(id) },
      select: { title: true, difficulty: true },
    });
    if (problem) {
      return {
        title: `${problem.title} - 题目`,
        description: `${problem.title}，难度 ${problem.difficulty}，在线评测编程题目。`,
        openGraph: {
          title: `${problem.title} - 题目`,
          description: `在线评测编程题目：${problem.title}，难度 ${problem.difficulty}`,
        },
      };
    }
  } catch {}
  return { title: "题目详情" };
}

export default function ProblemLayout({ children }: { children: React.ReactNode }) {
  return children;
}
