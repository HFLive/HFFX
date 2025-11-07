"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { DanmakuRecord } from "@/lib/danmaku";

type ActiveDanmakuItem = {
  key: string;
  text: string;
  color?: string | null;
  top: number;
  duration: number;
};

type DanmakuContextValue = {
  danmaku: DanmakuRecord[];
  activeDanmaku: ActiveDanmakuItem[];
};

const DanmakuContext = createContext<DanmakuContextValue>({ danmaku: [], activeDanmaku: [] });

const TRACK_COUNT = 6;

export function DanmakuProvider({ children }: { children: React.ReactNode }) {
  const [danmaku, setDanmaku] = useState<DanmakuRecord[]>([]);
  const [activeDanmaku, setActiveDanmaku] = useState<ActiveDanmakuItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    let isActive = true;
    const load = async () => {
      try {
        const response = await fetch("/api/danmaku", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as DanmakuRecord[];
        if (isActive) setDanmaku(data);
      } catch (error) {
        // ignore
      }
    };
    load();
    return () => {
      isActive = false;
    };
  }, [mounted]);

  const pool = useMemo(() => danmaku.filter((item) => item.text?.trim()), [danmaku]);

  useEffect(() => {
    if (!mounted) return;
    
    // 清理之前的定时器
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (pool.length === 0) {
      // 如果没有弹幕数据，清空现有弹幕
      setActiveDanmaku([]);
      indexRef.current = 0;
      return;
    }

    // 只在首次加载或pool变化时重置
    if (activeDanmaku.length === 0) {
      indexRef.current = 0;
    }

    const spawnDanmaku = () => {
      if (pool.length === 0) return;
      const danmakuItem = pool[indexRef.current % pool.length];
      indexRef.current += 1;
      const track = Math.floor(Math.random() * TRACK_COUNT);
      const duration = 25 + Math.random() * 12; // 25-37秒的随机时长
      const top = 8 + (track * 70) / TRACK_COUNT + Math.random() * 4;
      const key = `${danmakuItem.id}-${Date.now()}-${Math.random()}`;
      setActiveDanmaku((prev) => [
        ...prev,
        { key, text: danmakuItem.text, color: danmakuItem.color, top, duration },
      ]);
      setTimeout(() => {
        setActiveDanmaku((current) => current.filter((item) => item.key !== key));
      }, duration * 1000 + 100);
    };

    // 延迟一点启动，避免首次渲染时的闪烁
    const startupDelay = activeDanmaku.length === 0 ? 300 : 0;
    
    const timers: NodeJS.Timeout[] = [];
    
    const startupTimer = setTimeout(() => {
      // 首次加载时，让弹幕错开出现，而不是一起出现
      const initialCount = Math.min(pool.length, 8);
      for (let i = 0; i < initialCount; i += 1) {
        const timer = setTimeout(() => {
          spawnDanmaku();
        }, i * 800); // 每个弹幕间隔800ms出现
        timers.push(timer);
      }

      // 持续生成新弹幕，间隔更短
      const startContinuous = setTimeout(() => {
        timerRef.current = setInterval(spawnDanmaku, 2500); // 每2.5秒生成一个新弹幕
      }, initialCount * 800 + 500);
      timers.push(startContinuous);
    }, startupDelay);

    return () => {
      clearTimeout(startupTimer);
      timers.forEach(timer => clearTimeout(timer));
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      timerRef.current = null;
    };
  }, [pool, mounted, activeDanmaku.length]);

  const value = useMemo(() => ({ danmaku, activeDanmaku }), [danmaku, activeDanmaku]);

  return <DanmakuContext.Provider value={value}>{children}</DanmakuContext.Provider>;
}

export function useDanmaku() {
  return useContext(DanmakuContext);
}
