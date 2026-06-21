import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const header = columns.join(",");
  const body = rows.map((row) =>
    columns.map((c) => {
      const v = String(row[c] ?? "");
      return v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
    }).join(",")
  ).join("\n");
  return header + "\n" + body;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user.isAdmin) return NextResponse.json({ error: "无权限" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "users";

  try {
    let csv: string;
    let filename: string;

    switch (type) {
      case "users": {
        const users = await prisma.user.findMany({
          select: { id: true, name: true, email: true, role: true, userGroupId: true, createdAt: true },
          orderBy: { id: "asc" },
        });
        csv = toCsv(users, ["id", "name", "email", "role", "userGroupId", "createdAt"]);
        filename = "users.csv";
        break;
      }
      case "problems": {
        const problems = await prisma.problem.findMany({
          select: { id: true, title: true, slug: true, difficulty: true, timeLimit: true, memoryLimit: true, tags: true, createdAt: true },
          orderBy: { id: "asc" },
        });
        csv = toCsv(problems, ["id", "title", "slug", "difficulty", "timeLimit", "memoryLimit", "tags", "createdAt"]);
        filename = "problems.csv";
        break;
      }
      case "submissions": {
        const subs = await prisma.submission.findMany({
          select: { id: true, problemId: true, userId: true, language: true, status: true, time: true, memory: true, createdAt: true },
          orderBy: { id: "desc" },
          take: 10000,
        });
        csv = toCsv(subs, ["id", "problemId", "userId", "language", "status", "time", "memory", "createdAt"]);
        filename = "submissions.csv";
        break;
      }
      default:
        return NextResponse.json({ error: "未知导出类型" }, { status: 400 });
    }

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "导出失败" }, { status: 500 });
  }
}
