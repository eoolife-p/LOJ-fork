import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.settings.findFirst();
  return NextResponse.json({
    siteName: settings?.siteName || "LOJ",
    siteIcon: settings?.siteIcon || "/logo.svg",
    allowRegistration: settings?.allowRegistration ?? true,
    trainingEnabled: settings?.trainingEnabled ?? true,
    contestEnabled: settings?.contestEnabled ?? true,
    rankEnabled: settings?.rankEnabled ?? true,
    discussionEnabled: settings?.discussionEnabled ?? true,
    showCustomPagesSeparator: settings?.showCustomPagesSeparator ?? true,
    aiEnabled: settings?.aiEnabled ?? true,
    oauthProviders: parseOAuthProviders(settings?.oauthProviders),
    turnstileSiteKey: settings?.turnstileSiteKey || "",
    turnstileEnabled: settings?.turnstileEnabled ?? false,
  });
}

function parseOAuthProviders(raw: string | undefined) {
  if (!raw) return [];
  try { return JSON.parse(raw) || []; } catch { return []; }
}
