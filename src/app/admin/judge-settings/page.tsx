"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Save,
  Play,
  Settings,
  Terminal,
  Code,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

interface JudgeSettingsState {
  judgeEngine: string;
  judgeConfig: string;
  judgeCustomCode: string;
}

const JsMonacoEditor = dynamic(() => import("@/components/html-monaco-editor"), { ssr: false, loading: () => <div className="h-48 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div> });

const ENGINES = [
  { id: "onecompiler", name: "OneCompiler", desc: "第三方在线编译服务，支持多语言" },
  { id: "judge0", name: "Judge0", desc: "开源判题引擎，支持自建或 RapidAPI" },
  { id: "custom", name: "自定义引擎", desc: "通过 JavaScript 代码实现自定义判题逻辑" },
];

const DEFAULT_CUSTOM_CODE = `// 自定义判题引擎示例
// 必须返回一个包含 run 和 submit 方法的对象

const engine = {
  async run(code, language, input, timeLimit, memoryLimit) {
    // 调用你的判题 API
    const res = await fetch("https://your-judge-api.com/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, language, input, timeLimit, memoryLimit }),
    });
    const data = await res.json();
    return {
      status: data.status, // "AC" | "WA" | "CE" | "RE" | "TLE" | "MLE"
      stdout: data.stdout || "",
      stderr: data.stderr || "",
      time: data.time || 0,
      memory: data.memory || 0,
    };
  },

  async submit(code, language, input, expectedOutput, timeLimit, memoryLimit) {
    const result = await this.run(code, language, input, timeLimit, memoryLimit);
    
    if (result.status === "AC") {
      const got = result.stdout.trim().replace(/\\r\\n/g, "\\n");
      const exp = expectedOutput.trim().replace(/\\r\\n/g, "\\n");
      if (got !== exp) {
        return {
          ...result,
          status: "WA",
          stderr: \`Expected:\\\n\${exp}\\\n\\\nGot:\\\n\${got}\`,
        };
      }
    }
    
    return result;
  },
};

engine;`;

export default function AdminJudgeSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<JudgeSettingsState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [testResult, setTestResult] = useState<"idle" | "running" | "ok" | "fail">("idle");
  const [testMsg, setTestMsg] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !session.user.isAdmin) {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings({
          judgeEngine: data.judgeEngine || "onecompiler",
          judgeConfig: data.judgeConfig || "{}",
          judgeCustomCode: data.judgeCustomCode || DEFAULT_CUSTOM_CODE,
        });
        setLoading(false);
      });
  }, []);

  const getConfig = () => {
    try {
      return JSON.parse(settings?.judgeConfig || "{}");
    } catch {
      return {};
    }
  };

  const setConfigField = (key: string, subKey: string, value: string | number) => {
    if (!settings) return;
    const cfg = getConfig();
    if (!cfg[key]) cfg[key] = {};
    cfg[key][subKey] = value;
    setSettings({ ...settings, judgeConfig: JSON.stringify(cfg, null, 2) });
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          judgeEngine: settings.judgeEngine,
          judgeConfig: settings.judgeConfig,
          judgeCustomCode: settings.judgeCustomCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "保存失败");
      } else {
        setSettings({
          judgeEngine: data.judgeEngine,
          judgeConfig: data.judgeConfig,
          judgeCustomCode: data.judgeCustomCode,
        });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch {
      setError("网络错误");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!settings) return;
    setTestResult("running");
    setTestMsg("");
    try {
      const res = await fetch("/api/admin/judge-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          engine: settings.judgeEngine,
          config: settings.judgeConfig,
          customCode: settings.judgeCustomCode,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setTestResult("ok");
        setTestMsg("连接成功");
      } else {
        setTestResult("fail");
        setTestMsg(data.error || "测试失败");
      }
    } catch {
      setTestResult("fail");
      setTestMsg("网络错误");
    }
  };

  if (status === "loading" || status !== "authenticated") {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-3.5rem)]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">判题设置</h1>
            <p className="text-muted-foreground text-sm">配置判题引擎、接口地址和自定义逻辑</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
          保存成功
        </div>
      )}

      {loading || !settings ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card className="border-border/50 p-6 space-y-6">
          {/* 引擎选择 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <Label className="font-medium">判题引擎</Label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ENGINES.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setSettings({ ...settings, judgeEngine: e.id })}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border text-left transition-colors",
                    settings.judgeEngine === e.id
                      ? "border-primary bg-primary/5"
                      : "border-border/60 hover:bg-accent/50"
                  )}
                >
                  <div
                    className={cn(
                      "shrink-0 h-3 w-3 rounded-full border",
                      settings.judgeEngine === e.id
                        ? "bg-primary border-primary"
                        : "border-muted-foreground"
                    )}
                  />
                  <div>
                    <div className="text-sm font-medium">{e.name}</div>
                      <div className="text-xs text-muted-foreground">{e.desc}</div>
      </div>
                </button>
              ))}
            </div>
          </div>

          {/* 预置引擎配置 */}
          {settings.judgeEngine === "judge0" && (
            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-muted-foreground" />
                <Label className="font-medium">Judge0 配置</Label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Base URL</Label>
                  <Input
                    value={getConfig().judge0?.baseUrl || ""}
                    onChange={(e) => setConfigField("judge0", "baseUrl", e.target.value)}
                    placeholder="https://judge0-ce.p.rapidapi.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Token / API Key</Label>
                  <Input
                    value={getConfig().judge0?.token || ""}
                    onChange={(e) => setConfigField("judge0", "token", e.target.value)}
                    placeholder="your-rapidapi-key"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">默认语言 ID</Label>
                  <Input
                    type="number"
                    value={getConfig().judge0?.languageId || 54}
                    onChange={(e) => setConfigField("judge0", "languageId", parseInt(e.target.value) || 54)}
                    placeholder="54"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">时间限制（秒）</Label>
                  <Input
                    type="number"
                    value={getConfig().judge0?.timeLimit || 5}
                    onChange={(e) => setConfigField("judge0", "timeLimit", parseInt(e.target.value) || 5)}
                    placeholder="5"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">内存限制（MB）</Label>
                  <Input
                    type="number"
                    value={getConfig().judge0?.memoryLimit || 256}
                    onChange={(e) => setConfigField("judge0", "memoryLimit", parseInt(e.target.value) || 256)}
                    placeholder="256"
                  />
                </div>
              </div>
            </div>
          )}

          {settings.judgeEngine === "onecompiler" && (
            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-muted-foreground" />
                <Label className="font-medium">OneCompiler 配置</Label>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Endpoint</Label>
                <Input
                  value={getConfig().onecompiler?.endpoint || ""}
                  onChange={(e) => setConfigField("onecompiler", "endpoint", e.target.value)}
                  placeholder="https://onecompiler.com/api/code/exec"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">时间限制（秒）</Label>
                <Input
                  type="number"
                  value={getConfig().onecompiler?.timeLimit || 5}
                  onChange={(e) => setConfigField("onecompiler", "timeLimit", parseInt(e.target.value) || 5)}
                  placeholder="5"
                />
              </div>
            </div>
          )}

          {/* 自定义引擎 */}
          {settings.judgeEngine === "custom" && (
            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-muted-foreground" />
                <Label className="font-medium">自定义引擎代码</Label>
                <span className="text-xs text-muted-foreground">JavaScript，必须返回包含 run 和 submit 方法的对象</span>
              </div>
              <JsMonacoEditor
                value={settings.judgeCustomCode}
                onChange={(v) => setSettings({ ...settings, judgeCustomCode: v })}
                height="400px"
                language="javascript"
              />
              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">可用沙箱 API：</p>
                <p>fetch, console, Promise, setTimeout, setInterval, clearTimeout, clearInterval</p>
                <p>返回的对象必须包含：run(code, language, input, timeLimit, memoryLimit) → Promise&lt;JudgeResult&gt;</p>
                <p>submit(code, language, input, expectedOutput, timeLimit, memoryLimit) → Promise&lt;JudgeResult&gt;</p>
              </div>
            </div>
          )}

          {/* 测试 & 保存 */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTest}
                disabled={testResult === "running" || saving}
                className="gap-1.5"
              >
                {testResult === "running" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                测试连接
              </Button>
              {testResult === "ok" && (
                <span className="flex items-center gap-1 text-xs text-emerald-600">
                  <CheckCircle className="h-3.5 w-3.5" />
                  {testMsg}
                </span>
              )}
              {testResult === "fail" && (
                <span className="flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {testMsg}
                </span>
              )}
            </div>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  保存中
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  保存设置
                </>
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
