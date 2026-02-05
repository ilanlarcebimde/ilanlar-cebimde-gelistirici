"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

const INCLUDED = [
  "Türkçe CV",
  "İngilizce CV",
  "Kişisel Başvuru Mektubu",
  "Profil Fotoğrafı Düzenleme",
  "1 Haftalık İlan Analizi (ÜCRETSİZ)",
];

export function FinalCtaSection({ onCtaClick }: { onCtaClick: () => void }) {
  const scrollToMethods = () => {
    document.getElementById("yontem-secimi")?.scrollIntoView({ behavior: "smooth" });
    onCtaClick();
  };

  return (
    <section className="py-16 sm:py-20 bg-[#f8f9fa]">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <motion.div
          className="rounded-2xl border-2 border-slate-200 bg-white p-8 sm:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Usta Başvuru Paketi
          </p>
          <p className="text-3xl sm:text-4xl font-bold text-slate-900 mb-8">
            549 TL
          </p>
          <ul className="space-y-3 mb-8">
            {INCLUDED.map((item, i) => (
              <li key={item} className="flex items-center gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Check className="h-3 w-3" strokeWidth={2.5} />
                </span>
                <span className="text-slate-800 font-medium">{item}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={scrollToMethods}
            className="w-full rounded-xl bg-slate-900 py-4 text-lg font-semibold text-white shadow-[0_4px_14px_rgba(0,0,0,0.15)] transition-all hover:bg-slate-800 hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)]"
          >
            CV’ni Oluşturmaya Başla
          </button>
        </motion.div>
      </div>
    </section>
  );
}
