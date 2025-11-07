"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(targetTimestamp: number): TimeLeft {
  const now = Date.now();
  const difference = targetTimestamp - now;

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

const FALLBACK_TARGET = new Date("2025-12-30T18:00:00").getTime();

export default function Countdown() {
  const [mounted, setMounted] = useState(false);
  const [target, setTarget] = useState<number>(FALLBACK_TARGET);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const fetchCountdown = async () => {
      try {
        const response = await fetch("/api/countdown", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (typeof data?.target === "string" && !Number.isNaN(Date.parse(data.target))) {
          setTarget(new Date(data.target).getTime());
        }
      } catch (error) {
        // ignore fetch errors
      }
    };
    fetchCountdown();
  }, []);

  useEffect(() => {
    setMounted(true);
    setTimeLeft(calculateTimeLeft(target));
    let timer: NodeJS.Timeout;
    if (mounted) {
      timer = setInterval(() => {
        setTimeLeft(calculateTimeLeft(target));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [mounted, target]);

  const renderTimeUnits = () => {
    const timeUnits = [
      { label: "天", value: mounted ? timeLeft.days : 0 },
      { label: "时", value: mounted ? timeLeft.hours : 0 },
      { label: "分", value: mounted ? timeLeft.minutes : 0 },
      { label: "秒", value: mounted ? timeLeft.seconds : 0 },
    ];
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mt-8">
        {timeUnits.map((unit, index) => (
          <motion.div
            key={unit.label}
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
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
    <div className="relative pt-8 sm:pt-12 md:pt-16 pb-20 sm:pb-28 md:pb-36">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            className="inline-block mb-6"
          >
            <Calendar className="w-12 h-12 text-primary mx-auto" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-4 text-foreground"
          >
            距离华附春晚还有
          </motion.h2>
          {renderTimeUnits()}
        </div>
      </div>
    </div>
  );
}

