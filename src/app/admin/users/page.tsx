"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Users,
  Loader2,
  Shield,
  User,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Plus,
  X,
  Camera,
  Globe,
  Upload,
  Trash2,
  Save,
  Pencil,
  Lock,
  HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

interface UserGroup {
  id: number;
  name: string;
  isAdmin: boolean;
  allowCustomStorage: boolean;
  color: string;
  storageLimit: number;
}

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  userGroupId: number;
  userGroup: UserGroup;
  storageLimit: number | null;
  bio: string;
  signature: string;
  avatar: string;
  githubUsername: string;
  websiteUrl: string;
  createdAt: string;
  submissionCount: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 20;
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [groupsLoaded, setGroupsLoaded] = useState(false);

  // Create user dialog
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createGroupId, setCreateGroupId] = useState("2");
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit user dialog
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    bio: "",
    signature: "",
    avatar: "",
    githubUsername: "",
    websiteUrl: "",
    password: "",
    userGroupId: "2",
    storageLimit: "" as string | number,
  });
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editUploading, setEditUploading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !session.user.isAdmin) {
      router.push("/");
    }
  }, [status, session, router]);

  const fetchUsers = () => {
    setLoading(true);
    fetch(`/api/admin/users?page=${page}&pageSize=${pageSize}`)
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users || []);
        setTotal(data.total || 0);
        setLoading(false);
      });
  };

  const fetchGroups = () => {
    fetch("/api/admin/user-groups")
      .then((r) => r.json())
      .then((data) => {
        setGroups(data.groups || []);
        setGroupsLoaded(true);
      });
  };

  useEffect(() => {
    fetchUsers();
    fetchGroups();
  }, [page]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    if (!createName || !createEmail || !createPassword) {
      setCreateError("请填写完整信息");
      return;
    }
    if (createPassword.length < 6) {
      setCreateError("密码至少6个字符");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName,
          email: createEmail,
          password: createPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || "创建失败");
      } else {
        const groupId = parseInt(createGroupId);
        const group = groups.find((g) => g.id === groupId);
        if (group) {
          await fetch(`/api/admin/users/${data.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userGroupId: groupId }),
          });
        }
        setShowCreate(false);
        setCreateName("");
        setCreateEmail("");
        setCreatePassword("");
        setCreateGroupId("2");
        fetchUsers();
      }
    } catch {
      setCreateError("网络错误");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (user: AdminUser) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      bio: user.bio,
      signature: user.signature,
      avatar: user.avatar,
      githubUsername: user.githubUsername,
      websiteUrl: user.websiteUrl,
      password: "",
      userGroupId: user.userGroupId.toString(),
      storageLimit: user.storageLimit ?? "",
    });
    setEditError("");
  };

  const handleEditSave = async () => {
    if (!editingUser) return;
    setEditSaving(true);
    setEditError("");
    try {
      const body: Record<string, unknown> = {};
      if (editForm.name !== editingUser.name) body.name = editForm.name;
      if (editForm.bio !== editingUser.bio) body.bio = editForm.bio;
      if (editForm.signature !== editingUser.signature) body.signature = editForm.signature;
      if (editForm.avatar !== editingUser.avatar) body.avatar = editForm.avatar;
      if (editForm.githubUsername !== editingUser.githubUsername) body.githubUsername = editForm.githubUsername;
      if (editForm.websiteUrl !== editingUser.websiteUrl) body.websiteUrl = editForm.websiteUrl;
      if (editForm.password) body.password = editForm.password;
      if (parseInt(editForm.userGroupId) !== editingUser.userGroupId) {
        body.userGroupId = parseInt(editForm.userGroupId);
      }
      const customLimit = editForm.storageLimit === "" ? null : Number(editForm.storageLimit);
      if (customLimit !== editingUser.storageLimit) {
        body.storageLimit = customLimit;
      }

      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || "保存失败");
      } else {
        setEditingUser(null);
        fetchUsers();
      }
    } catch {
      setEditError("网络错误");
    } finally {
      setEditSaving(false);
    }
  };

  const handleEditAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingUser) return;
    setEditUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setEditForm((f) => ({ ...f, avatar: data.url }));
      } else {
        setEditError(data.error || "头像上传失败");
      }
    } catch {
      setEditError("头像上传失败");
    } finally {
      setEditUploading(false);
    }
  };

  const resolveAvatar = (user: AdminUser): string => {
    if (user.avatar) return user.avatar;
    if (user.githubUsername) return `https://github.com/${user.githubUsername}.png`;
    return "";
  };

  const totalPages = Math.ceil(total / pageSize);

  if (status === "loading" || status !== "authenticated") {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-3.5rem)]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">用户管理</h1>
            <p className="text-muted-foreground text-sm">共 {total} 位用户</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/admin")} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            返回管理主页
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" />
            新建用户
          </Button>
        </div>
      </div>

      {/* Create User Dialog */}
      {showCreate && groupsLoaded && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl border bg-card shadow-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">新建用户</h2>
              <button type="button" onClick={() => setShowCreate(false)} className="rounded-md p-1 hover:bg-accent">
                <X className="h-4 w-4" />
              </button>
            </div>
            {createError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                {createError}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="c-name">用户名</Label>
                <Input id="c-name" value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="用户昵称" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-email">邮箱</Label>
                <Input id="c-email" type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} placeholder="user@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-password">密码</Label>
                <Input id="c-password" type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} placeholder="至少6个字符" required />
              </div>
              <div className="space-y-2">
                <Label>用户组</Label>
                <Select value={createGroupId} onValueChange={(v) => setCreateGroupId(v || "2")}>
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="选择用户组" />
                  </SelectTrigger>
                  <SelectContent className="z-[110]">
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id.toString()}>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                          {g.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />创建中</> : "创建用户"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Dialog */}
      {editingUser && groupsLoaded && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border bg-card shadow-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">编辑用户 #{editingUser.id}</h2>
              <button type="button" onClick={() => setEditingUser(null)} className="rounded-md p-1 hover:bg-accent">
                <X className="h-4 w-4" />
              </button>
            </div>
            {editError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                {editError}
              </div>
            )}
            <div className="space-y-4">
              {/* Avatar */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                  头像
                </Label>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary overflow-hidden">
                    {editForm.avatar || editForm.githubUsername ? (
                      <img src={editForm.avatar || `https://github.com/${editForm.githubUsername}.png`} alt="avatar" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-6 w-6" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-sm hover:bg-accent transition-colors">
                      <Upload className="h-3.5 w-3.5" />
                      <span>{editUploading ? "上传中..." : "上传"}</span>
                      <input type="file" className="hidden" onChange={handleEditAvatarUpload} disabled={editUploading} />
                    </label>
                    {editForm.avatar && (
                      <Button variant="ghost" size="sm" onClick={() => setEditForm((f) => ({ ...f, avatar: "" }))} className="text-destructive hover:text-destructive h-8 px-2">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>昵称</Label>
                  <Input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>邮箱</Label>
                  <Input value={editingUser.email} disabled className="bg-muted" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <GitHubIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  GitHub 用户名
                </Label>
                <Input value={editForm.githubUsername} onChange={(e) => setEditForm((f) => ({ ...f, githubUsername: e.target.value }))} placeholder="username" />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  个人网站
                </Label>
                <Input value={editForm.websiteUrl} onChange={(e) => setEditForm((f) => ({ ...f, websiteUrl: e.target.value }))} placeholder="https://example.com" />
              </div>

              <div className="space-y-2">
                <Label>个人签名</Label>
                <Input value={editForm.signature} onChange={(e) => setEditForm((f) => ({ ...f, signature: e.target.value }))} placeholder="一句话签名" />
              </div>

              <div className="space-y-2">
                <Label>个人简介</Label>
                <textarea value={editForm.bio} onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))} placeholder="个人简介..." rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    重置密码
                  </Label>
                  <Input type="password" value={editForm.password} onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))} placeholder="留空则不修改" />
                </div>
                <div className="space-y-2">
                  <Label>用户组</Label>
                  <Select value={editForm.userGroupId} onValueChange={(v) => setEditForm((f) => ({ ...f, userGroupId: v || "2" }))}>
                    <SelectTrigger className="w-full h-9">
                      <SelectValue placeholder="选择用户组" />
                    </SelectTrigger>
                  <SelectContent className="z-[110]">
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id.toString()}>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                          {g.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditingUser(null)} disabled={editSaving || editUploading}>
                  <X className="h-4 w-4" />取消
                </Button>
                <Button onClick={handleEditSave} disabled={editSaving || editUploading}>
                  {editSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  保存
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Card className="border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-16">ID</TableHead>
              <TableHead>用户</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead className="w-32">用户组</TableHead>
              <TableHead className="w-24">提交数</TableHead>
              <TableHead className="w-24">云盘</TableHead>
              <TableHead className="w-40">注册时间</TableHead>
              <TableHead className="w-24">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">暂无用户</TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono text-muted-foreground">{u.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted overflow-hidden shrink-0">
                        {resolveAvatar(u) ? (
                          <img src={resolveAvatar(u)} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <span className="font-medium">{u.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: u.userGroup?.color || "#64748b" }} />
                      <span className="text-xs">{u.userGroup?.name || "用户"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{u.submissionCount}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {u.storageLimit !== null ? formatBytes(u.storageLimit) : formatBytes(u.userGroup?.storageLimit || 2147483647)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{new Date(u.createdAt).toLocaleString("zh-CN")}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(u)} className="h-7 px-2">
                        <Pencil className="h-3.5 w-3.5" />编辑
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">第 {page} / {totalPages} 页</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
