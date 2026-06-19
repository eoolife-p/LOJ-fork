import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(_req: Request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  const versions = await prisma.languageVersion.findMany({ orderBy: { language: "asc" } });
  return NextResponse.json({ versions });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = (await request.json()) as { language: string; version?: string; compileCmd?: string; runCmd?: string; enabled?: boolean };
  const { language, version, compileCmd, runCmd, enabled } = body;
  if (!language) return NextResponse.json({ error: "language is required" }, { status: 400 });

  const lv = await prisma.languageVersion.create({
    data: {
      language,
      version: version || "latest",
      compileCmd: compileCmd || "",
      runCmd: runCmd || "",
      enabled: enabled ?? true,
    },
  });
  return NextResponse.json(lv, { status: 201 });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = (await request.json()) as { id: number; language?: string; version?: string; compileCmd?: string; runCmd?: string; enabled?: boolean };
  const { id, language, version, compileCmd, runCmd, enabled } = body;
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (language !== undefined) data.language = language;
  if (version !== undefined) data.version = version;
  if (compileCmd !== undefined) data.compileCmd = compileCmd;
  if (runCmd !== undefined) data.runCmd = runCmd;
  if (enabled !== undefined) data.enabled = enabled;

  const lv = await prisma.languageVersion.update({ where: { id }, data });
  return NextResponse.json(lv);
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { id } = (await request.json()) as { id: number };
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await prisma.languageVersion.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
