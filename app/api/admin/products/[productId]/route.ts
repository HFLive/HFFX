import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().nullable().optional(),
  coverImage: z.string().trim().nullable().optional(),
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
  { params }: { params: { productId: string } }
) {
  const guard = adminGuard();
  if (guard) return guard;

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "参数错误", errors: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const product = await prisma.product.update({
      where: { id: params.productId },
      data: parsed.data,
      include: { variants: true },
    });
    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "更新失败" }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { productId: string } }
) {
  const guard = adminGuard();
  if (guard) return guard;

  try {
    await prisma.product.update({
      where: { id: params.productId },
      data: { isActive: false },
    });
    return NextResponse.json({ message: "已停用商品" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "操作失败" }, { status: 400 });
  }
}
