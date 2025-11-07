"use client";

import { motion, AnimatePresence } from "framer-motion";
import teamData from "@/data/team.json";
import Image from "next/image";
import { useState, useRef } from "react";

type DanmakuItem = {
  id: number;
  text: string;
  startX: number;
  startY: number;
};

export default function TeamMembers() {
  const [clickCount, setClickCount] = useState(0);
  const [danmakuList, setDanmakuList] = useState<DanmakuItem[]>([]);
  const danmakuIdRef = useRef(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleCyxClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // 清除之前的重置计时器
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    const newCount = clickCount + 1;
    setClickCount(newCount);

    // 连续点击5次触发彩蛋
    if (newCount === 5) {
      triggerEasterEgg(event);
      setClickCount(0);
    } else {
      // 1秒内没有继续点击则重置计数
      clickTimerRef.current = setTimeout(() => {
        setClickCount(0);
      }, 1000);
    }
  };

  const triggerEasterEgg = (event: React.MouseEvent<HTMLDivElement>) => {
    const messages = [
      "原神，启动！",
      "原神，启动！",
      "原神，启动！",
      "原神，启动！",
      "原神，启动！",
    ];

    // 获取头像的位置（中心点）
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // 生成多个弹幕
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const id = danmakuIdRef.current++;
        const newDanmaku = {
          id,
          text: messages[i],
          startX: centerX,  // 直接使用头像中心，不偏移
          startY: centerY,
        };
        
        setDanmakuList((prev) => [...prev, newDanmaku]);

        // 2秒后移除弹幕
        setTimeout(() => {
          setDanmakuList((current) => current.filter((item) => item.id !== id));
        }, 2000);
      }, i * 150); // 每150ms出现一个
    }
  };

  return (
    <section className="py-12 bg-background relative overflow-hidden">
      {/* 弹幕层 */}
      <AnimatePresence>
        {danmakuList.map((danmaku) => (
          <div
            key={danmaku.id}
            className="fixed pointer-events-none z-50"
            style={{
              left: `${danmaku.startX}px`,
              top: `${danmaku.startY}px`,
            }}
          >
            <motion.div
              initial={{ 
                x: "-50%",
                y: "-50%",
                opacity: 0,
                scale: 0.5
              }}
              animate={{ 
                y: -120,
                opacity: [0, 1, 1, 0],
                scale: [0.5, 1, 1, 0.8]
              }}
              transition={{ 
                duration: 2,
                ease: "easeOut",
                opacity: {
                  times: [0, 0.2, 0.8, 1],
                  duration: 2
                }
              }}
              className="text-sm font-medium text-foreground whitespace-nowrap"
              style={{
                textShadow: "0 1px 3px rgba(0,0,0,0.1)"
              }}
            >
              {danmaku.text}
            </motion.div>
          </div>
        ))}
      </AnimatePresence>

      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-center mb-4 text-foreground"
          >
            团队名录
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center text-sm text-foreground-light mb-8 max-w-2xl mx-auto"
          >
            <br />我们是2025华附返校团队
            <br />我们筹备了今年返校的主要工作
            <br />但其实每次返校活动都是几十位HFers共同努力的结果
            <br />我们衷心向每位为本次活动出力的同学表示感谢
            <br />
            <br />
          </motion.p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {teamData.members.map((member, index) => {
              const isCyx = member.name === "蔡宇翔";
              
              return (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group"
                >
                  {member.image ? (
                    <div
                      onClick={isCyx ? (e) => handleCyxClick(e) : undefined}
                      className={`relative ${isCyx ? "cursor-pointer select-none" : ""}`}
                    >
                      <div className="w-20 h-20 mx-auto mb-4 relative transition-transform duration-300 group-hover:-translate-y-1">
                        <Image
                          src={member.image}
                          alt={member.name + " 头像"}
                          width={80}
                          height={80}
                          className={`w-20 h-20 rounded-full object-cover ${
                            isCyx ? "active:scale-95" : ""
                          }`}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white text-2xl font-bold transition-transform duration-300 group-hover:-translate-y-1">
                      {member.name.charAt(0)}
                    </div>
                  )}
                  <h3 className="text-xl font-semibold text-center mb-1.5 text-foreground transition-colors duration-300 group-hover:text-primary">
                    {member.name}
                  </h3>
                  {member.role && (
                    <p className="text-sm text-center text-foreground/60">{member.role}</p>
                  )}
                </motion.div>
              );
            })}
          </div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="text-center text-sm text-foreground/60 mt-10"
          >
            联系我们：
            <a href="mailto:hf_infodept@163.com" className="text-primary hover:text-primary-dark ml-1">
              hf_infodept@163.com
            </a>
          </motion.p>
        </div>
      </div>
    </section>
  );
}

