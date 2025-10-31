"use client";

import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { useEffect, useState } from "react";

export default function Hero() {
  const [showArrow, setShowArrow] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (typeof window === "undefined") return;
      const threshold = window.innerHeight * 0.4;
      setShowArrow(window.scrollY <= threshold);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo 占位符 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="w-32 h-32 mx-auto bg-primary/20 rounded-full flex items-center justify-center border-4 border-primary/30">
              <span className="text-4xl font-bold text-primary">HFFX</span>
            </div>
          </motion.div>

          {/* 标题区块美化 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex flex-col items-center justify-center"
          >
            <h1 className="text-5xl md:text-7xl font-black leading-tight text-foreground mb-0">
              华附返校2025
            </h1>
            <div className="mt-2 mb-0 text-2xl md:text-4xl font-semibold tracking-wide text-primary">
              欢迎校友回家
            </div>
            <div className="mt-6 text-sm md:text-base text-foreground/60 italic select-none">
              华南师大附中返校团队(海外) 版权所有
            </div>
          </motion.div>
        </div>
      </div>

      {/* 滚动提示 - 手机端fixed居中，桌面absolute */}
      {showArrow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="fixed bottom-4 left-0 right-0 w-full flex justify-center md:absolute md:bottom-8 md:w-auto md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 z-10 pointer-events-none"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ArrowDown className="w-6 h-6 text-foreground-light drop-shadow pointer-events-auto" />
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}

