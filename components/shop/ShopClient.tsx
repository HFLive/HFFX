"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { MouseEvent, SyntheticEvent } from "react";
import OrderLookup from "@/components/shop/OrderLookup";
import { cn } from "@/lib/utils";

export type ShopProduct = {
  id: string;
  name: string;
  description?: string | null;
  coverImage?: string | null;
  variants: Array<{
    id: string;
    name: string;
    price: string | null;
    inventory: number | null;
  }>;
};

const DELIVERY_METHODS = [
  { value: "pickup", label: "自提" },
  { value: "delivery", label: "快递" },
] as const;

type DeliveryMethod = (typeof DELIVERY_METHODS)[number]["value"];

type Props = {
  products: ShopProduct[];
};

type FormState = {
  nickname: string;
  phoneCountry: string;
  phone: string;
  deliveryMethod: DeliveryMethod;
  deliveryName: string;
  deliveryPhone: string;
  deliveryAddress: string;
  note: string;
};

const initialFormState: FormState = {
  nickname: "",
  phoneCountry: "+86",
  phone: "",
  deliveryMethod: "pickup",
  deliveryName: "",
  deliveryPhone: "",
  deliveryAddress: "",
  note: "",
};

type SelectedItem = {
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  quantity: number;
  inventory: number | null;
  priceCents: number | null;
};

type SuccessInfo = {
  orderCode: string;
  deliveryMethod: DeliveryMethod;
  totalCents: number | null;
  hasPendingPrice: boolean;
  shippingCents: number;
};

const formatCurrency = (cents: number) => (cents / 100).toFixed(2);

const ZOOM_LENS_SIZE = 80;
const ZOOM_SCALE = 2.8;
const PREVIEW_SIZE = 360;
const PREVIEW_OFFSET = 28;
const DEFAULT_ASPECT_RATIO = 3 / 4;

type ProductImageZoomProps = {
  src: string;
  alt: string;
};

function ProductImageZoom({ src, alt }: ProductImageZoomProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [canHover, setCanHover] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [zoomState, setZoomState] = useState({
    active: false,
    x: 0,
    y: 0,
    containerWidth: 0,
    containerHeight: 0,
    containerTop: 0,
    containerRight: 0,
    containerLeft: 0,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setCanHover(query.matches);
    update();
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", update);
      return () => query.removeEventListener("change", update);
    }
    query.addListener(update);
    return () => query.removeListener(update);
  }, []);

  useEffect(() => {
    if (!canHover) {
      setZoomState((prev) => (prev.active ? { ...prev, active: false } : prev));
    }
  }, [canHover]);

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!canHover) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const lensRadius = ZOOM_LENS_SIZE / 2;
    const relativeX = event.clientX - rect.left;
    const relativeY = event.clientY - rect.top;

    const boundedX = Math.max(lensRadius, Math.min(relativeX, rect.width - lensRadius));
    const boundedY = Math.max(lensRadius, Math.min(relativeY, rect.height - lensRadius));

    setZoomState({
      active: true,
      x: boundedX,
      y: boundedY,
      containerWidth: rect.width,
      containerHeight: rect.height,
      containerTop: rect.top,
      containerRight: rect.right,
      containerLeft: rect.left,
    });
  };

  const handleMouseLeave = () => {
    setZoomState((prev) => ({ ...prev, active: false }));
  };

  const backgroundPositionX = zoomState.containerWidth
    ? (zoomState.x / zoomState.containerWidth) * 100
    : 50;
  const backgroundPositionY = zoomState.containerHeight
    ? (zoomState.y / zoomState.containerHeight) * 100
    : 50;

  const backgroundSizeX = zoomState.containerWidth * ZOOM_SCALE;
  const backgroundSizeY = zoomState.containerHeight * ZOOM_SCALE;

  const ratio = Math.min(Math.max(aspectRatio ?? DEFAULT_ASPECT_RATIO, 0.45), 1.35);
  const paddingBottom = `${ratio * 100}%`;

  return (
    <>
      <div
        ref={containerRef}
        className={cn("group relative w-full", canHover ? "cursor-crosshair" : "cursor-default")}
        style={{ paddingBottom }}
        onMouseMove={canHover ? handleMouseMove : undefined}
        onMouseLeave={canHover ? handleMouseLeave : undefined}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={false}
          className="pointer-events-none select-none object-contain"
          sizes="(min-width: 1024px) 240px, 100vw"
          onLoad={(event: SyntheticEvent<HTMLImageElement>) => {
            const img = event.currentTarget;
            if (img.naturalWidth && img.naturalHeight) {
              setAspectRatio(img.naturalHeight / img.naturalWidth);
            }
          }}
        />
        {canHover && zoomState.active && (
          <div
            className="pointer-events-none absolute shadow-[0_16px_30px_-18px_rgba(15,23,42,0.5)]"
            style={{
              width: ZOOM_LENS_SIZE,
              height: ZOOM_LENS_SIZE,
              left: zoomState.x - ZOOM_LENS_SIZE / 2,
              top: zoomState.y - ZOOM_LENS_SIZE / 2,
              backgroundImage:
                "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.12) 40%, rgba(148,163,184,0.35) 100%)",
              border: "1.5px solid rgba(255,255,255,0.7)",
              boxShadow: "inset 0 0 0 0.85px rgba(15,23,42,0.22)",
              backdropFilter: "blur(1.2px)",
            }}
          />
        )}
      </div>
      {canHover && zoomState.active && typeof window !== "undefined" &&
        createPortal(
          (() => {
            const preferredLeft = zoomState.containerRight + PREVIEW_OFFSET;
            const fallbackLeft = zoomState.containerLeft - PREVIEW_OFFSET - PREVIEW_SIZE;
            const hasSpaceRight = preferredLeft + PREVIEW_SIZE <= window.innerWidth - 24;
            const chosenLeft = hasSpaceRight ? preferredLeft : Math.max(24, fallbackLeft);
            const preferredTop = zoomState.containerTop + zoomState.y - PREVIEW_SIZE / 2;
            const chosenTop = Math.max(24, Math.min(preferredTop, window.innerHeight - PREVIEW_SIZE - 24));

            return (
              <div
                className="pointer-events-none fixed z-[9999] hidden overflow-hidden border border-white/80 bg-white/90 shadow-[0_20px_45px_-30px_rgba(15,23,42,0.6)] lg:block"
                style={{
                  width: PREVIEW_SIZE,
                  height: PREVIEW_SIZE,
                  left: chosenLeft,
                  top: chosenTop,
                  backgroundImage: `url(${src})`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: `${backgroundPositionX}% ${backgroundPositionY}%`,
                  backgroundSize: `${backgroundSizeX}px ${backgroundSizeY}px`,
                }}
              />
            );
          })(),
          document.body
        )}
    </>
  );
}

export default function ShopClient({ products }: Props) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [form, setForm] = useState<FormState>(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessInfo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "success" | "error">("idle");
  const [lookupOpen, setLookupOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [paymentAcknowledged, setPaymentAcknowledged] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedItems: SelectedItem[] = useMemo(() => {
    return products.flatMap((product) =>
      product.variants
        .map((variant) => ({
          productId: product.id,
          productName: product.name,
          variantId: variant.id,
          variantName: variant.name,
          quantity: quantities[variant.id] ?? 0,
          inventory: variant.inventory,
          priceCents: variant.price != null ? Math.round(parseFloat(variant.price) * 100) : null,
        }))
        .filter((item) => item.quantity > 0)
    );
  }, [products, quantities]);

  const { cartTotalCents, hasPendingPrice } = useMemo(() => {
    let total = 0;
    let pending = false;
    for (const item of selectedItems) {
      if (item.priceCents == null) {
        pending = true;
      } else {
        total += item.priceCents * item.quantity;
      }
    }
    return { cartTotalCents: total, hasPendingPrice: pending };
  }, [selectedItems]);

  const shippingFeeCents = form.deliveryMethod === "delivery" && selectedItems.length > 0 ? 1500 : 0;
  const grandTotalCents = hasPendingPrice ? cartTotalCents : cartTotalCents + shippingFeeCents;

  const handleQuantityChange = (variantId: string, inventory: number | null, next: number) => {
    const max = inventory ?? 999;
    const value = Math.max(0, Math.min(max, next));
    setQuantities((prev) => ({ ...prev, [variantId]: value }));
  };

  const handleFieldChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const resetForm = () => {
    setQuantities({});
    setForm(initialFormState);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedItems.length === 0) {
      setError("请先选择商品与数量");
      return;
    }

    if (!form.nickname.trim() || !form.phone.trim()) {
      setError("请填写姓名和手机号");
      return;
    }

    if (form.deliveryMethod === "delivery") {
      if (!form.deliveryName.trim() || !form.deliveryPhone.trim() || !form.deliveryAddress.trim()) {
        setError("请完整填写快递收件信息");
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: form.nickname.trim(),
          phone: `${form.phoneCountry.trim()} ${form.phone.trim()}`,
          deliveryMethod: form.deliveryMethod,
          deliveryName: form.deliveryMethod === "delivery" ? form.deliveryName.trim() : undefined,
          deliveryPhone: form.deliveryMethod === "delivery" ? form.deliveryPhone.trim() : undefined,
          deliveryAddress: form.deliveryMethod === "delivery" ? form.deliveryAddress.trim() : undefined,
          note: form.note.trim() || undefined,
          items: selectedItems.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message ?? "提交失败，请稍后再试");
      }

      const data = await response.json();
      setSuccess({
        orderCode: data.orderCode,
        deliveryMethod: form.deliveryMethod,
        totalCents: hasPendingPrice ? null : cartTotalCents + shippingFeeCents,
        hasPendingPrice,
        shippingCents: shippingFeeCents,
      });
      setModalOpen(true);
      setCopyState("idle");
      setPaymentAcknowledged(false);
      resetForm();
    } catch (err: any) {
      setError(err.message ?? "提交失败，请稍后再试");
    } finally {
      setSubmitting(false);
    }
  };

  const totalSelected = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleCopyOrderCode = async () => {
    if (!success) return;
    try {
      await navigator.clipboard.writeText(success.orderCode);
      setCopyState("success");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch (error) {
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), 2000);
    }
  };

  const totalSummary = () => {
    if (totalSelected === 0) return "尚未选择商品";
    if (hasPendingPrice) {
      return shippingFeeCents > 0
        ? `已选 ${totalSelected} 件，部分价格待定 + 运费 ¥${formatCurrency(shippingFeeCents)}`
        : `已选 ${totalSelected} 件，部分价格待定`;
    }
    return shippingFeeCents > 0
      ? `已选 ${totalSelected} 件 · ¥${formatCurrency(grandTotalCents)} （含运费 ¥${formatCurrency(shippingFeeCents)}）`
      : `已选 ${totalSelected} 件 · ¥${formatCurrency(grandTotalCents)}`;
  };

  const buttonLabel = () => {
    if (submitting) return "提交中...";
    if (totalSelected === 0) return "提交订单";
    if (hasPendingPrice) {
      return shippingFeeCents > 0
        ? `提交订单`
        : `提交订单`;
    }
    return shippingFeeCents > 0
      ? `提交订单`
      : `提交订单`;
  };

  return (
    <div className="space-y-16">
      <section className="space-y-6 border-b border-slate-200 pb-12">
        <div className="flex flex-col gap-4 md:gap-6">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900">纪念品商城</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <button
              type="button"
              onClick={() => setLookupOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-white"
            >
              查询订单状态
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-16 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section className="space-y-10">
          {products.map((product, productIndex) => (
            <div key={product.id} className="space-y-5 border-b border-slate-200 pb-8">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px] md:items-start">
                <div className="space-y-3">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">系列 {productIndex + 1}</p>
                  <h2 className="text-3xl font-semibold text-slate-900">{product.name}</h2>
                  {product.description && (
                    <p className="max-w-2xl text-base text-slate-600">{product.description}</p>
                  )}
                </div>
                {product.coverImage ? (
                  <ProductImageZoom src={product.coverImage} alt={product.name} />
                ) : null}
              </div>

              <div className="divide-y divide-slate-200">
                {product.variants.map((variant) => {
                  const quantity = quantities[variant.id] ?? 0;
                  const inventory = variant.inventory ?? null;
                  const max = inventory ?? 999;
                  const soldOut = inventory !== null && inventory <= 0;

                  return (
                    <div
                      key={variant.id}
                      className="grid gap-3 py-4 md:grid-cols-[minmax(0,1fr)_200px] md:items-center"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <p className="text-lg font-medium text-slate-900">{variant.name}</p>
                          {variant.price ? (
                            <span className="text-sm text-slate-500">¥{variant.price}</span>
                          ) : (
                            <span className="text-sm text-slate-400">价格待定</span>
                          )}
                        </div>
                        <p
                          className={cn(
                            "text-sm",
                            inventory === null
                              ? "text-slate-500"
                              : inventory > 10
                              ? "text-emerald-600"
                              : inventory > 0
                              ? "text-amber-500"
                              : "text-red-500"
                          )}
                        >
                          {inventory === null ? "库存充足" : inventory > 0 ? `剩余 ${inventory} 件` : "已售罄"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 justify-start md:justify-end">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(variant.id, inventory, quantity - 1)}
                          disabled={quantity <= 0}
                          className="h-10 w-10 rounded-full border border-slate-300 text-slate-700 hover:border-slate-500 disabled:opacity-40"
                          aria-label="减少数量"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={0}
                          max={max}
                          value={quantity}
                          onChange={(event) =>
                            handleQuantityChange(variant.id, inventory, Number(event.target.value) || 0)
                          }
                          className="w-16 rounded-full border border-slate-900/10 bg-white py-2 text-center text-base text-slate-900 focus:border-slate-900 focus:ring-0"
                          disabled={soldOut}
                        />
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(variant.id, inventory, quantity + 1)}
                          disabled={soldOut || quantity >= max}
                          className="h-10 w-10 rounded-full bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-40"
                          aria-label="增加数量"
                        >
                          ＋
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        <aside className="space-y-10 lg:sticky lg:top-24">
          <section className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">结算</p>
              <h3 className="text-2xl font-semibold text-slate-900">确认订单</h3>
              <p className="text-sm text-slate-600">请确保信息准确，以便我们正确处理您的订单</p>
            </div>
            <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-900 space-y-3">
              <p className="text-sm font-semibold">订单摘要</p>
              {selectedItems.length === 0 ? (
                <p className="text-xs text-slate-500">尚未选择商品</p>
              ) : (
                <ul className="space-y-1 text-xs text-slate-600">
                  {selectedItems.map((item) => (
                    <li key={`${item.variantId}-${item.variantName}`} className="flex justify-between">
                      <span>
                        {item.productName} · {item.variantName} × {item.quantity}
                      </span>
                      <span>
                        {item.priceCents != null
                          ? `¥${formatCurrency(item.priceCents * item.quantity)}`
                          : "价格待定"}
                      </span>
                    </li>
                  ))}
                  {shippingFeeCents > 0 && (
                    <li className="flex justify-between text-slate-500">
                      <span>运费（快递）</span>
                      <span>¥{formatCurrency(shippingFeeCents)}</span>
                    </li>
                  )}
                </ul>
              )}
              <div className="border-t border-slate-300 pt-2 text-sm font-medium">
                {totalSummary()}
              </div>
            </div>
          </section>

          <form className="space-y-10" onSubmit={handleSubmit}>
            <section className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-900">基本信息</h4>
              </div>
              <label className="flex flex-col gap-2">
                <span className="text-sm text-slate-600">姓名</span>
                <input
                  type="text"
                  value={form.nickname}
                  onChange={(event) => handleFieldChange("nickname", event.target.value)}
                  className="rounded-none border-b border-slate-300 bg-transparent px-0 py-2 text-base text-slate-900 focus:border-slate-900 focus:outline-none"
                  placeholder=""
                  required
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm text-slate-600">手机号</span>
                <div className="flex gap-2">
                  <select
                    value={form.phoneCountry}
                    onChange={(event) => handleFieldChange("phoneCountry", event.target.value)}
                    className="w-44 rounded-none border-b border-slate-300 bg-transparent py-2 text-sm text-slate-700 focus:border-slate-900 focus:outline-none"
                  >
                    <option value="+86">+86 中国大陆</option>
                    <option value="+852">+852 香港</option>
                    <option value="+853">+853 澳门</option>
                    <option value="+886">+886 台湾</option>
                    <option value="+81">+81 日本</option>
                    <option value="+82">+82 韩国</option>
                    <option value="+65">+65 新加坡</option>
                    <option value="+60">+60 马来西亚</option>
                    <option value="+1">+1 美国 / 加拿大</option>
                    <option value="+44">+44 英国</option>
                    <option value="+49">+49 德国</option>
                    <option value="+33">+33 法国</option>
                    <option value="+34">+34 西班牙</option>
                    <option value="+39">+39 意大利</option>
                    <option value="+7">+7 俄罗斯</option>
                    <option value="+61">+61 澳大利亚</option>
                    <option value="+64">+64 新西兰</option>
                    <option value="+55">+55 巴西</option>
                    <option value="+52">+52 墨西哥</option>
                    <option value="+971">+971 阿联酋</option>
                  </select>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) => handleFieldChange("phone", event.target.value)}
                    className="flex-1 rounded-none border-b border-slate-300 bg-transparent py-2 text-base text-slate-900 focus:border-slate-900 focus:outline-none"
                    placeholder=""
                    required
                  />
                </div>
              </label>
            </section>

            <section className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-900">配送方式</h4>
                <p className="text-xs text-slate-500">快递运费15元，仅限中国大陆地区</p>
              </div>
              <div className="flex gap-2">
                {DELIVERY_METHODS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleFieldChange("deliveryMethod", option.value)}
                    className={cn(
                      "flex-1 rounded-full border px-4 py-2 text-sm font-medium transition",
                      form.deliveryMethod === option.value
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 text-slate-600 hover:border-slate-500"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {form.deliveryMethod === "delivery" && (
                <div className="space-y-4 border-slate-300/60 pl-4">
                  <label className="flex flex-col gap-2">
                    <span className="text-sm text-slate-600">收件人姓名</span>
                    <input
                      type="text"
                      value={form.deliveryName}
                      onChange={(event) => handleFieldChange("deliveryName", event.target.value)}
                      className="rounded-none border-b border-slate-300 bg-transparent py-2 text-base text-slate-900 focus:border-slate-900 focus:outline-none"
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-sm text-slate-600">收件人电话</span>
                    <input
                      type="tel"
                      value={form.deliveryPhone}
                      onChange={(event) => handleFieldChange("deliveryPhone", event.target.value)}
                      className="rounded-none border-b border-slate-300 bg-transparent py-2 text-base text-slate-900 focus:border-slate-900 focus:outline-none"
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-sm text-slate-600">详细地址</span>
                    <textarea
                      value={form.deliveryAddress}
                      onChange={(event) => handleFieldChange("deliveryAddress", event.target.value)}
                      className="rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-base text-slate-900 focus:border-slate-900 focus:outline-none"
                      rows={3}
                      placeholder="注明省、市、区、详细地址"
                      required
                    />
                  </label>
                </div>
              )}
            </section>

            <section className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-900">备注</h4>
              </div>
              <textarea
                value={form.note}
                onChange={(event) => handleFieldChange("note", event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-base text-slate-900 focus:border-slate-900 focus:outline-none"
                rows={3}
                placeholder="选填"
              />

              <div className="rounded-lg border border-red-400 bg-red-50 px-4 py-3 text-sm text-red-600">
                <p className="font-semibold">重要提醒</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>提交订单后系统会生成唯一校验码。</li>
                  <li>支付时必须在备注中填写校验码，否则无法核验。</li>
                  <li>校验码将作为查询订单进度的凭证，请妥善保存。</li>
                </ul>
              </div>

              {error && (
                <div className="rounded-lg border border-red-400 bg-red-50 px-4 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-full bg-slate-900 px-6 py-3 text-lg font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
                disabled={submitting}
              >
                {buttonLabel()}
              </button>
            </section>
          </form>
        </aside>
      </div>

      {mounted && success && modalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 backdrop-blur-sm px-4">
            <div className="relative w-full max-w-xl rounded-3xl bg-white px-6 py-8 shadow-2xl">
              <button
                type="button"
                className="absolute right-5 top-5 text-slate-400 hover:text-slate-700"
                onClick={() => setModalOpen(false)}
                aria-label="关闭"
              >
                ×
              </button>
              {!paymentAcknowledged ? (
                <div className="space-y-6">
                  <header className="space-y-2 text-center">
                    <h3 className="text-[22px] font-semibold text-slate-900">请扫码支付</h3>
                    <p className="text-sm text-slate-500">
                      支付时务必<span className="mx-1 rounded-full bg-red-100 px-2 py-0.5 text-red-600">
                        备注校验码
                      </span>，以便我们匹配订单
                    </p>
                  </header>
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative h-80 w-80">
                      <Image src="/payment-qr.png" alt="收款二维码" fill className="object-contain" />
                    </div>
                    <div className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-center">
                      <p className="text-xs uppercase tracking-[0.4em] text-slate-500">校验码</p>
                      <p className="font-mono text-3xl font-semibold text-slate-900">{success.orderCode}</p>
                    </div>
                    {success.totalCents !== null || success.hasPendingPrice ? (
                      <div className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-center text-sm text-slate-700">
                        {success.hasPendingPrice ? (
                          <p>
                            部分商品价格待定，请以实际支付金额为准
                            {success.shippingCents > 0 ? `（含运费 ¥${formatCurrency(success.shippingCents)}）` : ""}
                          </p>
                        ) : (
                          <p>
                            请支付：
                            <span className="text-lg font-semibold text-slate-900">
                              ¥{formatCurrency(success.totalCents ?? 0)}
                            </span>
                            {success.shippingCents > 0 ? (
                              <span className="ml-2 text-xs text-slate-500">
                                （含运费 ¥{formatCurrency(success.shippingCents)}）
                              </span>
                            ) : null}
                          </p>
                        )}
                      </div>
                    ) : null}
                    <p className="text-xs text-slate-500 text-center">
                      我们将在核验后更新订单状态，可凭校验码在本页随时查询。
                    </p>
                    <button
                      type="button"
                      className="rounded-full border border-slate-300 px-6 py-2 text-sm text-slate-700 hover:border-slate-500"
                      onClick={() => setPaymentAcknowledged(true)}
                    >
                      我已支付
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 text-center">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold text-slate-900">我们已收到您的订单</h3>
                    <p className="text-sm text-slate-500">订单正在处理中</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-600">
                    如需核对，您可凭校验码 <span className="font-mono text-base text-slate-900">{success.orderCode}</span> 在本页查询进度
                  </div>
                  <button
                    type="button"
                    className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                    onClick={() => setModalOpen(false)}
                  >
                    返回商城
                  </button>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

      {mounted && lookupOpen &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="relative w-full max-w-lg rounded-3xl bg-white px-6 py-8 shadow-2xl">
              <button
                type="button"
                className="absolute right-5 top-5 text-slate-400 hover:text-slate-700"
                onClick={() => setLookupOpen(false)}
                aria-label="关闭"
              >
                ×
              </button>
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold text-slate-900">查询订单状态</h3>
                </div>
                <OrderLookup />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
