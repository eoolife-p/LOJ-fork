"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, ArrowLeft, GitCompare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function lcsSimilarity(a: string, b: string): number {
  const linesA = a.split("\n");
  const linesB = b.split("\n");
  const m = linesA.length;
  const n = linesB.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (linesA[i - 1].trim() === linesB[j - 1].trim()) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  const maxLen = Math.max(m, n);
  return maxLen > 0 ? (dp[m][n] / maxLen) * 100 : 100;
}

function computeDiff(linesA: string[], linesB: string[]): { aChanged: Set<number>; bChanged: Set<number> } {
  const m = linesA.length;
  const n = linesB.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (linesA[i - 1].trim() === linesB[j - 1].trim()) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const aChanged = new Set<number>();
  const bChanged = new Set<number>();

  let i = m, j = n;
  const matchA = new Set<number>();
  const matchB = new Set<number>();
  while (i > 0 && j > 0) {
    if (linesA[i - 1].trim() === linesB[j - 1].trim()) {
      matchA.add(i - 1);
      matchB.add(j - 1);
      i--; j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  for (let k = 0; k < m; k++) { if (!matchA.has(k)) aChanged.add(k); }
  for (let k = 0; k < n; k++) { if (!matchB.has(k)) bChanged.add(k); }

  return { aChanged, bChanged };
}

export default function DiffPage() {
  const { data: session, status: authStatus } = useSession();
  const { id } = useParams();
  const params = useSearchParams();
  const router = useRouter();
  const compareId = params.get("compare");

  const [subA, setSubA] = useState<any>(null);
  const [subB, setSubB] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [similarity, setSimilarity] = useState(0);
  const [aChanged, setAChanged] = useState<Set<number>>(new Set());
  const [bChanged, setBChanged] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (authStatus === "unauthenticated") { router.push("/login"); return; }
    if (!id) return;

    Promise.all([
      fetch(`/api/submissions/${id}`).then((r) => r.json()),
      compareId ? fetch(`/api/submissions/${compareId}`).then((r) => r.json()) : Promise.resolve(null),
    ]).then(([a, b]) => {
      setSubA(a);
      setSubB(b);
      if (a?.code && b?.code) {
        const sim = lcsSimilarity(a.code, b.code);
        setSimilarity(Math.round(sim * 100) / 100);
        const { aChanged: ac, bChanged: bc } = computeDiff(a.code.split("\n"), b.code.split("\n"));
        setAChanged(ac);
        setBChanged(bc);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id, compareId, authStatus]);

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-3.5rem)]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const codeA = subA?.code || "";
  const codeB = subB?.code || "";
  const linesA = codeA.split("\n");
  const linesB = codeB.split("\n");

  const getSimColor = (sim: number) => {
    if (sim >= 90) return "text-red-500 bg-red-500/10 border-red-500/20";
    if (sim >= 70) return "text-orange-500 bg-orange-500/10 border-orange-500/20";
    if (sim >= 50) return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
    return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />返回
        </button>
        <div className="flex items-center gap-3">
          {subA && subB && (
            <Badge variant="outline" className={cn("text-[11px]", getSimColor(similarity))}>
              相似度: {similarity.toFixed(1)}%
            </Badge>
          )}
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <GitCompare className="h-5 w-5" />
          </div>
        </div>
      </div>

      {!subB && (
        <Card className="border-border/50 p-8 text-center text-muted-foreground">
          请在URL中添加 ?compare=提交ID 参数来比较两份提交
        </Card>
      )}

      {subA && subB && (
        <div className="grid grid-cols-2 gap-2">
          <Card className="border-border/50 overflow-hidden">
            <div className="px-3 py-2 border-b bg-muted/30 text-xs font-medium text-muted-foreground flex items-center justify-between">
              <span>提交 #{subA.id} — {subA.language}</span>
              <span className="text-muted-foreground/60">{linesA.length} 行</span>
            </div>
            <div className="overflow-auto max-h-[70vh]">
              <pre className="text-xs font-mono leading-relaxed p-0">
                {linesA.map((line: string, idx: number) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex",
                      aChanged.has(idx) ? "bg-red-500/15 border-l-2 border-red-500" : "border-l-2 border-transparent"
                    )}
                  >
                    <span className="w-12 shrink-0 text-right pr-3 text-muted-foreground/50 select-none py-[1px]">
                      {idx + 1}
                    </span>
                    <span className="flex-1 py-[1px] whitespace-pre-wrap break-all pr-2">{line}</span>
                  </div>
                ))}
              </pre>
            </div>
          </Card>

          <Card className="border-border/50 overflow-hidden">
            <div className="px-3 py-2 border-b bg-muted/30 text-xs font-medium text-muted-foreground flex items-center justify-between">
              <span>提交 #{subB.id} — {subB.language}</span>
              <span className="text-muted-foreground/60">{linesB.length} 行</span>
            </div>
            <div className="overflow-auto max-h-[70vh]">
              <pre className="text-xs font-mono leading-relaxed p-0">
                {linesB.map((line: string, idx: number) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex",
                      bChanged.has(idx) ? "bg-red-500/15 border-l-2 border-red-500" : "border-l-2 border-transparent"
                    )}
                  >
                    <span className="w-12 shrink-0 text-right pr-3 text-muted-foreground/50 select-none py-[1px]">
                      {idx + 1}
                    </span>
                    <span className="flex-1 py-[1px] whitespace-pre-wrap break-all pr-2">{line}</span>
                  </div>
                ))}
              </pre>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
