"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Globe2, ShieldCheck, Languages, ContactRound, Workflow, FileBadge2 } from "lucide-react";

type Feature = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

type Particle = {
  id: string;
  className?: string;
  duration: number;
  delay: number;
  driftPx: number;
  hideOnMobile?: boolean;
};

const FEATURES: Feature[] = [
  {
    title: "Tüm dünyadaki iş ilanlarını tarıyoruz",
    description: "Farklı ülkelerdeki açık pozisyonları düzenli olarak takip ediyor ve uygun ilanları derliyoruz.",
    icon: Globe2,
  },
  {
    title: "Güvenli kaynakları tespit ediyoruz",
    description: "Daha güvenilir kaynakları ayıklıyor, iş arayanlar için daha sağlıklı bir içerik akışı sunuyoruz.",
    icon: ShieldCheck,
  },
  {
    title: "Çeviri ve ilan düzenleme yapıyoruz",
    description: "Yabancı dilde yayımlanan ilanları daha anlaşılır hale getiriyor, temel bilgileri düzenli biçimde sunuyoruz.",
    icon: Languages,
  },
  {
    title: "İşveren iletişim ve başvuru bilgilerini derliyoruz",
    description: "Ulaşılabilen başvuru kanallarını, iletişim detaylarını ve önemli ilan bilgilerini tek yerde topluyoruz.",
    icon: ContactRound,
  },
  {
    title: "Başvuru süreci için yazılım geliştiriyoruz",
    description: "Nasıl başvuracağınızı kolaylaştıran rehberler, başvuru akışları ve destek araçları geliştiriyoruz.",
    icon: Workflow,
  },
  {
    title: "CV ve profesyonel destek altyapısı sunuyoruz",
    description: "CV ve başvuru mektubu sistemleriyle birlikte vize danışmanlık entegrasyonunu da sürece dahil ediyoruz.",
    icon: FileBadge2,
  },
];

const PARTICLES: Particle[] = [
  { id: "p1", duration: 6.6, delay: 0, driftPx: 12 },
  { id: "p2", duration: 7.4, delay: 1.1, driftPx: -10 },
  { id: "p3", duration: 8.1, delay: 2.2, driftPx: 9 },
  { id: "p4", duration: 5.9, delay: 0.6, driftPx: -8, hideOnMobile: true },
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
  const reduceMotion = useReducedMotion();
  const [activeStep, setActiveStep] = useState(0);
  const [anchorPercents, setAnchorPercents] = useState<number[]>([10, 24, 38, 52, 66, 80]);
  const flowRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef<Array<HTMLElement | null>>([]);

  useLayoutEffect(() => {
    const recalcAnchors = () => {
      const flowEl = flowRef.current;
      if (!flowEl) return;
      const flowRect = flowEl.getBoundingClientRect();
      if (!flowRect.height) return;

      const nextAnchors = nodeRefs.current
        .map((node) => {
          if (!node) return null;
          const rect = node.getBoundingClientRect();
          const centerY = rect.top + rect.height / 2 - flowRect.top;
          return (centerY / flowRect.height) * 100;
        })
        .filter((v): v is number => v !== null);

      if (nextAnchors.length === FEATURES.length) {
        setAnchorPercents(nextAnchors);
      }
    };

    recalcAnchors();
    window.addEventListener("resize", recalcAnchors);
    return () => window.removeEventListener("resize", recalcAnchors);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => {
      setActiveStep((prev) => (prev + 1) % anchorPercents.length);
    }, 1125);
    return () => window.clearInterval(timer);
  }, [reduceMotion, anchorPercents.length]);

  const buildParticlePath = (driftPx: number) => {
    const entry = Math.max(4, (anchorPercents[0] ?? 8) - 8);
    const exit = Math.min(96, (anchorPercents[anchorPercents.length - 1] ?? 86) + 8);

    const yFrames: Array<string> = [`${entry}%`];
    const xFrames: number[] = [0];

    anchorPercents.forEach((anchorY) => {
      yFrames.push(`${Math.max(0, anchorY - 1.2)}%`, `${anchorY}%`, `${Math.min(100, anchorY + 1.2)}%`);
      xFrames.push(0, driftPx, 0);
    });

    yFrames.push(`${exit}%`);
    xFrames.push(0);

    return { yFrames, xFrames };
  };

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

            <motion.div
              ref={flowRef}
              className="relative lg:col-span-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-70px" }}
            >
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/65 p-4 shadow-[0_8px_20px_rgba(15,23,42,0.06)] sm:p-6">
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute left-[18px] top-6 bottom-6 w-px bg-gradient-to-b from-[#a8c3ea]/20 via-[#8fb2e6] to-[#a8c3ea]/20" />
                  <div className="absolute left-[18px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-transparent via-[#6fa0df]/35 to-transparent blur-[1px]" />

                  {PARTICLES.map((particle) => {
                    const { yFrames, xFrames } = buildParticlePath(particle.driftPx);
                    return (
                      <motion.span
                        key={particle.id}
                        aria-hidden
                        className={`absolute left-[18px] h-1.5 w-1.5 rounded-full bg-[#3f74c4] shadow-[0_0_0_4px_rgba(63,116,196,0.14)] ${
                          particle.hideOnMobile ? "hidden sm:block" : ""
                        }`}
                        animate={
                          reduceMotion
                            ? undefined
                            : {
                                top: yFrames,
                                x: xFrames,
                                opacity: [0, 1, 1, 0.95, 0.55, 0],
                              }
                        }
                        transition={
                          reduceMotion
                            ? undefined
                            : {
                                duration: particle.duration,
                                repeat: Infinity,
                                ease: "linear",
                                delay: particle.delay,
                              }
                        }
                      />
                    );
                  })}
                </div>

                <div className="relative space-y-4 pl-8 sm:pl-10">
                  {FEATURES.map((feature, index) => {
                    const isActive = index === activeStep;
                    const isLast = index === FEATURES.length - 1;
                    const Icon = feature.icon;
                    return (
                      <motion.article
                        key={feature.title}
                        ref={(el) => {
                          nodeRefs.current[index] = el;
                        }}
                        variants={itemVariants}
                        whileHover={{ y: -2 }}
                        className="group relative"
                      >
                        {!isLast && (
                          <span
                            aria-hidden
                            className="absolute -left-8 top-7 h-[calc(100%+0.5rem)] w-px bg-gradient-to-b from-[#b3ccef]/90 via-[#d6e4f8]/90 to-transparent sm:-left-10"
                          />
                        )}

                        <motion.span
                          aria-hidden
                          className="absolute -left-[36px] top-2.5 h-3 w-3 rounded-full border border-[#8fb2e6] bg-white sm:-left-[44px]"
                          animate={
                            reduceMotion
                              ? undefined
                              : isActive
                                ? { boxShadow: ["0 0 0 0 rgba(63,116,196,0.28)", "0 0 0 8px rgba(63,116,196,0)"] }
                                : {}
                          }
                          transition={{ duration: 0.9, ease: "easeOut" }}
                        />

                        <div
                          className={`rounded-xl border px-3.5 py-3 transition-all sm:px-4 ${
                            isActive
                              ? "border-[#b7cdef] bg-white shadow-[0_10px_20px_rgba(63,116,196,0.10)]"
                              : "border-slate-200/80 bg-white/75"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <motion.span
                              className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                                isActive
                                  ? "border-[#a8c4ea] bg-[#eff5ff] text-[#315f9b]"
                                  : "border-slate-200 bg-white text-[#3666b0]"
                              }`}
                              animate={
                                reduceMotion
                                  ? undefined
                                  : isActive
                                    ? { scale: [1, 1.06, 1], filter: ["brightness(1)", "brightness(1.1)", "brightness(1)"] }
                                    : { scale: 1 }
                              }
                              transition={{ duration: 0.55, ease: "easeInOut" }}
                            >
                              <Icon className="h-4 w-4" />
                            </motion.span>
                            <div>
                              <h3
                                className={`text-sm font-semibold leading-snug sm:text-base ${
                                  isActive ? "text-[#1f3f70]" : "text-slate-900"
                                }`}
                              >
                                {feature.title}
                              </h3>
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
