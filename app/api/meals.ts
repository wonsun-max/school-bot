// app/api/meals.ts
import fs from "fs/promises";
import path from "path";

export type Meal = { date: string; menu: string; source: string };
const DATA_DIR = path.join(process.cwd(), "data", "sample");

export async function loadMeals(): Promise<Meal[]> {
  const csv = await fs.readFile(path.join(DATA_DIR, "meals.csv"), "utf8");
  return csv
    .split("\n")
    .map(l => l.trim())
    .filter(l => l && !l.startsWith("date,"))
    .map(line => {
      const cols = line.split(",");
      const date = cols[0].trim();
      const source = cols[cols.length - 1].trim();
      const menu = cols.slice(1, -1).join(",").replace(/^"|"$/g, "").trim();
      return { date, menu, source };
    });
}
