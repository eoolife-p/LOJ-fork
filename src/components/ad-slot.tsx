"use client";

import { useEffect } from "react";

interface AdSlotProps {
  slot: string;    // e.g. "slot_home_banner"
  className?: string;
  style?: "banner" | "sidebar" | "footer";
}

export default function AdSlot({ slot, className = "", style = "banner" }: AdSlotProps) {
  useEffect(() => {
    try { ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({}); } catch {}
  }, []);

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={process.env.NEXT_PUBLIC_ADS_PUBLISHER_ID || ""}
        data-ad-slot={slot}
        data-ad-format={style === "sidebar" ? "vertical" : "auto"}
        data-full-width-responsive="true"
      />
    </div>
  );
}
