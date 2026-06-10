"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Settings,
  Loader2,
  Save,
  Globe,
  Clock,
  Zap,
  Shield,
  UserPlus,
  ArrowLeft,
  ImageIcon,
  X,
  Sparkles,
  FileText,
  Dumbbell,
  Swords,
  Medal,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface SiteSettings {
  id: number;
  siteName: string;
  siteIcon: string;
  siteSubtitle: string;
  submitCooldown: number;
  runCooldown: number;
  maxSubmitsPerHour: number;
  allowRegistration: boolean;
  turnstileSiteKey: string;
  turnstileEnabled: boolean;
  footerText: string;
  aiApiKey: string;
  aiBaseUrl: string;
  aiModels: string;
  aiEnabled: boolean;
  trainingEnabled: boolean;
  contestEnabled: boolean;
  rankEnabled: boolean;
  discussionEnabled: boolean;
  showCustomPagesSeparator: boolean;
}

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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
          ...data,
          siteSubtitle: data.siteSubtitle || "在线评测系统",
          aiApiKey: data.aiApiKey || "",
          aiBaseUrl: data.aiBaseUrl || "",
          aiModels: data.aiModels || "[]",
          aiEnabled: data.aiEnabled ?? true,
        });
        setLoading(false);
      });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !settings) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("图标大小不能超过 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSettings({ ...settings, siteIcon: reader.result as string });
    };
    reader.readAsDataURL(file);
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
          siteName: settings.siteName,
          siteIcon: settings.siteIcon,
          siteSubtitle: settings.siteSubtitle,
          submitCooldown: settings.submitCooldown,
          runCooldown: settings.runCooldown,
          maxSubmitsPerHour: settings.maxSubmitsPerHour,
          allowRegistration: settings.allowRegistration,
          turnstileSiteKey: settings.turnstileSiteKey || "",
          turnstileEnabled: settings.turnstileEnabled ?? false,
          footerText: settings.footerText,
          aiApiKey: settings.aiApiKey,
          aiBaseUrl: settings.aiBaseUrl,
          aiModels: settings.aiModels,
          aiEnabled: settings.aiEnabled,
          trainingEnabled: settings.trainingEnabled,
          contestEnabled: settings.contestEnabled,
          rankEnabled: settings.rankEnabled,
          discussionEnabled: settings.discussionEnabled,
          showCustomPagesSeparator: settings.showCustomPagesSeparator,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "保存失败");
      } else {
        setSettings(data);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      }
    } catch {
      setError("网络错误");
    } finally {
      setSaving(false);
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
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">系统设置</h1>
            <p className="text-muted-foreground text-sm">全局配置与运行策略</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.push("/admin")} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          返回管理主页
        </Button>
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
          {/* Site Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <Label className="font-medium">系统名称</Label>
              </div>
              <Input
                value={settings.siteName}
                onChange={(e) =>
                  setSettings({ ...settings, siteName: e.target.value })
                }
                placeholder="LOJ"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <Label className="font-medium">副标题</Label>
              </div>
              <Input
                value={settings.siteSubtitle}
                onChange={(e) =>
                  setSettings({ ...settings, siteSubtitle: e.target.value })
                }
                placeholder="在线评测系统"
              />
            </div>
          </div>

          {/* Site Icon */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <Label className="font-medium">站点图标</Label>
            </div>
            <div className="flex items-center gap-4">
              {settings.siteIcon ? (
                <div className="relative">
                  <img
                    src={settings.siteIcon}
                    alt="站点图标"
                    className="h-14 w-14 rounded-lg border object-contain bg-background"
                  />
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, siteIcon: "" })}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-lg border bg-muted">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="space-y-1">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm hover:bg-accent transition-colors">
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  上传图标
                </label>
                <p className="text-xs text-muted-foreground">
                  支持任意文件，建议 128×128，最大 2MB
                </p>
              </div>
            </div>
          </div>

          {/* Cooldowns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label className="font-medium">提交冷却（秒）</Label>
              </div>
              <Input
                type="number"
                min={0}
                value={settings.submitCooldown}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    submitCooldown: parseInt(e.target.value) || 0,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">0 为不限制</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <Label className="font-medium">自测冷却（秒）</Label>
              </div>
              <Input
                type="number"
                min={0}
                value={settings.runCooldown}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    runCooldown: parseInt(e.target.value) || 0,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">0 为不限制</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <Label className="font-medium">每小时最大提交</Label>
              </div>
              <Input
                type="number"
                min={0}
                value={settings.maxSubmitsPerHour}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxSubmitsPerHour: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="0 为不限制"
              />
              <p className="text-xs text-muted-foreground">0 为不限制</p>
            </div>
          </div>

          {/* Footer Text */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <Label className="font-medium">页脚自定义内容</Label>
            </div>
            <textarea
              value={settings.footerText}
              onChange={(e) =>
                setSettings({ ...settings, footerText: e.target.value })
              }
              placeholder="支持 HTML，留空则不显示"
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
            />
            <p className="text-xs text-muted-foreground">
              支持 HTML 标签，显示在 Powered by 下方
            </p>
          </div>

          {/* AI Configuration */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-orange-500" />
              <div>
                <p className="font-medium">AI 配置</p>
                <p className="text-sm text-muted-foreground">管理 API Key、Base URL 和模型列表</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push("/admin/ai-settings")}>管理</Button>
          </div>

          {/* 自定义页面快捷入口 */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium">自定义页面</p>
                <p className="text-sm text-muted-foreground">创建 HTML 页面或嵌入 URL，显示在顶栏</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={settings.showCustomPagesSeparator} onCheckedChange={(v) => setSettings({ ...settings, showCustomPagesSeparator: v })} />
                <span className="text-xs text-muted-foreground">分隔线</span>
              </label>
              <Button variant="outline" size="sm" onClick={() => router.push("/admin/custom-pages")}>管理</Button>
            </div>
          </div>

          {/* 功能开关 */}
          <div className="rounded-lg border p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <Label className="font-medium">功能开关</Label>
              <span className="text-xs text-muted-foreground ml-2">
                关闭后顶栏隐藏且地址无法访问
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {([ 
                { key: "trainingEnabled" as const, label: "训练", Icon: Dumbbell },
                { key: "contestEnabled" as const, label: "比赛", Icon: Swords },
                { key: "rankEnabled" as const, label: "排名", Icon: Medal },
                { key: "discussionEnabled" as const, label: "讨论", Icon: MessageSquare },
              ]).map(({ key, label, Icon }) => (
                <div key={key} className="flex items-center justify-between rounded-lg border px-4 py-3">
                  <span className="text-sm font-medium inline-flex items-center gap-1.5"><Icon className="h-4 w-4" />{label}</span>
                  <Switch
                    checked={settings[key]}
                    onCheckedChange={(v) => setSettings({ ...settings, [key]: v })}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Registration */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <UserPlus className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">开放注册</p>
                <p className="text-sm text-muted-foreground">
                  关闭后新用户将无法注册
                </p>
              </div>
            </div>
            <Switch
              checked={settings.allowRegistration}
              onCheckedChange={(v) =>
                setSettings({ ...settings, allowRegistration: v })
              }
            />
          </div>

          {/* Security */}
          <div className="rounded-lg border p-5 space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2"><Shield className="h-4 w-4" />安全设置</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">人机验证 (Turnstile)</p>
                <p className="text-sm text-muted-foreground">Cloudflare 免费验证码，防止机器人注册</p>
              </div>
              <Switch checked={settings.turnstileEnabled} onCheckedChange={v => setSettings({ ...settings, turnstileEnabled: v })} />
            </div>
            {settings.turnstileEnabled && (
              <div className="space-y-2 pl-1 border-l-2 border-primary/30 pl-4">
                <Label>Site Key</Label>
                <Input value={settings.turnstileSiteKey} onChange={e => setSettings({ ...settings, turnstileSiteKey: e.target.value })} placeholder="0x4AAAAA..." />
                <p className="text-xs text-muted-foreground">在部署平台设环境变量 TURNSTILE_SECRET_KEY 为 Secret Key</p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
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
