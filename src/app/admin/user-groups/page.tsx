"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Users,
  Loader2,
  Save,
  ArrowLeft,
  Plus,
  X,
  Shield,
  HardDrive,
  Palette,
  Pencil,
  Trash2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface UserGroup {
  id: number;
  name: string;
  isAdmin: boolean;
  storageLimit: number;
  color: string;
  priority: number;
  _count?: { users: number };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16",
  "#10b981", "#06b6d4", "#3b82f6", "#6366f1",
  "#8b5cf6", "#d946ef", "#f43f5e", "#64748b",
];

export default function AdminUserGroupsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState<UserGroup | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    isAdmin: false,
    storageLimit: 2147483647,
    color: "#64748b",
    priority: 0,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !session.user.isAdmin) {
      router.push("/");
    }
  }, [status, session, router]);

  const fetchGroups = () => {
    setLoading(true);
    fetch("/api/admin/user-groups")
      .then((r) => r.json())
      .then((data) => {
        setGroups(data.groups || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const startEdit = (g: UserGroup) => {
    setEditing(g);
    setEditForm({
      name: g.name,
      isAdmin: g.isAdmin,
      storageLimit: g.storageLimit,
      color: g.color,
      priority: g.priority,
    });
    setError("");
  };

  const startCreate = () => {
    setEditing({ id: 0, name: "", isAdmin: false, storageLimit: 2147483647, color: "#64748b", priority: 0 } as UserGroup);
    setEditForm({
      name: "",
      isAdmin: false,
      storageLimit: 2147483647,
      color: "#64748b",
      priority: 0,
    });
    setError("");
  };

  const handleSave = async () => {
    setError("");
    const isNew = editing?.id === 0;
    try {
      const res = await fetch("/api/admin/user-groups", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: isNew ? undefined : editing?.id,
          ...editForm,
          storageLimit: Number(editForm.storageLimit),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "保存失败");
      } else {
        setEditing(null);
        fetchGroups();
      }
    } catch {
      setError("保存失败");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除此用户组？该组下不能有任何用户。")) return;
    setError("");
    try {
      const res = await fetch(`/api/admin/user-groups?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "删除失败");
      } else {
        fetchGroups();
      }
    } catch {
      setError("删除失败");
    }
  };

  if (status === "loading" || status !== "authenticated") {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-3.5rem)]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">用户组</h1>
            <p className="text-muted-foreground text-sm">管理用户组、权限与云盘容量</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/admin")} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />返回
          </Button>
          <Button size="sm" onClick={startCreate} className="gap-1.5">
            <Plus className="h-4 w-4" />新建用户组
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Edit/Create Dialog */}
      {editing && (
        <Card className="border-border/50 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{editing.id === 0 ? "新建用户组" : `编辑用户组 #${editing.id}`}</h2>
            <button type="button" onClick={() => setEditing(null)} className="rounded-md p-1 hover:bg-accent">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label>名称</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} placeholder="用户组名称" />
            </div>
            <div className="space-y-2">
              <Label>优先级</Label>
              <Input type="number" value={editForm.priority} onChange={(e) => setEditForm((f) => ({ ...f, priority: parseInt(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
                云盘容量（字节）
              </Label>
              <Input type="number" value={editForm.storageLimit} onChange={(e) => setEditForm((f) => ({ ...f, storageLimit: parseInt(e.target.value) || 0 }))} />
              <p className="text-xs text-muted-foreground">当前：{formatBytes(editForm.storageLimit)}</p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                颜色
              </Label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditForm((f) => ({ ...f, color: c }))}
                    className={cn("w-6 h-6 rounded-full border-2 transition-all", editForm.color === c ? "border-foreground scale-110" : "border-transparent")}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={editForm.isAdmin} onCheckedChange={(v) => setEditForm((f) => ({ ...f, isAdmin: v }))} />
              <div>
                <Label className="flex items-center gap-1.5 cursor-pointer">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                  允许管理
                </Label>
                <p className="text-xs text-muted-foreground">该组用户可访问管理后台</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}>
              <X className="h-4 w-4" />取消
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4" />保存
            </Button>
          </div>
        </Card>
      )}

      {/* Groups list */}
      <Card className="border-border/50 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">暂无用户组</div>
        ) : (
          <div className="divide-y">
            {groups.map((g) => (
              <div key={g.id} className="flex items-center justify-between px-4 py-4 hover:bg-accent/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{g.name}</span>
                      {g.isAdmin && <span className="text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded">管理</span>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      容量 {formatBytes(g.storageLimit)} · 优先级 {g.priority}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(g)} title="编辑">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(g.id)} title="删除">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
