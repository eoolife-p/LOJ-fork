"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SmtpSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  // SMTP 字段
  const [host, setHost] = useState("");
  const [port, setPort] = useState("587");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [from, setFrom] = useState("");
  const [secure, setSecure] = useState(false);
  // Resend 字段
  const [resendEnabled, setResendEnabled] = useState(false);
  const [resendApiKey, setResendApiKey] = useState("");
  const [resendDomain, setResendDomain] = useState("");
  const [activeTab, setActiveTab] = useState("resend");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated" && !session.user.isAdmin) router.push("/");
    else if (status === "authenticated") {
      fetch("/api/admin/settings").then(r => r.json()).then(d => {
        setHost(d.smtpHost || "");
        setPort(String(d.smtpPort || 587));
        setUser(d.smtpUser || "");
        setPass(d.smtpPass || "");
        setFrom(d.smtpFrom || "");
        setSecure(d.smtpSecure ?? false);
        setResendEnabled(d.resendEnabled ?? false);
        setResendApiKey(d.resendApiKey || "");
        setResendDomain(d.resendDomain || "");
        // 如果 Resend 已启用，默认显示 Resend 标签页
        if (d.resendEnabled) setActiveTab("resend");
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [status, session, router]);

  const handleSave = async () => {
    setSaving(true); setMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        smtpHost: host, smtpPort: parseInt(port) || 587,
        smtpUser: user, smtpPass: pass, smtpFrom: from, smtpSecure: secure,
        resendEnabled, resendApiKey, resendDomain,
      }),
    });
    setMsg(res.ok ? "保存成功" : "保存失败");
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/admin")} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"><ArrowLeft className="h-4 w-4 text-muted-foreground" /></button>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Mail className="h-5 w-5" /></div>
        <h1 className="text-xl font-bold">邮件配置</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        配置后可启用密码重置、邮箱验证码等功能。支持 Resend（推荐）或 SMTP。留空则禁用邮件功能。
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="resend">Resend（推荐）</TabsTrigger>
          <TabsTrigger value="smtp">SMTP</TabsTrigger>
        </TabsList>

        <TabsContent value="resend" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resend 配置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Switch checked={resendEnabled} onCheckedChange={setResendEnabled} />
                <Label>启用 Resend</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                启用 Resend 后将优先使用 Resend 发送邮件。可在{" "}
                <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="underline">resend.com</a>{" "}
                注册并获取 API Key。
              </p>
              <div>
                <Label>API Key</Label>
                <Input
                  type="password"
                  value={resendApiKey}
                  onChange={e => setResendApiKey(e.target.value)}
                  placeholder="re_xxxxxxxxxxxx"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  也可以在环境变量中设置 <code>RESEND_API_KEY</code>（优先级低于数据库配置）。
                </p>
              </div>
              <div>
                <Label>发件域名（可选）</Label>
                <Input
                  value={resendDomain}
                  onChange={e => setResendDomain(e.target.value)}
                  placeholder="example.com"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  在 Resend 中验证过的域名，用于发件人地址。不填则使用默认发件人。
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="smtp" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">SMTP 服务器</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2"><Label>主机地址</Label><Input value={host} onChange={e => setHost(e.target.value)} placeholder="smtp.gmail.com" /></div>
                <div><Label>端口</Label><Input value={port} onChange={e => setPort(e.target.value)} placeholder="587" /></div>
              </div>
              <div className="flex items-center gap-4"><Switch checked={secure} onCheckedChange={setSecure} /><Label>使用 SSL/TLS</Label></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>用户名</Label><Input value={user} onChange={e => setUser(e.target.value)} placeholder="user@gmail.com" /></div>
                <div><Label>密码 / 应用专用密码</Label><Input type="password" value={pass} onChange={e => setPass(e.target.value)} /></div>
              </div>
              <div><Label>发件人地址</Label><Input value={from} onChange={e => setFrom(e.target.value)} placeholder="LOJ &lt;noreply@loj.com&gt;" /></div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {msg && <div className={`rounded-lg px-3 py-2 text-sm ${msg.includes("成功") ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}>{msg}</div>}

      <Button onClick={handleSave} disabled={saving} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? "保存中..." : "保存"}</Button>
    </div>
  );
}
