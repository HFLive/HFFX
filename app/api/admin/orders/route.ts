import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const PAYMENT_STATUS = ["pending", "paid", "cancelled"] as const;
const FULFILLMENT_STATUS = ["presale", "not_shipped", "shipped", "not_picked_up", "picked_up"] as const;
const DELIVERY_METHODS = ["pickup", "delivery"] as const;

function adminGuard() {
  try {
    requireAdmin();
  } catch (error: any) {
    return NextResponse.json({ message: "未授权" }, { status: 401 });
  }
  return null;
}

export async function GET(request: Request) {
  const guard = adminGuard();
  if (guard) return guard;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? "20")));
  const search = searchParams.get("q") ?? "";
  const paymentStatusParam = searchParams.get("paymentStatus") ?? undefined;
  const fulfillmentStatusParam = searchParams.get("fulfillmentStatus") ?? undefined;
  const deliveryMethodParam = searchParams.get("deliveryMethod") ?? undefined;

  const where: any = {};

  if (search) {
    where.OR = [
      { orderCode: { contains: search, mode: "insensitive" } },
      { nickname: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  if (paymentStatusParam && PAYMENT_STATUS.includes(paymentStatusParam as any)) {
    where.paymentStatus = paymentStatusParam;
  }
  if (fulfillmentStatusParam && FULFILLMENT_STATUS.includes(fulfillmentStatusParam as any)) {
    where.fulfillmentStatus = fulfillmentStatusParam;
  }
  if (deliveryMethodParam && DELIVERY_METHODS.includes(deliveryMethodParam as any)) {
    where.deliveryMethod = deliveryMethodParam;
  }

  const [total, orders] = await prisma.$transaction([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        items: { include: { variant: { include: { product: true } } } },
      },
    }),
  ]);

  return NextResponse.json({ total, page, pageSize, orders });
}
