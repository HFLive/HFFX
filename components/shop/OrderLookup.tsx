"use client";

import { useState } from "react";

const PHONE_OPTIONS = [
  { value: "+86", label: "+86 中国大陆" },
  { value: "+852", label: "+852 香港" },
  { value: "+853", label: "+853 澳门" },
  { value: "+886", label: "+886 台湾" },
  { value: "+81", label: "+81 日本" },
  { value: "+82", label: "+82 韩国" },
  { value: "+65", label: "+65 新加坡" },
  { value: "+60", label: "+60 马来西亚" },
  { value: "+1", label: "+1 美国 / 加拿大" },
  { value: "+44", label: "+44 英国" },
  { value: "+49", label: "+49 德国" },
  { value: "+33", label: "+33 法国" },
  { value: "+34", label: "+34 西班牙" },
  { value: "+39", label: "+39 意大利" },
  { value: "+7", label: "+7 俄罗斯" },
  { value: "+61", label: "+61 澳大利亚" },
  { value: "+64", label: "+64 新西兰" },
  { value: "+55", label: "+55 巴西" },
  { value: "+52", label: "+52 墨西哥" },
  { value: "+971", label: "+971 阿联酋" },
];

export default function OrderLookup() {
  const [orderCode, setOrderCode] = useState("");
  const [phoneCountry, setPhoneCountry] = useState("+86");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!orderCode.trim() || !phone.trim()) {
      setError("请输入订单号和手机号");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const params = new URLSearchParams({
        orderCode: orderCode.trim(),
        phone: `${phoneCountry.trim()} ${phone.trim()}`,
      });
      const response = await fetch(`/api/orders/status?${params.toString()}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message ?? "查询失败");
      }
      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message ?? "查询失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">校验码</span>
            <input
              type="text"
              value={orderCode}
              onChange={(event) => setOrderCode(event.target.value)}
              className="w-full rounded-xl border border-primary/20 px-3 py-2"
              placeholder="请输入付款时生成的校验码"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">手机号</span>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
              <select
                value={phoneCountry}
                onChange={(event) => setPhoneCountry(event.target.value)}
                className="w-full rounded-xl border border-primary/20 px-3 py-2 text-sm sm:w-36"
              >
                {PHONE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="w-full rounded-xl border border-primary/20 px-3 py-2 sm:flex-1 sm:min-w-0"
                placeholder="下单手机号"
              />
            </div>
          </label>
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-secondary px-4 py-2 text-white font-semibold shadow-sm disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "查询中..." : "查询订单"}
        </button>
      </form>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {result && (
        <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 text-sm space-y-2">
          <p>
            <span className="font-semibold">收货方式：</span>
            {result.deliveryMethod === "pickup" ? "自提" : "快递"}
          </p>
          <p>
            <span className="font-semibold">支付状态：</span>
            {renderPaymentStatus(result.paymentStatus)}
          </p>
          <p>
            <span className="font-semibold">发货状态：</span>
            {renderFulfillmentStatus(result.fulfillmentStatus)}
          </p>
          {result.items?.length ? (
            <div>
              <span className="font-semibold">商品：</span>
              <ul className="mt-1 list-disc list-inside space-y-1">
                {result.items.map((item: any) => (
                  <li key={item.id}>
                    {item.productName} - {item.variantName} × {item.quantity}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {result.note && (
            <p>
              <span className="font-semibold">备注：</span>
              {result.note}
            </p>
          )}
          <p className="text-xs text-foreground-light">下单时间：{new Date(result.createdAt).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}

function renderPaymentStatus(status: string) {
  switch (status) {
    case "pending":
      return "待核验";
    case "paid":
      return "已确认付款";
    case "cancelled":
      return "已取消";
    default:
      return status;
  }
}

function renderFulfillmentStatus(status: string) {
  switch (status) {
    case "presale":
      return "预售中";
    case "not_shipped":
      return "待发货";
    case "shipped":
      return "已发货";
    case "not_picked_up":
      return "待自提";
    case "picked_up":
      return "已自提";
    default:
      return status;
  }
}
