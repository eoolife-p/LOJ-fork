"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Loader2, Search, Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PlagReport {
  id: number;
  submissionId: number;
  similarToId: number;
  similarity: number;
  details: string;
  createdAt: string;
  submissionUserName: string;
  similarToUserName: string;
  submission: { contestId: number } | null;
}

export default function PlagiarismPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [contestId, setContestId] = useState("");
  const [checking, setChecking] = useState(false);
  const [resultMsg, setResultMsg] = useState("");
  const [reports, setReports] = useState<PlagReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated" && !session.user.isAdmin) router.push("/");
  }, [status, session, router]);

  useEffect(() => {
    setLoadingReports(true);
    fetch("/api/admin/plagiarism/reports")
      .then((r) => r.json())
      .then((d) => setReports(d.reports || []))
      .finally(() => setLoadingReports(false));
  }, []);

  const handleCheck = async () => {
    const cid = parseInt(contestId);
    if (isNaN(cid)) { setResultMsg("请输入有效的比赛ID"); return; }
    setChecking(true);
    setResultMsg("");
    try {
      const res = await fetch("/api/admin/plagiarism/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contestId: cid }),
      });
      const data = await res.json();
      if (res.ok) {
        setResultMsg(`检查完成，发现 ${data.pairsFound} 对相似代码`);
        setLoadingReports(true);
        fetch("/api/admin/plagiarism/reports")
          .then((r) => r.json())
          .then((d) => setReports(d.reports || []))
          .finally(() => setLoadingReports(false));
      } else {
        setResultMsg(data.error || "检查失败");
      }
    } catch {
      setResultMsg("网络错误");
    } finally {
      setChecking(false);
    }
  };

  const handleDelete = async (id: number) => {
    await fetch("/api/admin/plagiarism/reports", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setReports((prev) => prev.filter((r) => r.id !== id));
  };

  const getSimColor = (sim: number) => {
    if (sim >= 90) return "text-red-500 bg-red-500/10 border-red-500/20";
    if (sim >= 70) return "text-orange-500 bg-orange-500/10 border-orange-500/20";
    return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
  };

  if (status === "loading" || status !== "authenticated") {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-3.5rem)]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Search className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">查重管理</h1>
          <p className="text-muted-foreground text-sm">检测比赛中的代码相似度</p>
        </div>
      </div>

      <Card className="border-border/50 p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-sm font-medium">比赛ID：</label>
          <input
            type="number"
            value={contestId}
            onChange={(e) => setContestId(e.target.value)}
            placeholder="输入比赛ID"
            className="h-9 w-32 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button onClick={handleCheck} disabled={checking}>
            {checking ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Search className="h-4 w-4 mr-1" />}
            {checking ? "检查中..." : "运行查重"}
          </Button>
          {resultMsg && <p className="text-sm text-muted-foreground">{resultMsg}</p>}
        </div>
      </Card>

      <Card className="border-border/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">ID</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">提交A</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">提交B</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">相似度</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">时间</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            {loadingReports ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">加载中...</td></tr>
            ) : reports.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">暂无查重报告</td></tr>
            ) : (
              reports.map((r) => (
                <tr key={r.id} className="border-b hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">{r.id}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium">#{r.submissionId}</span>
                    <span className="text-xs text-muted-foreground ml-1">({r.submissionUserName})</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">#{r.similarToId}</span>
                    <span className="text-xs text-muted-foreground ml-1">({r.similarToUserName})</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={cn("text-[11px]", getSimColor(r.similarity))}>
                      {r.similarity.toFixed(1)}%
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
