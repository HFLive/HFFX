"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AdminButton } from "@/components/admin/AdminButton";

// 像素风格炸弹图标组件
function PixelBomb({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const scale = size === "sm" ? 0.5 : size === "md" ? 0.75 : 1;
  const pixel = 4 * scale;

  return (
    <div className="relative inline-block" style={{ imageRendering: "pixelated" }}>
      {/* 炸弹引线 - 更精致的引线设计 */}
      <div className="absolute" style={{ left: "50%", top: `-${pixel * 2.5}px`, transform: "translateX(-50%)" }}>
        {/* 引线火花 - 顶部 */}
        <div
          className="absolute bg-orange-400 border border-orange-300"
          style={{
            width: `${pixel * 0.8}px`,
            height: `${pixel * 0.8}px`,
            left: `${pixel * 0.1}px`,
            top: `-${pixel * 0.4}px`,
          }}
        />
        {/* 引线主体 */}
        <div
          className="absolute bg-yellow-500 border border-yellow-400"
          style={{
            width: `${pixel * 0.8}px`,
            height: `${pixel * 2}px`,
            left: `${pixel * 0.1}px`,
            top: 0,
          }}
        />
        {/* 引线高光 */}
        <div
          className="absolute bg-yellow-300"
          style={{
            width: `${pixel * 0.3}px`,
            height: `${pixel * 1.5}px`,
            left: `${pixel * 0.25}px`,
            top: `${pixel * 0.2}px`,
          }}
        />
      </div>
      
      {/* 炸弹主体 - 更精致的像素风格圆形炸弹 */}
      <div
        className="relative bg-red-700 border-2 border-red-500"
        style={{
          width: `${pixel * 5}px`,
          height: `${pixel * 5}px`,
          imageRendering: "pixelated",
        }}
      >
        {/* 顶部高光区域 */}
        <div
          className="absolute bg-red-500"
          style={{
            width: `${pixel * 2}px`,
            height: `${pixel * 1.5}px`,
            top: `${pixel * 0.5}px`,
            left: `${pixel * 1}px`,
          }}
        />
        {/* 顶部高光点 */}
        <div
          className="absolute bg-red-300"
          style={{
            width: `${pixel}px`,
            height: `${pixel}px`,
            top: `${pixel * 0.8}px`,
            left: `${pixel * 1.5}px`,
          }}
        />
        {/* 中间装饰点 */}
        <div
          className="absolute bg-red-600"
          style={{
            width: `${pixel * 0.5}px`,
            height: `${pixel * 0.5}px`,
            top: `${pixel * 1.8}px`,
            left: `${pixel * 1.2}px`,
          }}
        />
        <div
          className="absolute bg-red-600"
          style={{
            width: `${pixel * 0.5}px`,
            height: `${pixel * 0.5}px`,
            top: `${pixel * 1.8}px`,
            right: `${pixel * 1.2}px`,
          }}
        />
        {/* 底部阴影区域 */}
        <div
          className="absolute bg-red-900"
          style={{
            width: `${pixel * 3}px`,
            height: `${pixel * 1.5}px`,
            bottom: `${pixel * 0.3}px`,
            left: `${pixel * 1}px`,
          }}
        />
        {/* 装饰性条纹 */}
        <div
          className="absolute bg-red-800"
          style={{
            width: `${pixel * 3.5}px`,
            height: `${pixel * 0.5}px`,
            top: `${pixel * 2.5}px`,
            left: `${pixel * 0.75}px`,
          }}
        />
      </div>
    </div>
  );
}

// 像素风格爆炸图标组件
function PixelExplosion() {
  const pixel = 4;
  return (
    <div className="inline-flex items-center gap-0.5" style={{ imageRendering: "pixelated" }}>
      <div
        className="bg-red-600 border border-red-400"
        style={{ width: `${pixel * 2}px`, height: `${pixel * 2}px` }}
      />
      <div
        className="bg-yellow-400 border border-yellow-300"
        style={{ width: `${pixel * 1.5}px`, height: `${pixel * 1.5}px` }}
      />
      <div
        className="bg-red-600 border border-red-400"
        style={{ width: `${pixel * 2}px`, height: `${pixel * 2}px` }}
      />
    </div>
  );
}

// 华附关键位置数据
const KEY_LOCATIONS = [
  { id: "1", name: "修业楼", x: 40, y: 60, description: "西侧主要教学区域，包含多个教室" },
  { id: "2", name: "致知楼", x: 60, y: 60, description: "东侧主要教学区域，包含多个教室" },
  { id: "3", name: "图书馆", x: 20, y: 50, description: "学校图书馆，景观优美，常有学生自习" },
  { id: "4", name: "体育馆", x: 20, y: 26, description: "室内体育场馆，用于各类体育活动，是华附春晚的举办地点" },
  { id: "5", name: "华附饭堂", x: 75, y: 35, description: "情报：与厕所气味类似" },
  { id: "6", name: "宿舍楼", x: 80, y: 55, description: "男女学生宿舍" },
  { id: "7", name: "德政楼", x:15, y: 74, description: "行政办公区域" },
  { id: "8", name: "操场", x: 55, y: 18, description: "室外运动场，用于体育课和校运会，工作日10:30有大量学生聚集举行某种祭祀活动" },
  { id: "9", name: "国际部", x: 86, y: 82, description: "音乐美术等艺术课程教学区域" },
  { id: "10", name: "南门", x: 50, y: 88, description: "学校正门入口" },
];

type Props = {
  countdownTarget: string | null;
};

function calculateTimeLeft(targetTimestamp: number): { days: number; hours: number; minutes: number; seconds: number } {
  const now = Date.now();
  const difference = targetTimestamp - now;

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((difference % (1000 * 60)) / 1000),
  }
}

export default function BombManager({ countdownTarget }: Props) {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [bombLocations, setBombLocations] = useState<string[]>([]);
  const [toastMessages, setToastMessages] = useState<{ id: string; text: string }[]>([]);
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [loading, setLoading] = useState(true);

  const defaultTarget = "2025-12-30T18:00:00";
  const targetTimestamp = countdownTarget ? new Date(countdownTarget).getTime() : new Date(defaultTarget).getTime();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const loadBombLocations = async () => {
      try {
        const response = await fetch("/api/admin/settings/bomb-locations");
        if (response.status === 401) {
          window.location.href = "/admin/login";
          return;
        }
        if (response.ok) {
          const data = (await response.json()) as { locations: string[] };
          setBombLocations(data.locations || []);
        }
      } catch (error) {
        console.error("Failed to load bomb locations:", error);
      } finally {
        setLoading(false);
      }
    };

    loadBombLocations();
  }, []);

  useEffect(() => {
    setTimeLeft(calculateTimeLeft(targetTimestamp));
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetTimestamp));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetTimestamp]);

  const showToast = (message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToastMessages((prev) => [...prev, { id, text: message }]);
    setTimeout(() => {
      setToastMessages((prev) => prev.filter((toast) => toast.id !== id));
    }, 2800);
  };

  const handleToggleBomb = async (locationId: string) => {
    const location = KEY_LOCATIONS.find((loc) => loc.id === locationId);
    if (!location) return;

    const isBomb = bombLocations.includes(locationId);
    const newLocations = isBomb
      ? bombLocations.filter((id) => id !== locationId)
      : [...bombLocations, locationId];

    // 乐观更新
    setBombLocations(newLocations);
    showToast(isBomb ? `已取消爆炸地点：${location.name}` : `已设置爆炸地点：${location.name}`);

    // 保存到数据库
    try {
      const response = await fetch("/api/admin/settings/bomb-locations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locations: newLocations }),
      });
      if (response.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      if (!response.ok) {
        // 如果保存失败，回滚状态
        setBombLocations(bombLocations);
        showToast("保存失败，请稍后再试");
      }
    } catch (error) {
      // 如果保存失败，回滚状态
      setBombLocations(bombLocations);
      showToast("保存失败，请稍后再试");
    }
  };

  const selectedLocationData = selectedLocation ? KEY_LOCATIONS.find((loc) => loc.id === selectedLocation) : null;
  const bombLocationsData = KEY_LOCATIONS.filter((loc) => bombLocations.includes(loc.id));

  return (
    <div className="space-y-6">
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

      <section className="admin-panel space-y-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="admin-section-title">绝密</h2>
          {bombLocationsData.length > 0 && (
            <div className="admin-muted">
              爆炸地点数量：<span className="text-red-400">{bombLocationsData.length}</span>
              <span className="ml-2 text-xs">
                ({bombLocationsData.map((loc) => loc.name).join(", ")})
              </span>
            </div>
          )}
        </div>

        {/* 地图容器 */}
        <div className="relative w-full aspect-video border-2 border-emerald-500/60 bg-gradient-to-br from-black/90 via-black/80 to-emerald-950/30 overflow-hidden">
          {/* 地图背景网格 */}
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: `
                linear-gradient(rgba(16, 185, 129, 0.4) 1px, transparent 1px),
                linear-gradient(90deg, rgba(16, 185, 129, 0.4) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
            }}
          />
          
          {/* 地图标题 */}
          <div className="absolute top-4 left-4 z-10">
            <div className="admin-subpanel border-emerald-500/40 bg-black/60 px-3 py-1">
              <p className="admin-text-small font-mono">华南师范大学附属中学</p>
            </div>
          </div>

          {/* 关键位置标记 */}
          {KEY_LOCATIONS.map((location) => {
            const isSelected = selectedLocation === location.id;
            const isBomb = bombLocations.includes(location.id);
            return (
              <button
                key={location.id}
                type="button"
                onClick={() => setSelectedLocation(location.id)}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-200 hover:scale-125 z-20"
                style={{
                  left: `${location.x}%`,
                  top: `${location.y}%`,
                }}
                title={location.name}
              >
                <div
                  className={`w-8 h-8 border-2 flex items-center justify-center font-mono text-xs font-bold transition-all ${
                    isBomb
                      ? "bg-red-600 border-red-400 text-red-100 shadow-[0_0_16px_rgba(239,68,68,1)] animate-pulse"
                      : isSelected
                      ? "bg-emerald-600 border-emerald-400 text-emerald-100 shadow-[0_0_16px_rgba(16,185,129,0.8)]"
                      : "bg-emerald-500/40 border-emerald-400/70 text-emerald-200 hover:bg-emerald-500/60 hover:shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  }`}
                >
                  {location.id}
                </div>
                {isBomb && (
                  <div className="absolute -top-12 left-1/2" style={{ transform: 'translateX(-50%)' }}>
                    <div className="animate-bounce">
                      <PixelBomb size="lg" />
                    </div>
                  </div>
                )}
                {isSelected && !isBomb && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-emerald-400 text-xs font-mono whitespace-nowrap bg-black/80 px-2 py-1 border border-emerald-500/40">
                    {location.name}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* 位置列表 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {KEY_LOCATIONS.map((location) => {
            const isSelected = selectedLocation === location.id;
            const isBomb = bombLocations.includes(location.id);
            return (
              <button
                key={location.id}
                type="button"
                onClick={() => setSelectedLocation(location.id)}
                className={`admin-subpanel p-2 text-xs text-center transition-colors ${
                  isSelected
                    ? "border-emerald-400 bg-emerald-500/20"
                    : isBomb
                    ? "border-red-400 bg-red-500/20"
                    : "border-emerald-500/40 hover:bg-emerald-500/10"
                }`}
              >
                <div className={`font-mono font-bold ${isBomb ? "text-red-400" : ""}`}>{location.id}</div>
                <div className={`mt-1 truncate ${isBomb ? "text-red-400" : ""}`}>{location.name}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 选中位置详情 */}
      {selectedLocationData && (
        <section className="admin-panel space-y-4">
          <h3 className="admin-section-title">位置详情</h3>
          <div className="space-y-3">
            <div>
              <span className="admin-label">位置名称</span>
              <p className={`admin-text ${bombLocations.includes(selectedLocationData.id) ? "text-red-400" : ""}`}>
                {selectedLocationData.name}
              </p>
            </div>
            <div>
              <span className="admin-label">位置描述</span>
              <p className="admin-text-small">{selectedLocationData.description}</p>
            </div>
            <div>
              <span className="admin-label">坐标</span>
              <p className="admin-code">
                ({selectedLocationData.x}%, {selectedLocationData.y}%)
              </p>
            </div>
            <AdminButton
              type="button"
              tone={bombLocations.includes(selectedLocationData.id) ? "primary" : "danger"}
              onClick={() => handleToggleBomb(selectedLocationData.id)}
              className="w-full md:w-auto"
            >
              {bombLocations.includes(selectedLocationData.id) ? "取消爆炸地点" : "设为爆炸地点"}
            </AdminButton>
          </div>
        </section>
      )}

      {/* 爆破倒计时 */}
      <section className="admin-panel space-y-4">
        <h3 className="admin-section-title">爆破倒计时</h3>
        <div className="space-y-4">
          {timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0 ? (
            <div className="admin-subpanel border-red-500 bg-red-600/20 text-center py-6">
              <p className="admin-text text-red-400 font-bold text-xl uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                <PixelExplosion />
                时间已到
              </p>
              <p className="admin-text-small text-red-300 mt-2">
                华附春晚已经开始
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              <div className="admin-subpanel text-center border-emerald-500/40">
                <div className="admin-metric text-3xl font-mono">{String(timeLeft.days).padStart(2, "0")}</div>
                <div className="admin-label text-xs mt-1 uppercase tracking-[0.2em]">天</div>
              </div>
              <div className="admin-subpanel text-center border-emerald-500/40">
                <div className="admin-metric text-3xl font-mono">{String(timeLeft.hours).padStart(2, "0")}</div>
                <div className="admin-label text-xs mt-1 uppercase tracking-[0.2em]">时</div>
              </div>
              <div className="admin-subpanel text-center border-emerald-500/40">
                <div className="admin-metric text-3xl font-mono">{String(timeLeft.minutes).padStart(2, "0")}</div>
                <div className="admin-label text-xs mt-1 uppercase tracking-[0.2em]">分</div>
              </div>
              <div className="admin-subpanel text-center border-red-500/60 bg-red-500/10">
                <div className="admin-metric text-3xl font-mono text-red-400">{String(timeLeft.seconds).padStart(2, "0")}</div>
                <div className="admin-label text-xs mt-1 uppercase tracking-[0.2em] text-red-300">秒</div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

