"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Loader2, Save, FileText,
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

export default function AdminTermsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [termsOfService, setTermsOfService] = useState("");
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
        setTermsOfService(data.termsOfService || "");
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      const body: Record<string, string> = {};
      if (editMode === "simple") {
        body.termsOfService = termsOfService;
      } else {
        body.termsOfService = termsOfService;
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
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
          <FileText className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">用户协议</h1>
          <p className="text-muted-foreground text-sm">编辑站点用户协议内容</p>
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
            <p className="text-xs text-muted-foreground">用户协议中将自动替换为当前站点名称。</p>
            <Input
              id="siteName"
              value={termsOfService}
              onChange={(e) => setTermsOfService(e.target.value)}
              placeholder="输入站点名称，将用于生成默认用户协议"
              className="max-w-md"
            />
          </div>
          <div className="rounded-lg border border-border/50 p-4 bg-muted/30">
            <p className="text-xs text-muted-foreground mb-2">默认用户协议预览：</p>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>欢迎你使用 {termsOfService || "站点"}。本用户协议由你与本站运营者共同缔结。</p>
              <p>请你仔细阅读本协议。当你完成注册或以任何方式实际使用本站服务时，即视为你已同意接受本协议所有条款的约束。</p>
              <p>禁止利用漏洞、脚本、爬虫或自动化工具恶意刷题、刷榜、破坏系统，禁止在比赛、训练中抄袭作弊。</p>
            </div>
          </div>
        </Card>
      )}

      {/* 自定义修改 — BlockNote 富文本 */}
      {editMode === "custom" && (
        <Card className="border-border/50">
          <div className="p-4 border-b border-border/50">
            <Label className="text-sm font-medium">用户协议内容</Label>
            <p className="text-xs text-muted-foreground mt-1">使用 BlockNote 富文本编辑器编写用户协议，支持 Markdown 实时预览。</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border/50 min-h-[500px]">
            <div className="p-2">
              <BlockNoteEditor
                value={termsOfService}
                onChange={setTermsOfService}
                placeholder="编写用户协议..."
              />
            </div>
            <div className="p-4 overflow-auto">
              <p className="text-xs font-medium text-muted-foreground mb-3">预览</p>
              <MarkdownPreview content={termsOfService} />
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
