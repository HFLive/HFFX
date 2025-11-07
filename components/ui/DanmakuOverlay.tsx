"use client";

import { useDanmaku } from "@/components/ui/DanmakuProvider";
import { useEffect, useMemo, useRef, useState } from "react";
import { animate, motion, useMotionValue } from "framer-motion";

export default function DanmakuOverlay() {
  const { activeDanmaku } = useDanmaku();
  const EDGE_OPACITY = 0.5;

  const [viewportWidth, setViewportWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => {
      if (typeof window !== "undefined") {
        setViewportWidth(window.innerWidth);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const lines = useMemo(() => activeDanmaku.slice(0, 20), [activeDanmaku]);

  if (lines.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {lines.map((item) => (
        <DanmakuItem
          key={item.key}
          item={item}
          viewportWidth={viewportWidth}
          edgeOpacity={EDGE_OPACITY}
        />
      ))}
    </div>
  );
}

type DanmakuItemData = {
  key: string;
  text: string;
  color?: string | null;
  top: number;
  duration: number;
};

const ZERO_ZONE_RATIO = 0.24;
const ZERO_ZONE_MIN = 240;
const FADE_EDGE_RATIO = 0.08;
const FADE_EDGE_MIN = 80;

function clamp01(value: number) {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function calculateOpacity(
  position: number,
  viewportWidth: number,
  contentWidth: number,
  edgeOpacity: number,
) {
  if (!viewportWidth || !contentWidth) {
    return edgeOpacity;
  }

  const zeroHalfWidth = Math.max((viewportWidth * ZERO_ZONE_RATIO) / 2, ZERO_ZONE_MIN / 2);
  const fadeWidth = Math.max(viewportWidth * FADE_EDGE_RATIO, FADE_EDGE_MIN);
  const centerLeft = viewportWidth / 2 - contentWidth / 2;

  const fadeInStart = centerLeft - zeroHalfWidth;
  const fadeInEnd = centerLeft + zeroHalfWidth;
  const fadeOutStart = fadeInStart - fadeWidth;
  const fadeOutEnd = fadeInEnd + fadeWidth;

  if (position <= fadeOutStart || position >= fadeOutEnd) {
    return edgeOpacity;
  }

  if (position >= fadeInStart && position <= fadeInEnd) {
    return 0;
  }

  if (position < fadeInStart) {
    const span = fadeInStart - fadeOutStart;
    if (span <= 0) return 0;
    const progress = (position - fadeOutStart) / span;
    return edgeOpacity * (1 - clamp01(progress));
  }

  const span = fadeOutEnd - fadeInEnd;
  if (span <= 0) return 0;
  const progress = (fadeOutEnd - position) / span;
  return edgeOpacity * (1 - clamp01(progress));
}

function DanmakuItem({
  item,
  viewportWidth,
  edgeOpacity,
}: {
  item: DanmakuItemData;
  viewportWidth: number;
  edgeOpacity: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const opacity = useMotionValue(edgeOpacity);
  const [contentWidth, setContentWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measure = () => {
      setContentWidth(element.offsetWidth);
    };

    measure();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(measure);
      observer.observe(element);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [item.text]);

  useEffect(() => {
    const unsubscribe = x.on("change", (value) => {
      opacity.set(calculateOpacity(value, viewportWidth, contentWidth, edgeOpacity));
    });

    return () => {
      unsubscribe();
    };
  }, [x, opacity, viewportWidth, contentWidth, edgeOpacity]);

  useEffect(() => {
    if (!viewportWidth || !contentWidth) {
      return;
    }

    const startX = viewportWidth + contentWidth * 1.2;
    const endX = -contentWidth * 1.4;

    x.stop();
    x.set(startX);
    opacity.set(edgeOpacity);

    const controls = animate(x, endX, {
      duration: item.duration,
      ease: "linear",
    });

    return () => {
      controls.stop();
    };
  }, [viewportWidth, contentWidth, item.duration, edgeOpacity, x, opacity]);

  return (
    <motion.div
      ref={ref}
      className="absolute flex items-center gap-2 px-2 py-0.5 text-sm font-semibold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]"
      style={{
        top: `${item.top}%`,
        color: item.color ?? undefined,
        textShadow: item.color ? undefined : "0 2px 8px rgba(0,0,0,0.35)",
        whiteSpace: "nowrap",
        x,
        opacity,
      }}
    >
      <span className="text-xs opacity-80">❤</span>
      <span>{item.text}</span>
    </motion.div>
  );
}

