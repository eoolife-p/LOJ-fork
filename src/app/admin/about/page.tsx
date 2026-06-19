"use client";

import { useEffect, useState } from "react";
import {
  Server, Cpu, HardDrive, Globe, Shield,
  Database, Gauge, Code2, Package, Info,
  Terminal, Monitor, Cloud, Clock, MemoryStick,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DEFAULT_SITE_NAME, DEFAULT_SITE_ICON } from "@/lib/default-logo";

interface SiteInfo {
  siteName: string;
  siteIcon: string;
  siteSubtitle: string;
}

interface DeployInfo {
  platform: string;
  hostname: string;
  nodeVersion: string;
  uptime: number;
  totalMemory: number;
  freeMemory: number;
  cpus: number;
  loadAvg: number[];
  nodeEnv: string;
  dbProvider: string;
  dbConnected: boolean;
  judgeType: string;
  buildMode: string;
}

function formatUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}天`);
  if (h > 0) parts.push(`${h}小时`);
  if (m > 0) parts.push(`${m}分钟`);
  return parts.join(" ") || "刚启动";
}

function formatMemory(bytes: number) {
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

export default function AdminAboutPage() {
  const [siteInfo, setSiteInfo] = useState<SiteInfo>({
    siteName: DEFAULT_SITE_NAME,
    siteIcon: "",
    siteSubtitle: "在线评测系统",
  });
  const [deploy, setDeploy] = useState<DeployInfo | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setSiteInfo({
          siteName: data.siteName || DEFAULT_SITE_NAME,
          siteIcon: data.siteIcon || DEFAULT_SITE_ICON,
          siteSubtitle: data.siteSubtitle || "在线评测系统",
        });
      })
      .catch(() => {});
    fetch("/api/deploy-info")
      .then((r) => r.json())
      .then(setDeploy)
      .catch(() => {});
  }, []);

  const techStack = [
    { name: "Next.js", version: "16", icon: Globe, color: "text-foreground", bg: "bg-foreground/10" },
    { name: "React", version: "19", icon: Code2, color: "text-cyan-500", bg: "bg-cyan-500/10" },
    { name: "TypeScript", version: "5", icon: Terminal, color: "text-blue-500", bg: "bg-blue-500/10" },
    { name: "Prisma", version: "7", icon: Database, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { name: "Tailwind CSS", version: "4", icon: Package, color: "text-sky-500", bg: "bg-sky-500/10" },
    { name: "NextAuth", version: "5", icon: Shield, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { name: "Lucide React", version: "1", icon: Monitor, color: "text-orange-500", bg: "bg-orange-500/10" },
    { name: "Monaco Editor", version: "0.55", icon: Code2, color: "text-purple-500", bg: "bg-purple-500/10" },
    { name: "BlockNote", version: "0.50", icon: Package, color: "text-rose-500", bg: "bg-rose-500/10" },
    { name: "Recharts", version: "3", icon: Gauge, color: "text-violet-500", bg: "bg-violet-500/10" },
  ];

  return (
    <div className="space-y-6">
      {/* Hero 大卡片 */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 via-background to-primary/5 p-8 sm:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="relative flex flex-col sm:flex-row items-center gap-4">
          {siteInfo.siteIcon ? (
            <img src={siteInfo.siteIcon} alt="" className="h-14 w-14 rounded-xl object-contain shrink-0" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground shrink-0">
              <Info className="h-7 w-7" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{siteInfo.siteName}</h1>
            <p className="text-muted-foreground mt-1">{siteInfo.siteSubtitle}</p>
          </div>
        </div>
      </div>

      {/* 部署信息 */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>服务器信息</CardTitle>
              <CardDescription>实时运行状态</CardDescription>
            </div>
          </div>
        </CardHeader>
        {deploy ? (
          <CardContent className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { label: "平台", value: deploy.platform, icon: Monitor, color: "text-sky-500", bg: "bg-sky-500/10" },
              { label: "主机名", value: deploy.hostname, icon: Cloud, color: "text-indigo-500", bg: "bg-indigo-500/10" },
              { label: "Node.js", value: deploy.nodeVersion, icon: Terminal, color: "text-emerald-500", bg: "bg-emerald-500/10" },
              { label: "运行时间", value: formatUptime(deploy.uptime), icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
              { label: "CPU 核心", value: `${deploy.cpus} 核`, icon: Cpu, color: "text-blue-500", bg: "bg-blue-500/10" },
              { label: "系统负载", value: deploy.loadAvg.map((n: number) => n.toFixed(2)).join(" / "), icon: Gauge, color: "text-purple-500", bg: "bg-purple-500/10" },
              { label: "总内存", value: formatMemory(deploy.totalMemory), icon: MemoryStick, color: "text-orange-500", bg: "bg-orange-500/10" },
              { label: "可用内存", value: formatMemory(deploy.freeMemory), icon: HardDrive, color: "text-green-500", bg: "bg-green-500/10" },
              { label: "环境", value: deploy.nodeEnv === "production" ? "生产环境" : deploy.nodeEnv === "development" ? "开发环境" : deploy.nodeEnv, icon: Globe, color: "text-rose-500", bg: "bg-rose-500/10" },
              { label: "数据库", value: deploy.dbProvider.toUpperCase(), icon: Database, color: deploy.dbConnected ? "text-emerald-500" : "text-red-500", bg: deploy.dbConnected ? "bg-emerald-500/10" : "bg-red-500/10" },
              { label: "判题引擎", value: deploy.judgeType, icon: Cpu, color: "text-teal-500", bg: "bg-teal-500/10" },
              { label: "构建模式", value: deploy.buildMode, icon: Package, color: "text-slate-500", bg: "bg-slate-500/10" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-border/50 p-4 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <div className={`flex h-5 w-5 items-center justify-center rounded ${item.bg} ${item.color}`}>
                    <item.icon className="h-3 w-3" />
                  </div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
                <p className="text-sm font-medium">{item.value}</p>
              </div>
            ))}
          </CardContent>
        ) : (
          <CardContent>
            <p className="text-sm text-muted-foreground">加载中...</p>
          </CardContent>
        )}
      </Card>

      {/* 技术栈 */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>技术栈</CardTitle>
              <CardDescription>系统使用的核心技术及版本</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {techStack.map((tech) => (
              <div
                key={tech.name}
                className="flex items-center gap-2.5 rounded-lg border border-border/50 px-3 py-2.5 hover:bg-accent/50 transition-colors"
              >
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${tech.bg} ${tech.color}`}>
                  <tech.icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{tech.name}</p>
                  <p className="text-[10px] text-muted-foreground">v{tech.version}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
