import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const K = 32;
function expectedScore(ra: number, rb: number) { return 1 / (1 + Math.pow(10, (rb - ra) / 400)); }

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "无权限" }, { status: 403 });
  const { id } = await params;
  const contestId = parseInt(id);
  const participants = await prisma.contestParticipant.findMany({ where: { contestId }, orderBy: [{ score: "desc" }, { penalty: "asc" }] });
  const userIds = participants.map(p => p.userId);
  const ratings = await prisma.ratingHistory.findMany({ where: { userId: { in: userIds } }, orderBy: { createdAt: "desc" } });
  const map = new Map<number, number>();
  for (const r of ratings) { if (!map.has(r.userId)) map.set(r.userId, r.rating); }
  for (const p of participants) { if (!map.has(p.userId)) map.set(p.userId, 1500); }
  const changes = new Map<number, number>();
  const n = participants.length;
  for (let i = 0; i < n; i++) {
    let delta = 0;
    const ra = map.get(participants[i].userId)!;
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const rb = map.get(participants[j].userId)!;
      const expected = expectedScore(ra, rb);
      let actual = 0;
      if (i < j) actual = 1;
      delta += K * (actual - expected);
    }
    changes.set(participants[i].userId, Math.round(delta));
  }
  const records = participants.map((p, idx) => ({
    userId: p.userId, contestId, rating: (map.get(p.userId) ?? 1500) + (changes.get(p.userId) ?? 0),
    change: changes.get(p.userId) ?? 0, rank: idx + 1,
  }));
  await prisma.ratingHistory.createMany({ data: records });
  return NextResponse.json({ ok: true, count: records.length });
}
