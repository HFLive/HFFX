import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { readDanmaku, writeDanmaku } from "@/lib/danmaku";

const updateSchema = z.object({
  text: z.string().trim().min(1, "请填写弹幕内容").max(120).optional(),
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

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const guard = adminGuard();
  if (guard) return guard;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "请求格式错误" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "参数错误", errors: parsed.error.flatten() }, { status: 400 });
  }

  const records = await readDanmaku();
  const index = records.findIndex((item) => item.id === params.id);
  if (index === -1) {
    return NextResponse.json({ message: "弹幕不存在" }, { status: 404 });
  }

  const target = records[index];
  const nextText = parsed.data.text?.trim() ?? target.text;
  if (!nextText) {
    return NextResponse.json({ message: "弹幕内容不能为空" }, { status: 400 });
  }

  const next = {
    ...target,
    text: nextText,
    color: parsed.data.color !== undefined ? normalizeColor(parsed.data.color) : target.color,
    updatedAt: new Date().toISOString(),
  };

  records.splice(index, 1, next);
  await writeDanmaku(records);
  return NextResponse.json(next);
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const guard = adminGuard();
  if (guard) return guard;

  const records = await readDanmaku();
  const index = records.findIndex((item) => item.id === params.id);
  if (index === -1) {
    return NextResponse.json({ message: "弹幕不存在" }, { status: 404 });
  }

  records.splice(index, 1);
  await writeDanmaku(records);
  return NextResponse.json({ message: "已删除弹幕" });
}

