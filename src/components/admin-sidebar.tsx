"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FileText, Trophy, Users, BookOpen, Settings,
  ShieldCheck, Bot, Database, HardDrive, Globe, Info,
  Palette, Key, Megaphone, Gauge, Scan, Webhook, MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const sections = [
  {
    label: "概览",
    items: [
      { href: "/admin", icon: LayoutDashboard, label: "控制台", color: "text-zinc-500", bg: "bg-zinc-500/10" },
      { href: "/admin/about", icon: Info, label: "关于", color: "text-blue-500", bg: "bg-blue-500/10" },
    ],
  },
  {
    label: "内容管理",
    items: [
      { href: "/admin/problems", icon: FileText, label: "题目管理", color: "text-blue-500", bg: "bg-blue-500/10" },
      { href: "/admin/contest", icon: Trophy, label: "比赛管理", color: "text-red-500", bg: "bg-red-500/10" },
      { href: "/admin/training", icon: BookOpen, label: "训练管理", color: "text-purple-500", bg: "bg-purple-500/10" },
      { href: "/admin/discussion-categories", icon: MessageSquare, label: "讨论区", color: "text-green-500", bg: "bg-green-500/10" },
    ],
  },
  {
    label: "用户与权限",
    items: [
      { href: "/admin/users", icon: Users, label: "用户管理", color: "text-emerald-500", bg: "bg-emerald-500/10" },
      { href: "/admin/user-groups", icon: ShieldCheck, label: "用户组", color: "text-pink-500", bg: "bg-pink-500/10" },
      { href: "/admin/teams", icon: Users, label: "团队管理", color: "text-fuchsia-500", bg: "bg-fuchsia-500/10" },
    ],
  },
  {
    label: "系统配置",
    items: [
      { href: "/admin/settings", icon: Settings, label: "系统设置", color: "text-amber-500", bg: "bg-amber-500/10" },
      { href: "/admin/ai-settings", icon: Bot, label: "AI 设置", color: "text-orange-500", bg: "bg-orange-500/10" },
      { href: "/admin/judge-settings", icon: Gauge, label: "判题设置", color: "text-cyan-500", bg: "bg-cyan-500/10" },
      { href: "/admin/storage", icon: HardDrive, label: "存储管理", color: "text-violet-500", bg: "bg-violet-500/10" },
      { href: "/admin/homepage", icon: Palette, label: "首页配置", color: "text-indigo-500", bg: "bg-indigo-500/10" },
    ],
  },
  {
    label: "高级",
    items: [
      { href: "/admin/oauth-providers", icon: Key, label: "OAuth 登录", color: "text-rose-500", bg: "bg-rose-500/10" },
      { href: "/admin/smtp", icon: Globe, label: "邮件配置", color: "text-sky-500", bg: "bg-sky-500/10" },
      { href: "/admin/security", icon: ShieldCheck, label: "安全设置", color: "text-orange-500", bg: "bg-orange-500/10" },
      { href: "/admin/ads", icon: Megaphone, label: "广告管理", color: "text-yellow-500", bg: "bg-yellow-500/10" },
      { href: "/admin/custom-pages", icon: FileText, label: "自定义页面", color: "text-teal-500", bg: "bg-teal-500/10" },
      { href: "/admin/plagiarism", icon: Scan, label: "查重管理", color: "text-rose-500", bg: "bg-rose-500/10" },
      { href: "/admin/webhooks", icon: Webhook, label: "Webhook", color: "text-slate-500", bg: "bg-slate-500/10" },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="pt-[68px]">
        <SidebarTrigger className="ml-auto" />
      </SidebarHeader>
      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))}
                      render={<Link href={item.href} />}
                    >
                      <div
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-md",
                          item.bg,
                          item.color
                        )}
                      >
                        <item.icon className="size-3.5" />
                      </div>
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <Link href="/" className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground">
          <div className="flex size-5 shrink-0 items-center justify-center rounded-md bg-slate-500/10 text-slate-500">
            <Database className="size-3.5" />
          </div>
          <span>返回前台</span>
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}
