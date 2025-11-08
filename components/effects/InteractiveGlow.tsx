"use client";

import { useEffect, useRef } from "react";

const INITIAL_POSITION = { x: 50, y: 35 };
const EASING = 0.12;

export default function InteractiveGlow() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef<{ x: number; y: number }>(INITIAL_POSITION);
  const currentRef = useRef<{ x: number; y: number }>(INITIAL_POSITION);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    element.style.setProperty("--glow-x", `${INITIAL_POSITION.x}%`);
    element.style.setProperty("--glow-y", `${INITIAL_POSITION.y}%`);

    const updateGlow = () => {
      const { x: cx, y: cy } = currentRef.current;
      const { x: tx, y: ty } = targetRef.current;

      const nextX = cx + (tx - cx) * EASING;
      const nextY = cy + (ty - cy) * EASING;

      currentRef.current = { x: nextX, y: nextY };

      element.style.setProperty("--glow-x", `${nextX}%`);
      element.style.setProperty("--glow-y", `${nextY}%`);

      rafRef.current = window.requestAnimationFrame(updateGlow);
    };

    rafRef.current = window.requestAnimationFrame(updateGlow);

    const handlePointerMove = (event: PointerEvent) => {
      const { innerWidth, innerHeight } = window;
      if (!innerWidth || !innerHeight) return;

      const x = (event.clientX / innerWidth) * 100;
      const y = (event.clientY / innerHeight) * 100;

      targetRef.current = {
        x: Math.min(Math.max(x, 0), 100),
        y: Math.min(Math.max(y, 0), 100),
      };
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none">
      <div
        className="absolute inset-[-30%] opacity-70 transition-[opacity] duration-500"
        style={{
          background:
            "radial-gradient(circle at var(--glow-x, 50%) var(--glow-y, 40%), rgba(41,149,127,0.28) 0%, rgba(41,149,127,0.16) 25%, rgba(30,58,138,0.12) 55%, transparent 70%)",
          filter: "blur(140px)",
        }}
      />
      <div
        className="absolute inset-[-20%] opacity-60 transition-[opacity] duration-500"
        style={{
          background:
            "radial-gradient(circle at var(--glow-x, 50%) var(--glow-y, 40%), rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.12) 15%, transparent 40%)",
          filter: "blur(80px)",
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}
