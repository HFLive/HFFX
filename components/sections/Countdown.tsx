"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Calendar } from "lucide-react";

// 目标日期：2025年12月31日
const TARGET_DATE = new Date("2025-12-31T23:59:59").getTime();

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(): TimeLeft {
  const now = Date.now();
  const difference = TARGET_DATE - now;

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((difference % (1000 * 60)) / 1000),
  };
}

export default function Countdown() {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    setMounted(true);
    setTimeLeft(calculateTimeLeft());
    let timer: NodeJS.Timeout;
    if (mounted) {
      timer = setInterval(() => {
        setTimeLeft(calculateTimeLeft());
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [mounted]);

  const renderTimeUnits = () => {
    const timeUnits = [
      { label: "天", value: mounted ? timeLeft.days : 0 },
      { label: "时", value: mounted ? timeLeft.hours : 0 },
      { label: "分", value: mounted ? timeLeft.minutes : 0 },
      { label: "秒", value: mounted ? timeLeft.seconds : 0 }
    ];
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-8">
        {timeUnits.map((unit, index) => (
          <motion.div
            key={unit.label}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
            className="bg-white rounded-2xl p-6 border border-primary/20"
          >
            <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
              {String(unit.value).padStart(2, "0")}
            </div>
            <div className="text-lg text-foreground-light">{unit.label}</div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <section ref={ref} className="py-20 bg-gradient-to-b from-background to-primary/5">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : { scale: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-block mb-6"
          >
            <Calendar className="w-12 h-12 text-primary mx-auto" />
          </motion.div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            距离华附春晚还有
          </h2>
          {renderTimeUnits()}
        </motion.div>
      </div>
    </section>
  );
}

