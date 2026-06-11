import type { PrismaClient } from "@/generated/prisma/client";

/**
 * 自动建表 — 当数据库为空（Turso 新建）时，从 Prisma schema 创建所有表。
 * 使用 Prisma 的 $executeRawUnsafe 逐条执行 CREATE TABLE。
 */
export async function autoMigrate(prisma: PrismaClient): Promise<void> {
  try {
    const result = await prisma.$queryRawUnsafe<[{ count: number }]>(
      `SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='User'`
    );
    if (result[0]?.count > 0) {
      // 表已存在，执行增量迁移（添加新列）
      await runIncrementalMigration(prisma);
      return;
    }
  } catch {
    // 数据库为空，继续建表
  }

  for (const sql of MIGRATION_SQL) {
    await prisma.$executeRawUnsafe(sql);
  }
}

async function runIncrementalMigration(prisma: PrismaClient) {
  for (const sql of ALTER_TABLE_SQL) {
    try { await prisma.$executeRawUnsafe(sql); } catch {}
  }
}

const ALTER_TABLE_SQL = [
  `ALTER TABLE "User" ADD COLUMN "image" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "User" ADD COLUMN "oauthAccounts" TEXT NOT NULL DEFAULT '[]'`,
  `ALTER TABLE "Settings" ADD COLUMN "oauthProviders" TEXT NOT NULL DEFAULT '[]'`,
  `ALTER TABLE "Settings" ADD COLUMN "smtpHost" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "Settings" ADD COLUMN "smtpPort" INTEGER NOT NULL DEFAULT 587`,
  `ALTER TABLE "Settings" ADD COLUMN "smtpUser" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "Settings" ADD COLUMN "smtpPass" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "Settings" ADD COLUMN "smtpFrom" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "Settings" ADD COLUMN "smtpSecure" INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE "Settings" ADD COLUMN "turnstileEnabled" INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE "Settings" ADD COLUMN "turnstileSecretKey" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "Settings" ADD COLUMN "adsEnabled" INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE "Settings" ADD COLUMN "adsPublisherId" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "Settings" ADD COLUMN "adsSlots" TEXT NOT NULL DEFAULT '{}'`,
  `ALTER TABLE "User" ADD COLUMN "deletedAt" TEXT`,
  `ALTER TABLE "Discussion" ADD COLUMN "categoryId" INTEGER`,
];

// Prisma 7 + SQLite 生成的 DDL
const MIGRATION_SQL = [
  `CREATE TABLE "UserGroup" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "isAdmin" INTEGER NOT NULL DEFAULT 0,
    "storageLimit" INTEGER NOT NULL DEFAULT 2147483648,
    "color" TEXT NOT NULL DEFAULT '#64748b',
    "isDefault" INTEGER NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 0
  )`,

  `CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "userGroupId" INTEGER NOT NULL DEFAULT 1,
    "storageLimit" INTEGER,
    "bio" TEXT NOT NULL DEFAULT '',
    "signature" TEXT NOT NULL DEFAULT '',
    "avatar" TEXT NOT NULL DEFAULT '',
    "image" TEXT NOT NULL DEFAULT '',
    "githubUsername" TEXT NOT NULL DEFAULT '',
    "websiteUrl" TEXT NOT NULL DEFAULT '',
    "oauthAccounts" TEXT NOT NULL DEFAULT '[]',
    "deletedAt" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
    "updatedAt" TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY ("userGroupId") REFERENCES "UserGroup"("id")
  )`,

  `CREATE UNIQUE INDEX "User_email_key" ON "User"("email")`,

  `CREATE TABLE "Problem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "inputDesc" TEXT NOT NULL DEFAULT '',
    "outputDesc" TEXT NOT NULL DEFAULT '',
    "sampleInput" TEXT NOT NULL DEFAULT '',
    "sampleOutput" TEXT NOT NULL DEFAULT '',
    "selfTestSamples" TEXT NOT NULL DEFAULT '[]',
    "testCases" TEXT NOT NULL DEFAULT '[]',
    "timeLimit" INTEGER NOT NULL DEFAULT 5,
    "memoryLimit" INTEGER NOT NULL DEFAULT 256,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "pinyin" TEXT NOT NULL DEFAULT '',
    "aiMode" TEXT NOT NULL DEFAULT '',
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
    "updatedAt" TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE UNIQUE INDEX "Problem_slug_key" ON "Problem"("slug")`,

  `CREATE TABLE "Submission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "problemId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'cpp',
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "stdout" TEXT,
    "stderr" TEXT,
    "time" INTEGER,
    "memory" INTEGER,
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
  )`,

  `CREATE INDEX "Submission_problemId_idx" ON "Submission"("problemId")`,
  `CREATE INDEX "Submission_status_idx" ON "Submission"("status")`,
  `CREATE INDEX "Submission_createdAt_idx" ON "Submission"("createdAt")`,
  `CREATE INDEX "Submission_userId_idx" ON "Submission"("userId")`,

  `CREATE TABLE "Discussion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "problemId" INTEGER,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPinned" INTEGER NOT NULL DEFAULT 0,
    "isAnnouncement" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
    "updatedAt" TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
  )`,

  `CREATE INDEX "Discussion_problemId_idx" ON "Discussion"("problemId")`,
  `CREATE INDEX "Discussion_createdAt_idx" ON "Discussion"("createdAt")`,
  `CREATE INDEX "Discussion_isPinned_idx" ON "Discussion"("isPinned")`,

  `CREATE TABLE "DiscussionReply" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "discussionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
    "updatedAt" TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY ("discussionId") REFERENCES "Discussion"("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
  )`,

  `CREATE INDEX "DiscussionReply_discussionId_idx" ON "DiscussionReply"("discussionId")`,
  `CREATE INDEX "DiscussionReply_createdAt_idx" ON "DiscussionReply"("createdAt")`,

  `CREATE TABLE "File" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL DEFAULT '/',
    "size" INTEGER NOT NULL DEFAULT 0,
    "mimeType" TEXT NOT NULL DEFAULT '',
    "url" TEXT NOT NULL DEFAULT '',
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
    "updatedAt" TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
  )`,

  `CREATE INDEX "File_userId_idx" ON "File"("userId")`,
  `CREATE INDEX "File_path_idx" ON "File"("path")`,

  `CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "siteName" TEXT NOT NULL DEFAULT 'LOJ',
    "siteIcon" TEXT NOT NULL DEFAULT '',
    "imageHostingUrl" TEXT NOT NULL DEFAULT '',
    "submitCooldown" INTEGER NOT NULL DEFAULT 5,
    "runCooldown" INTEGER NOT NULL DEFAULT 3,
    "maxSubmitsPerHour" INTEGER NOT NULL DEFAULT 60,
    "maxRegistersPerHour" INTEGER NOT NULL DEFAULT 5,
    "allowRegistration" INTEGER NOT NULL DEFAULT 1,
    "footerText" TEXT NOT NULL DEFAULT '',
    "aiApiKey" TEXT NOT NULL DEFAULT '',
    "aiBaseUrl" TEXT NOT NULL DEFAULT '',
    "aiModels" TEXT NOT NULL DEFAULT '[]',
    "trainingEnabled" INTEGER NOT NULL DEFAULT 1,
    "contestEnabled" INTEGER NOT NULL DEFAULT 1,
    "rankEnabled" INTEGER NOT NULL DEFAULT 1,
    "discussionEnabled" INTEGER NOT NULL DEFAULT 1,
    "showCustomPagesSeparator" INTEGER NOT NULL DEFAULT 1,
    "siteSubtitle" TEXT NOT NULL DEFAULT '在线评测系统',
    "aiEnabled" INTEGER NOT NULL DEFAULT 1,
    "judgeEngine" TEXT NOT NULL DEFAULT 'onecompiler',
    "judgeConfig" TEXT NOT NULL DEFAULT '{}',
    "judgeCustomCode" TEXT NOT NULL DEFAULT '',
    "storageProvider" TEXT NOT NULL DEFAULT 'database',
    "storageS3Endpoint" TEXT NOT NULL DEFAULT '',
    "storageS3Bucket" TEXT NOT NULL DEFAULT '',
    "storageS3AccessKey" TEXT NOT NULL DEFAULT '',
    "storageS3SecretKey" TEXT NOT NULL DEFAULT '',
    "storageS3Region" TEXT NOT NULL DEFAULT '',
    "storageImageHostingUrl" TEXT NOT NULL DEFAULT '',
    "maxFileSize" INTEGER NOT NULL DEFAULT 20971520,
    "homepageAnnouncement" TEXT NOT NULL DEFAULT '',
    "homepageSlogan" TEXT NOT NULL DEFAULT '',
    "homepageShowSubmissions" INTEGER NOT NULL DEFAULT 0,
    "homepageShowDiscussions" INTEGER NOT NULL DEFAULT 0,
    "oauthProviders" TEXT NOT NULL DEFAULT '[]',
    "smtpHost" TEXT NOT NULL DEFAULT '',
    "smtpPort" INTEGER NOT NULL DEFAULT 587,
    "smtpUser" TEXT NOT NULL DEFAULT '',
    "smtpPass" TEXT NOT NULL DEFAULT '',
    "smtpFrom" TEXT NOT NULL DEFAULT '',
    "smtpSecure" INTEGER NOT NULL DEFAULT 0,
    "turnstileSiteKey" TEXT NOT NULL DEFAULT '',
    "turnstileEnabled" INTEGER NOT NULL DEFAULT 0,
    "turnstileSecretKey" TEXT NOT NULL DEFAULT '',
    "updatedAt" TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE UNIQUE INDEX "CustomPage_slug_key" ON "CustomPage"("slug")`,

  `CREATE TABLE "Contest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'ACM',
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "password" TEXT,
    "isPublic" INTEGER NOT NULL DEFAULT 1,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
    "updatedAt" TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE "ContestProblem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contestId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'Easy',
    "description" TEXT NOT NULL,
    "inputDesc" TEXT NOT NULL DEFAULT '',
    "outputDesc" TEXT NOT NULL DEFAULT '',
    "sampleInput" TEXT NOT NULL DEFAULT '',
    "sampleOutput" TEXT NOT NULL DEFAULT '',
    "testCases" TEXT NOT NULL DEFAULT '[]',
    "timeLimit" INTEGER NOT NULL DEFAULT 5,
    "memoryLimit" INTEGER NOT NULL DEFAULT 256,
    "sourceProblemId" INTEGER,
    FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE
  )`,

  `CREATE TABLE "ContestParticipant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contestId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "joinedAt" TEXT NOT NULL DEFAULT (datetime('now')),
    "score" INTEGER NOT NULL DEFAULT 0,
    "penalty" INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE,
    UNIQUE("contestId", "userId")
  )`,

  `CREATE TABLE "ContestSubmission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contestId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "contestProblemId" INTEGER NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'cpp',
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "stdout" TEXT,
    "stderr" TEXT,
    "time" INTEGER,
    "memory" INTEGER,
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE,
    FOREIGN KEY ("contestProblemId") REFERENCES "ContestProblem"("id") ON DELETE CASCADE
  )`,

  `CREATE INDEX "ContestSubmission_contestId_idx" ON "ContestSubmission"("contestId")`,
  `CREATE INDEX "ContestSubmission_userId_idx" ON "ContestSubmission"("userId")`,
  `CREATE INDEX "ContestSubmission_contestId_userId_idx" ON "ContestSubmission"("contestId", "userId")`,
  `CREATE INDEX "ContestSubmission_contestProblemId_idx" ON "ContestSubmission"("contestProblemId")`,

  `CREATE TABLE "ContestAnnouncement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contestId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
    "updatedAt" TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY ("contestId") REFERENCES "Contest"("id") ON DELETE CASCADE
  )`,

  `CREATE INDEX "ContestAnnouncement_contestId_idx" ON "ContestAnnouncement"("contestId")`,
  `CREATE INDEX "ContestAnnouncement_createdAt_idx" ON "ContestAnnouncement"("createdAt")`,

  `CREATE TABLE "Training" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "coverImage" TEXT NOT NULL DEFAULT '',
    "authorId" INTEGER NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "difficulty" TEXT NOT NULL DEFAULT '入门',
    "pinyin" TEXT NOT NULL DEFAULT '',
    "isPublic" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
    "updatedAt" TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE "TrainingProblem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trainingId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'Easy',
    "description" TEXT NOT NULL,
    "inputDesc" TEXT NOT NULL DEFAULT '',
    "outputDesc" TEXT NOT NULL DEFAULT '',
    "sampleInput" TEXT NOT NULL DEFAULT '',
    "sampleOutput" TEXT NOT NULL DEFAULT '',
    "testCases" TEXT NOT NULL DEFAULT '[]',
    "timeLimit" INTEGER NOT NULL DEFAULT 5,
    "memoryLimit" INTEGER NOT NULL DEFAULT 256,
    "sourceProblemId" INTEGER,
    FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE
  )`,

  `CREATE TABLE "TrainingSubmission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trainingId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "trainingProblemId" INTEGER NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'cpp',
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "stdout" TEXT,
    "stderr" TEXT,
    "time" INTEGER,
    "memory" INTEGER,
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE,
    FOREIGN KEY ("trainingProblemId") REFERENCES "TrainingProblem"("id") ON DELETE CASCADE
  )`,

  `CREATE INDEX "TrainingSubmission_trainingId_idx" ON "TrainingSubmission"("trainingId")`,
  `CREATE INDEX "TrainingSubmission_userId_idx" ON "TrainingSubmission"("userId")`,
  `CREATE INDEX "TrainingSubmission_trainingId_userId_idx" ON "TrainingSubmission"("trainingId", "userId")`,
  `CREATE INDEX "TrainingSubmission_trainingProblemId_idx" ON "TrainingSubmission"("trainingProblemId")`,

  `CREATE TABLE "DiscussionCategory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "icon" TEXT NOT NULL DEFAULT 'MessageSquare',
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "enabled" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE UNIQUE INDEX "DiscussionCategory_slug_key" ON "DiscussionCategory"("slug")`,
];
