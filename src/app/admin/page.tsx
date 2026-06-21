"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  BookOpen, Users, Settings, ChevronRight, Loader2, BarChart3,
  Swords, Dumbbell, FileText, Sparkles, Terminal, HardDrive, Send,
  Shield, Layout, FileCode, Mail, MessageSquare, DollarSign, Search,
  Webhook, CheckCircle2, Clock, UserPlus,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });
const Cell = dynamic(() => import("recharts").then((m) => m.Cell), { ssr: false });

interface Stats {
  problemCount: number;
  userCount: number;
  submissionCount: number;
  acCount: number;
  contestCount: number;
  discussionCount: number;
  trainingCount: number;
  todaySubmissions: number;
  todayUsers: number;
}
interface RecentSub {
  id: number; status: string; language: string; createdAt: string;
  problem: { id: number; title: string };
  user: { id: number; name: string };
}

const adminCards = [
  {
    title: "题目管理",
    desc: "创建、编辑、删除题目",
    href: "/admin/problems",
    icon: BookOpen,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    title: "比赛管理",
    desc: "创建、管理比赛",
    href: "/admin/contest",
    icon: Swords,
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
  {
    title: "训练管理",
    desc: "创建、管理训练题单",
    href: "/admin/training",
    icon: Dumbbell,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    title: "用户管理",
    desc: "查看用户、分配权限",
    href: "/admin/users",
    icon: Users,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    title: "用户组",
    desc: "管理用户组、权限与云盘",
    href: "/admin/user-groups",
    icon: Shield,
    color: "text-pink-500",
    bg: "bg-pink-500/10",
  },
  {
    title: "系统设置",
    desc: "站点名称、冷却限制等",
    href: "/admin/settings",
    icon: Settings,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    title: "AI 设置",
    desc: "配置 AI 模型、API Key",
    href: "/admin/ai-settings",
    icon: Sparkles,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    title: "判题设置",
    desc: "配置判题引擎、自定义接口",
    href: "/admin/judge-settings",
    icon: Terminal,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
  {
    title: "存储管理",
    desc: "配置文件存储后端",
    href: "/admin/storage",
    icon: HardDrive,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    title: "首页配置",
    desc: "自定义首页内容与公告",
    href: "/admin/homepage",
    icon: Layout,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
  },
  {
    title: "自定义页面",
    desc: "创建独立自定义页面",
    href: "/admin/custom-pages",
    icon: FileCode,
    color: "text-teal-500",
    bg: "bg-teal-500/10",
  },
  {
    title: "OAuth 登录",
    desc: "管理第三方登录提供者",
    href: "/admin/oauth-providers",
    icon: Shield,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
  {
    title: "邮件配置",
    desc: "SMTP 邮箱发送设置",
    href: "/admin/smtp",
    icon: Mail,
    color: "text-sky-500",
    bg: "bg-sky-500/10",
  },
  {
    title: "安全设置",
    desc: "人机验证与安全策略",
    href: "/admin/security",
    icon: Shield,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    title: "广告管理",
    desc: "Google AdSense 配置",
    href: "/admin/ads",
    icon: DollarSign,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
  },
  {
    title: "讨论区管理",
    desc: "管理讨论分区与开关",
    href: "/admin/discussion-categories",
    icon: MessageSquare,
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    title: "Rating 计算",
    desc: "为比赛重新计算 Rating",
    href: "/admin/contest#rating",
    icon: BarChart3,
    color: "text-lime-500",
    bg: "bg-lime-500/10",
  },
  {
    title: "团队管理",
    desc: "管理团队与成员",
    href: "/admin/teams",
    icon: Shield,
    color: "text-fuchsia-500",
    bg: "bg-fuchsia-500/10",
  },
  {
    title: "查重管理",
    desc: "检测代码相似度与抄袭",
    href: "/admin/plagiarism",
    icon: Search,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
  {
    title: "Webhook 管理",
    desc: "管理事件回调通知",
    href: "/admin/webhooks",
    icon: Webhook,
    color: "text-slate-500",
    bg: "bg-slate-500/10",
  },
];

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [health, setHealth] = useState<{ db: boolean; judge: boolean } | null>(null);
  const [recentSubs, setRecentSubs] = useState<RecentSub[]>([]);
  const [statusCounts, setStatusCounts] = useState<{ name: string; count: number; color: string }[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !session.user.isAdmin) {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats({
          problemCount: data.problemCount || 0,
          userCount: data.userCount || 0,
          submissionCount: data.submissionCount || 0,
          acCount: data.acCount || 0,
          contestCount: data.contestCount || 0,
          discussionCount: data.discussionCount || 0,
          trainingCount: data.trainingCount || 0,
          todaySubmissions: data.todaySubmissions || 0,
          todayUsers: data.todayUsers || 0,
        });
        setRecentSubs(data.recentSubmissions || []);
        setStatusCounts(data.statusCounts || []);
      })
      .catch(() => {});

    fetch("/api/admin/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => {});
  }, []);

  if (status === "loading" || status !== "authenticated") {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-3.5rem)]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">管理后台</h1>
          <p className="text-muted-foreground text-sm">系统概览与快捷入口</p>
        </div>
      </div>

      {/* Health */}
      {health && (
        <div className="flex gap-2">
          <span className={`px-2 py-1 rounded text-xs ${health.db ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500"}`}>
            数据库 {health.db ? "正常" : "异常"}
          </span>
          <span className={`px-2 py-1 rounded text-xs ${health.judge ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500"}`}>
            判题引擎 {health.judge ? "正常" : "异常"}
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {[
          { label: "题目", value: stats?.problemCount, icon: BookOpen, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "用户", value: stats?.userCount, icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "提交", value: stats?.submissionCount, icon: Send, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "AC", value: stats?.acCount, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
          { label: "比赛", value: stats?.contestCount, icon: Swords, color: "text-red-500", bg: "bg-red-500/10" },
          { label: "训练", value: stats?.trainingCount, icon: Dumbbell, color: "text-purple-500", bg: "bg-purple-500/10" },
          { label: "讨论", value: stats?.discussionCount, icon: MessageSquare, color: "text-violet-500", bg: "bg-violet-500/10" },
          { label: "今日提交", value: stats?.todaySubmissions, icon: Clock, color: "text-cyan-500", bg: "bg-cyan-500/10" },
          { label: "今日注册", value: stats?.todayUsers, icon: UserPlus, color: "text-pink-500", bg: "bg-pink-500/10" },
          { label: "AC率", value: stats?.submissionCount ? `${((stats.acCount / stats.submissionCount) * 100).toFixed(1)}%` : "-", icon: BarChart3, color: "text-teal-500", bg: "bg-teal-500/10" },
        ].map((s) => (
          <Card key={s.label} className="border-border/50 p-4 space-y-1">
            <div className="flex items-center gap-1.5">
              <div className={`flex h-5 w-5 items-center justify-center rounded ${s.bg} ${s.color}`}>
                <s.icon className="h-3 w-3" />
              </div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
            <p className="text-xl font-bold">{s.value ?? "-"}</p>
          </Card>
        ))}
      </div>

      {/* Chart + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-border/50 p-4">
          <h3 className="text-sm font-medium mb-3">提交状态分布</h3>
          {statusCounts.length > 0 && (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={statusCounts}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {statusCounts.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
        <Card className="border-border/50 p-4">
          <h3 className="text-sm font-medium mb-3">最近提交</h3>
          {recentSubs.length === 0 ? (
            <p className="text-xs text-muted-foreground">暂无提交</p>
          ) : (
            <div className="space-y-2">
              {recentSubs.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Link href={`/submissions/${s.id}`} className="font-mono hover:text-primary truncate shrink-0">#{s.id}</Link>
                    <span className="truncate">{s.user.name}</span>
                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 shrink-0">{s.language}</Badge>
                  </div>
                  <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                    s.status === "AC" ? "bg-emerald-500/10 text-emerald-600" :
                    s.status === "WA" ? "bg-red-500/10 text-red-500" :
                    s.status === "CE" ? "bg-amber-500/10 text-amber-500" :
                    "bg-muted text-muted-foreground"
                  }`}>{s.status}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {adminCards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="border-border/50 p-5 hover:bg-accent/50 transition-colors group cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.bg} ${card.color}`}
                  >
                    <card.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{card.title}</h3>
                    <p className="text-sm text-muted-foreground">{card.desc}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
