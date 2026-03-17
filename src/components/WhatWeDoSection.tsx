"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Globe2, ShieldCheck, Languages, ContactRound, Workflow, FileBadge2 } from "lucide-react";

type Feature = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const FEATURES: Feature[] = [
  {
    title: "Dünyadaki iş ilanlarını senin için buluyoruz",
    description: "Farklı ülkelerdeki uygun pozisyonları düzenli olarak takip ediyoruz.",
    icon: Globe2,
  },
  {
    title: "Güvenilir olanları seçiyoruz",
    description: "Daha güvenilir kaynakları ayıklayıp öncelikli içerik akışı oluşturuyoruz.",
    icon: ShieldCheck,
  },
  {
    title: "İlanları anlaşılır hale getiriyoruz",
    description: "Yabancı dildeki ilanları sadeleştirip temel bilgileri düzenli şekilde sunuyoruz.",
    icon: Languages,
  },
  {
    title: "İşveren iletişim bilgilerini hazırlıyoruz",
    description: "Başvuru kanallarını, iletişim detaylarını ve kritik bilgileri tek yerde topluyoruz.",
    icon: ContactRound,
  },
  {
    title: "Nasıl başvuracağını gösteriyoruz",
    description: "Adım adım başvuru yönlendirmeleri ve rehber akışlar sunuyoruz.",
    icon: Workflow,
  },
  {
    title: "Başvuru ve CV'ni hazırlıyoruz",
    description: "CV ve başvuru mektubu süreçlerini destekleyip profesyonel hazırlık sunuyoruz.",
    icon: FileBadge2,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export function WhatWeDoSection() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveStep((prev) => (prev + 1) % FEATURES.length);
    }, 2000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="relative overflow-hidden bg-slate-50/60 py-12 sm:py-16" aria-labelledby="what-we-do-title">
      <div className="pointer-events-none absolute -left-20 top-10 h-56 w-56 rounded-full bg-sky-100/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-8 h-56 w-56 rounded-full bg-blue-100/50 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/70 to-[#f2f7ff] p-5 shadow-[0_14px_34px_rgba(15,23,42,0.08)] sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
            <motion.div
              className="lg:col-span-4"
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, ease: "easeOut" }}
            >
              <span className="inline-flex rounded-full border border-[#cfe0fb] bg-white px-3 py-1 text-xs font-semibold tracking-wide text-[#355f9a] shadow-sm">
                Aktif Sistemimiz
              </span>
              <h2 id="what-we-do-title" className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Biz neler yapıyoruz?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                Yurtdışı iş arayanlar için ilanları sadece listelemiyoruz; araştırıyor, doğruluyor, düzenliyor ve başvuru sürecini kolaylaştıran yazılımlar geliştiriyoruz.
              </p>
              <p className="mt-4 text-sm font-medium text-slate-700">Sürekli çalışan içerik ve başvuru altyapımız</p>
            </motion.div>

            <motion.div className="relative lg:col-span-8" variants={containerVariants} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-70px" }}>
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/65 p-4 shadow-[0_8px_20px_rgba(15,23,42,0.06)] sm:p-6">
                <div className="pointer-events-none absolute left-[18px] top-6 bottom-6 w-px bg-gradient-to-b from-slate-200 via-slate-300/90 to-slate-200" />

                <div className="relative space-y-4 pl-14 sm:pl-16">
                  {FEATURES.map((feature, index) => {
                    const isActive = index === activeStep;
                    const isLast = index === FEATURES.length - 1;
                    const Icon = feature.icon;
                    return (
                      <motion.article
                        key={feature.title}
                        variants={itemVariants}
                        whileHover={{ y: -2 }}
                        className="group relative"
                        onMouseEnter={() => setActiveStep(index)}
                      >
                        {!isLast && (
                          <span
                            aria-hidden
                            className="absolute -left-[34px] top-7 h-[calc(100%+0.5rem)] w-px bg-gradient-to-b from-slate-300/90 via-slate-200/95 to-transparent sm:-left-[42px]"
                          />
                        )}

                        <motion.span
                          aria-hidden
                          className="absolute -left-[38px] top-2.5 h-2.5 w-2.5 rounded-full border border-slate-300 bg-white sm:-left-[46px]"
                          style={isActive ? { boxShadow: "0 0 0 5px rgba(148,163,184,0.18)" } : undefined}
                        />

                        <div
                          className={`relative overflow-hidden rounded-xl border px-3.5 py-3 transition-all sm:px-4 ${
                            isActive
                              ? "border-[#a9c5eb] bg-[#f7fbff] shadow-[0_10px_22px_rgba(63,116,196,0.12)]"
                              : "border-slate-200/80 bg-white/60"
                          }`}
                        >
                          {isActive && (
                            <motion.span
                              aria-hidden
                              className="pointer-events-none absolute inset-y-0 -left-1 w-14 bg-gradient-to-r from-transparent via-white/70 to-transparent"
                              initial={{ x: -54, opacity: 0 }}
                              animate={{ x: 260, opacity: [0, 0.5, 0] }}
                              transition={{ duration: 0.7, ease: "easeOut" }}
                            />
                          )}
                          <div className="flex items-start gap-3">
                            <motion.span
                              className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                                isActive
                                  ? "border-[#9ebce6] bg-[#eef5ff] text-[#2d5a98]"
                                  : "border-slate-200 bg-white text-[#3666b0]"
                              }`}
                              style={isActive ? { boxShadow: "0 0 0 4px rgba(168,196,234,0.24)" } : undefined}
                            >
                              <Icon className="h-4 w-4" />
                            </motion.span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h3
                                  className={`text-sm font-semibold leading-snug sm:text-base ${
                                    isActive ? "text-[#1f3f70]" : "text-slate-900"
                                  }`}
                                >
                                  {feature.title}
                                </h3>
                              </div>
                              <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-sm">{feature.description}</p>
                            </div>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>

              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
