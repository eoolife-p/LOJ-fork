"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchData = () => {
    setLoading(true);
    fetch("/api/notifications").then(r => r.json()).then(d => {
      setNotifs(d.notifications?.slice(0, 10) || []);
      setUnread(d.unreadCount || 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    fetchData();
  };

  return (
    <div className="relative" ref={ref}>
      <button className="relative p-1 rounded-md hover:bg-accent transition-colors" onClick={() => { setOpen(!open); if (!open) fetchData(); }}>
        <Bell className="h-4 w-4 text-muted-foreground" />
        {unread > 0 && <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">{unread > 99 ? "99+" : unread}</span>}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg border bg-card shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-2.5 border-b">
            <span className="text-sm font-medium">通知</span>
            {unread > 0 && <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={markAllRead}>全部已读</Button>}
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {loading ? <div className="flex items-center justify-center py-8"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div> :
             notifs.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">暂无通知</p> :
             notifs.map(n => (
               <Link key={n.id} href={n.link || "#"} onClick={() => setOpen(false)} className={`block px-4 py-3 hover:bg-accent/50 transition-colors border-b last:border-b-0 ${!n.isRead ? "bg-primary/5" : ""}`}>
                 <div className="text-sm font-medium truncate">{n.title}</div>
                 {n.body && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</div>}
                 <div className="text-[10px] text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString("zh-CN")}</div>
               </Link>
             ))}
          </div>
          <Link href="/notifications" onClick={() => setOpen(false)} className="block text-center text-xs text-muted-foreground hover:text-foreground py-2 border-t">查看全部</Link>
        </div>
      )}
    </div>
  );
}
