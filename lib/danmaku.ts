import { prisma } from "./prisma";
import { unstable_noStore as noStore } from 'next/cache';

export type DanmakuRecord = {
  id: string;
  text: string;
  color?: string | null;
  createdAt: string;
  updatedAt: string;
};

const MAX_RECORDS = 200;

export async function readDanmaku(): Promise<DanmakuRecord[]> {
  noStore();
  const danmakuList = await prisma.danmaku.findMany({
    orderBy: { createdAt: "desc" },
    take: MAX_RECORDS,
  });

  return danmakuList
    .reverse()
    .map((item) => ({
      id: item.id,
      text: item.text,
      color: item.color,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));
}

