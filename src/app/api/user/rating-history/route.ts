import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "未登录" }, { status: 401 });

  const history = await prisma.ratingHistory.findMany({
    where: { userId: parseInt(session.user.id) },
    orderBy: { createdAt: "asc" },
    select: { rating: true, change: true, rank: true, createdAt: true },
  });

  return NextResponse.json({ history });
}
