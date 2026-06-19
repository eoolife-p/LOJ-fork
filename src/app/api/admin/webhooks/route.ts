import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(_req: Request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  const webhooks = await prisma.webhook.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ webhooks });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = (await request.json()) as { url: string; events: string[]; secret?: string };
  const { url, events, secret } = body;
  if (!url || !events) return NextResponse.json({ error: "url and events are required" }, { status: 400 });

  const webhook = await prisma.webhook.create({
    data: {
      url,
      events: JSON.stringify(events),
      secret: secret || "",
    },
  });
  return NextResponse.json(webhook, { status: 201 });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = (await request.json()) as { id: number; url?: string; events?: string[]; enabled?: boolean };
  const { id, url, events, enabled } = body;
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (url !== undefined) data.url = url;
  if (events !== undefined) data.events = JSON.stringify(events);
  if (enabled !== undefined) data.enabled = enabled;

  const webhook = await prisma.webhook.update({ where: { id }, data });
  return NextResponse.json(webhook);
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { id } = (await request.json()) as { id: number };
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  await prisma.webhook.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
