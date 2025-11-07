import { prisma } from "./prisma";

export type DanmakuRecord = {
  id: string;
  text: string;
  color?: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function readDanmaku(): Promise<DanmakuRecord[]> {
  const danmakuList = await prisma.danmaku.findMany({
    orderBy: { createdAt: "asc" },
  });

  return danmakuList.map((item) => ({
    id: item.id,
    text: item.text,
    color: item.color,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));
}

