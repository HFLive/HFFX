import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { readDanmaku } from "@/lib/danmaku";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  text: z.string().trim().min(1, "请填写弹幕内容").max(120, "弹幕内容不宜超过120字符"),
  color: z.string().trim().optional(),
});

function adminGuard() {
  try {
    requireAdmin();
  } catch (error: any) {
    return NextResponse.json({ message: "未授权" }, { status: 401 });
  }
  return null;
}

function normalizeColor(color?: string | null) {
  if (!color) return undefined;
  const trimmed = color.trim();
  if (/^#([0-9a-fA-F]{3}){1,2}$/.test(trimmed) || /^rgb(a)?\(/.test(trimmed)) {
    return trimmed;
  }
  return undefined;
}

export async function GET() {
  const guard = adminGuard();
  if (guard) return guard;

  const records = await readDanmaku();
  return NextResponse.json(records);
}

export async function POST(request: Request) {
  const guard = adminGuard();
  if (guard) return guard;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "请求格式错误" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "参数错误", errors: parsed.error.flatten() }, { status: 400 });
  }

  const color = normalizeColor(parsed.data.color);

  const newDanmaku = await prisma.danmaku.create({
    data: {
      text: parsed.data.text.trim(),
      color: color,
    },
  });

  return NextResponse.json(
    {
      id: newDanmaku.id,
      text: newDanmaku.text,
      color: newDanmaku.color,
      createdAt: newDanmaku.createdAt.toISOString(),
      updatedAt: newDanmaku.updatedAt.toISOString(),
    },
    { status: 201 }
  );
}

