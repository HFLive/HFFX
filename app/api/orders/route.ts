import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const DELIVERY_METHODS = ["pickup", "delivery"] as const;
const PAYMENT_STATUS = {
  pending: "pending",
  paid: "paid",
  cancelled: "cancelled",
} as const;
const FULFILLMENT_STATUS = {
  presale: "presale",
  notShipped: "not_shipped",
  shipped: "shipped",
  notPicked: "not_picked_up",
  picked: "picked_up",
} as const;

const itemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

const orderSchema = z
  .object({
    nickname: z.string().min(1).max(50),
    phone: z.string().min(6).max(20),
    deliveryMethod: z.enum(DELIVERY_METHODS),
    deliveryName: z.string().max(50).optional(),
    deliveryPhone: z.string().max(20).optional(),
    deliveryAddress: z.string().max(200).optional(),
    note: z.string().max(500).optional(),
    items: z.array(itemSchema).min(1).max(20),
  })
  .superRefine((data, ctx) => {
    if (data.deliveryMethod === "delivery") {
      if (!data.deliveryName || data.deliveryName.trim() === "") {
        ctx.addIssue({
          path: ["deliveryName"],
          code: z.ZodIssueCode.custom,
          message: "请填写收件人姓名",
        });
      }
      if (!data.deliveryPhone || data.deliveryPhone.trim() === "") {
        ctx.addIssue({
          path: ["deliveryPhone"],
          code: z.ZodIssueCode.custom,
          message: "请填写收件人手机号",
        });
      }
      if (!data.deliveryAddress || data.deliveryAddress.trim() === "") {
        ctx.addIssue({
          path: ["deliveryAddress"],
          code: z.ZodIssueCode.custom,
          message: "请填写收件地址",
        });
      }
    }
  });

function generateOrderCode(length = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const array = Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]);
  return array.join("");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = orderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "参数错误", errors: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const variantIds = data.items.map((item) => item.variantId);
      const variants = await tx.productVariant.findMany({
        where: { id: { in: variantIds }, isActive: true, product: { isActive: true } },
        include: { product: true },
      });

      if (variants.length !== variantIds.length) {
        throw new Error("商品信息已更新，请刷新页面后重试");
      }

      const variantMap = new Map(variants.map((variant) => [variant.id, variant]));

      for (const item of data.items) {
        const variant = variantMap.get(item.variantId)!;
        if (variant.inventory !== null && variant.inventory !== undefined && variant.inventory < item.quantity) {
          throw new Error(`${variant.product.name} - ${variant.name} 库存不足`);
        }
      }

      const orderCode = await ensureUniqueOrderCode(tx);

      const totalAmount = data.items.reduce((sum, item) => {
        const variant = variantMap.get(item.variantId)!;
        if (variant.price == null) return sum;
        return sum + variant.price * item.quantity;
      }, 0);

      const createdOrder = await tx.order.create({
        data: {
          orderCode,
          nickname: data.nickname,
          phone: data.phone,
          deliveryMethod: data.deliveryMethod,
          deliveryName: data.deliveryMethod === "delivery" ? data.deliveryName : null,
          deliveryPhone: data.deliveryMethod === "delivery" ? data.deliveryPhone : null,
          deliveryAddress: data.deliveryMethod === "delivery" ? data.deliveryAddress : null,
          note: data.note ?? null,
          paymentStatus: PAYMENT_STATUS.pending,
          fulfillmentStatus: FULFILLMENT_STATUS.presale,
          totalAmount: totalAmount || null,
          items: {
            create: data.items.map((item) => {
              const variant = variantMap.get(item.variantId)!;
              return {
                variantId: variant.id,
                quantity: item.quantity,
                unitPrice: variant.price ?? null,
              };
            }),
          },
        },
        include: { items: { include: { variant: true } } },
      });

      for (const item of data.items) {
        const variant = variantMap.get(item.variantId)!;
        if (variant.inventory !== null && variant.inventory !== undefined) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { inventory: Math.max(0, variant.inventory - item.quantity) },
          });
        }
      }

      return createdOrder;
    });

    return NextResponse.json({
      orderCode: result.orderCode,
      nickname: result.nickname,
      deliveryMethod: result.deliveryMethod,
      createdAt: result.createdAt,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message ?? "创建订单失败" }, { status: 400 });
  }
}

async function ensureUniqueOrderCode(tx: Prisma.TransactionClient) {
  let orderCode = generateOrderCode();
  let attempts = 0;
  while (true) {
    const found = await tx.order.findUnique({ where: { orderCode } });
    if (!found) {
      return orderCode;
    }
    orderCode = generateOrderCode();
    attempts++;
    if (attempts > 5) {
      throw new Error("生成订单号失败，请稍后再试");
    }
  }
}
