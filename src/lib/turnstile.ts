import prisma from "@/lib/prisma";

export async function verifyTurnstile(token: string): Promise<boolean> {
  if (!token) return false;
  try {
    const settings = await prisma.settings.findFirst();
    const secret = settings?.turnstileSecretKey || process.env.TURNSTILE_SECRET_KEY;
    if (!secret) return true; // 未配置则放行
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: token }),
    });
    const data = await res.json();
    return data.success === true;
  } catch { return true; }
}
