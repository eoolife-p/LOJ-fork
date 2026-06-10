import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isSafeImageUrl, isSafeSiteIcon, MAX_SITE_NAME_LENGTH } from "@/lib/security";

export async function GET() {
  const session = await auth();
  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({ data: {} });
  }

  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = (await request.json()) as {
    siteName?: string;
    siteIcon?: string;
    imageHostingUrl?: string;
    submitCooldown?: number;
    runCooldown?: number;
    maxSubmitsPerHour?: number;
    allowRegistration?: boolean;
    footerText?: string;
    aiApiKey?: string;
    aiBaseUrl?: string;
    aiModel?: string;
    aiModels?: string;
    trainingEnabled?: boolean;
    contestEnabled?: boolean;
    rankEnabled?: boolean;
    discussionEnabled?: boolean;
    showCustomPagesSeparator?: boolean;
    siteSubtitle?: string;
    aiEnabled?: boolean;
    judgeEngine?: string;
    judgeConfig?: string;
    judgeCustomCode?: string;
    storageProvider?: string;
    storageS3Endpoint?: string;
    storageS3Bucket?: string;
    storageS3AccessKey?: string;
    storageS3SecretKey?: string;
    storageS3Region?: string;
    storageImageHostingUrl?: string;
    maxFileSize?: number;
    homepageAnnouncement?: string;
    homepageSlogan?: string;
    homepageShowSubmissions?: boolean;
    homepageShowDiscussions?: boolean;
    oauthProviders?: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    smtpFrom?: string;
    smtpSecure?: boolean;
    turnstileSiteKey?: string;
    turnstileEnabled?: boolean;
    maxRegistersPerHour?: number;
  };

  // ===== 字段校验 =====

  // 站点名称长度
  if (body.siteName !== undefined && body.siteName.length > MAX_SITE_NAME_LENGTH) {
    return NextResponse.json({ error: "站点名称过长" }, { status: 400 });
  }

  // 站点图标安全性（防 XSS）
  if (body.siteIcon !== undefined && body.siteIcon !== "" && !isSafeSiteIcon(body.siteIcon)) {
    return NextResponse.json({ error: "站点图标不合法，仅支持安全 URL 或 PNG/JPG/WebP data URI" }, { status: 400 });
  }

  // 图床地址 SSRF 防护
  if (body.imageHostingUrl !== undefined && body.imageHostingUrl !== "" && !isSafeImageUrl(body.imageHostingUrl)) {
    return NextResponse.json({ error: "图床地址不合法" }, { status: 400 });
  }

  // 数值范围校验
  if (body.submitCooldown !== undefined && (body.submitCooldown < 0 || body.submitCooldown > 3600)) {
    return NextResponse.json({ error: "提交冷却时间不合法（0-3600秒）" }, { status: 400 });
  }
  if (body.runCooldown !== undefined && (body.runCooldown < 0 || body.runCooldown > 3600)) {
    return NextResponse.json({ error: "自测冷却时间不合法（0-3600秒）" }, { status: 400 });
  }
  if (body.maxSubmitsPerHour !== undefined && (body.maxSubmitsPerHour < 0 || body.maxSubmitsPerHour > 10000)) {
    return NextResponse.json({ error: "每小时最大提交数不合法（0-10000）" }, { status: 400 });
  }
  if (body.maxFileSize !== undefined && (body.maxFileSize < 1024 || body.maxFileSize > 100 * 1024 * 1024)) {
    return NextResponse.json({ error: "单文件大小限制不合法（1KB - 100MB）" }, { status: 400 });
  }

  // 严格提取允许的字段（防止注入额外字段）
  const data: Record<string, unknown> = {};
  if (body.siteName !== undefined) data.siteName = body.siteName;
  if (body.siteIcon !== undefined) data.siteIcon = body.siteIcon;
  if (body.imageHostingUrl !== undefined) data.imageHostingUrl = body.imageHostingUrl;
  if (body.submitCooldown !== undefined) data.submitCooldown = body.submitCooldown;
  if (body.runCooldown !== undefined) data.runCooldown = body.runCooldown;
  if (body.maxSubmitsPerHour !== undefined) data.maxSubmitsPerHour = body.maxSubmitsPerHour;
  if (body.allowRegistration !== undefined) data.allowRegistration = body.allowRegistration;
  if (body.footerText !== undefined) data.footerText = body.footerText;
  if (body.aiApiKey !== undefined) data.aiApiKey = body.aiApiKey;
  if (body.aiBaseUrl !== undefined) data.aiBaseUrl = body.aiBaseUrl;
  if (body.aiModels !== undefined) data.aiModels = body.aiModels;
  if (body.trainingEnabled !== undefined) data.trainingEnabled = body.trainingEnabled;
  if (body.contestEnabled !== undefined) data.contestEnabled = body.contestEnabled;
  if (body.rankEnabled !== undefined) data.rankEnabled = body.rankEnabled;
  if (body.discussionEnabled !== undefined) data.discussionEnabled = body.discussionEnabled;
  if (body.showCustomPagesSeparator !== undefined) data.showCustomPagesSeparator = body.showCustomPagesSeparator;
  if (body.siteSubtitle !== undefined) data.siteSubtitle = body.siteSubtitle;
  if (body.aiEnabled !== undefined) data.aiEnabled = body.aiEnabled;
  if (body.judgeEngine !== undefined) data.judgeEngine = body.judgeEngine;
  if (body.judgeConfig !== undefined) data.judgeConfig = body.judgeConfig;
  if (body.judgeCustomCode !== undefined) data.judgeCustomCode = body.judgeCustomCode;
  if (body.storageProvider !== undefined) data.storageProvider = body.storageProvider;
  if (body.storageS3Endpoint !== undefined) data.storageS3Endpoint = body.storageS3Endpoint;
  if (body.storageS3Bucket !== undefined) data.storageS3Bucket = body.storageS3Bucket;
  if (body.storageS3AccessKey !== undefined) data.storageS3AccessKey = body.storageS3AccessKey;
  if (body.storageS3SecretKey !== undefined) data.storageS3SecretKey = body.storageS3SecretKey;
  if (body.storageS3Region !== undefined) data.storageS3Region = body.storageS3Region;
  if (body.storageImageHostingUrl !== undefined) data.storageImageHostingUrl = body.storageImageHostingUrl;
  if (body.maxFileSize !== undefined) data.maxFileSize = body.maxFileSize;
  if (body.homepageAnnouncement !== undefined) data.homepageAnnouncement = body.homepageAnnouncement;
  if (body.homepageSlogan !== undefined) data.homepageSlogan = body.homepageSlogan;
  if (body.homepageShowSubmissions !== undefined) data.homepageShowSubmissions = body.homepageShowSubmissions;
  if (body.homepageShowDiscussions !== undefined) data.homepageShowDiscussions = body.homepageShowDiscussions;
  if (body.oauthProviders !== undefined) data.oauthProviders = body.oauthProviders;
  if (body.smtpHost !== undefined) data.smtpHost = body.smtpHost;
  if (body.smtpPort !== undefined) data.smtpPort = body.smtpPort;
  if (body.smtpUser !== undefined) data.smtpUser = body.smtpUser;
  if (body.smtpPass !== undefined) data.smtpPass = body.smtpPass;
  if (body.smtpFrom !== undefined) data.smtpFrom = body.smtpFrom;
  if (body.smtpSecure !== undefined) data.smtpSecure = body.smtpSecure;
  if (body.turnstileSiteKey !== undefined) data.turnstileSiteKey = body.turnstileSiteKey;
  if (body.turnstileEnabled !== undefined) data.turnstileEnabled = body.turnstileEnabled;
  if (body.maxRegistersPerHour !== undefined) data.maxRegistersPerHour = body.maxRegistersPerHour;

  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({ data });
  } else {
    settings = await prisma.settings.update({
      where: { id: settings.id },
      data,
    });
  }

  return NextResponse.json(settings);
}
