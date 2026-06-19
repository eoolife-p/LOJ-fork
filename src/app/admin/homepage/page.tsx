"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Loader2, Save, Layout, X, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

const BlockNoteEditor = dynamic(() => import("@/components/blocknote-editor"), {
  ssr: false,
  loading: () => <div className="h-48 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>,
});

interface HomepageConfig {
  homepageAnnouncement: string;
  homepageSlogan: string;
  homepageShowSubmissions: boolean;
  homepageShowDiscussions: boolean;
}

export default function AdminHomepagePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [config, setConfig] = useState<HomepageConfig>({
    homepageAnnouncement: "",
    homepageSlogan: "",
    homepageShowSubmissions: false,
    homepageShowDiscussions: false,
  });
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
        setConfig({
          homepageAnnouncement: data.homepageAnnouncement || "",
          homepageSlogan: data.homepageSlogan || "",
          homepageShowSubmissions: data.homepageShowSubmissions ?? false,
          homepageShowDiscussions: data.homepageShowDiscussions ?? false,
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
        body: JSON.stringify(config),
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

  return (
    <div className="px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Layout className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">首页配置</h1>
            <p className="text-muted-foreground text-sm">自定义首页展示内容</p>
          </div>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</div>}
      {success && <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">保存成功</div>}

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : (
        <Card className="border-border/50 p-6 space-y-6">
          {/* Slogan */}
          <div className="space-y-2">
            <Label>首页标语</Label>
            <Input
              value={config.homepageSlogan}
              onChange={(e) => setConfig({ ...config, homepageSlogan: e.target.value })}
              placeholder="留空则显示默认标语"
            />
            <p className="text-xs text-muted-foreground">显示在首页 Hero 区域的小标题，留空使用默认设置</p>
          </div>

          {/* Recent submissions toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">显示最近提交</p>
              <p className="text-sm text-muted-foreground">在首页展示最近 10 条提交记录（不含代码）</p>
            </div>
            <Switch
              checked={config.homepageShowSubmissions}
              onCheckedChange={(v) => setConfig({ ...config, homepageShowSubmissions: v })}
            />
          </div>

          {/* Recent discussions toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">显示最新讨论</p>
              <p className="text-sm text-muted-foreground">在首页展示最新帖子与回复</p>
            </div>
            <Switch
              checked={config.homepageShowDiscussions}
              onCheckedChange={(v) => setConfig({ ...config, homepageShowDiscussions: v })}
            />
          </div>

          {/* Announcement */}
          <div className="space-y-2">
            <Label>首页公告（Markdown）</Label>
            <p className="text-xs text-muted-foreground">支持 Markdown 格式，留空则不显示公告板块</p>
            <div className="min-h-[200px] border rounded-lg overflow-hidden">
              <BlockNoteEditor
                value={config.homepageAnnouncement}
                onChange={(v) => setConfig({ ...config, homepageAnnouncement: v })}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "保存中" : "保存配置"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
