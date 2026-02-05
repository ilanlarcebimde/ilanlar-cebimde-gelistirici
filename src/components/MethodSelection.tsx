"use client";

import { motion } from "framer-motion";
import { Mic, MessageCircle, FileEdit } from "lucide-react";

const METHODS = [
  {
    id: "voice" as const,
    title: "Sesli Asistan ile",
    desc: "Sesli sorular, sesli yanıt. Metne dönüştürülür, otomatik kaydedilir.",
    icon: Mic,
    buttonLabel: "Sesli Asistan ile Başla",
  },
  {
    id: "chat" as const,
    title: "Sohbet ile",
    desc: "Soru-cevap sohbeti. Öneri chip’leri ve otomatik kayıt.",
    icon: MessageCircle,
    buttonLabel: "Sohbet ile Başla",
  },
  {
    id: "form" as const,
    title: "Form ile",
    desc: "Adım adım form. İlerleme çubuğu, kaydet ve devam et.",
    icon: FileEdit,
    buttonLabel: "Form ile Devam Et",
  },
];

type MethodId = "voice" | "chat" | "form";

export function MethodSelection({
  selectedMethod,
  onSelect,
}: {
  selectedMethod: MethodId | null;
  onSelect: (id: MethodId) => void;
}) {
  return (
    <section id="yontem-secimi" className="py-16 sm:py-20 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.h2
          className="text-2xl font-bold text-slate-900 sm:text-3xl text-center mb-3"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          CV Bilgilerini Nasıl Alacağız?
        </motion.h2>
        <motion.p
          className="text-slate-600 text-center max-w-xl mx-auto mb-12 text-base"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Size en uygun yöntemi seçin. Sayfa değişmeden aynı yerde devam edersiniz.
        </motion.p>

        <div className="grid gap-5 sm:grid-cols-3">
          {METHODS.map((m, i) => {
            const Icon = m.icon;
            const isSelected = selectedMethod === m.id;
            return (
              <motion.button
                key={m.id}
                type="button"
                onClick={() => onSelect(m.id)}
                className="group relative flex flex-col items-center rounded-2xl border-2 bg-white p-6 sm:p-8 text-center shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all duration-200 hover:border-slate-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                style={{
                  borderColor: isSelected ? "#0f172a" : undefined,
                  boxShadow: isSelected ? "0 8px 24px rgba(0,0,0,0.08)" : undefined,
                }}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600 group-hover:bg-slate-200 transition-colors">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{m.title}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-snug">{m.desc}</p>
                <span className="mt-6 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors group-hover:bg-slate-800">
                  {m.buttonLabel}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
