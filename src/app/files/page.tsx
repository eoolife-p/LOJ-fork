"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { pinyin } from "pinyin-pro";
import {
  Loader2, Upload, FolderPlus, Trash2, Pencil, Download,
  ArrowLeft, Folder, FileText, Image, Music, Video, File,
  HardDrive, X, Check, Grid3X3, List, Search, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface FileItem {
  id: number;
  name: string;
  path: string;
  size: number;
  mimeType: string;
  url: string;
  createdAt: string;
}

type Unit = "GB" | "MB" | "KB";

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  if (bytes >= k ** 3) return parseFloat((bytes / k ** 3).toFixed(2)) + " GB";
  if (bytes >= k ** 2) return parseFloat((bytes / k ** 2).toFixed(2)) + " MB";
  return parseFloat((bytes / k).toFixed(1)) + " KB";
}

function formatByUnit(bytes: number, unit: Unit): string {
  if (bytes === 0) return "0 " + unit;
  const k = 1024;
  const div = unit === "GB" ? k ** 3 : unit === "MB" ? k ** 2 : k;
  return parseFloat((bytes / div).toFixed(2)) + " " + unit;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const fileIconMap: Record<string, (name: string) => React.ReactNode> = {
  folder: () => <Folder className="h-10 w-10 text-amber-400" />,
  "image/": () => <Image className="h-10 w-10 text-blue-400" />,
  "video/": () => <Video className="h-10 w-10 text-purple-400" />,
  "audio/": () => <Music className="h-10 w-10 text-rose-400" />,
};

function fileIcon(mimeType: string, name: string) {
  if (mimeType === "folder") return fileIconMap.folder(name);
  for (const [prefix, fn] of Object.entries(fileIconMap)) {
    if (prefix !== "folder" && mimeType.startsWith(prefix)) return fn(name);
  }
  if (name.endsWith(".pdf")) return <FileText className="h-10 w-10 text-red-400" />;
  if (name.match(/\.(zip|rar|7z|tar|gz)$/)) return <FileText className="h-10 w-10 text-orange-400" />;
  return <File className="h-10 w-10 text-slate-400" />;
}

function toPinyin(text: string): string {
  try { return pinyin(text, { toneType: "none" }).replace(/\s+/g, "").toLowerCase(); } catch { return ""; }
}

function loadViewMode(): "grid" | "list" {
  try { const v = localStorage.getItem("loj_files_view"); if (v === "list") return "list"; } catch {}
  return "grid";
}

function saveViewMode(v: "grid" | "list") {
  try { localStorage.setItem("loj_files_view", v); } catch {}
}

function loadUnit(): Unit {
  try { const u = localStorage.getItem("loj_files_unit"); if (u === "MB" || u === "KB") return u; } catch {}
  return "GB";
}

function saveUnit(u: Unit) {
  try { localStorage.setItem("loj_files_unit", u); } catch {}
}

export default function MyFilesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPath, setCurrentPath] = useState("/");
  const [usage, setUsage] = useState(0);
  const [limit, setLimit] = useState(2147483647);

  const [viewMode, setViewMode] = useState<"grid" | "list">(loadViewMode);
  const [unit, setUnit] = useState<Unit>(loadUnit);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameId, setRenameId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");

  const fetchFiles = useCallback(() => {
    setLoading(true);
    fetch(`/api/files?path=${encodeURIComponent(currentPath)}`)
      .then((r) => r.json())
      .then((data) => {
        setFiles(data.files || []);
        setUsage(data.usage || 0);
        setLimit(data.limit || 2147483647);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [currentPath]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated") fetchFiles();
  }, [status, router, fetchFiles]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true); setError("");
    for (const file of files) {
      try {
        const fd = new FormData();
        fd.append("file", file); fd.append("path", currentPath);
        const res = await fetch("/api/files", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) setError(data.error || "上传失败");
      } catch { setError("上传失败"); }
    }
    fetchFiles();
    setUploading(false);
    e.target.value = "";
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setCreatingFolder(true); setError("");
    try {
      const res = await fetch("/api/files/folder", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName.trim(), path: currentPath }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "创建失败");
      else { setNewFolderName(""); fetchFiles(); }
    } catch { setError("创建失败"); }
    finally { setCreatingFolder(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除？")) return;
    setError("");
    try {
      const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); setError(d.error || "删除失败"); }
      else { setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; }); fetchFiles(); }
    } catch { setError("删除失败"); }
  };

  const handleBatchDelete = async () => {
    if (!confirm(`删除选中的 ${selectedIds.size} 项？`)) return;
    setError("");
    for (const id of Array.from(selectedIds)) {
      try { await fetch(`/api/files/${id}`, { method: "DELETE" }); } catch {}
    }
    setSelectedIds(new Set()); fetchFiles();
  };

  const handleRename = async (id: number) => {
    if (!renameValue.trim()) { setRenameId(null); return; }
    setError("");
    try {
      const res = await fetch(`/api/files/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameValue.trim() }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "重命名失败"); }
      else { setRenameId(null); fetchFiles(); }
    } catch { setError("重命名失败"); }
  };

  const enterFolder = (name: string) => {
    setCurrentPath((prev) => (prev === "/" ? `/${name}` : `${prev}/${name}`));
    setSelectedIds(new Set());
  };

  const goUp = () => {
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    setCurrentPath(parts.length === 0 ? "/" : "/" + parts.join("/"));
    setSelectedIds(new Set());
  };

  const handleDownload = async (item: FileItem) => {
    if (!item.url) return;
    try {
      const res = await fetch(item.url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = item.name; a.click();
      URL.revokeObjectURL(url);
    } catch { window.open(item.url, "_blank"); }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const handleViewChange = (v: "grid" | "list") => { setViewMode(v); saveViewMode(v); };
  const handleUnitChange = (v: Unit) => { setUnit(v); saveUnit(v); };

  const pathParts = currentPath.split("/").filter(Boolean);
  const searchLower = search.toLowerCase();

  const filtered = useMemo(() => {
    if (!searchLower) return files;
    return files.filter((f) => {
      const name = f.name.toLowerCase();
      if (name.includes(searchLower)) return true;
      try { if (toPinyin(f.name).includes(searchLower)) return true; } catch {}
      return false;
    });
  }, [files, searchLower]);

  if (status === "loading" || status !== "authenticated") {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-3.5rem)]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const usagePercent = Math.min((usage / limit) * 100, 100);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HardDrive className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">我的文件</h1>
            <p className="text-muted-foreground text-sm">{formatSize(usage)} / {formatSize(limit)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={unit} onValueChange={(v) => handleUnitChange(v as Unit)}>
            <SelectTrigger className="h-8 w-20 text-xs" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GB">GB</SelectItem>
              <SelectItem value="MB">MB</SelectItem>
              <SelectItem value="KB">KB</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center rounded-lg border bg-background p-1">
            <button onClick={() => handleViewChange("grid")} className={cn("p-1.5 rounded-md transition-colors", viewMode === "grid" ? "bg-accent" : "hover:bg-accent/50")}>
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button onClick={() => handleViewChange("list")} className={cn("p-1.5 rounded-md transition-colors", viewMode === "list" ? "bg-accent" : "hover:bg-accent/50")}>
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Usage bar */}
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", usagePercent > 90 ? "bg-red-500" : usagePercent > 70 ? "bg-amber-500" : "bg-primary")} style={{ width: `${usagePercent}%` }} />
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button onClick={goUp} disabled={currentPath === "/"} className="p-1.5 rounded-md hover:bg-accent disabled:opacity-30 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1 text-sm text-muted-foreground min-w-0 overflow-hidden">
            <button onClick={() => setCurrentPath("/")} className="hover:text-foreground transition-colors">根目录</button>
            {pathParts.map((part, idx) => (
              <span key={idx} className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3" />
                <button onClick={() => setCurrentPath("/" + pathParts.slice(0, idx + 1).join("/"))} className="hover:text-foreground transition-colors truncate">{part}</button>
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="搜索文件..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 w-48" />
          </div>
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border bg-background px-3 py-2 text-sm hover:bg-accent transition-colors">
            <Upload className="h-4 w-4" />
            <span>{uploading ? "上传中..." : "上传"}</span>
            <input type="file" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
          <Button variant="outline" size="sm" onClick={() => setCreatingFolder(!creatingFolder)} className="gap-1.5">
            <FolderPlus className="h-4 w-4" />新建文件夹
          </Button>
          {selectedIds.size > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBatchDelete} className="gap-1.5">
              <Trash2 className="h-4 w-4" />删除 {selectedIds.size}
            </Button>
          )}
        </div>
      </div>

      {/* New folder */}
      {creatingFolder && (
        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-amber-400" />
          <Input placeholder="文件夹名称" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleCreateFolder(); }} className="max-w-xs h-9" autoFocus />
          <Button size="sm" className="h-9 px-2" onClick={handleCreateFolder} disabled={!newFolderName.trim()}><Check className="h-4 w-4" /></Button>
          <Button size="sm" variant="ghost" className="h-9 px-2" onClick={() => { setCreatingFolder(false); setNewFolderName(""); }}><X className="h-4 w-4" /></Button>
        </div>
      )}

      {/* File list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground text-sm">
          {search ? "未找到匹配的文件" : "暂无文件，上传或创建文件夹"}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((item) => {
            const isFolder = item.mimeType === "folder";
            const isSelected = selectedIds.has(item.id);
            const isRenaming = renameId === item.id;
            return (
              <Card key={item.id} className={cn("relative p-3 hover:bg-accent/30 transition-colors cursor-pointer border", isSelected ? "border-primary ring-1 ring-primary/30" : "border-border/50")} onClick={() => toggleSelect(item.id)} onDoubleClick={() => isFolder ? enterFolder(item.name) : handleDownload(item)}>
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="flex items-center justify-center h-16 w-16">{fileIcon(item.mimeType, item.name)}</div>
                  {isRenaming ? (
                    <div className="w-full" onClick={(e) => e.stopPropagation()}>
                      <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleRename(item.id); if (e.key === "Escape") setRenameId(null); }} className="h-7 text-xs text-center" autoFocus />
                    </div>
                  ) : (
                    <div className="text-sm font-medium truncate w-full">{item.name}</div>
                  )}
                  <div className="text-[10px] text-muted-foreground">{isFolder ? "文件夹" : formatSize(item.size)}</div>
                </div>
                <div className="absolute top-1 right-1 flex items-center gap-0.5">
                  {!isRenaming && (
                    <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                      {!isFolder && item.url && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDownload(item)}><Download className="h-3 w-3" /></Button>}
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setRenameId(item.id); setRenameValue(item.name); }}><Pencil className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-border/50 overflow-hidden">
          <div className="divide-y">
            {filtered.map((item) => {
              const isFolder = item.mimeType === "folder";
              const isSelected = selectedIds.has(item.id);
              const isRenaming = renameId === item.id;
              return (
                <div key={item.id} className={cn("flex items-center gap-3 px-4 py-2.5 hover:bg-accent/20 transition-colors cursor-pointer", isSelected ? "bg-primary/5" : "")} onClick={() => toggleSelect(item.id)}>
                  <div className="shrink-0 w-8 h-8 flex items-center justify-center">{fileIcon(item.mimeType, item.name)}</div>
                  <div className="flex-1 min-w-0">
                    {isRenaming ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleRename(item.id); if (e.key === "Escape") setRenameId(null); }} className="h-7 max-w-xs" autoFocus />
                        <Button size="sm" className="h-7 w-7 p-0" onClick={() => handleRename(item.id)}><Check className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setRenameId(null)}><X className="h-3.5 w-3.5" /></Button>
                      </div>
                    ) : (
                      <button type="button" onClick={(e) => { e.stopPropagation(); isFolder ? enterFolder(item.name) : handleDownload(item); }} className="text-sm font-medium truncate hover:text-primary transition-colors text-left">{item.name}</button>
                    )}
                  </div>
                  <div className="hidden sm:block text-xs text-muted-foreground w-20 text-right">{isFolder ? "—" : formatSize(item.size)}</div>
                  <div className="hidden md:block text-xs text-muted-foreground w-32 text-right">{formatDate(item.createdAt)}</div>
                  <div className="shrink-0 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {!isRenaming && (
                      <>
                        {!isFolder && item.url && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownload(item)}><Download className="h-4 w-4" /></Button>}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setRenameId(item.id); setRenameValue(item.name); }}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
