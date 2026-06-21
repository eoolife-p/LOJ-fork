import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({ data: {} });
  }
  return NextResponse.json({
    siteName: settings.siteName,
    siteIcon: settings.siteIcon || "/logo.svg",
    siteSubtitle: settings.siteSubtitle || "在线评测系统",
    footerText: settings.footerText,
    homepageAnnouncement: settings.homepageAnnouncement,
    homepageSlogan: settings.homepageSlogan,
    homepageShowSubmissions: settings.homepageShowSubmissions,
    homepageShowDiscussions: settings.homepageShowDiscussions,
    privacyPolicy: settings.privacyPolicy,
    termsOfService: settings.termsOfService,
    cookieConsentEnabled: settings.cookieConsentEnabled,
    sponsorEnabled: settings.sponsorEnabled,
  });
}
