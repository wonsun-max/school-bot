// app/api/timetable.ts
import fs from "fs/promises";
import path from "path";

export type Timetable = Record<string, Record<string, string[]>>;
const DATA_DIR = path.join(process.cwd(), "data", "sample");

export async function loadTimetable(): Promise<Timetable> {
  const raw = await fs.readFile(path.join(DATA_DIR, "timetable.json"), "utf8");
  return JSON.parse(raw);
}
