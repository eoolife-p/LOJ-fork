"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface SeoSettings {
  seoDescription: string;
  seoKeywords: string;
}

export default function AdminSeoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [seo, setSeo] = useState<SeoSettings>({ seoDescription: "", seoKeywords: "" });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated" && !session.user.isAdmin) router.push("/");
  }, [status, session, router]);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setSeo({
          seoDescription: data.seoDescription || "",
          seoKeywords: data.seoKeywords || "",
        });
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seoDescription: seo.seoDescription,
          seoKeywords: seo.seoKeywords,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "保存失败"); }
      else { setSuccess(true); setTimeout(() => setSuccess(false), 2000); }
    } catch { setError("网络错误"); }
    finally { setSaving(false); }
  };

  if (status !== "authenticated") return (
    <div className="flex items-center justify-center h-[calc(100dvh-3.5rem)]">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-[calc(100dvh-3.5rem)]">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500">
          <Globe className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SEO 设置</h1>
          <p className="text-muted-foreground text-sm">优化搜索引擎展示效果，留空则使用系统默认值</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-sm text-emerald-600">
          保存成功
        </div>
      )}

      <Card className="border-border/50 p-6 space-y-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium">页面描述 (Meta Description)</Label>
          <textarea
            value={seo.seoDescription}
            onChange={(e) => setSeo({ ...seo, seoDescription: e.target.value })}
            placeholder="留空则自动生成"
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
          />
          <p className="text-xs text-muted-foreground">搜索引擎结果中的摘要文字，建议 120-160 字符</p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">页面关键词 (Meta Keywords)</Label>
          <Input
            value={seo.seoKeywords}
            onChange={(e) => setSeo({ ...seo, seoKeywords: e.target.value })}
            placeholder="留空则自动生成"
          />
          <p className="text-xs text-muted-foreground">逗号分隔，如 OJ, 在线评测, 算法竞赛</p>
        </div>

        <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-2 text-xs text-muted-foreground">
          <p className="font-medium text-foreground text-sm">预览</p>
          <p>
            <span className="text-sky-500 text-sm font-medium">[站点名称]</span>
            <span className="text-emerald-500 ml-2">{seo.seoDescription || "(自动生成描述)"}</span>
          </p>
          <p className="text-muted-foreground/50">
            自动生成的标题模板：页面名称 | 站点名称
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            保存
          </Button>
        </div>
      </Card>
    </div>
  );
}
