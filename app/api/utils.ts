// app/api/utils.ts
export function manilaDateString(offsetDays = 0) {
  const now = new Date();
  const manila = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  manila.setDate(manila.getDate() + offsetDays);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(manila);
}

export function findClassKeyFromText(q: string): string | null {
  // "2-3", "2학년 3반", "2 3", "2학년3반" 등 지원
  const m = q.match(/(\d+)\s*[-\s학년]*\s*(\d+)\s*(?:반)?/);
  if (m) return `${m[1]}-${m[2]}`;
  return null;
}

export function mapWeekdayToName(day: number): string {
  const map: Record<number, string> = { 1: "monday", 2: "tuesday", 3: "wednesday", 4: "thursday", 5: "friday" };
  return map[day] ?? "monday";
}
