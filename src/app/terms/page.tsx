"use client";
/* eslint-disable react/no-unescaped-entities */

import { useEffect, useState } from "react";
import {
  FileText, UserCheck, ShieldAlert, Scale, BookOpen, Code,
  Trophy, MessageSquare, Ban, Gavel,
  Copyright, RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import MarkdownPreview from "@/components/markdown-preview";
import { DEFAULT_SITE_NAME } from "@/lib/default-logo";

export default function TermsPage() {
  const [siteName, setSiteName] = useState(DEFAULT_SITE_NAME);
  const [customTerms, setCustomTerms] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.siteName) setSiteName(d.siteName);
        if (d.termsOfService) setCustomTerms(d.termsOfService);
      })
      .catch(() => {});
  }, []);

  // 站长自定义了用户协议 → 展示富文本版本
  if (customTerms) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-6">
        <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 via-background to-primary/5 p-8 sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          <div className="relative flex flex-col sm:flex-row items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">用户协议</h1>
              <p className="text-muted-foreground mt-1">使用 {siteName} 前请仔细阅读本协议</p>
            </div>
          </div>
        </div>
        <Card className="border-border/50">
          <CardContent className="p-6">
            <MarkdownPreview content={customTerms} />
          </CardContent>
        </Card>
      </div>
    );
  }

  // ===== 默认用户协议 =====
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 via-background to-primary/5 p-8 sm:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="relative flex flex-col sm:flex-row items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">用户协议</h1>
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
              <CardDescription>协议的适用范围</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>欢迎你使用 {siteName}（以下简称"本站"）。本用户协议（以下简称"本协议"）由你与本站运营者共同缔结，具有合同效力。</p>
          <p>本协议适用于你通过任何方式访问、注册、登录或使用本站提供的全部服务，包括但不限于在线评测（Online Judge）、题目训练、比赛系统、讨论区、排名系统、消息通知、文件存储、API 接口等。</p>
          <p>请你仔细阅读本协议。当你完成注册或以任何方式实际使用本站服务时，即视为你已充分阅读、理解并同意接受本协议所有条款的约束。若你不同意本协议的任何内容，请立即停止使用本站服务。</p>
        </CardContent>
      </Card>

      {/* 账号注册与安全 */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
              <UserCheck className="h-4 w-4" />
            </div>
            <div>
              <CardTitle>账号注册与安全</CardTitle>
              <CardDescription>注册账号即表示你同意以下规则</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              "你应当使用真实、有效、合法的电子邮箱进行注册，并妥善保管你的账号密码。因密码保管不善导致的损失由你自行承担。",
              "一个邮箱通常只能注册一个账号。禁止批量注册、使用自动化工具注册或借用他人身份注册账号。",
              "你应当对账号下的所有行为负责，包括但不限于代码提交、讨论发言、消息发送、比赛报名等。",
              "如发现账号被盗用或存在安全风险，应立即修改密码并通知管理员。",
              "我们有权对长期未使用、违反法律法规或本协议的账号采取限制功能、冻结或注销等措施。",
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                {text}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* 服务内容与使用规则 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-500">
                <Code className="h-4 w-4" />
              </div>
              <CardTitle className="text-base">服务内容</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                "在线评测：提交代码、自动判题、查看结果与排名",
                "训练与比赛：参与训练题单、ACM/OI 赛制比赛、虚拟参赛",
                "讨论与社交：在讨论区发布话题、回复、点赞与交流",
                "个人中心：管理账号信息、提交记录、收藏题目与文件",
                "API 与扩展：按规则使用 API Token 访问开放接口",
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500" />
                  {text}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <CardTitle className="text-base">禁止行为</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                "利用漏洞、脚本、爬虫或自动化工具恶意刷题、刷榜、破坏系统",
                "提交病毒、恶意代码或试图攻击判题机、服务器及其他用户",
                "在比赛、训练中抄袭他人代码、多人共用账号、协同作弊",
                "发布违法、色情、暴力、歧视、广告、垃圾信息或侵犯他人权益的内容",
                "未经授权抓取、复制、传播本站题目、测试数据、用户数据或系统资源",
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                  {text}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* 知识产权 */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
              <Copyright className="h-4 w-4" />
            </div>
            <div>
              <CardTitle>知识产权</CardTitle>
              <CardDescription>内容归属与授权</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>本站提供的题目、测试数据、界面设计、软件代码、商标、标识及其他原创内容受著作权法、商标法及相关法律法规保护。未经本站书面许可，任何个人或组织不得复制、修改、传播、销售或用于商业用途。</p>
          <p>你提交至本站的代码、题解、讨论内容等，你保留原始著作权，但授予本站非独占、免费、可再许可的权利，用于判题、展示、统计、反作弊及推广本站服务。</p>
          <p>你应确保你发布的内容不侵犯任何第三方的知识产权、肖像权、名誉权或其他合法权益。若因你发布的内容导致本站被第三方追责，你应承担全部赔偿责任。</p>
        </CardContent>
      </Card>

      {/* 比赛与排名 */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Trophy className="h-4 w-4" />
            </div>
            <div>
              <CardTitle>比赛与排名规则</CardTitle>
              <CardDescription>公平竞赛是本站的核心原则</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>参与比赛即表示你同意遵守相应比赛的规则，包括但不限于赛制说明（ACM/OI）、时间限制、封榜规则、密码保护规则等。比赛期间严禁以下行为：</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>使用多个账号参赛或代打</li>
            <li>与他人交流题目解法或共享代码</li>
            <li>利用非公开资料、预先编写的代码或外部工具获取不公平优势</li>
            <li>攻击比赛系统、干扰其他参赛者</li>
          </ul>
          <p>一经发现作弊行为，本站有权取消比赛成绩、封禁账号、公示处理结果，并保留追究法律责任的权利。排名数据仅供参考，本站保留根据反作弊审查结果调整排名的权利。</p>
        </CardContent>
      </Card>

      {/* 讨论区规则 */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <CardTitle>讨论区规范</CardTitle>
              <CardDescription>友善交流，共同维护社区氛围</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>讨论区是用户交流学习心得、分享解题思路的场所。请你遵守以下规范：</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>尊重他人，禁止人身攻击、侮辱、歧视或骚扰</li>
            <li>禁止在比赛进行中发布题解或关键提示，以免影响比赛公平性</li>
            <li>题解与代码分享应符合社区约定，避免直接贴出可 AC 的完整代码影响他人独立思考</li>
            <li>禁止发布与程序设计无关的广告、外链、招聘或政治敏感内容</li>
          </ul>
          <p>管理员有权对违反规范的讨论进行隐藏、删除、警告或封禁处理。</p>
        </CardContent>
      </Card>

      {/* 服务变更与中断 */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
              <RefreshCw className="h-4 w-4" />
            </div>
            <div>
              <CardTitle>服务变更、中断与终止</CardTitle>
              <CardDescription>我们将尽力保证服务稳定</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>本站将尽力为用户提供持续、稳定的服务，但不对以下情况承担责任：因不可抗力、系统维护、网络故障、第三方服务中断、硬件故障、自然灾害、政府行为等原因导致的服务中断或数据丢失。</p>
          <p>本站有权在必要时暂停、变更、终止全部或部分服务，且无需事先通知用户。对于免费服务，本站不承担因服务变更或终止而产生的任何赔偿责任。</p>
          <p>如你违反本协议或相关法律法规，本站有权随时终止向你提供服务，删除相关数据，并保留进一步追责的权利。</p>
        </CardContent>
      </Card>

      {/* 免责声明 */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/10 text-pink-500">
              <Ban className="h-4 w-4" />
            </div>
            <div>
              <CardTitle>责任限制与免责声明</CardTitle>
              <CardDescription>在法律允许范围内使用服务</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>本站提供的题目、题解、排名、数据等内容仅供学习交流使用，不构成任何形式的担保或建议。你应自行判断内容的正确性和适用性。</p>
          <p>在法律允许的最大范围内，本站不对因使用或无法使用服务而导致的任何直接、间接、附带、特殊或惩罚性损害承担责任，包括但不限于数据丢失、利润损失、商誉损失等。</p>
          <p>你理解并同意，互联网服务存在固有安全风险，尽管我们采取了合理的安全措施，仍无法保证服务绝对安全或无漏洞。请你自行采取必要措施保护账号和数据安全。</p>
        </CardContent>
      </Card>

      {/* 隐私保护 */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-500">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <CardTitle>隐私保护</CardTitle>
              <CardDescription>个人信息处理规则详见隐私政策</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-3">
          <p>本站重视你的个人信息保护。我们收集、使用、存储和保护个人信息的具体规则，请参见我们的《隐私政策》。</p>
          <p>使用本站服务即表示你同意我们按照隐私政策处理你的个人信息。如隐私政策与本协议存在冲突，以本协议为准，但隐私政策中关于个人信息处理的专门约定优先适用。</p>
        </CardContent>
      </Card>

      {/* 协议更新 */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500">
              <Gavel className="h-4 w-4" />
            </div>
            <div>
              <CardTitle>协议更新与争议解决</CardTitle>
              <CardDescription>本协议可能不时修订</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-3">
          <p>我们保留随时修改本协议的权利。当本协议发生重大变更时，我们将在网站上发布公告或通过站内通知告知你。重大变更包括但不限于：服务内容变化、用户权利义务调整、隐私政策变化等。</p>
          <p>若你在协议修改后继续使用本站服务，即表示你接受修改后的协议。如你不同意修改后的协议，请停止使用本站服务。</p>
          <p>本协议的签订、履行、解释及争议解决均适用中华人民共和国法律（不包括冲突法规则）。如发生争议，双方应友好协商解决；协商不成的，任何一方均可向本站运营者所在地有管辖权的人民法院提起诉讼。</p>
        </CardContent>
      </Card>

      <Separator />

      <div className="rounded-lg border border-border/50 bg-muted/30 p-4 text-sm text-muted-foreground leading-relaxed space-y-2">
        <p className="font-medium text-foreground">联系我们</p>
        <p>如果你对本用户协议有任何疑问、意见或建议，请通过以下方式联系我们：</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>站内消息：登录后通过消息系统联系管理员</li>
          <li>发送邮件至站点管理员邮箱（如有配置）</li>
        </ul>
        <p className="text-xs">我们将在收到你的请求后 15 个工作日内予以回复。</p>
      </div>
    </div>
  );
}
