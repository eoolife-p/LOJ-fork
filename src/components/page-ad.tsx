"use client";

import { useEffect, useState } from "react";

interface AdPositionProps {
  position: string; // e.g. "slot_home_top"
  className?: string;
}

export default function PageAd({ position, className = "" }: AdPositionProps) {
  const [slot, setSlot] = useState<string | null>(null);
  const [pubId, setPubId] = useState<string>("");

  useEffect(() => {
    fetch("/api/settings/public").then(r => r.json()).then(d => {
      if (!d.adsEnabled || !d.adsPublisherId) return;
      setPubId(d.adsPublisherId);
      try {
        const slots = JSON.parse(d.adsSlots || "{}");
        if (slots[position]) setSlot(slots[position]);
      } catch {}
    }).catch(() => {});
  }, [position]);

  useEffect(() => {
    if (!slot) return;
    try { ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({}); } catch {}
  }, [slot]);

  if (!slot) return null;

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={pubId}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
