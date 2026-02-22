"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { X } from "lucide-react";

const BULLETS = [
  "Adım adım başvuru rehberi",
  "Gerekli belgeler listesi",
  "Çalışma izni ve vize süreci",
  "Net maaş ve yaşam gider hesabı",
  "Risk değerlendirmesi",
  "Sana özel uygunluk analizi",
  "30 günlük başvuru planı",
];

export function PremiumIntroModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] sm:max-w-[600px] rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 min-h-0">
          <div className="flex justify-between items-start gap-3 mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
              Yurtdışına Gitmeden Önce Bilmen Gereken Her Şey
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 p-2 text-slate-500 hover:bg-slate-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Kapat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="text-base font-semibold text-brand-600 mb-4">Aylık sadece 89 TL</p>

          <ul className="space-y-2 mb-4">
            {BULLETS.map((label, i) => (
              <li key={i} className="flex items-start gap-2 text-sm sm:text-[15px] text-slate-700">
                <span className="text-green-600 shrink-0 mt-0.5" aria-hidden>✔</span>
                <span>{label}</span>
              </li>
            ))}
          </ul>

          <p className="text-sm text-slate-500">Günlük 3 TL'den az bir ücretle süreci öğrenin.</p>
        </div>

        <div className="p-5 sm:p-6 pt-0 flex flex-col sm:flex-row gap-3 border-t border-slate-100">
          <Link
            href="/odeme"
            className="flex min-h-[44px] items-center justify-center rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Premium'a Geç – 89 TL
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] items-center justify-center rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Kapat
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
