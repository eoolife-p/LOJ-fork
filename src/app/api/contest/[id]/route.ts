import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contestId = parseInt(id);
  if (isNaN(contestId)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const session = await auth();

  const contest = await prisma.contest.findUnique({
    where: { id: contestId },
    include: {
      problems: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          difficulty: true,
          description: true,
          inputDesc: true,
          outputDesc: true,
          sampleInput: true,
          sampleOutput: true,
          order: true,
          timeLimit: true,
          memoryLimit: true,
        },
      },
      participants: true,
    },
  });

  if (!contest) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date();
  const st = new Date(contest.startTime);
  const et = new Date(contest.endTime);
  let status: string;
  if (now < st) status = "upcoming";
  else if (now >= st && now <= et) status = "running";
  else status = "ended";

  const isAdmin = session?.user?.isAdmin;
  const userId = session?.user?.id ? parseInt(session.user.id) : null;
  const isParticipant = userId ? contest.participants.some((p) => p.userId === userId) : false;
  const hasPassword = !!contest.password;

  // 非管理员在比赛开始前只能看到基本信息
  if (!isAdmin && status === "upcoming") {
    return NextResponse.json({
      id: contest.id,
      title: contest.title,
      description: contest.description,
      type: contest.type,
      startTime: contest.startTime,
      endTime: contest.endTime,
      duration: Math.round((et.getTime() - st.getTime()) / 60000),
      status,
      password: hasPassword,
      problems: contest.problems.map((p) => ({
        id: p.id,
        title: p.title,
        order: p.order,
      })),
      participantCount: contest.participants.length,
      isAdmin,
      allowHack: contest.allowHack,
      freezeTime: contest.freezeTime,
    });
  }

  return NextResponse.json({
    id: contest.id,
    title: contest.title,
    description: contest.description,
    type: contest.type,
    startTime: contest.startTime,
    endTime: contest.endTime,
    freezeTime: contest.freezeTime,
    allowHack: contest.allowHack,
    isAdmin,
    duration: Math.round((et.getTime() - st.getTime()) / 60000),
    status,
    password: hasPassword,
    problems: contest.problems.map((p) => ({
      id: p.id,
      title: p.title,
      order: p.order,
      difficulty: p.difficulty,
      description: p.description,
      inputDesc: p.inputDesc,
      outputDesc: p.outputDesc,
      sampleInput: p.sampleInput,
      sampleOutput: p.sampleOutput,
      timeLimit: p.timeLimit,
      memoryLimit: p.memoryLimit,
    })),
    participantCount: contest.participants.length,
  });
}
