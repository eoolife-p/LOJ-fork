"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Code2,
  Loader2,
  Shield,
  UserPlus,
  Users,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExistingUser {
  id: number;
  name: string;
  email: string;
}

export default function InitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [needsInit, setNeedsInit] = useState(false);
  const [dbError, setDbError] = useState(false);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [rawResponse, setRawResponse] = useState("");
  const [existingUsers, setExistingUsers] = useState<ExistingUser[]>([]);
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [selectedUser, setSelectedUser] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/init")
      .then(async (r) => {
        const text = await r.text();
        setRawResponse(text.slice(0, 500));
        try { return JSON.parse(text); } catch { throw new Error(text.slice(0, 200)); }
      })
      .then((data) => {
        if (!data.needsInit) { router.replace("/"); return; }
        setDbStatus(data.dbStatus || {});
        if (data.dbStatus?.error) { setDbError(true); return; }
        setNeedsInit(true);
        setExistingUsers(data.users || []);
        if (data.users?.length > 0) { setMode("existing"); } else { setMode("new"); }
      })
      .catch(() => setDbError(true))
      .finally(() => setLoading(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const body: Record<string, unknown> = { mode };
    if (mode === "existing") {
      if (!selectedUser) {
        setError("请选择一个用户");
        setSubmitting(false);
        return;
      }
      body.userId = parseInt(selectedUser);
    } else {
      if (!name || !email || !password) {
        setError("请填写完整信息");
        setSubmitting(false);
        return;
      }
      if (password.length < 6) {
        setError("密码至少6个字符");
        setSubmitting(false);
        return;
      }
      body.name = name;
      body.email = email;
      body.password = password;
    }

    try {
      const res = await fetch("/api/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "初始化失败");
      } else {
        router.push("/login");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-3.5rem)]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100dvh-3.5rem)] px-4">
        <div className="w-full max-w-lg space-y-6 text-center">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-amber-500 text-white">
            <Code2 className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold">数据库未配置</h1>
          <p className="text-muted-foreground text-sm">
            请先在部署平台设置以下环境变量：
          </p>
          <div className="rounded-xl border bg-muted/30 p-5 text-left space-y-3">
            <p className="text-xs font-medium text-muted-foreground">在 Vercel / EdgeOne Pages 后台 → Settings → Environment Variables：</p>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex items-center gap-2">
                <span className="text-emerald-500 shrink-0">TURSO_DATABASE_URL</span>
                <code className="text-xs bg-muted px-2 py-0.5 rounded">libsql://your-db.turso.io</code>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-500 shrink-0">TURSO_AUTH_TOKEN</span>
                <code className="text-xs bg-muted px-2 py-0.5 rounded">your-auth-token</code>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              如果使用 Supabase，改为设置：
            </p>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex items-center gap-2">
                <span className="text-purple-500 shrink-0">DATABASE_URL</span>
                <code className="text-xs bg-muted px-2 py-0.5 rounded">postgres://user:pass@host:5432/db</code>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            NEXTAUTH_SECRET 已自动生成，无需手动配置。
            设置好数据库环境变量后刷新此页面。
          </p>
          {dbStatus && (
            <div className="text-xs text-left font-mono text-muted-foreground/70 bg-muted p-2 rounded-md">
              {Object.entries(dbStatus).map(([k, v]) => (
                <div key={k}>{k}: {String(v)}</div>
              ))}
            </div>
          )}
          {rawResponse && (
            <div className="text-xs text-left font-mono text-red-400 bg-red-500/5 p-2 rounded-md break-all">
              API raw: {rawResponse}
            </div>
          )}
          <Button variant="outline" onClick={() => window.location.reload()}>
            刷新重试
          </Button>
        </div>
      </div>
    );
  }

  if (!needsInit) return null;

  return (
    <div className="flex items-center justify-center min-h-[calc(100dvh-3.5rem)] px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500 text-white">
            <Shield className="h-6 w-6" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">
              系统初始化
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              设置第一位管理员，完成后即可正常使用
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="flex gap-2 rounded-lg border p-1">
          {existingUsers.length > 0 && (
            <button
              type="button"
              onClick={() => setMode("existing")}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                mode === "existing"
                  ? "bg-emerald-500 text-white"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              <Users className="h-4 w-4" />
              现有用户
            </button>
          )}
          <button
            type="button"
            onClick={() => setMode("new")}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              mode === "new"
                ? "bg-emerald-500 text-white"
                : "text-muted-foreground hover:bg-accent"
            }`}
          >
            <UserPlus className="h-4 w-4" />
            新建用户
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "existing" && existingUsers.length > 0 ? (
            <div className="space-y-2">
              <Label>选择用户</Label>
              <Select value={selectedUser} onValueChange={(v) => setSelectedUser(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="选择一位用户设为管理员" />
                </SelectTrigger>
                <SelectContent>
                  {existingUsers.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">用户名</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="管理员昵称"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少6个字符"
                  required
                />
              </div>
            </>
          )}

          <Button
            type="submit"
            className="w-full gap-2"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                处理中
              </>
            ) : (
              <>
                完成初始化
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
