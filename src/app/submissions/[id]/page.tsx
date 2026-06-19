"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Loader2, Clock, MemoryStick, ArrowLeft, ChevronDown,
  Download, CheckCircle2, XCircle, AlertTriangle, FileText, Terminal,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const langExt: Record<string, string> = {
  cpp: "cpp", c: "c", python: "py", java: "java", javascript: "js",
  typescript: "ts", go: "go", rust: "rs", ruby: "rb", php: "php",
};

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="h-[400px] flex items-center justify-center bg-muted/20 rounded-b-lg"><Loader2 className="h-5 w-5 animate-spin" /></div>,
});

const statusColors: Record<string, string> = {
  AC: "bg-emerald-500/10 text-emerald-500 border-emerald-500/25",
  WA: "bg-red-500/10 text-red-500 border-red-500/25",
  CE: "bg-amber-500/10 text-amber-500 border-amber-500/25",
  RE: "bg-orange-500/10 text-orange-500 border-orange-500/25",
  TLE: "bg-violet-500/10 text-violet-500 border-violet-500/25",
  MLE: "bg-blue-500/10 text-blue-500 border-blue-500/25",
  PAC: "bg-cyan-500/10 text-cyan-500 border-cyan-500/25",
  Pending: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  AC: "Accepted", WA: "Wrong Answer", CE: "Compile Error",
  RE: "Runtime Error", TLE: "Time Limit Exceeded", MLE: "Memory Limit Exceeded",
  PAC: "Partial Accepted", Pending: "等待中",
};

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  AC: CheckCircle2, WA: XCircle, CE: AlertTriangle,
  RE: AlertTriangle, TLE: Clock, MLE: MemoryStick, PAC: CheckCircle2, Pending: Clock,
};

function TestCaseCard({ index, passed }: {
  index: number; passed?: boolean;
}) {
  return (
    <div className={cn(
      "w-10 h-10 rounded-lg border flex items-center justify-center text-xs font-bold",
      passed === true ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500" :
      passed === false ? "border-red-500/40 bg-red-500/10 text-red-500" :
      "border-border/50 bg-muted/30 text-muted-foreground"
    )}>
      {index + 1}
    </div>
  );
}

export default function SubmissionDetailPage() {
  const { data: session, status: authStatus } = useSession();
  const { resolvedTheme } = useTheme();
  const { id } = useParams();
  const router = useRouter();
  const [submission, setSubmission] = useState<any>(null);
  const [problem, setProblem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadsUsed, setDownloadsUsed] = useState(0);
  const maxDownloads = session?.user?.isAdmin ? 10 : 2;

  useEffect(() => {
    if (authStatus === "unauthenticated") { router.push("/login"); return; }
    if (!id) return;
    fetch(`/api/submissions/${id}`).then((r) => r.json()).then((sub) => {
      setSubmission(sub);
      if (sub.problem?.id) {
        fetch(`/api/problems/${sub.problem.id}`).then((r) => r.json()).then(setProblem);
      }
      const used = parseInt(localStorage.getItem(`loj_dl_${id}`) || "0");
      setDownloadsUsed(used);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id, authStatus]);

  const handleDownload = async (testIndex: number) => {
    if (downloadsUsed >= maxDownloads) return;
    if (!problem?.testCases) return;
    setDownloading(true);
    try {
      const testCases = (() => { try { return JSON.parse(problem.testCases || "[]"); } catch { return []; } })();
      const tc = testCases[testIndex];
      if (!tc) return;
      const content = `${tc.input}\n---\n${tc.output}`;
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `test_${testIndex + 1}_${submission?.problem?.title || "data"}.txt`;
      a.click(); URL.revokeObjectURL(url);
      const newCount = downloadsUsed + 1;
      setDownloadsUsed(newCount);
      localStorage.setItem(`loj_dl_${id}`, newCount.toString());
    } catch { /* ignore */ }
    finally { setDownloading(false); }
  };

  const downloadCode = () => {
    if (!submission?.code) return;
    const ext = langExt[submission.language] || submission.language || "txt";
    const blob = new Blob([submission.code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `submission-${submission.id}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-3.5rem)]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!submission) {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-3.5rem)]">
        <p className="text-muted-foreground">提交不存在或无权查看</p>
      </div>
    );
  }

  const StatusIcon = statusIcons[submission.status] || AlertTriangle;
  const testCases: Array<{ input: string; output: string; in?: string; expected?: string }> = (() => { try { return JSON.parse(problem?.testCases || "[]"); } catch { return []; } })();
  const sampleInputs = (submission.problem?.sampleInput || problem?.sampleInput || "").split("\n\n").filter(Boolean);
  const sampleOutputs = (submission.problem?.sampleOutput || problem?.sampleOutput || "").split("\n\n").filter(Boolean);
  const monacoTheme = resolvedTheme === "dark" ? "vs-dark" : "vs";

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />返回
      </button>

      <Card className={cn("border-border/50 p-6", statusColors[submission.status]?.split(" ")[0] || "")}>
        <div className="flex items-center gap-4">
          <div className={cn("shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center", statusColors[submission.status] || "")}>
            <StatusIcon className="h-7 w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold">{statusLabels[submission.status] || submission.status}</h1>
            <div className="flex items-center gap-4 mt-1.5 text-sm text-muted-foreground flex-wrap">
              {submission.time !== null && <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{submission.time}ms</span>}
              {submission.memory !== null && <span className="flex items-center gap-1"><MemoryStick className="h-4 w-4" />{(submission.memory / 1024).toFixed(1)}MB</span>}
              <span className="flex items-center gap-1"><Terminal className="h-4 w-4" />{submission.language}</span>
              <span>{new Date(submission.createdAt).toLocaleString("zh-CN")}</span>
            </div>
            {submission.problem?.title && (
              <Link href={`/problems/${submission.problem.id}`} className="text-sm text-primary hover:underline mt-1 inline-block">
                {submission.problem.title}
              </Link>
            )}
          </div>
        </div>
      </Card>

      <Card className="border-border/50 overflow-hidden">
        <div className="px-4 py-2.5 border-b flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">代码</span>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={downloadCode} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            下载代码
          </Button>
        </div>
        <MonacoEditor
          height="400px"
          language={submission.language === "cpp" ? "cpp" : submission.language === "python" ? "python" : submission.language === "java" ? "java" : "plaintext"}
          value={submission.code || ""}
          theme={monacoTheme}
          onMount={(editor, monaco) => {
            editor.addCommand(monaco.KeyCode.F1, () => {}, "");
            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyP, () => {}, "");
          }}
          options={{
            readOnly: true,
            contextmenu: false,
            minimap: { enabled: false },
            fontSize: 13,
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            renderLineHighlight: "none",
            folding: true,
            wordWrap: "on",
            padding: { top: 12 },
          }}
        />
      </Card>

      {submission.stderr && (
        <Card className="border-border/50 p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-red-500">编译/错误信息</h3>
          <pre className="text-xs bg-red-500/5 p-3 rounded-md overflow-x-auto font-mono whitespace-pre-wrap text-red-500">{submission.stderr}</pre>
        </Card>
      )}

      {testCases.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">测试点 ({testCases.length})</h3>
            {submission.status !== "AC" && (
              <p className="text-xs text-muted-foreground">下载剩余 {maxDownloads - downloadsUsed}/{maxDownloads} 次</p>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {testCases.map((tc, idx) => {
              const isAC = submission.status === "AC";
              const isPAC = submission.status === "PAC";
              const passed = isAC ? true : isPAC ? undefined : submission.status === "Pending" ? undefined : false;
              return (
                <TestCaseCard
                  key={idx}
                  index={idx}
                  passed={passed}
                />
              );
            })}
          </div>
          {submission.status !== "AC" && (
            <div className="flex flex-wrap gap-2">
              {testCases.map((_, idx) => (
                <Button key={idx} variant="outline" size="sm" onClick={() => handleDownload(idx)} disabled={downloading || downloadsUsed >= maxDownloads} className="gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  测试点 #{idx + 1}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {testCases.length === 0 && sampleInputs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">样例测试</h3>
            <p className="text-xs text-muted-foreground">下载剩余 {maxDownloads - downloadsUsed}/{maxDownloads} 次</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {sampleInputs.map((inp: string, idx: number) => {
              const isAC = submission.status === "AC";
              return (
                <TestCaseCard
                  key={idx}
                  index={idx}
                  passed={isAC ? true : submission.status === "Pending" ? undefined : false}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
