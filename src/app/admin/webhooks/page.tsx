"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Loader2, Webhook, Plus, Pencil, Trash2, X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface WebhookItem {
  id: number;
  url: string;
  secret: string;
  events: string;
  enabled: boolean;
  createdAt: string;
}

export default function WebhooksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<WebhookItem | null>(null);
  const [formUrl, setFormUrl] = useState("");
  const [formEvents, setFormEvents] = useState("");
  const [formSecret, setFormSecret] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated" && !session.user.isAdmin) router.push("/");
  }, [status, session, router]);

  const loadData = () => {
    setLoading(true);
    fetch("/api/admin/webhooks")
      .then((r) => r.json())
      .then((d) => setWebhooks(d.webhooks || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const resetForm = () => {
    setEditing(null);
    setFormUrl("");
    setFormEvents("");
    setFormSecret("");
  };

  const startEdit = (w: WebhookItem) => {
    setEditing(w);
    setFormUrl(w.url);
    setFormEvents(typeof w.events === "string" ? w.events : JSON.stringify(w.events));
    setFormSecret(w.secret || "");
  };

  const handleSave = async () => {
    if (!formUrl || !formEvents) return;
    setSaving(true);
    try {
      let eventsArr: string[];
      try { eventsArr = JSON.parse(formEvents); } catch { eventsArr = formEvents.split(",").map((s) => s.trim()); }

      if (editing) {
        await fetch("/api/admin/webhooks", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, url: formUrl, events: eventsArr, secret: formSecret }),
        });
      } else {
        await fetch("/api/admin/webhooks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: formUrl, events: eventsArr, secret: formSecret }),
        });
      }
      resetForm();
      loadData();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    await fetch("/api/admin/webhooks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadData();
  };

  const handleToggle = async (w: WebhookItem) => {
    await fetch("/api/admin/webhooks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: w.id, enabled: !w.enabled }),
    });
    loadData();
  };

  if (status === "loading" || status !== "authenticated") {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-3.5rem)]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const parseEvents = (raw: string) => {
    try { return JSON.parse(raw); } catch { return raw; }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Webhook className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Webhook 管理</h1>
          <p className="text-muted-foreground text-sm">管理事件回调通知</p>
        </div>
      </div>

      <Card className="border-border/50 p-4 space-y-3">
        <h3 className="text-sm font-medium">{editing ? "编辑 Webhook" : "添加 Webhook"}</h3>
        <div className="flex flex-col gap-2">
          <input
            value={formUrl}
            onChange={(e) => setFormUrl(e.target.value)}
            placeholder="Webhook URL"
            className="h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            value={formEvents}
            onChange={(e) => setFormEvents(e.target.value)}
            placeholder='事件 (JSON数组，如 ["submission.created"])'
            className="h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            value={formSecret}
            onChange={(e) => setFormSecret(e.target.value)}
            placeholder="签名密钥 (可选)"
            className="h-9 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              {editing ? "更新" : "添加"}
            </Button>
            {editing && (
              <Button variant="outline" onClick={resetForm}>
                <X className="h-4 w-4 mr-1" />取消
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card className="border-border/50 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">URL</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">事件</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">状态</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">创建时间</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">加载中...</td></tr>
            ) : webhooks.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">暂无 Webhook</td></tr>
            ) : (
              webhooks.map((w) => (
                <tr key={w.id} className="border-b hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 max-w-[200px] truncate font-mono text-xs">{w.url}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {[].concat(parseEvents(w.events)).map((e: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-[10px] h-5 px-1.5">{e}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Switch checked={w.enabled} onCheckedChange={() => handleToggle(w)} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(w.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(w)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(w.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
