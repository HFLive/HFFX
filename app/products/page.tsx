export const dynamic = 'force-dynamic';
export const revalidate = 0;

import ShopClient from "@/components/shop/ShopClient";
import { prisma } from "@/lib/prisma";
import { readPaymentQr } from "@/lib/payment-qr";

function formatPrice(price: number | null) {
  if (price == null) return null;
  return (price / 100).toFixed(2);
}

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    where: { isActive: true, variants: { some: { isActive: true } } },
    include: {
      variants: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const payload = products.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    coverImage: product.coverImage,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      price: formatPrice(variant.price),
      inventory: variant.inventory,
    })),
  }));
  const paymentQr = await readPaymentQr();

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <ShopClient products={payload} paymentQrPath={paymentQr.path} />
      </div>
    </div>
  );
}
