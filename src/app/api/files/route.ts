import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getStorageProvider } from "@/lib/storage";

async function getMaxFileSize(): Promise<number> {
  const settings = await prisma.settings.findFirst();
  return settings?.maxFileSize || 20971520;
}

async function getUserStorageLimit(userId: number): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { userGroup: true },
  });
  if (!user) return 2147483647;
  if (user.storageLimit !== null) return user.storageLimit;
  return user.userGroup?.storageLimit ?? 2147483647;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const userId = parseInt(session.user.id);
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path") || "/";

  try {
    const [files, usage, limit] = await Promise.all([
      prisma.file.findMany({
        where: { userId, path },
        orderBy: [{ createdAt: "desc" }],
      }),
      prisma.file.aggregate({
        where: { userId },
        _sum: { size: true },
      }),
      getUserStorageLimit(userId),
    ]);

    return NextResponse.json({
      files,
      usage: usage._sum.size || 0,
      limit,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "服务器错误";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "请先登录" }, { status: 401 });

  const userId = parseInt(session.user.id);

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const path = (formData.get("path") as string) || "/";

    if (!file) {
      return NextResponse.json({ error: "未选择文件" }, { status: 400 });
    }

    const [usage, limit, maxFileSize] = await Promise.all([
      prisma.file.aggregate({
        where: { userId },
        _sum: { size: true },
      }),
      getUserStorageLimit(userId),
      getMaxFileSize(),
    ]);

    if (file.size > maxFileSize) {
      return NextResponse.json({ error: `单个文件不能超过 ${(maxFileSize / 1024 / 1024).toFixed(0)}MB` }, { status: 400 });
    }

    const used = usage._sum.size || 0;
    if (used + file.size > limit) {
      return NextResponse.json({ error: "空间不足" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storage = await getStorageProvider();
    const result = await storage.upload(buffer, file.name, file.type);

    const saved = await prisma.file.create({
      data: {
        userId,
        name: file.name,
        path,
        size: file.size,
        mimeType: file.type,
        url: result.url,
      },
    });

    return NextResponse.json({
      id: saved.id,
      name: saved.name,
      size: saved.size,
      url: saved.url,
      path: saved.path,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "上传失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
