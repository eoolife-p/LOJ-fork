"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const COOKIE_CONSENT_KEY = "cookie-consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 pointer-events-none">
      <Card className="mx-auto max-w-2xl pointer-events-auto border-border/50 shadow-lg backdrop-blur-md bg-background/95">
        <div className="flex items-start gap-4 p-4 sm:p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <Cookie className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <h3 className="text-sm font-semibold">Cookie 使用声明</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                本站使用必要的 Cookie 来维持登录状态和用户偏好设置。不用于追踪或广告目的。
                继续使用即表示你同意我们使用 Cookie。详情请查看
                <Link href="/privacy" className="text-primary hover:underline mx-1">隐私政策</Link>。
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={accept}>
                接受
              </Button>
              <Button size="sm" variant="outline" onClick={decline}>
                拒绝非必要
              </Button>
            </div>
          </div>
          <button
            onClick={decline}
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </Card>
    </div>
  );
}
