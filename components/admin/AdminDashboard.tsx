"use client";

import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import ProductManager from "@/components/admin/ProductManager";
import OrderManager from "@/components/admin/OrderManager";
import SurveyManager from "@/components/admin/SurveyManager";
import DanmakuManager from "@/components/admin/DanmakuManager";
import TimelineManager from "@/components/admin/TimelineManager";
import SettingsManager from "@/components/admin/SettingsManager";

export type AdminProduct = {
  id: string;
  name: string;
  description?: string | null;
  coverImage?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  variants: Array<{
    id: string;
    name: string;
    price: number | null;
    inventory: number | null;
    isActive: boolean;
  }>;
};

export type AdminSurvey = {
  slug: string;
  title: string;
  description?: string | null;
  url?: string | null;
  embedHtml?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminDanmaku = {
  id: string;
  text: string;
  color?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminTimeline = {
  note?: string | null;
  events: Array<{
    id: string;
    title: string;
    date?: string | null;
    description?: string | null;
    completed?: boolean;
  }>;
};

export type AdminOrder = {
  id: string;
  orderCode: string;
  nickname: string;
  phone: string;
  deliveryMethod: string;
  deliveryName?: string | null;
  deliveryPhone?: string | null;
  deliveryAddress?: string | null;
  paymentStatus: string;
  fulfillmentStatus: string;
  note?: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number | null;
    variant: {
      name: string;
      product: {
        name: string;
      };
    };
  }>;
};

type OrderResponse = {
  total: number;
  page: number;
  pageSize: number;
  orders: AdminOrder[];
};

export default function AdminDashboard() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [ordersData, setOrdersData] = useState<OrderResponse | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [surveys, setSurveys] = useState<AdminSurvey[]>([]);
  const [surveysLoading, setSurveysLoading] = useState(true);
  const [danmaku, setDanmaku] = useState<AdminDanmaku[]>([]);
  const [danmakuLoading, setDanmakuLoading] = useState(true);
  const [timeline, setTimeline] = useState<AdminTimeline>({ note: undefined, events: [] });
  const [timelineLoading, setTimelineLoading] = useState(true);
  const [countdownTarget, setCountdownTarget] = useState<string | null>(null);
  const [countdownLoading, setCountdownLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("products");
  const [orderPage, setOrderPage] = useState(1);

  const ORDER_PAGE_SIZE = 20;

  const loadProducts = async () => {
    setProductsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/products");
      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message ?? "加载商品失败");
      }
      const productsData = await response.json();
      setProducts(productsData);
    } catch (err: any) {
      setError(err.message ?? "加载失败，请稍后再试");
    } finally {
      setProductsLoading(false);
    }
  };

  const loadOrders = async (page = orderPage) => {
    setOrdersLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders?page=${page}&pageSize=${ORDER_PAGE_SIZE}`);
      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message ?? "加载订单失败");
      }
      const data = (await response.json()) as OrderResponse;
      setOrdersData(data);
      setOrderPage(data.page);
    } catch (err: any) {
      setError(err.message ?? "加载失败，请稍后再试");
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadSurveys = async () => {
    setSurveysLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/surveys");
      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message ?? "加载问卷失败");
      }
      const surveysData = await response.json();
      setSurveys(surveysData);
    } catch (err: any) {
      setError(err.message ?? "加载失败，请稍后再试");
    } finally {
      setSurveysLoading(false);
    }
  };

  const loadDanmaku = async () => {
    setDanmakuLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/danmaku");
      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message ?? "加载弹幕失败");
      }
      const danmakuData = await response.json();
      setDanmaku(danmakuData);
    } catch (err: any) {
      setError(err.message ?? "加载失败，请稍后再试");
    } finally {
      setDanmakuLoading(false);
    }
  };

  const loadTimeline = async () => {
    setTimelineLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/timeline");
      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message ?? "加载时间线失败");
      }
      const data = await response.json();
      setTimeline({
        note: data.note ?? undefined,
        events: Array.isArray(data.events) ? data.events : [],
      });
    } catch (err: any) {
      setError(err.message ?? "加载失败，请稍后再试");
    } finally {
      setTimelineLoading(false);
    }
  };

  const loadCountdown = async () => {
    setCountdownLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/settings/countdown");
      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message ?? "加载倒计时设置失败");
      }
      const data = await response.json();
      setCountdownTarget(typeof data?.target === "string" ? data.target : null);
    } catch (err: any) {
      setError(err.message ?? "加载失败，请稍后再试");
    } finally {
      setCountdownLoading(false);
    }
  };

  const loadInitialData = async () => {
    setError(null);
    setProductsLoading(true);
    setOrdersLoading(true);
    setSurveysLoading(true);
    setDanmakuLoading(true);
    setTimelineLoading(true);
    setCountdownLoading(true);
    try {
      const [productsRes, ordersRes, surveysRes, danmakuRes, timelineRes, countdownRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch(`/api/admin/orders?page=1&pageSize=${ORDER_PAGE_SIZE}`),
        fetch("/api/admin/surveys"),
        fetch("/api/admin/danmaku"),
        fetch("/api/admin/timeline"),
        fetch("/api/admin/settings/countdown"),
      ]);

      if (
        productsRes.status === 401 ||
        ordersRes.status === 401 ||
        surveysRes.status === 401 ||
        danmakuRes.status === 401 ||
        timelineRes.status === 401 ||
        countdownRes.status === 401
      ) {
        window.location.href = "/admin/login";
        return;
      }

      if (!productsRes.ok) {
        const data = await productsRes.json().catch(() => ({}));
        throw new Error(data.message ?? "加载商品失败");
      }
      if (!ordersRes.ok) {
        const data = await ordersRes.json().catch(() => ({}));
        throw new Error(data.message ?? "加载订单失败");
      }
      if (!surveysRes.ok) {
        const data = await surveysRes.json().catch(() => ({}));
        throw new Error(data.message ?? "加载问卷失败");
      }
      if (!danmakuRes.ok) {
        const data = await danmakuRes.json().catch(() => ({}));
        throw new Error(data.message ?? "加载弹幕失败");
      }
      if (!timelineRes.ok) {
        const data = await timelineRes.json().catch(() => ({}));
        throw new Error(data.message ?? "加载时间线失败");
      }
      if (!countdownRes.ok) {
        const data = await countdownRes.json().catch(() => ({}));
        throw new Error(data.message ?? "加载倒计时设置失败");
      }

      const productsData = await productsRes.json();
      const ordersData = (await ordersRes.json()) as OrderResponse;
      const surveysData = await surveysRes.json();
      const danmakuData = await danmakuRes.json();
      const timelineData = await timelineRes.json();
      const countdownData = await countdownRes.json();

      setProducts(productsData);
      setOrdersData(ordersData);
      setOrderPage(ordersData.page);
      setSurveys(surveysData);
      setDanmaku(danmakuData);
      setTimeline({
        note: timelineData.note ?? undefined,
        events: Array.isArray(timelineData.events) ? timelineData.events : [],
      });
      setCountdownTarget(typeof countdownData?.target === "string" ? countdownData.target : null);
    } catch (err: any) {
      setError(err.message ?? "加载失败，请稍后再试");
    } finally {
      setProductsLoading(false);
      setOrdersLoading(false);
      setSurveysLoading(false);
      setDanmakuLoading(false);
      setTimelineLoading(false);
      setCountdownLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  const totalInventory = useMemo(() => {
    return products.reduce((sum, product) => {
      return (
        sum +
        product.variants.reduce((variantSum, variant) => {
          return variantSum + (variant.inventory ?? 0);
        }, 0)
      );
    }, 0);
  }, [products]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">后台管理</h1>
          <p className="text-sm text-foreground-light mt-1">
            当前库存总计 {totalInventory} 件
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          退出登录
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="products">商品与库存</TabsTrigger>
          <TabsTrigger value="orders">订单</TabsTrigger>
          <TabsTrigger value="surveys">问卷</TabsTrigger>
          <TabsTrigger value="timeline">时间线</TabsTrigger>
          <TabsTrigger value="danmaku">弹幕</TabsTrigger>
          <TabsTrigger value="settings">提示</TabsTrigger>
        </TabsList>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <TabsContent value="products">
          <ProductManager products={products} loading={productsLoading} reload={loadProducts} />
        </TabsContent>

        <TabsContent value="orders">
          <OrderManager
            orders={ordersData?.orders ?? []}
            loading={ordersLoading}
            reload={() => loadOrders(orderPage)}
            page={ordersData?.page ?? orderPage}
            pageSize={ordersData?.pageSize ?? ORDER_PAGE_SIZE}
            total={ordersData?.total ?? 0}
            onPageChange={(page) => {
              setOrderPage(page);
              loadOrders(page);
            }}
          />
        </TabsContent>

        <TabsContent value="surveys">
          <SurveyManager surveys={surveys} loading={surveysLoading} reload={loadSurveys} />
        </TabsContent>

        <TabsContent value="timeline">
          <TimelineManager timeline={timeline} loading={timelineLoading} reload={loadTimeline} />
        </TabsContent>

        <TabsContent value="danmaku">
          <DanmakuManager danmaku={danmaku} loading={danmakuLoading} reload={loadDanmaku} />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsManager
            countdownTarget={countdownTarget}
            loading={countdownLoading}
            reloadCountdown={loadCountdown}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
