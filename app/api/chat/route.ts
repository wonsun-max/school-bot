// app/api/chat/route.ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";  // 상대경로로 바꿈

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const query = (body.query || "").toString();

  // 간단히 학교 데이터에서 처리하거나 GPT 호출
  // 예: const answer = await callGPTorSchoolLogic(query, session.user);
  const answer = `[샘플 응답] ${query}`;

  // DB에 저장 (userId는 session.user.id)
  try {
    await prisma.message.createMany({
      data: [
        { userId: session.user.id, role: "user", text: query },
        { userId: session.user.id, role: "bot", text: answer },
      ],
    });
  } catch (e) {
    console.error("DB save error:", e);
  }

  return NextResponse.json({ answer });
}