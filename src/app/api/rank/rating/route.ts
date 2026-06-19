import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const users = await prisma.user.findMany({ select: { id: true, name: true, avatar: true } });
  const ratings = await prisma.ratingHistory.findMany({ orderBy: { createdAt: "desc" } });
  const latest = new Map<number, { rating: number; maxRating: number; contests: number }>();
  for (const r of ratings) {
    if (!latest.has(r.userId)) latest.set(r.userId, { rating: r.rating, maxRating: r.rating, contests: 1 });
    else { const cur = latest.get(r.userId)!; cur.rating = r.rating; cur.maxRating = Math.max(cur.maxRating, r.rating); cur.contests++; }
  }
  const result = users.filter(u => latest.has(u.id)).map(u => {
    const r = latest.get(u.id)!;
    return { id: u.id, name: u.name, avatar: u.avatar, rating: r.rating, maxRating: r.maxRating, contests: r.contests };
  }).sort((a, b) => b.rating - a.rating);
  return NextResponse.json({ users: result });
}
