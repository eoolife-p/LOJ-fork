"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cookie, Shield, FileText, Heart } from "lucide-react";
import SponsorDialog from "@/components/sponsor-dialog";

interface FooterProps {
  siteName: string;
  footerText?: string;
}

export default function Footer({ siteName, footerText }: FooterProps) {
  const pathname = usePathname();
  const [sponsorOpen, setSponsorOpen] = useState(false);
  const [sponsorEnabled, setSponsorEnabled] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => { if (d.sponsorEnabled) setSponsorEnabled(true); })
      .catch(() => {});
  }, []);

  // 做题页面不显示页脚
  if (pathname.startsWith("/problems/") && pathname.split("/").length >= 3) {
    return null;
  }

  return (
    <>
      <SponsorDialog open={sponsorOpen} onOpenChange={setSponsorOpen} />
      <footer className="border-t border-border/50 bg-background/80 backdrop-blur-sm shrink-0 py-3">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col items-center justify-center gap-1.5">
          <span className="text-xs text-muted-foreground/70 tracking-wide">
            Powered by{" "}
            <span className="text-emerald-500/80 font-medium">{siteName}</span>
          </span>
          {footerText && (
            <div
              className="text-[11px] text-muted-foreground/60 text-center"
              dangerouslySetInnerHTML={{ __html: footerText }}
            />
          )}
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground/50">
            {sponsorEnabled && (
              <>
                <button
                  type="button"
                  onClick={() => setSponsorOpen(true)}
                  className="inline-flex items-center gap-1 hover:text-rose-500 transition-colors"
                >
                  <Heart className="h-3 w-3" />
                  赞助我们
                </button>
                <span className="text-border">|</span>
              </>
            )}
            <Link href="/terms" className="inline-flex items-center gap-1 hover:text-muted-foreground transition-colors">
              <FileText className="h-3 w-3" />
              用户协议
            </Link>
            <span className="text-border">|</span>
            <Link href="/privacy" className="inline-flex items-center gap-1 hover:text-muted-foreground transition-colors">
              <Shield className="h-3 w-3" />
              隐私政策
            </Link>
            <span className="text-border">|</span>
            <button
              id="cookie-prefs-trigger"
              type="button"
              className="inline-flex items-center gap-1 hover:text-muted-foreground transition-colors"
              style={{ display: "none" }}
            >
              <Cookie className="h-3 w-3" />
              Cookie 偏好设置
            </button>
          </div>
        </div>
      </footer>
    </>
  );
}
