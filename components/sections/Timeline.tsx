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
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const circleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const titleRefs = useRef<(HTMLHeadingElement | null)[]>([]);
  const [circleOffsets, setCircleOffsets] = useState<number[]>([]);
  const [lineHeights, setLineHeights] = useState<number[]>([]);

  useEffect(() => {
    const calculatePositions = () => {
      const offsets = timeline.events.map((_, index) => {
        const rowEl = rowRefs.current[index];
        const titleEl = titleRefs.current[index];
        if (!rowEl || !titleEl) return 0;

        // 获取行容器和标题的位置
        const rowRect = rowEl.getBoundingClientRect();
        const titleRect = titleEl.getBoundingClientRect();
        
        // 行顶部 + 32px（圆圈半径）= 圆圈中心的默认位置
        const defaultCircleCenterY = rowRect.top + 32;
        // 标题中心
        const titleCenterY = titleRect.top + titleRect.height / 2;
        
        // 返回需要的偏移量
        return titleCenterY - defaultCircleCenterY;
      });
      setCircleOffsets(offsets);

      // 计算连接线的实际高度
      const heights = timeline.events.map((_, index) => {
        if (index >= timeline.events.length - 1) return 0;
        
        const currentRow = rowRefs.current[index];
        const nextRow = rowRefs.current[index + 1];
        if (!currentRow || !nextRow) return 0;

        const currentRect = currentRow.getBoundingClientRect();
        const nextRect = nextRow.getBoundingClientRect();
        
        // 从当前圆圈底部到下一个圆圈顶部的距离
        // 当前行顶部 + 当前偏移 + 64px（圆圈高度）到下一行顶部 + 下一个偏移
        const currentCircleBottom = 64 + offsets[index];
        const nextCircleTop = (nextRect.top - currentRect.top) + offsets[index + 1];
        
        return nextCircleTop - currentCircleBottom;
      });
      setLineHeights(heights);
    };

    // 多次延迟计算，确保 DOM 完全渲染和动画完成
    const timer1 = setTimeout(calculatePositions, 50);
    const timer2 = setTimeout(calculatePositions, 200);
    const timer3 = setTimeout(calculatePositions, 600);
    window.addEventListener("resize", calculatePositions);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      window.removeEventListener("resize", calculatePositions);
    };
  }, [timeline.events]);

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
            <div className="space-y-6">
              {timeline.events.map((event, index) => (
                <motion.div
                  key={event.id}
                  ref={(el) => {
                    rowRefs.current[index] = el;
                  }}
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
                    {/* 连接线到下一个节点 */}
                    {index < timeline.events.length - 1 && lineHeights[index] !== undefined && (
                      <motion.div
                        initial={{ scaleY: 0, opacity: 0 }}
                        whileInView={{ scaleY: 1, opacity: 1 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.08 }}
                        className="absolute top-16 left-1/2 -translate-x-1/2 w-px bg-primary/25 origin-top"
                        style={{ 
                          height: `${lineHeights[index]}px` 
                        }}
                      />
                    )}
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

