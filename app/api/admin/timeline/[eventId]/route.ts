export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { readTimeline, writeTimeline } from "@/lib/timeline";

const updateEventSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  date: z.string().trim().max(120).optional(),
  description: z.string().trim().max(500).optional(),
  completed: z.boolean().optional(),
});

function adminGuard() {
  try {
    requireAdmin();
  } catch (error: any) {
    return NextResponse.json({ message: "未授权" }, { status: 401 });
  }
  return null;
}

export async function PATCH(request: Request, { params }: { params: { eventId: string } }) {
  const guard = adminGuard();
  if (guard) return guard;

  const body = await request.json().catch(() => null);
  const parsed = updateEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "参数错误", errors: parsed.error.flatten() }, { status: 400 });
  }

  const timeline = await readTimeline();
  const index = timeline.events.findIndex((event) => event.id === params.eventId);
  if (index === -1) {
    return NextResponse.json({ message: "事件不存在" }, { status: 404 });
  }

  const target = timeline.events[index];
  const next = {
    ...target,
    title: parsed.data.title?.trim() || target.title,
    date: parsed.data.date !== undefined ? parsed.data.date.trim() || undefined : target.date,
    description:
      parsed.data.description !== undefined ? parsed.data.description.trim() || undefined : target.description,
    completed: parsed.data.completed ?? target.completed ?? false,
  };

  timeline.events.splice(index, 1, next);
  await writeTimeline(timeline);
  return NextResponse.json(next);
}

export async function DELETE(_request: Request, { params }: { params: { eventId: string } }) {
  const guard = adminGuard();
  if (guard) return guard;

  const timeline = await readTimeline();
  const index = timeline.events.findIndex((event) => event.id === params.eventId);
  if (index === -1) {
    return NextResponse.json({ message: "事件不存在" }, { status: 404 });
  }

  timeline.events.splice(index, 1);
  await writeTimeline(timeline);
  return NextResponse.json({ message: "已删除事件" });
}

