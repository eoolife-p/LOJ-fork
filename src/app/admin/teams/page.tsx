"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Users, UserPlus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TeamInfo { id: number; name: string; leaderId: number; members: string; createdAt: string }

export default function TeamsAdmin() {
  const { data: session } = useSession();
  const router = useRouter();
  const [teams, setTeams] = useState<TeamInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session && !session.user.isAdmin) { router.push("/"); return; }
    fetch("/api/admin/teams").then(r=>r.json()).then(d => setTeams(d.teams || [])).finally(()=>setLoading(false));
  }, [session, router]);

  const deleteTeam = async (id: number) => {
    await fetch(`/api/admin/teams?id=${id}`, { method: "DELETE" });
    setTeams(teams.filter(t => t.id !== id));
  };

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-6"><p className="text-muted-foreground">加载中...</p></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6" /><h1 className="text-xl font-bold">团队管理</h1>
        </div>
      </div>
      {teams.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">暂无团队</CardContent></Card>
      ) : (
        teams.map(t => (
          <Card key={t.id}>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">{t.name}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => deleteTeam(t.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              创建于 {new Date(t.createdAt).toLocaleDateString()} · {
                (() => { try { return JSON.parse(t.members).length; } catch { return 0; } })()
              } 名成员
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
