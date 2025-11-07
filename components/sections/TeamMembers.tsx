"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import teamData from "@/data/team.json";
import Image from "next/image";

export default function TeamMembers() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-foreground">
            团队名录
          </h2>
          <p className="text-center text-sm text-foreground-light mb-8 max-w-2xl mx-auto">
            <br />我们是2025华附返校团队
            <br />我们筹备了今年返校的主要工作
            <br />但其实每次返校活动都是几十位HFers共同努力的结果
            <br />我们衷心向每位为本次活动出力的同学表示感谢
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamData.members.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 border border-primary/10"
              >
                {member.image ? (
                  <Image
                    src={member.image}
                    alt={member.name + " 头像"}
                    width={80}
                    height={80}
                    className="w-20 h-20 mx-auto mb-4 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {member.name.charAt(0)}
                  </div>
                )}
                <h3 className="text-xl font-semibold text-center mb-2 text-foreground">
                  {member.name}
                </h3>
                {member.role && (
                  <p className="text-sm text-center text-foreground-light">{member.role}</p>
                )}
              </motion.div>
            ))}
          </div>
          <p className="text-center text-sm text-foreground/60 mt-10">
            联系我们：
            <a href="mailto:hf_infodept@163.com" className="text-primary hover:text-primary-dark ml-1">
              hf_infodept@163.com
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}

