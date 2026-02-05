"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

export function StickyCta({ onCtaClick }: { onCtaClick: () => void }) {
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const m = typeof window !== "undefined" && window.innerWidth < 768;
      setIsMobile(m);
      if (m) {
        const scrollY = window.scrollY;
        const heroHeight = typeof document !== "undefined" ? document.getElementById("hero")?.offsetHeight ?? 400 : 400;
        setVisible(scrollY > heroHeight * 0.5);
      } else {
        setVisible(false);
      }
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  if (!isMobile || !visible) return null;

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden p-3 bg-white/95 backdrop-blur border-t border-slate-200 shadow-lg safe-area-pb"
    >
      <button
        type="button"
        onClick={onCtaClick}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 py-4 px-6 text-white font-semibold shadow-soft hover:bg-slate-700 active:scale-[0.98] transition"
      >
        CV Bilgilerini Tamamla → Ödeme Yap
        <ChevronRight className="h-5 w-5" />
      </button>
    </motion.div>
  );
}
