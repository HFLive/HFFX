import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { requireAdmin } from "@/lib/auth";
import { readTimeline, writeTimeline, TimelineEvent } from "@/lib/timeline";

const createEventSchema = z.object({
  title: z.string().trim().min(1).max(120),
  date: z.string().trim().max(120).optional(),
  description: z.string().trim().max(500).optional(),
  completed: z.boolean().optional(),
});

const updateTimelineSchema = z.object({
  note: z.string().trim().max(500).optional(),
  order: z.array(z.string()).optional(),
});

function adminGuard() {
  try {
    requireAdmin();
  } catch (error: any) {
    return NextResponse.json({ message: "未授权" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const guard = adminGuard();
  if (guard) return guard;

  const timeline = await readTimeline();
  return NextResponse.json(timeline);
}

export async function POST(request: Request) {
  const guard = adminGuard();
  if (guard) return guard;

  const body = await request.json().catch(() => null);
  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "参数错误", errors: parsed.error.flatten() }, { status: 400 });
  }

  const timeline = await readTimeline();
  const newEvent: TimelineEvent = {
    id: randomUUID(),
    title: parsed.data.title.trim(),
    date: parsed.data.date?.trim() || undefined,
    description: parsed.data.description?.trim() || undefined,
    completed: parsed.data.completed ?? false,
  };

  timeline.events = [...timeline.events, newEvent];
  await writeTimeline(timeline);
  return NextResponse.json(newEvent, { status: 201 });
}

export async function PATCH(request: Request) {
  const guard = adminGuard();
  if (guard) return guard;

  const body = await request.json().catch(() => null);
  const parsed = updateTimelineSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "参数错误", errors: parsed.error.flatten() }, { status: 400 });
  }

  const timeline = await readTimeline();
  if (parsed.data.note !== undefined) {
    timeline.note = parsed.data.note.trim() || undefined;
  }
  if (parsed.data.order) {
    const idSet = new Set(timeline.events.map((event) => event.id));
    const validIds = parsed.data.order.filter((id) => idSet.has(id));
    if (validIds.length) {
      const idToEvent = new Map(timeline.events.map((event) => [event.id, event]));
      const reordered = validIds.map((id) => idToEvent.get(id)!).filter(Boolean);
      const remaining = timeline.events.filter((event) => !validIds.includes(event.id));
      timeline.events = [...reordered, ...remaining];
    }
  }
  await writeTimeline(timeline);
  return NextResponse.json(timeline);
}

