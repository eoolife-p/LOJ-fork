"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Users,
  Settings,
  ChevronRight,
  Loader2,
  BarChart3,
  Swords,
  Dumbbell,
  FileText,
  Sparkles,
  Terminal,
  HardDrive,
  Send,
  Shield,
  Layout,
  FileCode,
  Mail,
  MessageSquare,
} from "lucide-react";
import { Card } from "@/components/ui/card";

interface Stats {
  problemCount: number;
  userCount: number;
  submissionCount: number;
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
    title: "讨论区管理",
    desc: "管理讨论分区与开关",
    href: "/admin/discussion-categories",
    icon: MessageSquare,
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
];

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !session.user.isAdmin) {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    Promise.all([
      fetch("/api/problems?pageSize=1").then((r) => r.json()),
      fetch("/api/admin/users?pageSize=1").then((r) => r.json()),
      fetch("/api/submissions?pageSize=1").then((r) => r.json()),
    ]).then(([problems, users, submissions]) => {
      setStats({
        problemCount: problems.total || 0,
        userCount: users.total || 0,
        submissionCount: submissions.total || 0,
      });
    });
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

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50 p-4">
          <p className="text-sm text-muted-foreground">题目总数</p>
          <p className="text-2xl font-bold mt-1">
            {stats?.problemCount ?? "-"}
          </p>
        </Card>
        <Card className="border-border/50 p-4">
          <p className="text-sm text-muted-foreground">用户总数</p>
          <p className="text-2xl font-bold mt-1">
            {stats?.userCount ?? "-"}
          </p>
        </Card>
        <Card className="border-border/50 p-4">
          <p className="text-sm text-muted-foreground">提交总数</p>
          <p className="text-2xl font-bold mt-1">
            {stats?.submissionCount ?? "-"}
          </p>
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
