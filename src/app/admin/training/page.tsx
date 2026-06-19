"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Dumbbell, Plus, Trash2, Pencil, Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Training {
  id: number;
  title: string;
  difficulty: string;
  isPublic: boolean;
  problemCount: number;
  createdAt: string;
}

const difficultyColors: Record<string, string> = {
  "入门": "bg-blue-500/15 text-blue-500 border-blue-500/25",
  "Easy": "bg-emerald-500/15 text-emerald-500 border-emerald-500/25",
  "Medium": "bg-yellow-500/15 text-yellow-500 border-yellow-500/25",
  "Hard": "bg-red-500/15 text-red-500 border-red-500/25",
};

export default function AdminTrainingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !session.user.isAdmin) {
      router.push("/");
    }
  }, [status, session, router]);

  const fetchTrainings = () => {
    fetch("/api/admin/training?pageSize=100")
      .then((r) => r.json())
      .then((data) => {
        setTrainings(data.trainings || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTrainings();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除此训练题单？将同时删除所有相关题目和提交记录")) return;
    await fetch(`/api/admin/training?id=${id}`, { method: "DELETE" });
    fetchTrainings();
  };

  if (status === "loading" || status !== "authenticated") {
    return (
      <div className="flex items-center justify-center h-[calc(100dvh-3.5rem)]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Dumbbell className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">训练管理</h1>
            <p className="text-muted-foreground text-sm">管理所有训练题单，创建、编辑、删除</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/training/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> 新建训练
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-16">ID</TableHead>
              <TableHead>标题</TableHead>
              <TableHead className="w-24">难度</TableHead>
              <TableHead className="w-20">题目数</TableHead>
              <TableHead className="w-28">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
                </TableCell>
              </TableRow>
            ) : trainings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  暂无训练题单，点击右上角新建
                </TableCell>
              </TableRow>
            ) : (
              trainings.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-muted-foreground">
                    {t.id}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {t.title}
                      {!t.isPublic && (
                        <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">
                          隐藏
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs ${difficultyColors[t.difficulty] || ""}`}
                    >
                      {t.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {t.problemCount} 题
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Link href={`/training/${t.id}`} target="_blank">
                        <Button variant="ghost" size="sm" title="查看">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/training/${t.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(t.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
