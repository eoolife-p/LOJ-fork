"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Trash2, X, Save, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface Announcement {
  id: number;
  title: string;
  content: string;
  isActive: boolean;
  priority: number;
  createdAt: string;
}

export default function AdminAnnouncementsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [list, setList] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [formPriority, setFormPriority] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated" && !session.user.isAdmin) router.push("/");
  }, [status, session, router]);

  const load = () => {
    fetch("/api/admin/announcements")
      .then((r) => r.json())
      .then(setList)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setEditingId(null);
    setFormTitle("");
    setFormContent("");
    setFormActive(true);
    setFormPriority(0);
  };

  const startEdit = (a: Announcement) => {
    setEditingId(a.id);
    setFormTitle(a.title);
    setFormContent(a.content);
    setFormActive(a.isActive);
    setFormPriority(a.priority);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) return;
    setSaving(true);
    try {
      const body = editingId
        ? { id: editingId, title: formTitle, content: formContent, isActive: formActive, priority: formPriority }
        : { title: formTitle, content: formContent, isActive: formActive, priority: formPriority };
      const res = await fetch("/api/admin/announcements", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) { resetForm(); load(); }
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    await fetch("/api/admin/announcements", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  };

  if (status !== "authenticated") return (
    <div className="flex items-center justify-center h-[calc(100dvh-3.5rem)]">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Megaphone className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">系统公告</h1>
          <p className="text-muted-foreground text-sm">管理全站公告，活跃公告显示在首页顶部</p>
        </div>
      </div>

      <Card className="border-border/50 p-4 space-y-3">
        <h3 className="text-sm font-medium">{editingId ? "编辑公告" : "新建公告"}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">标题</Label>
            <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="公告标题" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">优先级 (越大越靠前)</Label>
            <Input type="number" value={formPriority} onChange={(e) => setFormPriority(parseInt(e.target.value) || 0)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">内容</Label>
          <textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} placeholder="公告内容..." rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y" />
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-xs flex items-center gap-2">
            <Switch checked={formActive} onCheckedChange={setFormActive} />
            激活
          </Label>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {editingId ? "更新" : "创建"}
          </Button>
          {editingId && <Button variant="outline" size="sm" onClick={resetForm}><X className="h-4 w-4" />取消</Button>}
        </div>
      </Card>

      <Card className="border-border/50 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : list.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">暂无公告</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">标题</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">状态</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">优先级</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">时间</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id} className="border-b hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium max-w-[200px] truncate">{a.title}</td>
                  <td className="px-4 py-3">
                    {a.isActive ? <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">活跃</Badge> : <Badge variant="secondary">隐藏</Badge>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{a.priority}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString("zh-CN")}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(a)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
