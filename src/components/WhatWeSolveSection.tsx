"use client";

import { motion } from "framer-motion";
import { X, Check } from "lucide-react";

const CARDS = [
  {
    problem: "CV hazırlayamıyorum",
    solution: "Biz senin adına profesyonel hale getiriyoruz",
  },
  {
    problem: "İngilizce bilmiyorum",
    solution: "İngilizce CV ve başvuru mektubunu biz yazıyoruz",
  },
  {
    problem: "Nereye başvuracağımı bilmiyorum",
    solution: "Ülke ve mesleğine göre ilanları biz tarıyoruz",
  },
];

export function WhatWeSolveSection() {
  return (
    <section className="py-10 sm:py-20 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.h2
          className="text-2xl font-bold text-slate-900 sm:text-3xl text-center mb-3"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Ne çözüyoruz?
        </motion.h2>
        <motion.p
          className="text-slate-600 text-center max-w-xl mx-auto mb-12 text-base"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Sık karşılaşılan engeller ve bizim çözümümüz.
        </motion.p>

        <div className="grid gap-6 sm:grid-cols-3">
          {CARDS.map((card, i) => (
            <motion.div
              key={card.problem}
              className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_6px_20px_rgba(0,0,0,0.07)] hover:border-slate-200"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -2 }}
            >
              <div className="flex items-start gap-3 mb-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <X className="h-4 w-4" strokeWidth={2.5} />
                </span>
                <p className="text-slate-700 font-medium">{card.problem}</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                </span>
                <p className="text-slate-800 font-semibold">{card.solution}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
