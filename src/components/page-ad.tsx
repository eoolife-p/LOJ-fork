"use client";

import { useEffect, useState } from "react";
import { X, ChevronUp } from "lucide-react";

interface PageAdProps {
  position: string;
  className?: string;
  sticky?: boolean;
}

export default function PageAd({ position, className = "", sticky }: PageAdProps) {
  const [slot, setSlot] = useState<string | null>(null);
  const [pubId, setPubId] = useState<string>("");
  const [collapsed, setCollapsed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/settings/public").then(r => r.json()).then(d => {
      if (!d.adsEnabled || !d.adsPublisherId) return;
      setPubId(d.adsPublisherId);
      try {
        const slots = JSON.parse(d.adsSlots || "{}");
        if (slots[position]) { setSlot(slots[position]); setLoaded(true); }
      } catch {}
    }).catch(() => {});
  }, [position]);

  if (!slot || !loaded) return null;

  if (collapsed) {
    return (
      <div className={`${sticky ? "sticky top-4 z-10" : ""} ${className}`}>
        <button onClick={() => setCollapsed(false)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground bg-muted/50 rounded px-2 py-1"><ChevronUp className="h-3 w-3" /> 展开</button>
      </div>
    );
  }

  return (
    <div className={`${sticky ? "sticky top-4 z-10" : ""} ${className}`}>
      <div className="relative">
        {sticky && (
          <button onClick={() => setCollapsed(true)} className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-muted border hover:bg-accent z-10">
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={pubId}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
        <script dangerouslySetInnerHTML={{ __html: `(adsbygoogle = window.adsbygoogle || []).push({});` }} />
      </div>
    </div>
  );
}
