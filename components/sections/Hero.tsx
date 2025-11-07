"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import DanmakuOverlay from "@/components/ui/DanmakuOverlay";
import { DanmakuProvider } from "@/components/ui/DanmakuProvider";

export default function Hero() {
  return (
    <DanmakuProvider>
      <div className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <DanmakuOverlay />
        {/* 背景装饰 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>

        <div className="container mx-auto px-4 pt-12 relative z-10">
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
            className="group block rounded-2xl border border-white/30 bg-white/90 px-4 py-3 text-right shadow-xl backdrop-blur-md transition hover:-translate-y-1 hover:bg-white"
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-primary/80">弹幕征集中</div>
            <div className="mt-1 text-sm font-medium text-foreground transition group-hover:text-primary">
              分享你的返校寄语 →
            </div>
          </Link>
        </motion.div>

      </div>
    </DanmakuProvider>
  );
}

