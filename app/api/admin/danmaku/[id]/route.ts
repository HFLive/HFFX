import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const existingDanmaku = await prisma.danmaku.findUnique({
    where: { id: params.id },
  });

  if (!existingDanmaku) {
    return NextResponse.json({ message: "弹幕不存在" }, { status: 404 });
  }

  const nextText = parsed.data.text?.trim() ?? existingDanmaku.text;
  if (!nextText) {
    return NextResponse.json({ message: "弹幕内容不能为空" }, { status: 400 });
  }

  const nextColor = parsed.data.color !== undefined ? normalizeColor(parsed.data.color) : existingDanmaku.color;

  const updatedDanmaku = await prisma.danmaku.update({
    where: { id: params.id },
    data: {
      text: nextText,
      color: nextColor,
    },
  });

  return NextResponse.json({
    id: updatedDanmaku.id,
    text: updatedDanmaku.text,
    color: updatedDanmaku.color,
    createdAt: updatedDanmaku.createdAt.toISOString(),
    updatedAt: updatedDanmaku.updatedAt.toISOString(),
  });
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const guard = adminGuard();
  if (guard) return guard;

  const existingDanmaku = await prisma.danmaku.findUnique({
    where: { id: params.id },
  });

  if (!existingDanmaku) {
    return NextResponse.json({ message: "弹幕不存在" }, { status: 404 });
  }

  await prisma.danmaku.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ message: "已删除弹幕" });
}

