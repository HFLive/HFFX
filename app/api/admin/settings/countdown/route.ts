export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { readCountdown, writeCountdown } from "@/lib/countdown";

const updateSchema = z.object({
  target: z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: "时间格式不正确，请使用 YYYY-MM-DDTHH:mm",
    }),
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

  const countdown = await readCountdown();
  return NextResponse.json(countdown);
}

export async function PATCH(request: Request) {
  const guard = adminGuard();
  if (guard) return guard;

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "参数错误", errors: parsed.error.flatten() }, { status: 400 });
  }

  const next = { target: parsed.data.target };
  await writeCountdown(next);
  return NextResponse.json(next);
}

