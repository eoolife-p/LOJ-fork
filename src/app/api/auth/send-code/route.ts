import { NextResponse } from "next/server";
import { sendVerificationCode } from "@/lib/verification-code";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "邮箱不能为空" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
    }

    const result = await sendVerificationCode(email.trim().toLowerCase());

    if (!result.success) {
      return NextResponse.json({
        error: `请${result.remainingSeconds}秒后再试`,
        remainingSeconds: result.remainingSeconds,
      }, { status: 429 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "发送失败，请重试" }, { status: 500 });
  }
}
