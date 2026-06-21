import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const list = await prisma.announcement.findMany({
    where: { isActive: true },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(list);
}
