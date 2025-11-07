import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  price: z.string().trim().optional(),
  inventory: z.number().int().nonnegative().nullable().optional(),
});

function adminGuard() {
  try {
    requireAdmin();
  } catch (error: any) {
    return NextResponse.json({ message: "未授权" }, { status: 401 });
  }
  return null;
}

export async function POST(
  request: Request,
  { params }: { params: { productId: string } }
) {
  const guard = adminGuard();
  if (guard) return guard;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "参数错误", errors: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const variant = await prisma.productVariant.create({
      data: {
        productId: params.productId,
        name: parsed.data.name,
        price: parsePriceToCents(parsed.data.price),
        inventory: parsed.data.inventory ?? 0,
      },
    });
    return NextResponse.json(variant, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "创建失败" }, { status: 400 });
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
