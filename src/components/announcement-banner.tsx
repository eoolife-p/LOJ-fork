"use client";

import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";

interface Announcement {
  id: number;
  title: string;
  content: string;
}

export default function AnnouncementBanner() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("announcement-dismissed");
      if (stored) {
        try { return new Set(JSON.parse(stored)); } catch {}
      }
    }
    return new Set();
  });
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetch("/api/announcements")
      .then((r) => r.json())
      .then(setItems)
      .catch(() => {});
  }, []);

  const dismiss = (id: number) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    sessionStorage.setItem("announcement-dismissed", JSON.stringify([...next]));
  };

  const visible = items.filter((a) => !dismissed.has(a.id));
  if (!collapsed && visible.length === 0) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-4">
      {collapsed ? (
        <button
          onClick={() => setCollapsed(false)}
          className="w-full flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-4 py-2 text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          <Megaphone className="h-4 w-4 text-amber-500" />
          {visible.length} 条公告未读 — 点击展开
        </button>
      ) : (
        <div className="space-y-2">
          {visible.map((a) => (
            <div
              key={a.id}
              className="relative flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3"
            >
              <Megaphone className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{a.title}</p>
                {a.content && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{a.content}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(a.id)}
                className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            onClick={() => setCollapsed(true)}
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            收起公告
          </button>
        </div>
      )}
    </div>
  );
}
