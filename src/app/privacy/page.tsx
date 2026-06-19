"use client";

import { useEffect, useState } from "react";
import {
  Shield, Cookie, Eye, Lock, FileText, Server,
  Bell, Trash2, Globe, User, X,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DEFAULT_SITE_NAME } from "@/lib/default-logo";

export default function PrivacyPage() {
  const [siteName, setSiteName] = useState(DEFAULT_SITE_NAME);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => { if (d.siteName) setSiteName(d.siteName); })
      .catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 via-background to-primary/5 p-8 sm:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="relative flex flex-col sm:flex-row items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Shield className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">隐私政策</h1>
            <p className="text-muted-foreground mt-1">{siteName} 非常重视你的隐私</p>
          </div>
        </div>
      </div>

      {/* 数据收集 */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Server className="h-4 w-4" />
            </div>
            <div>
              <CardTitle>我们收集的信息</CardTitle>
              <CardDescription>必要的账号与使用数据</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: User, label: "账号信息", desc: "用户名、邮箱、加密密码" },
              { icon: FileText, label: "提交记录", desc: "代码、判题结果、时间戳" },
              { icon: Globe, label: "IP 地址", desc: "提交、登录等操作的来源 IP" },
              { icon: Cookie, label: "Cookie", desc: "维持登录状态的会话令牌" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent">
                  <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 信息用途 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                <Eye className="h-4 w-4" />
              </div>
              <CardTitle className="text-base">信息用途</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                提供 OJ 核心功能（判题、排名、讨论）
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                维护系统安全，防范滥用行为
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                改善用户体验和功能优化
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                不用于广告投放或用户画像
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                <Lock className="h-4 w-4" />
              </div>
              <CardTitle className="text-base">数据保护</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                密码使用 bcrypt 加密存储
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                登录令牌仅存储在 HttpOnly Cookie 中
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                服务器部署在受控环境中
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                不将数据出售或共享给第三方
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Cookie 说明 */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Cookie className="h-4 w-4" />
            </div>
            <div>
              <CardTitle>Cookie 政策</CardTitle>
              <CardDescription>本站使用的 Cookie 类型</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "会话 Cookie", desc: "维持登录状态，关闭浏览器后自动清除", type: "必要" },
              { label: "偏好 Cookie", desc: "记录主题偏好和侧边栏状态", type: "必要" },
              { label: "第三方 Cookie", desc: "未使用任何第三方追踪 Cookie", type: "无" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-border/50 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{item.label}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-emerald-500/10 text-emerald-500">
                    {item.type}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 用户权利 */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <CardTitle>你的权利</CardTitle>
              <CardDescription>你对自己的数据拥有完全控制权</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: Eye, label: "访问权", desc: "随时在个人中心查看自己的数据" },
              { icon: Trash2, label: "删除权", desc: "可联系管理员永久删除账户及所有数据" },
              { icon: FileText, label: "导出权", desc: "可联系管理员导出个人提交记录等数据" },
              { icon: X, label: "撤回同意", desc: "可在浏览器设置中清除 Cookie 并停止使用" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent">
                  <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      <p className="text-xs text-muted-foreground/60 text-center">
        如有隐私相关问题，请联系站点管理员。
      </p>
    </div>
  );
}
