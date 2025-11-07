"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import type { TimelineData } from "@/lib/timeline";

type Props = {
  timeline: TimelineData;
};

export default function Timeline({ timeline }: Props) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="pt-0 pb-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-foreground">
            时间线
          </h2>
          {timeline.note && (
            <p className="text-center text-sm text-foreground-light mb-8">
              {timeline.note}
            </p>
          )}
          <div className="relative">
            {/* 时间线连接线 */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-primary/20 hidden md:block" />

            <div className="space-y-8">
              {timeline.events.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative flex items-start gap-6"
                >
                  {/* 时间线节点 */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center border-4 border-white">
                      {event.completed ? (
                        <CheckCircle2 className="w-8 h-8 text-primary" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-primary" />
                      )}
                    </div>
                  </div>

                  {/* 内容卡片 */}
                  <div className="flex-1 rounded-xl p-6 border border-primary/10 bg-white">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-foreground">{event.title}</h3>
                      {event.completed && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                          已完成
                        </span>
                      )}
                    </div>
                    {event.date && (
                      <p className="text-sm text-foreground-light mb-2">{event.date}</p>
                    )}
                    {event.description && (
                      <p className="text-foreground-light">{event.description}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

