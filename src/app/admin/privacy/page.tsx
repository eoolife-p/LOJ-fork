"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Loader2, Save, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import MarkdownPreview from "@/components/markdown-preview";

const BlockNoteEditor = dynamic(() => import("@/components/blocknote-editor"), {
  ssr: false,
  loading: () => <div className="h-48 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>,
});

export default function AdminPrivacyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [privacyPolicy, setPrivacyPolicy] = useState("");
  const [editMode, setEditMode] = useState<"simple" | "custom">("simple");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated" && !session.user.isAdmin) router.push("/");
  }, [status, session, router]);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setPrivacyPolicy(data.privacyPolicy || "");
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      const body: Record<string, string> = {};
      if (editMode === "simple") {
        body.privacyPolicy = privacyPolicy;
      } else {
        body.privacyPolicy = privacyPolicy;
      }
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "保存失败"); }
      else { setSuccess(true); setTimeout(() => setSuccess(false), 2000); }
    } catch { setError("网络错误"); }
    finally { setSaving(false); }
  };

  if (status === "loading" || status !== "authenticated") {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-3.5rem)]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-3.5rem)]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">隐私政策</h1>
          <p className="text-muted-foreground text-sm">编辑站点隐私政策内容</p>
        </div>
      </div>

      {/* 模式切换 */}
      <Card className="border-border/50 p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Label className="text-sm font-medium">编辑模式：</Label>
          <div className="flex rounded-lg border border-border/50 overflow-hidden">
            <button
              onClick={() => setEditMode("simple")}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${editMode === "simple" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
            >
              简易修改
            </button>
            <button
              onClick={() => setEditMode("custom")}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${editMode === "custom" ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
            >
              自定义修改
            </button>
          </div>
        </div>
      </Card>

      {/* 简易修改 */}
      {editMode === "simple" && (
        <Card className="border-border/50 p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="siteName" className="text-sm font-medium">站点名称</Label>
            <p className="text-xs text-muted-foreground">隐私政策中将自动替换为当前站点名称。</p>
            <Input
              id="siteName"
              value={privacyPolicy}
              onChange={(e) => setPrivacyPolicy(e.target.value)}
              placeholder="输入站点名称，将用于生成默认隐私政策"
              className="max-w-md"
            />
          </div>
          <div className="rounded-lg border border-border/50 p-4 bg-muted/30">
            <p className="text-xs text-muted-foreground mb-2">默认隐私政策预览：</p>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>{privacyPolicy || "站点"} 非常重视你的隐私。</p>
              <p>本站收集必要的账号信息（用户名、邮箱、加密密码）和提交记录，仅用于提供 OJ 核心功能，不用于广告投放或用户画像。</p>
              <p>密码使用 bcrypt 加密存储，登录令牌仅存储在 HttpOnly Cookie 中。</p>
            </div>
          </div>
        </Card>
      )}

      {/* 自定义修改 — BlockNote 富文本 */}
      {editMode === "custom" && (
        <Card className="border-border/50">
          <div className="p-4 border-b border-border/50">
            <Label className="text-sm font-medium">隐私政策内容</Label>
            <p className="text-xs text-muted-foreground mt-1">使用 BlockNote 富文本编辑器编写隐私政策，支持 Markdown 实时预览。</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border/50 min-h-[500px]">
            <div className="p-2">
              <BlockNoteEditor
                value={privacyPolicy}
                onChange={setPrivacyPolicy}
                placeholder="编写隐私政策..."
              />
            </div>
            <div className="p-4 overflow-auto">
              <p className="text-xs font-medium text-muted-foreground mb-3">预览</p>
              <MarkdownPreview content={privacyPolicy} />
            </div>
          </div>
        </Card>
      )}

      {/* 保存 */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
          保存
        </Button>
        {success && <span className="text-sm text-emerald-500">保存成功</span>}
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>
    </div>
  );
}
