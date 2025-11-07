import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

const PAYMENT_STATUS = ["pending", "paid", "cancelled"] as const;
const FULFILLMENT_STATUS = ["presale", "not_shipped", "shipped", "not_picked_up", "picked_up"] as const;

const schema = z.object({
  paymentStatus: z.enum(PAYMENT_STATUS).optional(),
  fulfillmentStatus: z.enum(FULFILLMENT_STATUS).optional(),
  note: z.string().max(500).nullable().optional(),
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
  { params }: { params: { orderId: string } }
) {
  const guard = adminGuard();
  if (guard) return guard;

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "参数错误", errors: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const order = await prisma.order.update({
      where: { id: params.orderId },
      data: parsed.data,
      include: { items: { include: { variant: { include: { product: true } } } } },
    });
    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "更新失败" }, { status: 400 });
  }
}
