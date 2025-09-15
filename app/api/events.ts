// app/api/events.ts
import fs from "fs/promises";
import path from "path";

export type Event = { title: string; date_start: string; date_end: string; description: string; type: string };
const DATA_DIR = path.join(process.cwd(), "data", "sample");

export async function loadEvents(): Promise<Event[]> {
  const csv = await fs.readFile(path.join(DATA_DIR, "events.csv"), "utf8");
  return csv
    .split("\n")
    .map(l => l.trim())
    .filter(l => l && !l.startsWith("title,"))
    .map(line => {
      const cols = line.split(",");
      const title = cols[0].trim();
      const date_start = cols[1]?.trim() ?? "";
      const date_end = cols[2]?.trim() ?? date_start;
      const description = cols[3]?.replace(/^"|"$/g, "").trim() ?? "";
      const type = cols[4]?.trim() ?? "";
      return { title, date_start, date_end, description, type };
    });
}
