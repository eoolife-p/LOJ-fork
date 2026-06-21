import type { Metadata } from "next";
import prisma from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const contest = await prisma.contest.findUnique({
      where: { id: parseInt(id) },
      select: { title: true },
    });
    if (contest) {
      return {
        title: `${contest.title} - 比赛`,
        description: `${contest.title}，在线编程竞赛。`,
        openGraph: {
          title: `${contest.title} - 比赛`,
          description: `在线编程竞赛：${contest.title}`,
        },
      };
    }
  } catch {}
  return { title: "比赛详情" };
}

export default function ContestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
