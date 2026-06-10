"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Shield, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export default function SecuritySettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);
  const [siteKey, setSiteKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated" && !session.user.isAdmin) router.push("/");
    else if (status === "authenticated") {
      fetch("/api/admin/settings").then(r => r.json()).then(d => {
        setEnabled(d.turnstileEnabled ?? false);
        setSiteKey(d.turnstileSiteKey || "");
        setSecretKey(d.turnstileSecretKey || "");
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [status, session, router]);

  const handleSave = async () => {
    setSaving(true); setMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ turnstileEnabled: enabled, turnstileSiteKey: siteKey, turnstileSecretKey: secretKey }),
    });
    setMsg(res.ok ? "保存成功" : "保存失败");
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/admin")} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"><ArrowLeft className="h-4 w-4 text-muted-foreground" /></button>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Shield className="h-5 w-5" /></div>
        <h1 className="text-xl font-bold">安全设置</h1>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">人机验证 (Cloudflare Turnstile)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div><div className="font-medium">启用 Turnstile</div><div className="text-sm text-muted-foreground">免费验证码，防止机器人注册</div></div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {enabled && (
            <div className="space-y-3 border-l-2 border-primary/30 pl-4">
              <div className="space-y-1.5">
                <Label>Site Key</Label>
                <Input value={siteKey} onChange={e => setSiteKey(e.target.value)} placeholder="0x4AAAAA..." />
              </div>
              <div className="space-y-1.5">
                <Label>Secret Key</Label>
                <Input type="password" value={secretKey} onChange={e => setSecretKey(e.target.value)} placeholder="0x4..." />
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                <p className="font-medium">部署密钥设置</p>
                <p className="text-muted-foreground">在 Vercel / EdgeOne 后台添加环境变量：</p>
                <code className="block text-xs bg-background px-2 py-1 rounded border mt-1">TURNSTILE_SECRET_KEY=your-secret-key</code>
                <p className="text-xs text-muted-foreground mt-2">去 <a href="https://dash.cloudflare.com/?to=/:account/turnstile" target="_blank" rel="noreferrer" className="text-primary hover:underline">Cloudflare Turnstile</a> 创建站点获取密钥对</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {msg && <div className={`rounded-lg px-3 py-2 text-sm ${msg.includes("成功") ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}>{msg}</div>}

      <Button onClick={handleSave} disabled={saving} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? "保存中..." : "保存"}</Button>
    </div>
  );
}
