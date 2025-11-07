import { promises as fs } from "fs";
import path from "path";

const COUNTDOWN_PATH = path.join(process.cwd(), "data", "countdown.json");

export type CountdownSettings = {
  target: string;
};

const FALLBACK_TARGET = "2025-12-30T18:00:00";

export async function readCountdown(): Promise<CountdownSettings> {
  try {
    const content = await fs.readFile(COUNTDOWN_PATH, "utf-8");
    const data = JSON.parse(content);
    if (typeof data?.target === "string" && data.target.trim()) {
      return { target: data.target };
    }
  } catch (error: any) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
  return { target: FALLBACK_TARGET };
}

export async function writeCountdown(settings: CountdownSettings): Promise<void> {
  const serialized = JSON.stringify(settings, null, 2);
  await fs.writeFile(COUNTDOWN_PATH, serialized, "utf-8");
}

