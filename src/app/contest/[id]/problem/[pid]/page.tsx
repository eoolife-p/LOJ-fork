"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ChevronLeft, Play, Loader2, Clock, MemoryStick, Copy, Check,
  Terminal, FileText, RotateCcw, Send, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, AlertTriangle, Zap, Bug, Settings2,
  GripVertical, FlaskConical, ClipboardPaste, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import CodeEditor from "@/components/code-editor";
import { StatusBadge } from "@/components/status-badge";
import MarkdownPreview from "@/components/markdown-preview";
import type { JudgeResult } from "@/lib/judge/types";

interface ContestProblem {
  id: number;
  title: string;
  difficulty: string;
  description: string;
  inputDesc: string;
  outputDesc: string;
  sampleInput: string;
  sampleOutput: string;
  timeLimit: number;
  memoryLimit: number;
}

interface ContestDetail {
  id: number;
  title: string;
  status?: string;
  problems: ContestProblem[];
}

const CODE_TEMPLATES: Record<string, string> = { cpp: "", c: "", python3: "", python2: "", java: "", go: "", csharp: "" };
const CPP_TEMPLATE = "";

const difficultyConfig: Record<string, { label: string; className: string }> = {
  Easy: { label: "简单", className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800" },
  Medium: { label: "中等", className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800" },
  Hard: { label: "困难", className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800" },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button type="button" onClick={handleCopy} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10 dark:hover:bg-white/5" title="复制">
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
    </button>
  );
}

const STATUS_ICON_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string; iconColor: string }> = {
  AC: { icon: CheckCircle2, color: "bg-emerald-500 text-white", label: "Accepted", iconColor: "text-white" },
  PAC: { icon: AlertTriangle, color: "bg-cyan-500 text-white", label: "Partial Accepted", iconColor: "text-white" },
  WA: { icon: XCircle, color: "bg-red-500 text-white", label: "Wrong Answer", iconColor: "text-white" },
  CE: { icon: AlertTriangle, color: "bg-yellow-500 text-white", label: "Compile Error", iconColor: "text-white" },
  RE: { icon: Bug, color: "bg-orange-500 text-white", label: "Runtime Error", iconColor: "text-white" },
  TLE: { icon: Zap, color: "bg-blue-500 text-white", label: "Time Limit Exceeded", iconColor: "text-white" },
  MLE: { icon: MemoryStick, color: "bg-purple-500 text-white", label: "Memory Limit Exceeded", iconColor: "text-white" },
};

function StatusMiniBadge({ status }: { status: string }) {
  const c = STATUS_ICON_CONFIG[status] || { icon: AlertTriangle, color: "bg-muted text-muted-foreground", label: status, iconColor: "text-muted-foreground" };
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${c.color}`}>
      <Icon className={`h-3 w-3 ${c.iconColor}`} />
      {c.label}
    </span>
  );
}

function JudgeResultDetail({ result, action }: { result: JudgeResult; action: "run" | "submit" }) {
  const isAc = result.status === "AC";
  const isPac = result.status === "PAC";
  const isWa = result.status === "WA";
  const isCe = result.status === "CE";
  const isRe = result.status === "RE";
  const isTle = result.status === "TLE";
  const isMle = result.status === "MLE";

  const statusMessages: Record<string, string> = {
    AC: action === "run" ? "代码编译并运行成功" : "全部测试用例通过",
    PAC: "部分测试用例通过",
    WA: action === "run" ? "运行完成，输出与期望不符" : "答案错误",
    CE: "编译失败，请检查代码语法",
    RE: "运行时错误（段错误/异常退出）",
    TLE: "运行超时，请优化算法复杂度",
    MLE: "内存超限，请减少内存使用",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <StatusBadge status={result.status} />
        <span className="text-xs text-muted-foreground">{statusMessages[result.status] || "未知状态"}</span>
      </div>
      {(result.time > 0 || result.memory > 0) && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {result.time > 0 && <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted"><Clock className="h-3 w-3" /> {result.time}ms</span>}
          {result.memory > 0 && <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted"><MemoryStick className="h-3 w-3" /> {(result.memory / 1024).toFixed(1)}MB</span>}
        </div>
      )}
      {action === "submit" && isAc && (
        <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3 text-xs text-emerald-600">
          <div className="flex items-center gap-1.5 font-medium"><CheckCircle2 className="h-3.5 w-3.5" /> 提交成功</div>
          <p className="mt-1 text-muted-foreground">所有测试用例均已通过。</p>
        </div>
      )}
      {isPac && (
        <div className="rounded-lg bg-cyan-500/5 border border-cyan-500/20 p-3">
          <h4 className="text-xs font-medium mb-1.5 flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400"><AlertTriangle className="h-3.5 w-3.5" /> 部分通过</h4>
          {result.stderr && <pre className="text-xs font-mono whitespace-pre-wrap text-cyan-700 dark:text-cyan-400 leading-relaxed">{result.stderr}</pre>}
          <p className="mt-1 text-muted-foreground text-xs">部分测试用例未通过，请检查边界情况或特殊输入。</p>
        </div>
      )}
      {action === "run" && isWa && result.stderr && (
        <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-3">
          <h4 className="text-xs font-medium mb-1.5 flex items-center gap-1.5 text-red-600 dark:text-red-400"><XCircle className="h-3.5 w-3.5" /> 比对详情</h4>
          <pre className="text-xs font-mono whitespace-pre-wrap text-red-600/80 dark:text-red-400/80 leading-relaxed">{result.stderr}</pre>
        </div>
      )}
      {action === "submit" && isWa && (
        <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-3 text-xs text-red-600 dark:text-red-400">
          <div className="flex items-center gap-1.5 font-medium"><XCircle className="h-3.5 w-3.5" /> 答案错误</div>
          <p className="mt-1 text-muted-foreground">你的答案未能通过所有隐藏测试用例，请检查算法逻辑或边界情况。</p>
        </div>
      )}
      {isCe && result.stderr && (
        <div className="rounded-lg bg-yellow-500/5 border border-yellow-500/20 p-3">
          <h4 className="text-xs font-medium mb-1.5 flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400"><AlertTriangle className="h-3.5 w-3.5" /> 编译错误</h4>
          <pre className="text-xs font-mono whitespace-pre-wrap text-yellow-700 dark:text-yellow-400 leading-relaxed">{result.stderr}</pre>
        </div>
      )}
      {isRe && result.stderr && (
        <div className="rounded-lg bg-orange-500/5 border border-orange-500/20 p-3">
          <h4 className="text-xs font-medium mb-1.5 flex items-center gap-1.5 text-orange-600 dark:text-orange-400"><Bug className="h-3.5 w-3.5" /> 运行时错误</h4>
          <pre className="text-xs font-mono whitespace-pre-wrap text-orange-700 dark:text-orange-400 leading-relaxed">{result.stderr}</pre>
        </div>
      )}
      {isTle && (
        <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3 text-xs text-blue-600">
          <div className="flex items-center gap-1.5 font-medium"><Zap className="h-3.5 w-3.5" /> 时间超限</div>
          <p className="mt-1 text-muted-foreground">代码运行时间超过了限制，请检查算法复杂度。</p>
        </div>
      )}
      {isMle && (
        <div className="rounded-lg bg-purple-500/5 border border-purple-500/20 p-3 text-xs text-purple-600">
          <div className="flex items-center gap-1.5 font-medium"><MemoryStick className="h-3.5 w-3.5" /> 内存超限</div>
          <p className="mt-1 text-muted-foreground">代码内存占用超过了限制，请减少数据结构大小或优化空间复杂度。</p>
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground/40 gap-2">
      <Icon className="h-8 w-8" />
      <p className="text-xs">{text}</p>
    </div>
  );
}

function mapStatus(status: string): string {
  if (status === "Accepted") return "AC";
  return status;
}

export default function ContestProblemPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const rawPid = Array.isArray(params.pid) ? params.pid[0] : params.pid;
  const contestId = rawId ? Number(rawId) : NaN;
  const contestProblemId = rawPid ? Number(rawPid) : NaN;

  const [contest, setContest] = useState<ContestDetail | null>(null);
  const [problem, setProblem] = useState<ContestProblem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const storageKey = useCallback((suffix: string) => `loj_contest_${contestId}_${suffix}`, [contestId]);

  const [code, setCode] = useState(() => {
    if (typeof window === "undefined") return CPP_TEMPLATE;
    return localStorage.getItem(storageKey(`code_${contestProblemId}`)) || CPP_TEMPLATE;
  });
  const [language, setLanguage] = useState(() => {
    if (typeof window === "undefined") return "cpp";
    return localStorage.getItem(storageKey("language")) || "cpp";
  });
  const [fontSize, setFontSize] = useState(() => {
    if (typeof window === "undefined") return 14;
    const saved = localStorage.getItem(storageKey("fontSize"));
    return saved ? Number(saved) : 14;
  });

  useEffect(() => { localStorage.setItem(storageKey(`code_${contestProblemId}`), code); }, [code, contestProblemId, storageKey]);
  useEffect(() => { localStorage.setItem(storageKey("language"), language); }, [language, storageKey]);
  useEffect(() => { localStorage.setItem(storageKey("fontSize"), fontSize.toString()); }, [fontSize, storageKey]);

  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<JudgeResult | null>(null);
  const [lastAction, setLastAction] = useState<"run" | "submit" | null>(null);
  const [isResultOpen, setIsResultOpen] = useState(false);

  const [isSelfTestOpen, setIsSelfTestOpen] = useState(false);
  const [selfTestInput, setSelfTestInput] = useState("");
  const [selfTestResult, setSelfTestResult] = useState<JudgeResult | null>(null);

  const [leftOpen, setLeftOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(storageKey("leftOpen")) !== "false";
  });
  useEffect(() => { localStorage.setItem(storageKey("leftOpen"), leftOpen.toString()); }, [leftOpen, storageKey]);

  const [splitRatio, setSplitRatio] = useState(0.35);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const handleRunRef = useRef<() => void>(() => {});
  const handleSubmitRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (isNaN(contestId) || isNaN(contestProblemId)) { setError("无效的比赛或题目 ID"); return; }
    fetch(`/api/contest/${contestId}`)
      .then((r) => { if (!r.ok) throw new Error("加载失败"); return r.json(); })
      .then((data: ContestDetail & { status?: string }) => {
        setContest(data);
        if (data.status && data.status !== "running" && !session?.user?.isAdmin) {
          setError(data.status === "upcoming" ? "比赛尚未开始" : "比赛已结束");
          return;
        }
        const p = data.problems.find((p) => p.id === contestProblemId) || null;
        if (!p) setError("未找到该题目"); else setProblem(p);
      })
      .catch(() => setError("加载失败，请刷新重试"));
  }, [contestId, contestProblemId, session]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(storageKey(`submit_${contestProblemId}`));
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as JudgeResult & { lastAction: "run" | "submit" };
        if (parsed.lastAction === "submit") { setResult(parsed); setLastAction("submit"); }
      } catch { /* ignore */ }
    }
  }, [contestProblemId, storageKey]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const ratio = Math.min(0.6, Math.max(0.25, (e.clientX - rect.left) / rect.width));
      setSplitRatio(ratio);
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  const handleRun = useCallback(async () => {
    if (!problem || running) return;
    if (!session) { router.push("/login"); return; }
    setRunning(true); setSelfTestResult(null);
    try {
      const isSample = selfTestInput.trim() === problem.sampleInput.trim();
      const res = await fetch("/api/run", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language, stdin: selfTestInput, timeLimit: problem.timeLimit, memoryLimit: problem.memoryLimit, expectedOutput: isSample ? problem.sampleOutput : undefined }),
      });
      const data = await res.json();
      setSelfTestResult({ status: data.status, stdout: data.stdout || "", stderr: data.stderr || "", time: data.time || 0, memory: data.memory || 0 });
    } catch {
      setSelfTestResult({ status: "RE", stdout: "", stderr: "运行失败，请重试", time: 0, memory: 0 });
    } finally { setRunning(false); }
  }, [problem, code, language, running, session, router, selfTestInput]);

  const handleSubmit = useCallback(async () => {
    if (!problem || submitting) return;
    if (!session) { router.push("/login"); return; }
    setSubmitting(true); setResult(null); setLastAction("submit"); setIsResultOpen(true);
    try {
      const res = await fetch(`/api/contest/${contestId}/problem/${problem.id}/submit`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      const data = await res.json();
      const submitResult: JudgeResult = {
        status: mapStatus(data.status) as JudgeResult["status"],
        stdout: data.stdout || "", stderr: data.stderr || "", time: data.time || 0, memory: data.memory || 0,
      };
      setResult(submitResult);
      if (typeof window !== "undefined") localStorage.setItem(storageKey(`submit_${contestProblemId}`), JSON.stringify({ ...submitResult, lastAction: "submit" }));
    } catch {
      const failResult: JudgeResult = { status: "RE", stdout: "", stderr: "提交失败，请重试", time: 0, memory: 0 };
      setResult(failResult);
      if (typeof window !== "undefined") localStorage.setItem(storageKey(`submit_${contestProblemId}`), JSON.stringify({ ...failResult, lastAction: "submit" }));
    } finally { setSubmitting(false); }
  }, [problem, code, language, submitting, session, router, contestId, contestProblemId, storageKey]);

  const handleReset = useCallback(() => { setCode(CODE_TEMPLATES[language] || CPP_TEMPLATE); setResult(null); setIsResultOpen(false); }, [language]);

  useEffect(() => { handleRunRef.current = handleRun; handleSubmitRef.current = handleSubmit; }, [handleRun, handleSubmit]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") { e.preventDefault(); handleRunRef.current(); }
      if (e.ctrlKey && e.key === "s") { e.preventDefault(); handleSubmitRef.current(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (error) return <div className="flex items-center justify-center h-[calc(100dvh-3.5rem)] bg-background text-muted-foreground">{error}</div>;
  if (!problem) return <div className="flex items-center justify-center h-[calc(100dvh-3.5rem)] bg-background"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const diff = difficultyConfig[problem.difficulty] || difficultyConfig.Easy;

  return (
    <div className="h-[calc(100dvh-3.5rem)] flex flex-col bg-background overflow-hidden">
      <header className="h-11 shrink-0 border-b bg-background flex items-center px-4">
        <button type="button" onClick={() => router.push(`/contest/${contestId}`)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-3.5 w-3.5" /> 返回比赛
        </button>
      </header>
      <div ref={containerRef} className="flex-1 flex min-h-0">
        <aside className={`flex flex-col border-r bg-background ${leftOpen ? "min-w-0" : "w-10 shrink-0"}`} style={leftOpen ? { width: `${splitRatio * 100}%` } : undefined}>
          {leftOpen ? (
            <>
              <div className="shrink-0 border-b px-5 py-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h1 className="text-lg font-bold leading-tight">{problem.title}</h1>
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => setLeftOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors" title="收起题目描述">
                      <PanelLeftClose className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 shrink-0 ${diff.className}`}>{diff.label}</Badge>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Clock className="h-3 w-3" /> {problem.timeLimit}ms</span>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><MemoryStick className="h-3 w-3" /> {problem.memoryLimit}MB</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-3">
                  <div className="rounded-lg border bg-card">
                    <div className="px-3 pt-2.5 pb-1"><h3 className="text-xs font-semibold flex items-center gap-1.5 text-foreground/70 uppercase tracking-wider"><FileText className="h-3.5 w-3.5 text-primary" /> 题目描述</h3></div>
                    <div className="px-3 pb-3"><MarkdownPreview content={problem.description} /></div>
                  </div>
                  <div className="rounded-lg border bg-card">
                    <div className="px-3 pt-2.5 pb-1"><h3 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">输入描述</h3></div>
                    <div className="px-3 pb-3"><MarkdownPreview content={problem.inputDesc} /></div>
                  </div>
                  <div className="rounded-lg border bg-card">
                    <div className="px-3 pt-2.5 pb-1"><h3 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">输出描述</h3></div>
                    <div className="px-3 pb-3"><MarkdownPreview content={problem.outputDesc} /></div>
                  </div>
                  <div className="rounded-lg border bg-card">
                    <div className="px-3 pt-2.5 pb-1"><h3 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">样例</h3></div>
                    <div className="px-3 pb-3 space-y-2.5">
                      <div className="group relative">
                        <div className="flex items-center justify-between mb-1"><span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">输入</span><CopyButton text={problem.sampleInput} /></div>
                        <pre className="rounded-md bg-secondary text-foreground p-2.5 text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed border border-border">{problem.sampleInput}</pre>
                      </div>
                      <div className="group relative">
                        <div className="flex items-center justify-between mb-1"><span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">输出</span><CopyButton text={problem.sampleOutput} /></div>
                        <pre className="rounded-md bg-secondary text-foreground p-2.5 text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed border border-border">{problem.sampleOutput}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="shrink-0 border-t px-5 py-3 bg-card flex items-center justify-end gap-3">
                <Button size="sm" onClick={handleSubmit} disabled={submitting} className="gap-1.5 h-8">
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  {submitting ? "提交中" : "提交"}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center py-3">
              <button type="button" onClick={() => setLeftOpen(true)} className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors" title="展开题目描述">
                <PanelLeftOpen className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          )}
        </aside>
        <div className="w-px shrink-0 cursor-col-resize bg-border hover:bg-primary/40 active:bg-primary/60 transition-colors relative group/drag" onMouseDown={() => { dragging.current = true; }}>
          <div className="absolute inset-y-0 -left-1.5 -right-1.5" />
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/0 group-hover/drag:text-muted-foreground/50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="flex-1 flex flex-col min-w-0 bg-background">
          <div className="shrink-0 border-b px-4 py-2 flex items-center justify-between bg-card">
            <div className="flex items-center gap-2">
              <Select value={language} onValueChange={(v) => setLanguage(v ?? "cpp")}>
                <SelectTrigger className="h-7 text-xs w-[110px]">
                  <SelectValue>{({ cpp: "C++", c: "C", python3: "Python3", python2: "Python2", java: "Java", go: "Go", csharp: "C#" } as Record<string, string>)[language] ?? language}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpp">C++</SelectItem><SelectItem value="c">C</SelectItem><SelectItem value="python3">Python3</SelectItem>
                  <SelectItem value="python2">Python2</SelectItem><SelectItem value="java">Java</SelectItem><SelectItem value="go">Go</SelectItem><SelectItem value="csharp">C#</SelectItem>
                </SelectContent>
              </Select>
              <div className="hidden sm:flex items-center gap-1.5">
                <Select value={fontSize.toString()} onValueChange={(v) => setFontSize(Number(v ?? "14"))}>
                  <SelectTrigger className="h-7 text-xs w-[70px]"><Settings2 className="h-3 w-3 text-muted-foreground" /><SelectValue /></SelectTrigger>
                  <SelectContent>{[12,13,14,15,16,17,18].map((s) => (<SelectItem key={s} value={s.toString()}>{s}px</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsSelfTestOpen((v) => !v)} disabled={running} className="gap-1.5 h-8"><FlaskConical className="h-3.5 w-3.5" /> 自测</Button>
              <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1.5 h-8"><RotateCcw className="h-3.5 w-3.5" /> 重置</Button>
              <Button size="sm" onClick={handleSubmit} disabled={submitting} className="gap-1.5 h-8">
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                {submitting ? "提交中" : "提交"}
              </Button>
              {lastAction === "submit" && result && (
                <button type="button" onClick={() => setIsResultOpen(true)} className="ml-0.5"><StatusMiniBadge status={result.status} /></button>
              )}
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <CodeEditor value={code} onChange={setCode} language={language} fontSize={fontSize} onFontSizeChange={setFontSize} />
          </div>
          {isSelfTestOpen && (
            <div className="shrink-0 border-t flex flex-col bg-card" style={{ height: 240 }}>
              <div className="flex items-center justify-between px-4 py-1.5 border-b">
                <div className="flex items-center gap-2"><Terminal className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-xs font-medium">自测</span></div>
                <div className="flex items-center gap-1.5">
                  {problem?.sampleInput && (
                    <Button variant="ghost" size="sm" onClick={() => setSelfTestInput(problem.sampleInput)} className="h-6 text-xs gap-1"><ClipboardPaste className="h-3 w-3" /> 填充样例</Button>
                  )}
                  <Button variant="default" size="sm" onClick={handleRun} disabled={running} className="h-6 text-xs gap-1">
                    {running ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />} 运行
                  </Button>
                </div>
              </div>
              <div className="flex-1 flex min-h-0">
                <div className="flex-1 flex flex-col min-w-0 border-r">
                  <div className="px-3 py-1 text-[10px] text-muted-foreground uppercase tracking-wider border-b bg-muted/30">标准输入</div>
                  <textarea value={selfTestInput} onChange={(e) => setSelfTestInput(e.target.value)} placeholder="在此输入标准输入..." className="flex-1 bg-background px-3 py-2 text-xs font-mono resize-none outline-none placeholder:text-muted-foreground" />
                </div>
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="px-3 py-1 text-[10px] text-muted-foreground uppercase tracking-wider border-b bg-muted/30 flex items-center justify-between"><span>运行结果</span>{selfTestResult && <StatusMiniBadge status={selfTestResult.status} />}</div>
                  <div className="flex-1 overflow-auto px-3 py-2">
                    {running ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground gap-2"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-xs">运行中...</span></div>
                    ) : !selfTestResult ? (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground/40 gap-2"><Terminal className="h-6 w-6" /><span className="text-xs">点击运行查看结果</span></div>
                    ) : selfTestResult.status === "CE" ? (
                      <pre className="text-xs font-mono whitespace-pre-wrap text-yellow-700 dark:text-yellow-400 leading-relaxed">{selfTestResult.stderr}</pre>
                    ) : (
                      <div className="space-y-2">
                        {selfTestResult.stdout ? <pre className="text-xs font-mono whitespace-pre-wrap text-foreground leading-relaxed">{selfTestResult.stdout}</pre> : <p className="text-xs text-muted-foreground">无标准输出</p>}
                        {selfTestResult.stderr && selfTestResult.status !== "AC" && <pre className="text-xs font-mono whitespace-pre-wrap text-red-600 dark:text-red-400 leading-relaxed">{selfTestResult.stderr}</pre>}
                        <div className="flex items-center gap-3 pt-1 text-[10px] text-muted-foreground">
                          {selfTestResult.time > 0 && <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted"><Clock className="h-3 w-3" /> {selfTestResult.time}ms</span>}
                          {selfTestResult.memory > 0 && <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted"><MemoryStick className="h-3 w-3" /> {(selfTestResult.memory / 1024).toFixed(1)}MB</span>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className={`shrink-0 border-t flex flex-col transition-all duration-300 ease-in-out ${isResultOpen ? "h-[200px]" : "h-9"}`}>
            <button type="button" onClick={() => setIsResultOpen((v) => !v)} className="h-9 shrink-0 flex items-center justify-between px-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2"><Terminal className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-xs font-medium">提交结果</span>{result && <StatusMiniBadge status={result.status} />}</div>
              {isResultOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
            {isResultOpen && (
              <div className="flex-1 min-h-0 overflow-auto p-4">
                {result && lastAction === "submit" ? <JudgeResultDetail result={result} action="submit" /> : <EmptyState icon={CheckCircle2} text="提交代码后查看判题结果" />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
