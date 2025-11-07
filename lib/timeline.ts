import { promises as fs } from "fs";
import path from "path";

export type TimelineEvent = {
  id: string;
  title: string;
  date?: string;
  description?: string;
  completed?: boolean;
};

export type TimelineData = {
  note?: string;
  events: TimelineEvent[];
};

const TIMELINE_FILE_PATH = path.join(process.cwd(), "data", "timeline.json");

function normalizeEvent(raw: any): TimelineEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!id || !title) return null;
  const date = typeof raw.date === "string" ? raw.date.trim() : undefined;
  const description = typeof raw.description === "string" ? raw.description.trim() : undefined;
  const completed = typeof raw.completed === "boolean" ? raw.completed : false;
  return { id, title, date, description, completed };
}

export async function readTimeline(): Promise<TimelineData> {
  try {
    const content = await fs.readFile(TIMELINE_FILE_PATH, "utf-8");
    const parsed = JSON.parse(content);
    const note = typeof parsed?.note === "string" ? parsed.note : undefined;
    const eventsInput = Array.isArray(parsed?.events) ? parsed.events : [];
    const events: TimelineEvent[] = [];
    for (const item of eventsInput) {
      const normalized = normalizeEvent(item);
      if (normalized) events.push(normalized);
    }
    return { note, events };
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      return { note: undefined, events: [] };
    }
    throw error;
  }
}

export async function writeTimeline(data: TimelineData): Promise<void> {
  const serialized = JSON.stringify(
    {
      note: data.note ?? "",
      events: data.events,
    },
    null,
    2
  );
  await fs.writeFile(TIMELINE_FILE_PATH, serialized, "utf-8");
}

