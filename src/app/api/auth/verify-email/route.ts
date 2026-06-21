import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { token: string };
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "缺少验证令牌" }, { status: 400 });
    }

    const record = await prisma.emailVerification.findUnique({ where: { token } });
    if (!record) {
      return NextResponse.json({ error: "无效的验证链接" }, { status: 400 });
    }

    if (new Date(record.expiresAt) < new Date()) {
      await prisma.emailVerification.delete({ where: { id: record.id } });
      return NextResponse.json({ error: "验证链接已过期，请重新发送" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: record.userId },
      data: { emailVerified: true },
    });

    await prisma.emailVerification.delete({ where: { id: record.id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "验证失败，请重试" }, { status: 500 });
  }
}
