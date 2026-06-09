"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Code2, ListChecks, Send, Settings, Trophy, User, LogOut, MessageSquare,
  Medal, Swords, Dumbbell, HardDrive, Mail,
} from "lucide-react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { DEFAULT_SITE_ICON, DEFAULT_SITE_NAME } from "@/lib/default-logo";
import { useState, useRef, useEffect } from "react";

const baseNavItems = [
  { href: "/", label: "首页", icon: Trophy, key: "" },
  { href: "/problems", label: "题库", icon: ListChecks, key: "" },
  { href: "/training", label: "训练", icon: Dumbbell, key: "trainingEnabled" },
  { href: "/contest", label: "比赛", icon: Swords, key: "contestEnabled" },
  { href: "/rank", label: "排名", icon: Medal, key: "rankEnabled" },
  { href: "/discussions", label: "讨论", icon: MessageSquare, key: "discussionEnabled" },
];

interface SiteInfo {
  siteName: string;
  siteIcon: string;
}

interface FeatureToggles {
  trainingEnabled: boolean;
  contestEnabled: boolean;
  rankEnabled: boolean;
  discussionEnabled: boolean;
  showCustomPagesSeparator: boolean;
}

interface CustomPageItem {
  id: number;
  slug: string;
  title: string;
  icon: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [siteInfo, setSiteInfo] = useState<SiteInfo>({
    siteName: DEFAULT_SITE_NAME,
    siteIcon: "",
  });
  const [toggles, setToggles] = useState<FeatureToggles>({
    trainingEnabled: true, contestEnabled: true, rankEnabled: true, discussionEnabled: true, showCustomPagesSeparator: true,
  });
  const [customPages, setCustomPages] = useState<CustomPageItem[]>([]);
  const [unreadMsgs, setUnreadMsgs] = useState(0);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setSiteInfo((s) => ({
          siteName: data.siteName || s.siteName,
          siteIcon: data.siteIcon || s.siteIcon,
        }));
      })
      .catch(() => {});
    fetch("/api/settings/public")
      .then((r) => r.json())
      .then((data) => setToggles(data))
      .catch(() => {});
    fetch("/api/admin/custom-pages")
      .then((r) => r.json())
      .then((data: CustomPageItem[]) => setCustomPages(data))
      .catch(() => {});
    fetch("/api/messages").then(r => r.json()).then(d => setUnreadMsgs(d.unreadCount || 0)).catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const isAdmin = session?.user?.isAdmin;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 md:px-6 max-w-[1400px] mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 mr-14 shrink-0">
          {siteInfo.siteIcon || DEFAULT_SITE_ICON ? (
            <img
              src={siteInfo.siteIcon || DEFAULT_SITE_ICON}
              alt=""
              className="h-8 w-8 rounded-lg object-contain"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Code2 className="h-4 w-4" />
            </div>
          )}
          <span className="font-bold text-lg tracking-tight">
            {siteInfo.siteName}
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-0.5">
          {baseNavItems.filter((item) => {
            if (!item.key) return true;
            return (toggles as unknown as Record<string, boolean>)[item.key];
          }).map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1.5 right-1.5 h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
          {customPages.length > 0 && (
            <>
              {toggles.showCustomPagesSeparator && <div className="w-px h-5 bg-border mx-1" />}
              {customPages.map((p) => {
                const isCustomIcon = p.icon.startsWith("<svg") || p.icon.startsWith("http") || p.icon.startsWith("data:");
                const IconComponent = isCustomIcon ? null : (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[p.icon];
                const isActive = pathname.startsWith(`/pages/${p.slug}`);
                return (
                  <Link key={p.id} href={`/pages/${p.slug}`} className={cn("relative flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors", isActive ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent/50")}>
                    {isCustomIcon ? (p.icon.startsWith("<svg") ? <span className="h-4 w-4 shrink-0 [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: p.icon }} /> : <img src={p.icon} className="h-4 w-4 shrink-0 rounded object-cover" alt="" />) : (IconComponent ? <IconComponent className="h-4 w-4" /> : <Icons.FileText className="h-4 w-4" />)}
                    <span className="hidden sm:inline">{p.title}</span>
                    {isActive && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* Right */}
        <div className="ml-auto flex items-center gap-5">
          {session && (
            <div className="flex items-center gap-3">
              <Link href="/messages" className="relative p-1 rounded-md hover:bg-accent transition-colors">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {unreadMsgs > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{unreadMsgs > 99 ? "99+" : unreadMsgs}</span>}
              </Link>
              <NotificationBell />
            </div>
          )}
          <ThemeToggle />

          {session ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                  {session.user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline">{session.user.name}</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg border bg-card shadow-lg py-1 z-50">
                  <div className="px-3 py-2 border-b">
                    <p className="text-sm font-medium truncate">
                      {session.user.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {session.user.email}
                    </p>
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <User className="h-3.5 w-3.5" />
                    个人中心
                  </Link>
                  <Link
                    href="/files"
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <HardDrive className="h-3.5 w-3.5" />
                    我的文件
                  </Link>
                  <Link
                    href="/my-submissions"
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Send className="h-3.5 w-3.5" />
                    我的提交
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Settings className="h-3.5 w-3.5" />
                      管理
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-sm w-full text-left hover:bg-accent transition-colors text-red-600 dark:text-red-400"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    退出登录
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <User className="h-4 w-4" />
              登录
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
