"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useMemo } from "react";
import type { SurveyRecord } from "@/lib/survey";

type Props = {
  surveys: SurveyRecord[];
};

export default function SurveyEmbed({ surveys }: Props) {
  const list = useMemo(() => surveys ?? [], [surveys]);

  if (!Array.isArray(list) || list.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden border border-primary/10 p-12 text-center"
      >
        <div className="text-foreground-light mb-2 text-xl">暂无问卷，敬请期待</div>
      </motion.div>
    );
  }
  return (
    <div className="grid gap-8 md:grid-cols-2">
      {list.map((survey, index) => (
        <motion.div
          key={survey.slug}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden border border-primary/10 flex flex-col"
        >
          <div className="p-6 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2 text-foreground">{survey.title}</h3>
              <p className="text-foreground-light mb-6">{survey.description}</p>
            </div>
            <div className="flex gap-4 mt-auto">
              <Link
                href={`/survey/${survey.slug}`}
                className="flex-1 inline-flex justify-center items-center gap-2 bg-primary hover:bg-primary-dark transition text-white py-2 px-4 rounded-lg font-semibold"
              >
                填写
              </Link>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

