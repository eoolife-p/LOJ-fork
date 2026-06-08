"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  Loader2, Trophy, Send, CheckCircle2, Save, X, Globe, Mail, Quote, Pencil, User, FileText, Link2, Camera, Upload, Trash2, Unlink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

interface UserStats {
  totalSubmissions: number;
  acCount: number;
  problemCount: number;
}

interface UserProfile {
  name: string;
  email: string;
  role: string;
  bio: string;
  signature: string;
  avatar: string;
  githubUsername: string;
  oauthAccounts: string;
  image: string;
  websiteUrl: string;
}

export default function ProfilePage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats>({
    totalSubmissions: 0,
    acCount: 0,
    problemCount: 0,
  });
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "",
    role: "user",
    bio: "",
    signature: "",
    avatar: "",
    githubUsername: "",
    image: "",
    oauthAccounts: "[]",
    websiteUrl: "",
  });
  const [uploading, setUploading] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/user/stats")
        .then((r) => r.json())
        .then((data) => {
          setStats({
            totalSubmissions: data.totalSubmissions || 0,
            acCount: data.acCount || 0,
            problemCount: data.problemCount || 0,
          });
        })
        .catch(() => {});

      fetch("/api/user/profile")
        .then((r) => r.json())
        .then((data) => {
          setProfile(data);
          setProfileLoaded(true);
        })
        .catch(() => {
          setProfileLoaded(true);
        });
    }
  }, [session]);

  const handleEdit = useCallback(() => {
    setEditForm({
      name: profile.name,
      bio: profile.bio,
      signature: profile.signature,
      avatar: profile.avatar,
      githubUsername: profile.githubUsername,
      websiteUrl: profile.websiteUrl,
    });
    setEditing(true);
  }, [profile]);

  const handleCancel = useCallback(() => {
    setEditing(false);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data);
        setEditing(false);
        await updateSession();
      } else {
        setSaveError(data.error || "保存失败，请重试");
      }
    } catch {
      setSaveError("网络错误，请重试");
    } finally {
      setSaving(false);
    }
  }, [editForm, updateSession]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
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
        setProfile((p) => ({ ...p, avatar: data.url }));
        await updateSession();
      } else {
        setSaveError(data.error || "头像上传失败");
      }
    } catch {
      setSaveError("头像上传失败");
    } finally {
      setUploading(false);
    }
  };

  const resolveAvatar = (user: UserProfile): string => {
    if (user.avatar) return user.avatar;
    if (user.githubUsername) return `https://github.com/${user.githubUsername}.png`;
    return "";
  };

  const handleRemoveAvatar = () => {
    setEditForm((f) => ({ ...f, avatar: "" }));
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-3.5rem)]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) return null;

  const displayName = profile.name || session?.user?.name || "";
  const displayEmail = profile.email || session?.user?.email || "";
  const isLoadingProfile = !displayName && !displayEmail;
  const avatarUrl = resolveAvatar(profile);
  const acRate = stats.totalSubmissions > 0 ? Math.round((stats.acCount / stats.totalSubmissions) * 100) : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
      {/* ========== 顶部信息栏 ========== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {/* 头像 */}
        <div className="relative shrink-0">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary text-3xl font-bold overflow-hidden">
            {isLoadingProfile ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>
        </div>

        {/* 名称 + 邮箱 + 标签 */}
        <div className="flex-1 min-w-0 space-y-1">
          {isLoadingProfile ? (
            <>
              <div className="h-8 w-32 bg-muted rounded animate-pulse" />
              <div className="h-4 w-48 bg-muted rounded animate-pulse mt-2" />
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">{displayName}</h1>
                <Badge variant="outline" className="text-xs">
                  {profile.role === "admin" ? "管理员" : "普通用户"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="truncate">{displayEmail}</span>
              </div>
            </>
          )}
          {!isLoadingProfile && profile.signature && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground italic pt-1">
              <Quote className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground/60" />
              <span>{profile.signature}</span>
            </div>
          )}
        </div>

        {/* 编辑按钮 */}
        {!editing && !isLoadingProfile && (
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Pencil className="h-4 w-4" />
            编辑资料
          </Button>
        )}
      </div>

      {/* ========== 统计数据 ========== */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center gap-2">
            <Send className="h-6 w-6 text-amber-500" />
            <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
            <div className="text-xs text-muted-foreground">总提交</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex flex-col items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            <div className="text-2xl font-bold">{stats.acCount}</div>
            <div className="text-xs text-muted-foreground">已通过</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex flex-col items-center gap-2">
            <Trophy className="h-6 w-6 text-blue-500" />
            <div className="text-2xl font-bold">{acRate}%</div>
            <div className="text-xs text-muted-foreground">通过率</div>
          </CardContent>
        </Card>
      </div>

      {/* ========== 编辑模式 ========== */}
      {editing ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Pencil className="h-4 w-4 text-muted-foreground" />
              编辑资料
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* 头像编辑 */}
            <div className="space-y-3">
              <Label className="flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                头像
              </Label>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold overflow-hidden">
                  {editForm.avatar ? (
                    <img src={editForm.avatar} alt="avatar" className="h-full w-full object-cover" />
                  ) : editForm.githubUsername ? (
                    <img src={`https://github.com/${editForm.githubUsername}.png`} alt="github avatar" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-8 w-8" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-sm hover:bg-accent transition-colors">
                      <Upload className="h-3.5 w-3.5" />
                      <span>{uploading ? "上传中..." : "上传头像"}</span>
                      <input type="file" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                    </label>
                    {editForm.avatar && (
                      <Button variant="ghost" size="sm" onClick={handleRemoveAvatar} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                        移除
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">支持任意文件，最大 2MB</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  昵称
                </Label>
                <Input id="edit-name" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} placeholder="输入昵称" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-signature" className="flex items-center gap-1.5">
                  <Quote className="h-3.5 w-3.5 text-muted-foreground" />
                  个人签名
                </Label>
                <Input id="edit-signature" value={editForm.signature} onChange={(e) => setEditForm((f) => ({ ...f, signature: e.target.value }))} placeholder="一句话签名" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-bio" className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                个人简介
              </Label>
              <Textarea id="edit-bio" value={editForm.bio} onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))} placeholder="介绍一下你自己..." className="min-h-[80px]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="edit-github" className="flex items-center gap-1.5">
                  <GitHubIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  GitHub 用户名
                </Label>
                <Input id="edit-github" value={editForm.githubUsername} onChange={(e) => setEditForm((f) => ({ ...f, githubUsername: e.target.value }))} placeholder="your-username" />
                <p className="text-xs text-muted-foreground">留空则使用默认头像</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-website" className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  个人网站
                </Label>
                <Input id="edit-website" value={editForm.websiteUrl} onChange={(e) => setEditForm((f) => ({ ...f, websiteUrl: e.target.value }))} placeholder="https://your-website.com" />
              </div>
            </div>

            {saveError && (
              <p className="text-sm text-destructive">{saveError}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleCancel} disabled={saving || uploading}>
                <X className="h-4 w-4" />
                取消
              </Button>
              <Button onClick={handleSave} disabled={saving || uploading}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                保存
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* ========== 展示模式 ========== */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 左侧：简介 */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  个人简介
                </CardTitle>
              </CardHeader>
              <CardContent>
                {profile.bio ? (
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">还没有填写个人简介...</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 右侧：链接 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  账号关联
                </CardTitle>
              </CardHeader>
               <CardContent className="space-y-3">
                 {(() => {
                   const linked = (() => { try { return JSON.parse(profile.oauthAccounts || "[]"); } catch { return []; } })();
                   const providers = ["github", "google"];
                   return (
                     <>
                       {linked.map((a: any) => (
                         <div key={a.provider} className="flex items-center gap-2.5 text-sm">
                           <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                             {a.avatar ? <img src={a.avatar} alt="" className="h-5 w-5 rounded" /> : <GitHubIcon className="h-4 w-4 text-muted-foreground" />}
                           </div>
                           <div className="min-w-0">
                             <div className="font-medium">{a.provider.charAt(0).toUpperCase() + a.provider.slice(1)}</div>
                             <div className="text-xs text-muted-foreground truncate">{a.providerAccountId}{a.username && a.username !== a.providerAccountId ? ` (${a.username})` : ""}</div>
                           </div>
                           <span className="ml-auto text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded">已关联</span>
                         </div>
                       ))}
                       {profile.githubUsername && !linked.find(a => a.provider === "github") ? null : null}
                       {providers.filter(id => !linked.find(a => a.provider === id)).map(id => (
                         <div key={id} className="flex items-center gap-2.5 text-sm">
                           <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                             <GitHubIcon className="h-4 w-4 text-muted-foreground" />
                           </div>
                           <div className="min-w-0">
                             <div className="font-medium">{id.charAt(0).toUpperCase() + id.slice(1)}</div>
                             <div className="text-xs text-muted-foreground">未关联</div>
                           </div>
                           <Button variant="outline" size="sm" className="ml-auto h-7 text-xs" onClick={() => signIn(id, { callbackUrl: "/profile" })}>
                             <Link2 className="h-3 w-3 mr-1" />关联
                           </Button>
                         </div>
                       ))}
                       {linked.length === 0 && providers.every(id => !linked.find(a => a.provider === id)) && !profile.githubUsername && (
                         <p className="text-sm text-muted-foreground text-center">登录时选择第三方账号即可自动关联</p>
                       )}
                     </>
                   );
                 })()}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
