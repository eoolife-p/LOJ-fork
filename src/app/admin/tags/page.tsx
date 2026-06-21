"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Trash2, X, Save, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Tag {
  id: number;
  name: string;
  color: string;
}

export default function AdminTagsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState("#64748b");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated" && !session.user.isAdmin) router.push("/");
  }, [status, session, router]);

  const load = () => {
    fetch("/api/admin/tags")
      .then((r) => r.json())
      .then(setTags)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setEditingId(null);
    setFormName("");
    setFormColor("#64748b");
  };

  const startEdit = (t: Tag) => {
    setEditingId(t.id);
    setFormName(t.name);
    setFormColor(t.color);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await fetch("/api/admin/tags", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, name: formName, color: formColor }),
        });
      } else {
        await fetch("/api/admin/tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: formName, color: formColor }),
        });
      }
      resetForm();
      load();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    await fetch("/api/admin/tags", {
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
          <Tags className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">标签管理</h1>
          <p className="text-muted-foreground text-sm">管理题目标签及颜色</p>
        </div>
      </div>

      <Card className="border-border/50 p-4 space-y-3">
        <h3 className="text-sm font-medium">{editingId ? "编辑标签" : "新建标签"}</h3>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="space-y-2">
            <Label className="text-xs">名称</Label>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="标签名"
              className="w-40"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">颜色</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formColor}
                onChange={(e) => setFormColor(e.target.value)}
                className="w-9 h-9 rounded cursor-pointer border-0 p-0"
              />
              <Input
                value={formColor}
                onChange={(e) => setFormColor(e.target.value)}
                placeholder="#64748b"
                className="w-28 text-xs"
              />
            </div>
          </div>
          <div className="flex gap-2 pb-0.5">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editingId ? "更新" : "创建"}
            </Button>
            {editingId && (
              <Button variant="outline" size="sm" onClick={resetForm}>
                <X className="h-4 w-4" />取消
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card className="border-border/50 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : tags.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">暂无标签</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">预览</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">名称</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">颜色</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((t) => (
                <tr key={t.id} className="border-b hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <Badge style={{ backgroundColor: t.color, color: "#fff" }} className="border-0">
                      {t.name}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: t.color }} />
                      <span className="font-mono text-xs text-muted-foreground">{t.color}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(t)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
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
