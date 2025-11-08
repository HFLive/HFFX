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
const MAX_ACTIVE_ITEMS = 40;
const REFRESH_INTERVAL = 30000;

export function DanmakuProvider({ children }: { children: React.ReactNode }) {
  const [danmaku, setDanmaku] = useState<DanmakuRecord[]>([]);
  const [activeDanmaku, setActiveDanmaku] = useState<ActiveDanmakuItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startupTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const removalTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const hasStartedRef = useRef(false);
  const isMountedRef = useRef(false);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const removalTimeouts = removalTimeoutsRef.current;
    return () => {
      removalTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
      removalTimeouts.clear();
    };
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let isActive = true;
    let isFetching = false;

    const applyDanmaku = (incoming: DanmakuRecord[]) => {
      setDanmaku((prev) => {
        if (prev.length === incoming.length) {
          const unchanged = prev.every((item, index) => {
            const nextItem = incoming[index];
            return item.id === nextItem.id && item.updatedAt === nextItem.updatedAt;
          });
          if (unchanged) {
            return prev;
          }
        }
        return incoming;
      });
    };

    const load = async () => {
      if (isFetching) return;
      isFetching = true;
      try {
        const response = await fetch("/api/danmaku", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as DanmakuRecord[];
        if (isActive) {
          applyDanmaku(data);
        }
      } catch (error) {
        // ignore
      } finally {
        isFetching = false;
      }
    };

    load();

    refreshTimerRef.current = setInterval(load, REFRESH_INTERVAL);

    return () => {
      isActive = false;
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
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

      setActiveDanmaku((prev) => {
        const appended = [
          ...prev,
          { key, text: danmakuItem.text, color: danmakuItem.color, top, duration },
        ];

        if (appended.length <= MAX_ACTIVE_ITEMS) {
          return appended;
        }

        const overflow = appended.length - MAX_ACTIVE_ITEMS;
        const removedItems = appended.slice(0, overflow);
        removedItems.forEach((item) => {
          const timeoutId = removalTimeoutsRef.current.get(item.key);
          if (timeoutId) {
            clearTimeout(timeoutId);
            removalTimeoutsRef.current.delete(item.key);
          }
        });

        return appended.slice(overflow);
      });

      const removalTimeout = setTimeout(() => {
        if (!isMountedRef.current) return;
        setActiveDanmaku((current) => current.filter((item) => item.key !== key));
        removalTimeoutsRef.current.delete(key);
      }, duration * 1000 + 100);
      removalTimeoutsRef.current.set(key, removalTimeout);
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
