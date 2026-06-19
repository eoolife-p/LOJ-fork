"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ListChecks,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";

interface Problem {
  id: number;
  title: string;
  slug: string;
  difficulty: string;
  tags: string;
  createdAt: string;
  _count: { submissions: number };
}

const difficultyColors: Record<string, string> = {
  Easy: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Hard: "bg-red-500/10 text-red-600 border-red-500/20",
};

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [difficulty, setDifficulty] = useState("all");
  const [keyword, setKeyword] = useState("");
  const pageSize = 20;

  useEffect(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
    if (difficulty !== "all") params.set("difficulty", difficulty);
    if (keyword) params.set("keyword", keyword);

    fetch(`/api/problems?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setProblems(data.problems || []);
        setTotal(data.total || 0);
      });
  }, [page, difficulty, keyword]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ListChecks className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">题库</h1>
          <p className="text-muted-foreground text-sm">共 {total} 道题目</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索题目..."
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={difficulty}
          onValueChange={(v) => {
            setDifficulty(v ?? "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[140px]">
            <span>
              {difficulty === "all"
                ? "全部难度"
                : difficulty === "Easy"
                  ? "简单"
                  : difficulty === "Medium"
                    ? "中等"
                    : difficulty === "Hard"
                      ? "困难"
                      : difficulty}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部难度</SelectItem>
            <SelectItem value="Easy">简单</SelectItem>
            <SelectItem value="Medium">中等</SelectItem>
            <SelectItem value="Hard">困难</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-16">ID</TableHead>
              <TableHead>标题</TableHead>
              <TableHead className="w-24">难度</TableHead>
              <TableHead className="w-24">标签</TableHead>
              <TableHead className="w-24">提交数</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {problems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  暂无题目
                </TableCell>
              </TableRow>
            ) : (
              problems.map((p) => {
                const tags = JSON.parse(p.tags || "[]") as string[];
                return (
                  <TableRow key={p.id} className="group">
                    <TableCell className="font-mono text-muted-foreground">
                      {p.id}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/problems/${p.id}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {p.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${difficultyColors[p.difficulty] || ""}`}
                      >
                        {p.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {tags.slice(0, 2).map((t: string) => (
                          <Badge key={t} variant="secondary" className="text-xs">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p._count.submissions}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            第 {page} / {totalPages} 页
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
