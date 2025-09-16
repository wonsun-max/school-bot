// app/api/guest/chat/route.ts
import { NextResponse } from "next/server";
import { loadMeals } from "../meals";
import { loadEvents } from "../events";
import { loadTimetable } from "../timetable";
import { manilaDateString, findClassKeyFromText, mapWeekdayToName } from "../utils";

export async function POST(req: Request) {
  // Guest mode: No authentication required, no DB saving
  
  const body = await req.json().catch(() => ({}));
  const qRaw = (body.query || body.text || "").toString().trim();
  const q = qRaw.toLowerCase();

  // Load all data
  const [meals, events, timetable] = await Promise.all([
    loadMeals(), 
    loadEvents(), 
    loadTimetable()
  ]);

  // Process meals
  if (q.includes("급식") || q.includes("meal") || q.includes("lunch")) {
    let offset = q.includes("tomorrow") || q.includes("내일") ? 1 : 
                 q.includes("yesterday") || q.includes("어제") ? -1 : 0;
    const dateMatch = q.match(/(20\d{2}-\d{2}-\d{2})/);
    const dateStr = dateMatch ? dateMatch[1] : manilaDateString(offset);

    const meal = meals.find(m => m.date === dateStr);
    return NextResponse.json({
      answer: meal 
        ? `${meal.date} 급식: ${meal.menu} (source: ${meal.source})` 
        : `데이터가 없습니다: ${dateStr} 급식 정보 없음`
    });
  }

  // Process timetable
  if (q.includes("시간표") || q.includes("timetable")) {
    const cls = findClassKeyFromText(q) ?? Object.keys(timetable)[0];
    let dayName = "monday";

    if (q.includes("월") || q.includes("monday")) dayName = "monday";
    if (q.includes("화") || q.includes("tuesday")) dayName = "tuesday";
    if (q.includes("수") || q.includes("wednesday")) dayName = "wednesday";
    if (q.includes("목") || q.includes("thursday")) dayName = "thursday";
    if (q.includes("금") || q.includes("friday")) dayName = "friday";

    const dayKeyword = q.includes("내일") ? 1 : q.includes("오늘") ? 0 : null;
    if (dayKeyword !== null) {
      const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
      d.setDate(d.getDate() + dayKeyword);
      dayName = mapWeekdayToName(d.getDay());
    }

    const classData = timetable[cls];
    if (!classData) {
      return NextResponse.json({ answer: `시간표 데이터 없음: ${cls} 반 정보 없음` });
    }

    const schedule = classData[dayName] ?? [];
    return NextResponse.json({ 
      answer: `${cls} ${dayName} 시간표: ${schedule.join(", ") || "등록된 수업 없음"}` 
    });
  }

  // Process events
  if (q.includes("일정") || q.includes("행사") || q.includes("event")) {
    const today = manilaDateString(0);
    const upcoming = events.filter(e => e.date_start >= today).slice(0, 3);
    if (upcoming.length) {
      const lines = upcoming.map(
        e => `${e.title} (${e.date_start}${e.date_end !== e.date_start ? " ~ " + e.date_end : ""})`
      );
      return NextResponse.json({ answer: `다음 일정: ${lines.join(" / ")}` });
    }
    return NextResponse.json({ answer: "등록된 향후 일정이 없습니다." });
  }

  // Default response
  return NextResponse.json({
    answer: '게스트 모드입니다. 학교 관련 질문을 해주세요. (예: "오늘 급식", "2-3반 시간표", "다음 행사")'
  });
}