"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Pencil,
  Loader2,
  BookOpen,
  RefreshCw,
} from "lucide-react";
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

interface Problem {
  id: number;
  title: string;
  slug: string;
  difficulty: string;
  timeLimit: number;
  memoryLimit: number;
  tags: string;
}

const difficultyColors: Record<string, string> = {
  Easy: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Hard: "bg-red-500/10 text-red-600 border-red-500/20",
};

export default function AdminProblemsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejudging, setRejudging] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !session.user.isAdmin) {
      router.push("/");
    }
  }, [status, session, router]);

  const fetchProblems = () => {
    fetch("/api/problems?pageSize=100")
      .then((r) => r.json())
      .then((data) => {
        setProblems(data.problems || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("确定删除此题目？")) return;
    await fetch(`/api/admin/problems?id=${id}`, { method: "DELETE" });
    fetchProblems();
  };

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
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">题目管理</h1>
            <p className="text-muted-foreground text-sm">创建、编辑、删除题目</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/problems/new/edit">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> 新建题目
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
              <TableHead className="w-24">时间限制</TableHead>
              <TableHead className="w-24">内存限制</TableHead>
              <TableHead className="w-28">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
                </TableCell>
              </TableRow>
            ) : problems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  暂无题目，点击右上角新建
                </TableCell>
              </TableRow>
            ) : (
              problems.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-muted-foreground">
                    {p.id}
                  </TableCell>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-xs ${difficultyColors[p.difficulty] || ""}`}
                    >
                      {p.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {p.timeLimit}s
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {p.memoryLimit}MB
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Link href={`/admin/problems/${p.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          setRejudging(p.id);
                          try {
                            const res = await fetch(`/api/admin/problems/${p.id}/rejudge`, { method: "POST" });
                            const data = await res.json();
                            alert(data.message || data.error);
                          } finally {
                            setRejudging(null);
                          }
                        }}
                        disabled={rejudging === p.id}
                      >
                        <RefreshCw className={rejudging === p.id ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(p.id)}
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
