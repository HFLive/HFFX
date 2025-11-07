import { prisma } from "./prisma";
import { unstable_noStore as noStore } from 'next/cache';

export type DanmakuRecord = {
  id: string;
  text: string;
  color?: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function readDanmaku(): Promise<DanmakuRecord[]> {
  noStore();
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

