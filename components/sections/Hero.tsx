"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import DanmakuOverlay from "@/components/ui/DanmakuOverlay";
import { DanmakuProvider } from "@/components/ui/DanmakuProvider";

export default function Hero() {
  return (
    <DanmakuProvider>
      <div className="relative flex items-center justify-center overflow-hidden pt-12 pb-16 sm:pb-20 md:pb-24">
        <DanmakuOverlay />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Logo 占位符 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <div className="flex justify-center">
                <Image
                  src="/mainlogo.png"
                  alt="HFFX Logo"
                  width={220}
                  height={220}
                  className="w-40 h-40 object-contain"
                  priority
                />
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
                欢迎HFers回家
              </div>
              <div className="mt-4 text-sm md:text-base text-foreground/60 italic select-none">
                华南师大附中返校团队(海外)版权所有
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="fixed bottom-6 right-6 z-30 sm:bottom-8 sm:right-8"
        >
          <Link
            href="/survey/messages"
            className="group relative block rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-white via-white to-primary/5 px-6 py-4 text-right shadow-2xl backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:shadow-primary/20 hover:shadow-[0_20px_50px_-12px] hover:border-primary/60"
          >
            {/* 脉冲动画背景 */}
            <div className="absolute inset-0 rounded-2xl bg-primary/5 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative">
              <div className="flex items-center gap-2 justify-end mb-1">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <div className="text-sm font-bold uppercase tracking-wider text-primary">弹幕征集中</div>
              </div>
              <div className="text-base sm:text-lg font-semibold text-foreground transition-all duration-300 group-hover:text-primary group-hover:scale-105">
                分享你的返校寄语 →
              </div>
            </div>
          </Link>
        </motion.div>

      </div>
    </DanmakuProvider>
  );
}

