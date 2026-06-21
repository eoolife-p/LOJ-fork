"use client";
/* eslint-disable react/no-unescaped-entities */

import { useEffect, useState } from "react";
import {
  Shield, Cookie, Eye, Lock, FileText, Server,
  Bell, Trash2, Globe, User, X, Scale, Fingerprint,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import MarkdownPreview from "@/components/markdown-preview";
import { DEFAULT_SITE_NAME } from "@/lib/default-logo";

export default function PrivacyPage() {
  const [siteName, setSiteName] = useState(DEFAULT_SITE_NAME);
  const [customPolicy, setCustomPolicy] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.siteName) setSiteName(d.siteName);
        if (d.privacyPolicy) setCustomPolicy(d.privacyPolicy);
      })
      .catch(() => {});
  }, []);

  // 站长自定义了隐私政策 → 展示富文本版本
  if (customPolicy) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-6">
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
        <Card className="border-border/50">
          <CardContent className="p-6">
            <MarkdownPreview content={customPolicy} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===== 默认隐私政策 =====
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
            <p className="text-muted-foreground mt-1">最后更新时间：2026年6月</p>
          </div>
        </div>
      </div>

      {/* 导言 */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
              <Scale className="h-4 w-4" />
            </div>
            <div>
              <CardTitle>导言</CardTitle>
              <CardDescription>适用范围与法律依据</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>{siteName}（以下简称"本站"或"我们"）深知个人信息对你的重要性，并会尽力保护你的个人信息安全。本隐私政策旨在向你说明我们如何收集、使用、存储和保护你的个人信息。</p>
          <p>本隐私政策适用于本站提供的全部在线评测（Online Judge）及相关功能服务，包括但不限于代码提交与判题、比赛系统、训练题单、讨论区、排名系统、消息通知等。</p>
          <p className="font-medium text-foreground">本隐私政策依据以下法律法规制定：</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>《中华人民共和国网络安全法》</li>
            <li>《中华人民共和国数据安全法》</li>
            <li>《中华人民共和国个人信息保护法》</li>
            <li>《信息安全技术 个人信息安全规范》（GB/T 35273-2020）</li>
          </ul>
          <p>请你仔细阅读本隐私政策。若你不同意本隐私政策的任何内容，请立即停止使用本站服务。继续使用本站服务即表示你已充分阅读、理解并同意本隐私政策的所有条款。</p>
        </CardContent>
      </Card>

      {/* 信息收集 */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-500">
              <Server className="h-4 w-4" />
            </div>
            <div>
              <CardTitle>我们收集的信息</CardTitle>
              <CardDescription>我们仅收集提供 OJ 服务所必要的信息</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: User, label: "账号信息", desc: "用户名、昵称、电子邮箱、加密后的登录密码。密码使用 bcrypt 算法加密存储，我们无法获取你的原始密码。" },
              { icon: Fingerprint, label: "第三方登录", desc: "当你使用 GitHub 或 Google 账号登录时，我们会获取你授权的公开信息（如用户名、邮箱），不会访问你的私有仓库或其他敏感数据。" },
              { icon: FileText, label: "提交与判题数据", desc: "你提交的代码内容、使用的编程语言、判题结果（通过/错误/超时等）、运行时间和内存消耗。" },
              { icon: Globe, label: "IP 地址与设备信息", desc: "提交代码、登录、注册等操作时的来源 IP 地址，用于安全审计和滥用防护。" },
              { icon: Cookie, label: "Cookie 与本地存储", desc: "用于维持登录会话、记住你的主题偏好和侧边栏状态。详见 Cookie 说明章节。" },
              { icon: Bell, label: "操作日志", desc: "登录、注册、密码修改、API 调用等操作的时间和类型，用于安全审计。" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent">
                  <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 信息用途 + 数据保护 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                <Eye className="h-4 w-4" />
              </div>
              <CardTitle className="text-base">信息使用目的</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                提供在线评测核心功能（代码提交、自动判题、排名统计）
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                运营比赛系统（包括 ACM/OI 赛制判题、封榜、排名计算）
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                维护系统安全，防范作弊、恶意攻击和滥用行为
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                发送与账号相关的服务通知（密码重置、比赛提醒等）
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                改善用户体验和优化系统性能
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                <strong className="text-foreground">我们不会将你的个人信息用于广告投放或用户画像</strong>
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
              <CardTitle className="text-base">数据安全保护</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                密码使用 bcrypt（加盐哈希）加密存储，无人可反向获取原始密码
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                登录会话令牌通过 HttpOnly Cookie 存储，防止 XSS 攻击窃取
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                全站 HTTPS 加密传输，防止中间人攻击
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                登录防暴力破解：同一邮箱 5 次失败锁定 15 分钟，单 IP 限制 20 次
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                提交与运行接口有冷却时间和频率限制，防止 API 滥用
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                <strong className="text-foreground">我们不会出售、出租或以其他方式向第三方提供你的个人信息</strong>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Cookie */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Cookie className="h-4 w-4" />
            </div>
            <div>
              <CardTitle>Cookie 与本地存储</CardTitle>
              <CardDescription>我们使用的浏览器存储技术</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "会话 Cookie", type: "必要", desc: "维持登录状态的身份验证令牌，关闭浏览器后自动失效。依据《个人信息保护法》第十三条，为履行服务协议所必需。" },
              { label: "偏好 Cookie", type: "必要", desc: "记录你选择的主题（亮色/暗色）、侧边栏展开/折叠状态。属于用户主动设置的偏好，不涉及个人信息。" },
              { label: "第三方 Cookie", type: "无", desc: "本站不使用任何第三方追踪 Cookie、社交媒体 Cookie 或跨站追踪技术。若未来引入广告系统，将另行通知并征求同意。" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-border/50 p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{item.label}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-emerald-500/10 text-emerald-500">
                    {item.type}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-border/50 bg-amber-500/5 p-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">你可以管理你的 Cookie 偏好：</strong>
              在浏览器设置中可以清除所有 Cookie，或通过本站页脚的"Cookie 偏好设置"入口随时调整你的选择。
              请注意，禁用必要 Cookie 可能导致登录功能无法正常使用。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 用户权利 */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
              <Scale className="h-4 w-4" />
            </div>
            <div>
              <CardTitle>你的权利</CardTitle>
              <CardDescription>根据《个人信息保护法》，你享有以下权利</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: Eye, label: "查阅权", desc: "你有权查阅我们收集的你的个人信息。在个人中心页面可以查看你的账号信息、提交记录和排名数据。", law: "《个人信息保护法》第四十四条" },
              { icon: FileText, label: "更正权", desc: "若你的个人信息有误或不完整，你有权要求我们进行更正。你可以在个人设置中自行修改部分信息。", law: "《个人信息保护法》第四十六条" },
              { icon: Trash2, label: "删除权", desc: "你可以联系管理员申请删除你的账号及所有关联数据。我们将在15个工作日内完成处理并提供回执。", law: "《个人信息保护法》第四十七条" },
              { icon: Server, label: "数据可携权", desc: "你可以联系管理员导出你的个人数据（提交记录、比赛成绩等），我们将以常用电子格式提供。", law: "《个人信息保护法》第四十五条" },
              { icon: Shield, label: "限制处理权", desc: "在特定情况下，你有权要求我们限制对个人信息的处理，例如信息准确性存在争议时。", law: "《个人信息保护法》第四十四条" },
              { icon: Bell, label: "撤回同意权", desc: "对于基于你同意进行的个人信息处理，你有权随时撤回同意。撤回不影响此前已进行的处理的合法性。", law: "《个人信息保护法》第十五条" },
              { icon: X, label: "注销账户", desc: "你有权随时注销你的账户。联系管理员即可完成注销流程，所有个人数据将被永久删除。", law: "《个人信息保护法》第四十七条" },
              { icon: Globe, label: "投诉举报", desc: "若你认为我们处理个人信息的行为侵犯了你的权益，可向有关监管部门投诉举报。", law: "《个人信息保护法》第六十五条" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 rounded-lg border border-border/50 p-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent">
                  <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{item.label}</p>
                    <span className="text-[10px] text-muted-foreground/50">{item.law}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 未成年人保护 */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/10 text-pink-500">
              <User className="h-4 w-4" />
            </div>
            <div>
              <CardTitle>未成年人保护</CardTitle>
              <CardDescription>对未满十四周岁用户的特殊保护</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-3">
          <p>根据《个人信息保护法》第三十一条及《儿童个人信息网络保护规定》，我们特别重视对未成年人个人信息的保护。</p>
          <p>本站主要面向程序设计学习与竞赛训练，不主动收集未成年人的个人信息。若你未满 14 周岁，请在父母或监护人的陪同下阅读本隐私政策，并在其同意下使用本站服务。</p>
          <p>若我们发现未经监护人同意收集了儿童个人信息，我们将立即删除相关数据。监护人可以随时联系我们要求查阅、修改或删除你监护的儿童的个人信息。</p>
        </CardContent>
      </Card>

      {/* 信息存储与跨境传输 */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
              <Server className="h-4 w-4" />
            </div>
            <div>
              <CardTitle>信息存储与跨境传输</CardTitle>
              <CardDescription>数据存储地点与传输规则</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-3">
          <p>你的个人信息存储于本站运营者选定的服务器中。若服务器位于中国大陆境内，受中国法律管辖；若服务器位于境外，我们将确保数据传输符合相关法律法规要求。</p>
          <p>根据《个人信息保护法》第三十八条，若涉及个人信息跨境传输，我们将依法采取必要的安全评估、签订标准合同或通过认证等措施，确保你的个人信息在境外获得同等水平的保护。</p>
          <p>我们将在服务运营期间及法律要求的期限内保留你的个人信息。当保留期限届满或你请求删除数据后，我们将安全地销毁或匿名化处理相关数据。</p>
        </CardContent>
      </Card>

      {/* 策略更新与联系方式 */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-500">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <CardTitle>隐私政策更新</CardTitle>
              <CardDescription>本政策可能不时修订</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-3">
          <p>我们保留随时修改本隐私政策的权利。当隐私政策发生重大变更时，我们将在网站上发布公告或通过站内通知告知你。</p>
          <p>重大变更包括但不限于：收集个人信息的目的、范围或方式发生变化；个人信息共享、转让或公开披露的对象发生变化；个人信息保护的重大技术措施变化。</p>
          <p>若你在隐私政策修改后继续使用本站服务，即表示你接受修改后的隐私政策。</p>
        </CardContent>
      </Card>

      <Separator />

      <div className="rounded-lg border border-border/50 bg-muted/30 p-4 text-sm text-muted-foreground leading-relaxed space-y-2">
        <p className="font-medium text-foreground">联系我们</p>
        <p>如果你对本隐私政策有任何疑问、意见或建议，或需要行使上述个人信息权利，请通过以下方式联系我们：</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>站内消息：登录后通过消息系统联系管理员</li>
          <li>发送邮件至站点管理员邮箱（如有配置）</li>
        </ul>
        <p className="text-xs">我们将在收到你的请求后 15 个工作日内予以回复。</p>
      </div>
    </div>
  );
}
