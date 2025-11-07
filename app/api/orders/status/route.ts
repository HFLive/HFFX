import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  orderCode: z.string().min(4),
  phone: z.string().min(4),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = Object.fromEntries(searchParams.entries());
  const parsed = schema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ message: "请输入有效的订单信息" }, { status: 400 });
  }

  const { orderCode, phone } = parsed.data;
  const order = await prisma.order.findUnique({
    where: { orderCode },
    include: {
      items: { include: { variant: { include: { product: true } } } },
    },
  });

  if (!order || order.phone !== phone) {
    return NextResponse.json({ message: "未找到对应订单" }, { status: 404 });
  }

  return NextResponse.json({
    orderCode: order.orderCode,
    nickname: order.nickname,
    deliveryMethod: order.deliveryMethod,
    fulfillmentStatus: order.fulfillmentStatus,
    paymentStatus: order.paymentStatus,
    note: order.note,
    createdAt: order.createdAt,
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.variant.product.name,
      variantName: item.variant.name,
      quantity: item.quantity,
    })),
  });
}
