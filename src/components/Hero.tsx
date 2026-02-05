"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

const SERVICES = [
  "Türkçe Profesyonel CV",
  "İngilizce CV (Uluslararası Standart)",
  "Kişiselleştirilmiş İş Başvuru Mektubu",
  "Gelişmiş Profil Fotoğrafı Düzenleme",
  "Seçilen ülke ve meslek için 1 haftalık iş ilanları (ÜCRETSİZ)",
];

const HERO_IMAGES = [
  { src: "/images/hero/hero-1.png", alt: "Kaynak ve metal işleri - sahada çalışan usta" },
  { src: "/images/hero/hero-2.png", alt: "Demir bağlama - inşaat sahasında usta" },
  { src: "/images/hero/hero-3.png", alt: "Bina boyama - ipte çalışan usta" },
  { src: "/images/hero/hero-4.png", alt: "İnşaat ekibi - demir ve şantiye" },
  { src: "/images/hero/hero-5.png", alt: "Elektrik panosu - elektrikçi usta" },
];

const SLIDE_DURATION_MS = 4500;

export function Hero({ onCtaClick }: { onCtaClick: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % HERO_IMAGES.length);
    }, SLIDE_DURATION_MS);
    return () => clearInterval(t);
  }, []);

  const scrollToMethods = () => {
    document.getElementById("yontem-secimi")?.scrollIntoView({ behavior: "smooth" });
    onCtaClick();
  };

  return (
    <section id="hero" className="relative overflow-hidden bg-[#fafbfc] py-14 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <div>
            <motion.h1
              className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] leading-[1.15]"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              Başvuruyu kolaylaştırır.<br />
              Süreci hızlandırır.<br />
              Sonuca yaklaştırır.
            </motion.h1>
            <motion.p
              className="mt-5 text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
            >
              Yurtiçi ve yurtdışı iş başvuruları için profesyonel CV, kişisel başvuru mektubu ve ilan analizi tek pakette.
            </motion.p>

            <div className="mt-8 grid gap-2.5 sm:grid-cols-2">
              {SERVICES.map((label, i) => (
                <motion.div
                  key={label}
                  className="group flex items-center gap-3 rounded-xl border border-slate-200/90 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 hover:border-slate-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.12 + i * 0.04 }}
                  whileHover={{ transition: { duration: 0.2 } }}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Check className="h-3 w-3" strokeWidth={2.5} />
                  </span>
                  <span className="text-sm font-medium text-slate-800">{label}</span>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <motion.button
                type="button"
                onClick={scrollToMethods}
                className="rounded-xl bg-slate-900 px-6 py-3.5 text-base font-semibold text-white shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-all hover:bg-slate-800 hover:shadow-[0_4px_14px_rgba(0,0,0,0.15)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Usta Başvuru Paketini Başlat (549 TL)
              </motion.button>
              <motion.button
                type="button"
                onClick={scrollToMethods}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:border-slate-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
              >
                Nasıl Çalışır?
              </motion.button>
            </div>
          </div>

          <motion.div
            className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Image
                  src={HERO_IMAGES[currentIndex].src}
                  alt={HERO_IMAGES[currentIndex].alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </motion.div>
            </AnimatePresence>
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
              {HERO_IMAGES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentIndex(i)}
                  className="h-1 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-800"
                  style={{
                    width: i === currentIndex ? 20 : 6,
                    backgroundColor: i === currentIndex ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.4)",
                  }}
                  aria-label={`Fotoğraf ${i + 1}`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
