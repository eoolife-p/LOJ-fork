import { NextResponse } from "next/server";
import os from "os";
import prisma from "@/lib/prisma";
import judgeConfig from "@/config/judge";

export async function GET() {
  try {
    let dbConnected = false;
    const dbType = (process.env.DB_PROVIDER || "sqlite").toLowerCase();
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
    } catch {
      dbConnected = false;
    }

    const judgeType = judgeConfig.engine;

    const info = {
      platform: `${os.platform()} ${os.arch()}`,
      hostname: os.hostname(),
      nodeVersion: process.version,
      uptime: Math.floor(os.uptime()),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpus: os.cpus().length,
      loadAvg: os.loadavg(),
      nodeEnv: process.env.NODE_ENV || "development",
      dbProvider: dbType,
      dbConnected,
      judgeType,
      buildMode: process.env.DOCKER_BUILD === "1" ? "Docker" : process.env.BUILD_MODE || "未知",
    };

    return NextResponse.json(info);
  } catch {
    return NextResponse.json({ error: "无法获取部署信息" }, { status: 500 });
  }
}
