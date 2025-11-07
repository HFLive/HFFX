import { prisma } from "./prisma";
import { unstable_noStore as noStore } from 'next/cache';

export type TimelineEvent = {
  id: string;
  title: string;
  date?: string | null;
  description?: string | null;
  completed?: boolean;
  order?: number;
};

export type TimelineData = {
  note?: string | null;
  events: TimelineEvent[];
};

export async function readTimeline(): Promise<TimelineData> {
  noStore();
  const events = await prisma.timelineEvent.findMany({
    orderBy: { order: "asc" },
  });

  const setting = await prisma.siteSetting.findUnique({
    where: { key: "timeline_note" },
  });

  return {
    note: setting?.value || null,
    events: events.map((event) => ({
      id: event.id,
      title: event.title,
      date: event.date,
      description: event.description,
      completed: event.completed,
      order: event.order,
    })),
  };
}

export async function writeTimeline(data: TimelineData): Promise<void> {
  noStore();
  // 使用事务更新所有数据
  await prisma.$transaction(async (tx) => {
    // 更新note
    await tx.siteSetting.upsert({
      where: { key: "timeline_note" },
      update: { value: data.note || "" },
      create: { key: "timeline_note", value: data.note || "" },
    });

    // 删除所有现有事件
    await tx.timelineEvent.deleteMany({});

    // 创建新事件
    if (data.events.length > 0) {
      await tx.timelineEvent.createMany({
        data: data.events.map((event, index) => ({
          id: event.id,
          title: event.title,
          date: event.date,
          description: event.description,
          completed: event.completed ?? false,
          order: event.order ?? index,
        })),
      });
    }
  });
}

