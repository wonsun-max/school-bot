// app/api/chat/history/route.ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";  // 경로 수정
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";  // 경로 수정

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const msgs = await prisma.message.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(msgs);
}