import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { verifyTurnstile } from "@/lib/turnstile";
import {
  checkRegisterRateLimit,
  recordRegisterAttempt,
  validatePasswordStrength,
  containsHtml,
  MAX_NAME_LENGTH,
} from "@/lib/security";

function extractIP(headersList: Headers): string {
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",").map((s) => s.trim()).filter(Boolean);
    if (ips.length > 0) {
      const candidate = ips[0];
      if (/^[\d.]+$/.test(candidate) || /^[0-9a-f:]+$/i.test(candidate)) {
        return candidate;
      }
    }
  }
  const realIp = headersList.get("x-real-ip");
  if (realIp && (/^[\d.]+$/.test(realIp) || /^[0-9a-f:]+$/i.test(realIp))) {
    return realIp;
  }
  const cf = headersList.get("cf-connecting-ip");
  if (cf && (/^[\d.]+$/.test(cf) || /^[0-9a-f:]+$/i.test(cf))) {
    return cf;
  }
  return "unknown";
}

export async function POST(request: Request) {
  try {
    // CVE-10: 注册速率限制（基于 IP + 系统设置）
    const headersList = await headers();
    const ip = extractIP(headersList);

    const settings = await prisma.settings.findFirst();
    const maxRegisters = 5;

    if (!checkRegisterRateLimit(ip, maxRegisters)) {
      return NextResponse.json(
        { error: "注册请求过于频繁，请稍后再试" },
        { status: 429 }
      );
    }

    const body = (await request.json()) as {
      name: string;
      email: string;
      password: string;
    };

    const { name, email, password } = body;

    // Turnstile 人机验证
    if (settings?.turnstileEnabled && settings.turnstileSiteKey) {
      const turnstileToken = (body as any).turnstileToken;
      if (!turnstileToken) return NextResponse.json({ error: "请完成人机验证" }, { status: 400 });
      const ok = await verifyTurnstile(turnstileToken);
      if (!ok) return NextResponse.json({ error: "人机验证失败" }, { status: 400 });
    }

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "所有字段均为必填" },
        { status: 400 }
      );
    }

    // 用户名长度和内容校验
    if (name.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { error: `用户名不能超过${MAX_NAME_LENGTH}个字符` },
        { status: 400 }
      );
    }
    if (containsHtml(name)) {
      return NextResponse.json(
        { error: "用户名不能包含HTML内容" },
        { status: 400 }
      );
    }

    // 邮箱格式校验
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "邮箱格式不正确" },
        { status: 400 }
      );
    }

    // 密码强度校验
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return NextResponse.json(
        { error: passwordError },
        { status: 400 }
      );
    }

    if (settings && !settings.allowRegistration) {
      return NextResponse.json(
        { error: "当前已关闭注册" },
        { status: 403 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const defaultGroup = await prisma.userGroup.findFirst({
      where: { isDefault: true },
    });
    if (!defaultGroup) {
      return NextResponse.json(
        { error: "系统配置错误：未找到默认用户组" },
        { status: 500 }
      );
    }
    const userGroupId = defaultGroup.id;

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: "user",
        userGroupId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    recordRegisterAttempt(ip);

    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "注册失败，请重试" },
      { status: 500 }
    );
  }
}
