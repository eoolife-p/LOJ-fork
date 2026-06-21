"use client";

import { useEffect, useState, useCallback, type Dispatch, type SetStateAction } from "react";
import Link from "next/link";
import { Cookie, Check, Settings, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const COOKIE_CONSENT_KEY = "cookie-consent";

interface CookiePrefs {
  necessary: boolean;
  analytics: boolean;
  advertising: boolean;
}

export default function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"main" | "custom">("main");
  const [agreed, setAgreed] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [prefs, setPrefs] = useState<CookiePrefs>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (stored) {
        try { return JSON.parse(stored) as CookiePrefs; } catch {}
      }
    }
    return { necessary: true, analytics: false, advertising: false };
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        const isEnabled = d.cookieConsentEnabled ?? true;
        setEnabled(isEnabled);
        if (!isEnabled) {
          localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ necessary: true, analytics: true, advertising: true }));
          return;
        }
        const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (!stored) {
          const timer = setTimeout(() => setOpen(true), 600);
          return () => clearTimeout(timer);
        }
      })
      .catch(() => {});
  }, []);

  const saveAndClose = useCallback((p: CookiePrefs) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(p));
    setPrefs(p);
    setOpen(false);
    setView("main");
  }, []);

  const acceptAll = () => saveAndClose({ necessary: true, analytics: true, advertising: true });
  const necessaryOnly = () => saveAndClose({ necessary: true, analytics: false, advertising: false });
  const saveCustom = () => saveAndClose({ ...prefs, necessary: true });

  const openFromFooter = () => {
    if (!enabled) {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ necessary: true, analytics: true, advertising: true }));
      return;
    }
    setView("custom");
    setOpen(true);
  };

  return (
    <>
      <FooterTriggerInjector onOpen={openFromFooter} />

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4">
          <div className="fixed inset-0 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-2xl border border-border/50 bg-background shadow-2xl animate-in slide-in-from-bottom duration-300">
            {view === "main" ? (
              <MainView
                agreed={agreed}
                setAgreed={setAgreed}
                onAcceptAll={acceptAll}
                onNecessaryOnly={necessaryOnly}
                onCustomSettings={() => setView("custom")}
              />
            ) : (
              <CustomView
                prefs={prefs}
                setPrefs={setPrefs}
                onBack={() => setView("main")}
                onSave={saveCustom}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ========== 主视图（截图样式） ========== */
function MainView({
  agreed,
  setAgreed,
  onAcceptAll,
  onNecessaryOnly,
  onCustomSettings,
}: {
  agreed: boolean;
  setAgreed: (v: boolean) => void;
  onAcceptAll: () => void;
  onNecessaryOnly: () => void;
  onCustomSettings: () => void;
}) {
  return (
    <div className="p-6 space-y-5">
      {/* 标题 */}
      <div className="flex items-center gap-2.5">
        <Cookie className="h-5 w-5 text-foreground" />
        <h2 className="text-base font-semibold">Cookie 设置</h2>
      </div>

      {/* 说明文字 */}
      <div className="space-y-2.5 text-sm text-muted-foreground leading-relaxed">
        <p>继续使用本网站即表示你同意以下协议及隐私政策中所述的 Cookie 使用方式。</p>
        <p>
          点击「接受全部」即表示您同意我们使用所有 Cookie，您也可以点击「自定义设置」来选择您希望启用的 Cookie 类型。
        </p>
      </div>

      {/* 同意勾选 */}
      <div
        onClick={() => setAgreed(!agreed)}
        className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3"
      >
        <div
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
            agreed
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background"
          )}
        >
          {agreed && <Check className="h-3.5 w-3.5" />}
        </div>
        <span className="text-sm">
          我已阅读并同意
          <Link href="/terms" target="_blank" className="mx-1 underline underline-offset-2 hover:text-primary">
            《用户协议》
          </Link>
          和
          <Link href="/privacy" target="_blank" className="mx-1 underline underline-offset-2 hover:text-primary">
            《隐私政策》
          </Link>
        </span>
      </div>

      {/* 按钮组 */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button onClick={onAcceptAll} disabled={!agreed} size="sm">
          <Check className="h-4 w-4 mr-1" />
          接受全部
        </Button>
        <Button onClick={onNecessaryOnly} disabled={!agreed} variant="outline" size="sm">
          仅必要 Cookie
        </Button>
        <Button onClick={onCustomSettings} disabled={!agreed} variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-1" />
          自定义设置
        </Button>
      </div>
    </div>
  );
}

/* ========== 自定义设置视图 ========== */
function CustomView({
  prefs,
  setPrefs,
  onBack,
  onSave,
}: {
  prefs: CookiePrefs;
  setPrefs: Dispatch<SetStateAction<CookiePrefs>>;
  onBack: () => void;
  onSave: () => void;
}) {
  return (
    <div className="p-6 space-y-5">
      {/* 头部 */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-base font-semibold">Cookie 偏好设置</h2>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">
        你可以根据需要调整各类 Cookie 的启用状态。必要 Cookie 无法禁用，因为它们对网站的基本功能至关重要。
      </p>

      <div className="space-y-3">
        {/* 必要 */}
        <div className="flex items-start justify-between gap-4 rounded-xl border border-border/50 p-3">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">必要 Cookie</Label>
            <p className="text-xs text-muted-foreground">维持登录会话、安全防护和核心功能所必需，无法禁用。</p>
          </div>
          <Switch checked disabled className="mt-0.5" />
        </div>

        {/* 分析 */}
        <div className="flex items-start justify-between gap-4 rounded-xl border border-border/50 p-3">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">统计分析 Cookie</Label>
            <p className="text-xs text-muted-foreground">匿名收集页面访问量、提交量等数据，帮助我们改进服务质量。</p>
          </div>
          <Switch
            checked={prefs.analytics}
            onCheckedChange={(v) => setPrefs((p) => ({ ...p, analytics: !!v }))}
            className="mt-0.5"
          />
        </div>

        {/* 广告 */}
        <div className="flex items-start justify-between gap-4 rounded-xl border border-border/50 p-3">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">广告 Cookie</Label>
            <p className="text-xs text-muted-foreground">用于展示个性化广告内容，可能由第三方广告平台设置。</p>
          </div>
          <Switch
            checked={prefs.advertising}
            onCheckedChange={(v) => setPrefs((p) => ({ ...p, advertising: !!v }))}
            className="mt-0.5"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onBack}>
          返回
        </Button>
        <Button size="sm" onClick={onSave}>
          保存偏好
        </Button>
      </div>
    </div>
  );
}

/** 注入到页脚，通过 data 属性与 Footer 组件通信 */
function FooterTriggerInjector({ onOpen }: { onOpen: () => void }) {
  useEffect(() => {
    const el = document.getElementById("cookie-prefs-trigger");
    if (el) {
      el.style.display = "flex";
      el.addEventListener("click", onOpen);
      return () => el.removeEventListener("click", onOpen);
    }
  }, [onOpen]);
  return null;
}
