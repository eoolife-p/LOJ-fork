"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Mail, Loader2, Send, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import dynamic from "next/dynamic";

const BlockNoteEditor = dynamic(() => import("@/components/blocknote-editor"), {
  ssr: false,
  loading: () => <div className="h-[200px] rounded-lg border bg-muted/30 flex items-center justify-center text-muted-foreground text-sm">加载编辑器...</div>,
});

export default function MessagesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [received, setReceived] = useState<any[]>([]);
  const [sent, setSent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"inbox" | "sent">("inbox");
  const [compose, setCompose] = useState(false);
  const [toUser, setToUser] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch("/api/messages").then(r => r.json()).then(d => { setReceived(d.received || []); setSent(d.sent || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); else if (status === "authenticated") fetchData(); }, [status, fetchData]);

  const handleSend = async () => {
    if (!toUser || !title || !content) return;
    setSending(true);
    const res = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ toUserId: parseInt(toUser) || toUser, title, content }) });
    if (res.ok) { setCompose(false); setToUser(""); setTitle(""); setContent(""); fetchData(); }
    setSending(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const items = tab === "inbox" ? received : sent;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Mail className="h-5 w-5" /><h1 className="text-xl font-bold">站内信</h1></div>
        <Button size="sm" onClick={() => setCompose(true)}><Plus className="h-4 w-4 mr-1" />写消息</Button>
      </div>

      <div className="flex gap-1 rounded-lg border p-1">
        <button onClick={() => setTab("inbox")} className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${tab === "inbox" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}>收件箱</button>
        <button onClick={() => setTab("sent")} className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${tab === "sent" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}>已发送</button>
      </div>

      {items.length === 0 ? <p className="text-muted-foreground text-center py-12">{tab === "inbox" ? "暂无收到消息" : "暂无发送消息"}</p> : (
        <div className="space-y-2">
          {items.map((m: any) => (
            <Card key={m.id} className={`p-4 ${tab === "inbox" && !m.isRead ? "border-primary/30 bg-primary/5" : ""}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-medium">{m.title}</div>
                <div className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleString("zh-CN")}</div>
              </div>
              <div className="text-xs text-muted-foreground mb-1">
                {tab === "inbox" ? `来自 ${m.fromUser?.name || "用户"}` : `发送给 ${m.toUser?.name || "用户"}`}
              </div>
              <div className="text-sm text-foreground/80 line-clamp-2">{m.content}</div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={compose} onOpenChange={setCompose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>写消息</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>收件人（用户 ID）</Label><Input value={toUser} onChange={e => setToUser(e.target.value)} placeholder="输入用户数字 ID" /></div>
            <div><Label>标题</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
            <div><Label>内容</Label><BlockNoteEditor value={content} onChange={setContent} /></div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCompose(false)}>取消</Button>
              <Button onClick={handleSend} disabled={sending || !toUser || !title || !content}><Send className="h-4 w-4 mr-1" />{sending ? "发送中..." : "发送"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
