"use client";

import { useState } from "react";
import { AdminOrder } from "./AdminDashboard";
import { Button } from "@/components/ui/button";

const PAYMENT_STATUS_OPTIONS = [
  { value: "pending", label: "待核验" },
  { value: "paid", label: "已确认付款" },
  { value: "cancelled", label: "已取消" },
];

const FULFILLMENT_STATUS_OPTIONS = [
  { value: "presale", label: "预售中" },
  { value: "not_shipped", label: "待发货" },
  { value: "shipped", label: "已发货" },
  { value: "not_picked_up", label: "待自提" },
  { value: "picked_up", label: "已自提" },
];

type Props = {
  orders: AdminOrder[];
  loading: boolean;
  reload: () => Promise<void>;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

export default function OrderManager({ orders, loading, reload, page, pageSize, total, onPageChange }: Props) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = total === 0 ? 0 : (page - 1) * pageSize + orders.length;

  const handleUpdate = async (orderId: string, updates: { paymentStatus?: string; fulfillmentStatus?: string }) => {
    setUpdatingId(orderId);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message ?? "更新失败");
      }
      await reload();
    } catch (err: any) {
      setError(err.message ?? "更新失败，请稍后再试");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-primary/10 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-foreground">订单列表</h2>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-foreground-light">
            共 {total} 条记录，当前第 {page}/{totalPages} 页
            {total > 0 && (
              <span className="ml-2">
                本页显示 {startIndex} - {endIndex}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={loading || page <= 1}
            >
              上一页
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={loading || page >= totalPages}
            >
              下一页
            </Button>
            <Button type="button" onClick={() => reload()} disabled={loading}>
              刷新当前页
            </Button>
          </div>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="rounded-3xl border border-primary/10 bg-white p-6 text-center text-foreground-light">
          正在加载订单...
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-primary/10 bg-white p-6 text-center text-foreground-light">
          暂无订单记录。
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-3xl border border-primary/10 bg-white p-6 shadow-sm space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-sm text-foreground-light">订单号</p>
                  <p className="text-xl font-semibold font-mono text-primary">{order.orderCode}</p>
                  <p className="text-xs text-foreground-light mt-1">
                    {order.nickname} · {order.phone} · {order.deliveryMethod === "pickup" ? "自提" : "快递"}
                  </p>
                </div>
                <div className="text-sm text-foreground-light">
                  下单时间：{new Date(order.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">商品明细</p>
                  <ul className="space-y-1 text-sm text-foreground-light">
                    {order.items.map((item) => (
                      <li key={item.id}>
                        {item.variant.product.name} - {item.variant.name} × {item.quantity}
                        {item.unitPrice != null ? `（¥${(item.unitPrice / 100).toFixed(2)}）` : ""}
                      </li>
                    ))}
                  </ul>
                  {order.note && (
                    <p className="text-xs text-primary/80 bg-primary/5 border border-primary/10 rounded-xl px-3 py-2">
                      备注：{order.note}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-foreground">支付状态</label>
                    <select
                      className="rounded-xl border border-primary/20 px-3 py-2 text-sm"
                      value={order.paymentStatus}
                      onChange={(event) => handleUpdate(order.id, { paymentStatus: event.target.value })}
                      disabled={updatingId === order.id}
                    >
                      {PAYMENT_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-foreground">发货状态</label>
                    <select
                      className="rounded-xl border border-primary/20 px-3 py-2 text-sm"
                      value={order.fulfillmentStatus}
                      onChange={(event) => handleUpdate(order.id, { fulfillmentStatus: event.target.value })}
                      disabled={updatingId === order.id}
                    >
                      {FULFILLMENT_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {order.deliveryMethod === "delivery" && (
                <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-foreground">
                  <p className="font-medium">快递信息</p>
                  <p>收件人：{order.deliveryName ?? "-"}，电话：{order.deliveryPhone ?? "-"}</p>
                  <p>地址：{order.deliveryAddress ?? "-"}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
