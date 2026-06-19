"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Medal, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingUser {
  id: number;
  name: string;
  avatar: string | null;
  rating: number;
  maxRating: number;
  contests: number;
}

function getRatingColor(rating: number) {
  if (rating >= 2400) return "text-red-500";
  if (rating >= 2100) return "text-orange-500";
  if (rating >= 1900) return "text-purple-500";
  if (rating >= 1600) return "text-blue-500";
  if (rating >= 1400) return "text-cyan-500";
  if (rating >= 1200) return "text-emerald-500";
  return "text-gray-400";
}

function getRatingLevel(rating: number) {
  if (rating >= 2400) return "Grandmaster";
  if (rating >= 2100) return "Master";
  if (rating >= 1900) return "Expert";
  if (rating >= 1600) return "Specialist";
  if (rating >= 1400) return "Pupil";
  if (rating >= 1200) return "Newbie";
  return "Unrated";
}

export default function RatingPage() {
  const [users, setUsers] = useState<RatingUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/rank/rating")
      .then((r) => r.json())
      .then((data) => setUsers(data.users || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Trophy className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rating 排行榜</h1>
          <p className="text-muted-foreground text-sm">根据比赛表现计算的用户等级分</p>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-center px-3 py-2.5 font-medium text-muted-foreground w-14">#</th>
              <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">用户</th>
              <th className="text-center px-3 py-2.5 font-medium text-muted-foreground w-20">Rating</th>
              <th className="text-center px-3 py-2.5 font-medium text-muted-foreground w-24">最高 Rating</th>
              <th className="text-center px-3 py-2.5 font-medium text-muted-foreground w-20">比赛数</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin inline" />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-muted-foreground">暂无数据</td>
              </tr>
            ) : (
              users.map((u, idx) => (
                <tr key={u.id} className="border-b hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-3 text-center">
                    {idx === 0 ? (
                      <Trophy className="h-4 w-4 text-yellow-500 inline" />
                    ) : idx === 1 ? (
                      <Medal className="h-4 w-4 text-gray-400 inline" />
                    ) : idx === 2 ? (
                      <Medal className="h-4 w-4 text-amber-600 inline" />
                    ) : (
                      <span className="text-muted-foreground">{idx + 1}</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <Link
                      href={`/profile/${u.id}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {u.name}
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={cn("font-bold", getRatingColor(u.rating))}>
                      {u.rating}
                    </span>
                    <span className={cn("text-[10px] ml-1", getRatingColor(u.rating))}>
                      ({getRatingLevel(u.rating)})
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={cn("font-medium", getRatingColor(u.maxRating))}>
                      {u.maxRating}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center text-muted-foreground">{u.contests}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
