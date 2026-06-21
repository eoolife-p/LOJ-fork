import crypto from "crypto";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/mail";

export async function generateAndSendVerification(userId: number, email: string): Promise<boolean> {
  try {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.emailVerification.deleteMany({ where: { userId } });
    await prisma.emailVerification.create({
      data: { userId, token, expiresAt },
    });

    const settings = await prisma.settings.findFirst();
    const siteName = settings?.siteName || "LOJ";
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const link = `${baseUrl}/verify-email?token=${token}`;

    const html = `
      <div style="max-width:480px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif">
        <h2>验证你的邮箱地址</h2>
        <p>感谢你注册 ${siteName}！请点击下方按钮验证你的邮箱地址：</p>
        <a href="${link}" style="display:inline-block;background:#3b82f6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">验证邮箱</a>
        <p style="color:#888;font-size:13px">此链接 24 小时内有效。如果你没有注册 ${siteName} 账号，请忽略此邮件。</p>
      </div>
    `;

    return await sendEmail(email, `[${siteName}] 验证你的邮箱地址`, html);
  } catch {
    return false;
  }
}
