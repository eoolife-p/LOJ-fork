"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Key, Copy, Check, Trash2, AlertTriangle, Shield, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ApiToken {
  id: number;
  name: string;
  token: string;
  scopes: string;
  createdAt: string;
  lastUsed: string | null;
}

export default function DeveloperSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowTokens, setAllowTokens] = useState(false);
  const [statusChecked, setStatusChecked] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [newTokenValue, setNewTokenValue] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status !== "authenticated") return;
    fetchTokens();
  }, [status]);

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const [tokensRes, statusRes] = await Promise.all([
        fetch("/api/user/api-tokens"),
        fetch("/api/user/developer-status"),
      ]);
      const tokensData = await tokensRes.json();
      const statusData = await statusRes.json();
      setTokens(tokensData.tokens || []);
      setAllowTokens(statusData.allowTokens ?? false);
      setStatusChecked(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setError("");
    if (!newName.trim()) {
      setError("请输入 Token 名称");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/user/api-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "创建失败");
      } else {
        setNewTokenValue(data.token);
        setNewName("");
        fetchTokens();
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    setError("");
    try {
      const res = await fetch(`/api/user/api-tokens?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "删除失败");
      } else {
        fetchTokens();
      }
    } catch {
      setError("删除失败");
    }
  };

  const handleCopy = (token: string, id: number) => {
    navigator.clipboard.writeText(token);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (status === "loading" || !statusChecked) {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-3.5rem)]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status !== "authenticated") return null;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/profile")}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Key className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">开发者设置</h1>
          <p className="text-muted-foreground text-sm">管理 API Token</p>
        </div>
      </div>

      {/* Agreement */}
      {!agreed && (
        <Card className="border-amber-500/30 bg-amber-500/5 p-6 space-y-4">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">使用协议</span>
          </div>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>API Token 具有与您账户相同的权限，请妥善保管：</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Token 仅在创建时显示一次，之后无法再次查看</li>
              <li>请勿将 Token 分享给他人或在客户端代码中暴露</li>
              <li>如果 Token 泄露，请立即删除并重新生成</li>
              <li>你最多可以创建 10 个 Token</li>
            </ul>
          </div>
          <Button onClick={() => setAgreed(true)} className="gap-1.5">
            <Shield className="h-4 w-4" />
            我已了解，继续
          </Button>
        </Card>
      )}

      {agreed && (
        <>
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {!allowTokens && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
              <div>
                <p className="font-medium text-sm text-red-600 dark:text-red-400">无权限</p>
                <p className="text-xs text-muted-foreground">你所在的用户组不允许创建 API Token，请联系管理员。</p>
              </div>
            </div>
          )}

          {allowTokens && (
            <>
              {/* Create Token */}
              <Card className="border-border/50 p-4 space-y-3">
                <h2 className="text-sm font-semibold flex items-center gap-1.5">
                  <Key className="h-4 w-4 text-primary" />
                  创建 Token
                </h2>
                <div className="flex gap-2">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Token 名称（如：CLI 工具）"
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    className="flex-1"
                  />
                  <Button onClick={handleCreate} disabled={creating || tokens.length >= 10} className="gap-1.5">
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                    创建
                  </Button>
                </div>
                {tokens.length >= 10 && (
                  <p className="text-xs text-muted-foreground">已达到 Token 数量上限（10 个）</p>
                )}

                {newTokenValue && (
                  <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 space-y-2">
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <Check className="h-4 w-4" />
                      Token 创建成功
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-background rounded-md px-3 py-2 text-xs font-mono break-all border">
                        {newTokenValue}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={() => handleCopy(newTokenValue, -1)}
                      >
                        {copiedId === -1 ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">请立即复制并保存此 Token，之后无法再次查看</p>
                  </div>
                )}
              </Card>

              {/* Token List */}
              <Card className="border-border/50 overflow-hidden">
                <div className="px-4 py-3 border-b">
                  <h2 className="text-sm font-semibold">我的 Token ({tokens.length}/10)</h2>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : tokens.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">暂无 Token</div>
                ) : (
                  <div className="divide-y">
                    {tokens.map((t) => (
                      <div key={t.id} className="flex items-center justify-between px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{t.name}</p>
                          <code className="text-xs text-muted-foreground font-mono truncate block">
                            {t.token.slice(0, 30)}...
                          </code>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            创建于 {new Date(t.createdAt).toLocaleString()}
                            {t.lastUsed && ` · 最后使用：${new Date(t.lastUsed).toLocaleString()}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 ml-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleCopy(t.token, t.id)}
                            title="复制"
                          >
                            {copiedId === t.id ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(t.id)}
                            title="删除"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
