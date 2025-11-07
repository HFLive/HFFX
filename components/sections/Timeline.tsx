"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import type { TimelineData } from "@/lib/timeline";

type Props = {
  timeline: TimelineData;
};

export default function Timeline({ timeline }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const firstNodeRef = useRef<HTMLDivElement | null>(null);
  const [lineOffset, setLineOffset] = useState<number>(32);
  const circleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const titleRefs = useRef<(HTMLHeadingElement | null)[]>([]);
  const [circleOffsets, setCircleOffsets] = useState<number[]>([]);

  useEffect(() => {
    const updateOffset = () => {
      if (!containerRef.current || !firstNodeRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const nodeRect = firstNodeRef.current.getBoundingClientRect();
      const offset = nodeRect.left - containerRect.left + nodeRect.width / 2;

      setLineOffset(offset);
    };

    const raf = requestAnimationFrame(updateOffset);
    window.addEventListener("resize", updateOffset);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", updateOffset);
    };
  }, [timeline.events, timeline.events.length]);

  useEffect(() => {
    const calculateCircleOffsets = () => {
      const offsets = timeline.events.map((_, index) => {
        const circleEl = circleRefs.current[index];
        const titleEl = titleRefs.current[index];
        if (!circleEl || !titleEl) return 0;

        const circleRect = circleEl.getBoundingClientRect();
        const titleRect = titleEl.getBoundingClientRect();
        const circleCenterY = circleRect.top + circleRect.height / 2;
        const titleCenterY = titleRect.top + titleRect.height / 2;
        return titleCenterY - circleCenterY;
      });
      setCircleOffsets(offsets);
    };

    const raf = requestAnimationFrame(calculateCircleOffsets);
    window.addEventListener("resize", calculateCircleOffsets);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", calculateCircleOffsets);
    };
  }, [timeline.events, timeline.events.length]);

  return (
    <section className="pt-0 pb-20 bg-background">
      <div className="container mx-auto px-4">
        <div ref={containerRef} className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-center mb-4 text-foreground"
          >
            时间线
          </motion.h2>
          {timeline.note && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-center text-sm text-foreground-light mb-8"
            >
              {timeline.note}
            </motion.p>
          )}
          <div className="relative">
            {/* 时间线连接线 */}
            <motion.div
              initial={{ scaleY: 0, opacity: 0 }}
              whileInView={{ scaleY: 1, opacity: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{ left: `${lineOffset}px` }}
              className="absolute top-0 bottom-0 w-px bg-primary/25 origin-top"
            />

            <div className="space-y-6">
              {timeline.events.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="relative flex items-start gap-6 group"
                >
                  {/* 时间线节点 */}
                  <div
                    ref={(el) => {
                      circleRefs.current[index] = el;
                      if (index === 0) {
                        firstNodeRef.current = el;
                      }
                    }}
                    className="relative z-10 flex-shrink-0"
                    style={{ transform: `translateY(${circleOffsets[index] ?? 0}px)` }}
                  >
                    <div className="w-16 h-16 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors flex items-center justify-center">
                      {event.completed ? (
                        <CheckCircle2 className="w-8 h-8 text-primary" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-primary group-hover:scale-110 transition-transform" />
                      )}
                    </div>
                  </div>

                  {/* 内容卡片 */}
                  <div className="flex-1 rounded-lg p-6 bg-white/60 group-hover:bg-white transition-colors">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3
                        ref={(el) => {
                          titleRefs.current[index] = el;
                        }}
                        className="text-xl font-semibold text-foreground"
                      >
                        {event.title}
                      </h3>
                      {event.completed && (
                        <span className="text-xs bg-primary/15 text-primary px-3 py-1 rounded-full font-medium">
                          已完成
                        </span>
                      )}
                    </div>
                    {event.date && (
                      <p className="text-sm text-primary/70 mb-3 font-medium">{event.date}</p>
                    )}
                    {event.description && (
                      <p className="text-foreground/70 leading-relaxed">{event.description}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

