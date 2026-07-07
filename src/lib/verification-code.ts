import crypto from "crypto";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/mail";

// 内存限频：每个邮箱60秒内只能发送一次
const cooldownMap = new Map<string, number>();

// 内存存储验证码（5分钟有效）
const codeMap = new Map<string, { code: string; expiresAt: number }>();

export function checkSendCooldown(email: string): { allowed: boolean; remainingSeconds: number } {
  const lastSent = cooldownMap.get(email);
  const now = Date.now();
  if (lastSent && now - lastSent < 60_000) {
    return { allowed: false, remainingSeconds: Math.ceil((60_000 - (now - lastSent)) / 1000) };
  }
  return { allowed: true, remainingSeconds: 0 };
}

export function recordSendCooldown(email: string): void {
  cooldownMap.set(email, Date.now());
}

export async function sendVerificationCode(email: string): Promise<{ success: boolean; remainingSeconds?: number }> {
  const cooldown = checkSendCooldown(email);
  if (!cooldown.allowed) {
    return { success: false, remainingSeconds: cooldown.remainingSeconds };
  }

  try {
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5分钟有效

    codeMap.set(email, { code, expiresAt });

    const settings = await prisma.settings.findFirst();
    const siteName = settings?.siteName || "LOJ";

    const html = `
      <div style="max-width:480px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif">
        <h2>邮箱验证码</h2>
        <p>你正在 ${siteName} 注册账号，验证码如下：</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:20px;background:#f5f5f5;border-radius:8px;margin:16px 0">${code}</div>
        <p style="color:#888;font-size:13px">验证码 5 分钟内有效。如果你没有注册 ${siteName} 账号，请忽略此邮件。</p>
      </div>
    `;

    const sent = await sendEmail(email, `[${siteName}] 邮箱验证码: ${code}`, html);
    if (sent) {
      recordSendCooldown(email);
      return { success: true };
    }
    return { success: false };
  } catch {
    return { success: false };
  }
}

export function verifyCode(email: string, code: string): boolean {
  const record = codeMap.get(email);
  if (!record) return false;
  if (Date.now() > record.expiresAt) {
    codeMap.delete(email);
    return false;
  }
  if (record.code !== code) return false;
  codeMap.delete(email); // 验证成功后删除
  return true;
}
