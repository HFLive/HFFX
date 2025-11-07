import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).optional(),
  price: z.string().trim().nullable().optional(),
  inventory: z.number().int().nonnegative().nullable().optional(),
  isActive: z.boolean().optional(),
});

function adminGuard() {
  try {
    requireAdmin();
  } catch (error: any) {
    return NextResponse.json({ message: "未授权" }, { status: 401 });
  }
  return null;
}

export async function PATCH(
  request: Request,
  { params }: { params: { variantId: string } }
) {
  const guard = adminGuard();
  if (guard) return guard;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "参数错误", errors: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  try {
    const variant = await prisma.productVariant.update({
      where: { id: params.variantId },
      data: {
        name: data.name,
        price: data.price === undefined ? undefined : parsePriceToCents(data.price ?? undefined),
        inventory: data.inventory === undefined ? undefined : data.inventory ?? 0,
        isActive: data.isActive,
      },
    });
    return NextResponse.json(variant);
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "更新失败" }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { variantId: string } }
) {
  const guard = adminGuard();
  if (guard) return guard;

  try {
    await prisma.productVariant.update({
      where: { id: params.variantId },
      data: { isActive: false },
    });
    return NextResponse.json({ message: "款式已停用" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "操作失败" }, { status: 400 });
  }
}

function parsePriceToCents(input?: string) {
  if (!input) return null;
  const trimmed = input.trim();
  if (trimmed === "" || trimmed.toLowerCase() === "待定") return null;
  const value = Number(trimmed);
  if (Number.isNaN(value)) {
    throw new Error("价格格式不正确");
  }
  return Math.round(value * 100);
}
