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
  const startupTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const hasStartedRef = useRef(false);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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

    const cleanup = () => {
      startupTimeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      startupTimeoutsRef.current = [];
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    cleanup();

    if (pool.length === 0) {
      setActiveDanmaku([]);
      indexRef.current = 0;
      hasStartedRef.current = false;
      return cleanup;
    }

    indexRef.current = indexRef.current % pool.length;

    const spawnDanmaku = () => {
      if (pool.length === 0) return;

      const danmakuItem = pool[indexRef.current % pool.length];
      indexRef.current += 1;

      const track = Math.floor(Math.random() * TRACK_COUNT);
      const duration = 25 + Math.random() * 12;
      const top = 8 + (track * 70) / TRACK_COUNT + Math.random() * 4;
      const key = `${danmakuItem.id}-${Date.now()}-${Math.random()}`;

      setActiveDanmaku((prev) => [
        ...prev,
        { key, text: danmakuItem.text, color: danmakuItem.color, top, duration },
      ]);

      setTimeout(() => {
        if (!isMountedRef.current) return;
        setActiveDanmaku((current) => current.filter((item) => item.key !== key));
      }, duration * 1000 + 100);
    };

    const scheduleRuns = () => {
      const initialCount = Math.min(pool.length, 8);

      for (let i = 0; i < initialCount; i += 1) {
        const timeoutId = setTimeout(() => {
          spawnDanmaku();
        }, i * 800);
        startupTimeoutsRef.current.push(timeoutId);
      }

      const intervalStarter = setTimeout(() => {
        spawnDanmaku();
        timerRef.current = setInterval(spawnDanmaku, 2500);
      }, initialCount * 800 + 500);
      startupTimeoutsRef.current.push(intervalStarter);
    };

    const startupDelay = hasStartedRef.current ? 0 : 300;
    hasStartedRef.current = true;

    const startupTimer = setTimeout(scheduleRuns, startupDelay);
    startupTimeoutsRef.current.push(startupTimer);

    return cleanup;
  }, [pool, mounted]);

  const value = useMemo(() => ({ danmaku, activeDanmaku }), [danmaku, activeDanmaku]);

  return <DanmakuContext.Provider value={value}>{children}</DanmakuContext.Provider>;
}

export function useDanmaku() {
  return useContext(DanmakuContext);
}
