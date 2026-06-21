import type { Metadata } from "next";
import prisma from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const training = await prisma.training.findUnique({
      where: { id: parseInt(id) },
      select: { title: true },
    });
    if (training) {
      return {
        title: `${training.title} - 训练`,
        description: `${training.title}，在线编程训练题单。`,
        openGraph: {
          title: `${training.title} - 训练`,
          description: `在线编程训练题单：${training.title}`,
        },
      };
    }
  } catch {}
  return { title: "训练详情" };
}

export default function TrainingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
