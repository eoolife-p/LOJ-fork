import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getJudgeEngine } from "@/lib/judge";
import { getJudgeConfig } from "@/lib/judge-config";

export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin)
    return NextResponse.json({ error: "无权限" }, { status: 403 });

  let dbOk = false;
  let judgeOk = false;

  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    dbOk = true;
  } catch {}

  try {
    const engine = getJudgeEngine(await getJudgeConfig());
    const result = await engine.run(
      "int main(){return 0;}",
      "cpp",
      "",
      3,
      128
    );
    judgeOk = result.status === "AC";
  } catch {}

  return NextResponse.json({ db: dbOk, judge: judgeOk });
}
