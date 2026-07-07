import nodemailer from "nodemailer";
import prisma from "@/lib/prisma";

let _transporter: nodemailer.Transporter | null = null;
let _transporterSettingsKey = "";

function getSettingsKey(s: {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
}) {
  return `${s.smtpHost}:${s.smtpPort}:${s.smtpSecure}:${s.smtpUser}:${s.smtpPass}`;
}

async function getTransporter() {
  const s = await prisma.settings.findFirst();
  if (!s?.smtpHost) return null;

  const key = getSettingsKey(s);
  if (_transporter && _transporterSettingsKey === key) return _transporter;

  _transporter = nodemailer.createTransport({
    host: s.smtpHost,
    port: s.smtpPort,
    secure: s.smtpSecure,
    auth: s.smtpUser ? { user: s.smtpUser, pass: s.smtpPass } : undefined,
  });
  _transporterSettingsKey = key;
  return _transporter;
}

export async function sendEmail(to: string, subject: string, html: string) {
  const s = await prisma.settings.findFirst();

  // 优先使用 Resend
  if (s?.resendEnabled && s?.resendApiKey) {
    return await sendViaResend(s, to, subject, html);
  }

  // 回退到 SMTP
  const transporter = await getTransporter();
  if (!transporter) return false;
  const from = s?.smtpFrom || s?.smtpUser || "LOJ <noreply@loj.com>";
  await transporter.sendMail({ from, to, subject, html });
  return true;
}

async function sendViaResend(
  settings: { resendApiKey: string; resendDomain: string },
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  try {
    // 优先使用数据库配置的 API Key，其次使用环境变量
    const apiKey = settings.resendApiKey || process.env.RESEND_API_KEY || "";
    const domain = settings.resendDomain || process.env.RESEND_DOMAIN || "";

    if (!apiKey) {
      console.error("[Resend] No API key configured");
      return false;
    }

    const from = domain
      ? `LOJ <noreply@${domain}>`
      : "LOJ <noreply@resend.dev>";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      console.error("[Resend] send failed:", await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("[Resend] error:", e);
    return false;
  }
}
