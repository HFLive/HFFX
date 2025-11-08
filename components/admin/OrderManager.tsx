"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AdminOrder } from "./AdminDashboard";
import { AdminButton } from "@/components/admin/AdminButton";

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
  searchQuery: string;
  paymentStatusFilter: string;
  fulfillmentStatusFilter: string;
  deliveryMethodFilter: string;
  onSearch: (search: string, paymentStatus: string, fulfillmentStatus: string, deliveryMethod: string) => void;
};

export default function OrderManager({
  orders,
  loading,
  reload,
  page,
  pageSize,
  total,
  onPageChange,
  searchQuery,
  paymentStatusFilter,
  fulfillmentStatusFilter,
  deliveryMethodFilter,
  onSearch
}: Props) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toastMessages, setToastMessages] = useState<{ id: string; text: string }[]>([]);
  const [mounted, setMounted] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [localPaymentStatus, setLocalPaymentStatus] = useState(paymentStatusFilter);
  const [localFulfillmentStatus, setLocalFulfillmentStatus] = useState(fulfillmentStatusFilter);
  const [localDeliveryMethod, setLocalDeliveryMethod] = useState(deliveryMethodFilter);

  // 当 props 改变时同步本地状态
  useEffect(() => {
    setLocalSearch(searchQuery);
    setLocalPaymentStatus(paymentStatusFilter);
    setLocalFulfillmentStatus(fulfillmentStatusFilter);
    setLocalDeliveryMethod(deliveryMethodFilter);
  }, [searchQuery, paymentStatusFilter, fulfillmentStatusFilter, deliveryMethodFilter]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIndex = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = total === 0 ? 0 : (page - 1) * pageSize + orders.length;

  const showToast = (message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToastMessages((prev) => [...prev, { id, text: message }]);
    setTimeout(() => {
      setToastMessages((prev) => prev.filter((toast) => toast.id !== id));
    }, 2800);
  };

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

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
      showToast("订单状态已更新");
      await reload();
    } catch (err: any) {
      setError(err.message ?? "更新失败，请稍后再试");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* 搜索表单 */}
      <section className="admin-panel space-y-4">
        <h2 className="admin-section-title">搜索订单</h2>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSearch(localSearch, localPaymentStatus, localFulfillmentStatus, localDeliveryMethod);
          }}
        >
          <div className="grid gap-2">
            <span className="admin-label">关键词搜索</span>
            <input
              name="search"
              type="text"
              placeholder="订单号、昵称或电话"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="admin-input"
            />
            <span className="admin-muted">支持在订单号、昵称和电话中搜索</span>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <label className="grid gap-2">
              <span className="admin-label">支付状态</span>
              <select
                name="paymentStatus"
                value={localPaymentStatus}
                onChange={(e) => setLocalPaymentStatus(e.target.value)}
                className="admin-select"
              >
                <option value="">全部</option>
                {PAYMENT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="admin-label">发货状态</span>
              <select
                name="fulfillmentStatus"
                value={localFulfillmentStatus}
                onChange={(e) => setLocalFulfillmentStatus(e.target.value)}
                className="admin-select"
              >
                <option value="">全部</option>
                {FULFILLMENT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="admin-label">配送方式</span>
              <select
                name="deliveryMethod"
                value={localDeliveryMethod}
                onChange={(e) => setLocalDeliveryMethod(e.target.value)}
                className="admin-select"
              >
                <option value="">全部</option>
                <option value="pickup">自提</option>
                <option value="delivery">快递</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <AdminButton type="submit" disabled={loading}>
              {loading ? "搜索中..." : "搜索"}
            </AdminButton>
            <AdminButton
              type="button"
              tone="plain"
              onClick={() => {
                setLocalSearch("");
                setLocalPaymentStatus("");
                setLocalFulfillmentStatus("");
                setLocalDeliveryMethod("");
                onSearch("", "", "", "");
              }}
              disabled={loading}
            >
              清除搜索
            </AdminButton>
          </div>
        </form>
      </section>

      {mounted && toastMessages.length > 0 &&
        createPortal(
          <div className="pointer-events-none fixed bottom-6 right-6 z-[1000]">
            {toastMessages.map((toast, index) => (
              <div
                key={toast.id}
                className="bg-emerald-500/15 border border-emerald-400/70 text-emerald-200 uppercase tracking-[0.28em] text-xs px-4 py-2 shadow-[0_0_24px_rgba(16,185,129,0.35)] rounded-none"
                style={{
                  position: "absolute",
                  bottom: `${index * 60}px`,
                  right: 0,
                  whiteSpace: "nowrap",
                  maxWidth: "300px",
                }}
              >
                {toast.text}
              </div>
            ))}
          </div>,
          document.body
        )}
      <div className="admin-panel space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <p className="admin-heading">order console</p>
            <h2 className="admin-section-title">订单列表</h2>
          </div>
          <div className="admin-muted">
            total {total} · page {page}/{totalPages}
            {total > 0 && (
              <span className="ml-4">
                window {startIndex} - {endIndex}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <AdminButton tone="plain" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={loading || page <= 1}>
            上一页
          </AdminButton>
          <AdminButton
            tone="plain"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={loading || page >= totalPages}
          >
            下一页
          </AdminButton>
          <AdminButton tone="plain" onClick={() => reload()} disabled={loading}>
            刷新当前页
          </AdminButton>
        </div>
      </div>

      {error && <div className="admin-alert">{error}</div>}

      {loading ? (
        <div className="admin-panel text-center">
          <p className="admin-text">正在加载订单...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="admin-panel text-center">
          <p className="admin-text">暂无订单记录。</p>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((order) => (
            <div key={order.id} className="admin-panel space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <p className="admin-text-small">订单号</p>
                  <p className="font-mono text-lg text-emerald-200 tracking-[0.25em]">{order.orderCode}</p>
                  <p className="admin-text-small">
                    {order.nickname} · {order.phone} · {order.deliveryMethod === "pickup" ? "自提" : "快递"}
                  </p>
                </div>
                <div className="admin-text-small">下单时间：{new Date(order.createdAt).toLocaleString()}</div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="admin-heading">商品明细</p>
                  <ul className="space-y-1">
                    {order.items.map((item) => (
                      <li key={item.id} className="admin-text-small normal-case tracking-normal text-emerald-200/80">
                        {item.variant.product.name} · {item.variant.name} × {item.quantity}
                        {item.unitPrice != null ? `（¥${(item.unitPrice / 100).toFixed(2)}）` : ""}
                      </li>
                    ))}
                  </ul>
                  {order.note && <div className="admin-subpanel admin-text-small">备注：{order.note}</div>}
                </div>

                <div className="space-y-3">
                  <div className="grid gap-2">
                    <span className="admin-label">支付状态</span>
                    <select
                      className="admin-input"
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
                  <div className="grid gap-2">
                    <span className="admin-label">发货状态</span>
                    <select
                      className="admin-input"
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
                <div className="admin-subpanel space-y-1 admin-text-small">
                  <p className="admin-heading">快递信息</p>
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
