import { promises as fs } from "fs";
import path from "path";

export type DanmakuRecord = {
  id: string;
  text: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
};

const DANMAKU_FILE_PATH = path.join(process.cwd(), "data", "danmaku.json");

function sanitizeColor(value?: string | null) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^#([0-9a-fA-F]{3}){1,2}$/.test(trimmed) || /^rgb(a)?\(/.test(trimmed)) {
    return trimmed;
  }
  return undefined;
}

function normalizeDanmaku(raw: any): DanmakuRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  const text = typeof raw.text === "string" ? raw.text.trim() : "";
  if (!id || !text) return null;
  const color = sanitizeColor(raw.color);
  const createdAt = typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString();
  const updatedAt = typeof raw.updatedAt === "string" ? raw.updatedAt : createdAt;
  return { id, text, color, createdAt, updatedAt };
}

export async function readDanmaku(): Promise<DanmakuRecord[]> {
  try {
    const content = await fs.readFile(DANMAKU_FILE_PATH, "utf-8");
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) return [];
    const normalized: DanmakuRecord[] = [];
    for (const item of parsed) {
      const danmaku = normalizeDanmaku(item);
      if (danmaku) normalized.push(danmaku);
    }
    return normalized;
  } catch (error: any) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

export async function writeDanmaku(records: DanmakuRecord[]): Promise<void> {
  const serialized = JSON.stringify(records, null, 2);
  await fs.writeFile(DANMAKU_FILE_PATH, serialized, "utf-8");
}

