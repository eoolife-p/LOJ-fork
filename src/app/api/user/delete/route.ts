import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const userId = parseInt(session.user.id);
  const { confirm } = (await request.json()) as { confirm?: string };

  if (confirm !== "DELETE") {
    return NextResponse.json({ error: "请输入 DELETE 确认" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ success: true });
}
