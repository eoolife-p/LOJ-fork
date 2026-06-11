"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Trophy, ListChecks, Send, ArrowRight, CheckCircle2, MessageSquare,
  Clock, User, Loader2, Bell, Megaphone,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import PageAd from "@/components/page-ad";
import { Badge } from "@/components/ui/badge";
import MarkdownPreview from "@/components/markdown-preview";
import { DEFAULT_SITE_NAME, DEFAULT_SITE_ICON } from "@/lib/default-logo";
import { cn } from "@/lib/utils";

interface SubmissionItem {
  id: number; status: string; language: string; createdAt: string;
  problem: { id: number; title: string }; user: { id: number; name: string };
}
interface DiscussionItem {
  id: number; title: string; createdAt: string;
  user: { id: number; name: string }; problem: { id: number; title: string } | null;
  _count: { replies: number };
}

const statusColors: Record<string, string> = {
  AC: "bg-emerald-500/10 text-emerald-500 border-emerald-500/25",
  WA: "bg-red-500/10 text-red-500 border-red-500/25",
  CE: "bg-amber-500/10 text-amber-500 border-amber-500/25",
  RE: "bg-orange-500/10 text-orange-500 border-orange-500/25",
  TLE: "bg-violet-500/10 text-violet-500 border-violet-500/25",
  MLE: "bg-blue-500/10 text-blue-500 border-blue-500/25",
};
const fallbackColor = "bg-muted text-muted-foreground";

function SectionTitle({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
      <Icon className="h-5 w-5 text-primary" />
      {children}
    </h2>
  );
}

function HeroCard({ siteIcon, siteName, siteSubtitle, slogan }: {
  siteIcon: string; siteName: string; siteSubtitle: string; slogan: string;
}) {
  const defaultSlogan = "刷题即修行，每一行代码都是成长的痕迹。";
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 via-background to-primary/5 p-10 sm:p-14">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      <div className="relative space-y-5">
        <div className="flex items-center gap-4">
          {siteIcon ? (
            <img src={siteIcon} alt="" className="h-14 w-14 rounded-xl object-contain" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Trophy className="h-7 w-7" />
            </div>
          )}
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">{siteName}</h1>
            <p className="text-muted-foreground mt-0.5">{siteSubtitle}</p>
          </div>
        </div>
        <p className="text-muted-foreground max-w-xl leading-relaxed">{slogan || defaultSlogan}</p>
        <Link href="/problems" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          开始刷题 <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [stats, setStats] = useState({ problemCount: 0, submissionCount: 0, acCount: 0 });
  const [discussionCount, setDiscussionCount] = useState(0);
  const [siteName, setSiteName] = useState(DEFAULT_SITE_NAME);
  const [siteIcon, setSiteIcon] = useState(DEFAULT_SITE_ICON);
  const [siteSubtitle, setSiteSubtitle] = useState("在线评测系统");
  const [slogan, setSlogan] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [showDiscussions, setShowDiscussions] = useState(false);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [discussions, setDiscussions] = useState<DiscussionItem[]>([]);
  const [heroLoaded, setHeroLoaded] = useState(false);

  useEffect(() => {
    // 检查是否需要初始化
    fetch("/api/init").then((r) => r.json())
      .then((data) => { if (data.needsInit) window.location.href = "/init"; })
      .catch(() => window.location.href = "/init");

    Promise.all([
      fetch("/api/problems").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/discussions?pageSize=1").then((r) => r.json()),
      fetch("/api/recent-submissions").then((r) => r.json()),
    ]).then(([pd, setd, dd, rsd]) => {
      setStats({
        problemCount: pd.total || 0,
        submissionCount: rsd.submissions?.length || 0,
        acCount: (rsd.submissions || []).filter((s: SubmissionItem) => s.status === "AC").length,
      });
      setDiscussionCount(dd.total || 0);
      if (setd.siteName) setSiteName(setd.siteName);
      if (setd.siteIcon) setSiteIcon(setd.siteIcon);
      if (setd.siteSubtitle) setSiteSubtitle(setd.siteSubtitle);
      setSlogan(setd.homepageSlogan || "");
      setAnnouncement(setd.homepageAnnouncement || "");
      setShowSubmissions(setd.homepageShowSubmissions ?? false);
      setShowDiscussions(setd.homepageShowDiscussions ?? false);
      if (setd.homepageShowSubmissions) setSubmissions(rsd.submissions || []);
      if (setd.homepageShowDiscussions) {
        fetch("/api/discussions?pageSize=8").then((r) => r.json()).then((d) => setDiscussions(d.discussions || [])).catch(() => {});
      }
    })
    .catch(() => {})
    .finally(() => setHeroLoaded(true));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-8">
      <PageAd position="slot_home_top" className="min-h-[90px]" />
      {/* Hero + Announcement side by side */}
      {heroLoaded ? (
        <div className={cn("grid gap-5", announcement ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
          <HeroCard siteIcon={siteIcon} siteName={siteName} siteSubtitle={siteSubtitle} slogan={slogan} />
          {announcement && (
            <Card className="border-border/50 p-6">
              <SectionTitle icon={Megaphone}>公告</SectionTitle>
              <MarkdownPreview content={announcement} />
            </Card>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-border/50 bg-muted/30 h-64 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-5">
        {[
          { label: "题目总数", value: stats.problemCount, icon: ListChecks, color: "text-blue-500" },
          { label: "提交总数", value: stats.submissionCount, icon: Send, color: "text-amber-500" },
          { label: "通过数", value: stats.acCount, icon: CheckCircle2, color: "text-emerald-500" },
          { label: "讨论话题", value: discussionCount, icon: MessageSquare, color: "text-violet-500" },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="pt-6 flex flex-col items-center gap-2">
              <s.icon className={`h-7 w-7 ${s.color}`} />
              <div className="text-3xl font-bold tracking-tight">{s.value}</div>
              <div className="text-muted-foreground text-sm">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Recent submissions & Latest discussions: side by side when both on */}
      {(showSubmissions || showDiscussions) && (
        <div className={cn("grid gap-5", showSubmissions && showDiscussions ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
          {showSubmissions && submissions.length > 0 && (
            <Card className="border-border/50 p-5">
              <SectionTitle icon={Send}>最近提交</SectionTitle>
              <div className="space-y-1.5">
                {submissions.slice(0, 10).map((sub) => (
                  <div key={sub.id} className="flex items-center gap-3 text-sm py-1.5">
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 shrink-0", statusColors[sub.status] || fallbackColor)}>{sub.status}</Badge>
                    <Link href={`/problems/${sub.problem.id}`} className="truncate hover:text-primary transition-colors flex-1 min-w-0">{sub.problem.title}</Link>
                    <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1"><User className="h-3 w-3" />{sub.user.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0 hidden sm:flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(sub.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {showDiscussions && discussions.length > 0 && (
            <Card className="border-border/50 p-5">
              <SectionTitle icon={MessageSquare}>最新讨论</SectionTitle>
              <div className="space-y-1.5">
                {discussions.slice(0, 8).map((d) => (
                  <div key={d.id} className="flex items-center gap-3 text-sm py-1.5">
                    <Link href={`/discussions/${d.id}`} className="truncate hover:text-primary transition-colors flex-1 min-w-0">{d.title}</Link>
                    <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1"><MessageSquare className="h-3 w-3" />{d._count.replies}</span>
                    <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1"><User className="h-3 w-3" />{d.user.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">{new Date(d.createdAt).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
