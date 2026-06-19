"use client";

import { useEffect, useState } from "react";
import { useFeatureGuard } from "@/lib/use-feature-guard";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Swords, ChevronLeft, ChevronRight, Clock, Users, Hash, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Contest {
  id: number;
  title: string;
  description: string;
  type: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: string;
  participantCount: number;
  problemCount: number;
}

const tabs = [
  { value: "", label: "全部" },
  { value: "upcoming", label: "未开始" },
  { value: "running", label: "进行中" },
  { value: "ended", label: "已结束" },
];

const statusConfig: Record<string, { label: string; className: string; dot: string }> = {
  upcoming: { label: "未开始", className: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  running: { label: "进行中", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", dot: "bg-emerald-500 animate-pulse" },
  ended: { label: "已结束", className: "bg-foreground/5 text-foreground", dot: "bg-foreground" },
};

function formatDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export default function ContestPage() {
  useFeatureGuard("contestEnabled");
  const { data: session } = useSession();
  const router = useRouter();
  const [contests, setContests] = useState<Contest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [status, setStatus] = useState("");

  const isAdmin = session?.user?.isAdmin;

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("pageSize", pageSize.toString());
    if (status) params.set("status", status);

    fetch(`/api/contest?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setContests(data.contests || []);
        setTotal(data.total || 0);
      });
  }, [page, status, pageSize]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Swords className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">比赛</h1>
          <p className="text-muted-foreground text-sm">共 {total} 场比赛</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5 w-fit">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => { setStatus(t.value); setPage(1); }}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              status === t.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {contests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground rounded-xl border border-dashed bg-card/50">
            <Swords className="h-8 w-8 mx-auto mb-3 opacity-40" />
            暂无比赛
          </div>
        ) : (
          contests.map((c) => {
            const st = new Date(c.startTime);
            const cfg = statusConfig[c.status] || statusConfig.upcoming;
            return (
              <div
                key={c.id}
                onClick={() => router.push(`/contest/${c.id}`)}
                className="group flex items-start gap-4 rounded-xl border border-border/50 bg-card p-4 transition-colors hover:border-primary/30 cursor-pointer"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Swords className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium group-hover:text-primary transition-colors">{c.title}</h3>
                    <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5", cfg.className)}>
                      <span className={cn("h-1.5 w-1.5 rounded-full mr-1", cfg.dot)} />
                      {cfg.label}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{c.type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{c.description || "暂无简介"}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {st.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      {formatDuration(c.duration)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {c.participantCount} 人报名
                    </span>
                    <span className="flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      {c.problemCount} 题
                    </span>
                    {isAdmin && (
                      <a
                        href={`/contest/${c.id}?tab=plag`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-orange-500 hover:text-orange-600 font-medium"
                      >
                        <Search className="h-3 w-3" />
                        查重
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">第 {page} / {totalPages} 页</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
