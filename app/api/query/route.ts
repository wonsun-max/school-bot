import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { query } = await req.json();

  let answer = "아직 똑똑하진 않아요 🤖";

  if (query.includes("급식")) {
    answer = "내일 급식은: Fried Rice, Miso Soup, Egg";
  } else if (query.includes("시간표")) {
    answer = "2-3 반 월요일 시간표는: Math, English, PE, Science";
  } else if (query.includes("행사")) {
    answer = "다음 학교 행사는 9월 20일 School Festival 입니다!";
  }

  return NextResponse.json({ answer });
}
