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
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await fetch("/api/danmaku", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as DanmakuRecord[];
        if (mounted) setDanmaku(data);
      } catch (error) {
        // ignore
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const pool = useMemo(() => danmaku.filter((item) => item.text?.trim()), [danmaku]);

  useEffect(() => {
    setActiveDanmaku([]);
    indexRef.current = 0;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (pool.length === 0) return;

    const spawnDanmaku = () => {
      if (pool.length === 0) return;
      const danmakuItem = pool[indexRef.current % pool.length];
      indexRef.current += 1;
      const track = Math.floor(Math.random() * TRACK_COUNT);
      const duration = 28 + Math.random() * 9;
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

    for (let i = 0; i < Math.min(pool.length, TRACK_COUNT); i += 1) {
      spawnDanmaku();
    }

    timerRef.current = setInterval(spawnDanmaku, 3200);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      timerRef.current = null;
    };
  }, [pool]);

  const value = useMemo(() => ({ danmaku, activeDanmaku }), [danmaku, activeDanmaku]);

  return <DanmakuContext.Provider value={value}>{children}</DanmakuContext.Provider>;
}

export function useDanmaku() {
  return useContext(DanmakuContext);
}
