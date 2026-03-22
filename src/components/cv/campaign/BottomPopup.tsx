"use client";

import { X } from "lucide-react";
import { motion } from "framer-motion";
import { useCvCampaign } from "./CvCampaignContext";

const BADGE = "⚡ SINIRLI KONTENJANLI KAMPANYA";
const TOP_LINE = "Bu fırsat sadece bu paket için geçerli";
const HEADLINE = "CV'n hazırlanır, sana özel ilanlar sunulur";
const LINE1 = "Seçtiğin ülke ve mesleğe uygun iş ilanları 1 hafta boyunca sunulur";
const LINE2 = "Tek tıkla CV ve başvuru mektubunu gönderirsin";
const LINE3 = "İşverenle e-posta veya WhatsApp üzerinden direkt iletişime geçersin";
const HIGHLIGHT_INTRO = "Kampanyaya özel:";
const HIGHLIGHT_BODY = "Maaş, konaklama, vize ve iş şartlarını doğrudan iletirsin";
const SUB_LINE = "Aracı yok • Bekleme yok";
const DEADLINE = "Sadece 31.03.2026'ya kadar";
const CTA_LABEL = "Bu Fırsatı Kullan";

export function BottomPopup() {
  const { popupOpen, closePopup, advanceWithAdvantage } = useCvCampaign();

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-[1040] flex justify-center px-3 pb-6 sm:px-4 ${
        popupOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
      aria-live="polite"
    >
      <div
        className={`w-full max-w-[640px] min-w-0 transition-transform duration-300 ease-out ${
          popupOpen ? "translate-y-0" : "translate-y-[calc(100%+32px)]"
        }`}
      >
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xl sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <span className="inline-flex max-w-[85%] flex-wrap items-center rounded-lg bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-red-900 ring-1 ring-red-100 sm:max-w-none sm:text-[11px]">
              {BADGE}
            </span>
            <button
              type="button"
              onClick={closePopup}
              className="-mr-1 -mt-1 flex shrink-0 items-center gap-1 rounded-full p-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
              aria-label="Kapat"
            >
              <X className="h-5 w-5" strokeWidth={2} />
              <span className="hidden sm:inline">Kapat</span>
            </button>
          </div>

          <p className="mt-3 text-xs font-semibold text-red-800/90 sm:text-sm">{TOP_LINE}</p>

          <h2 className="mt-3 text-xl font-bold leading-tight tracking-tight text-slate-900 sm:mt-4 sm:text-2xl sm:leading-snug">
            {HEADLINE}
          </h2>

          <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-slate-700 sm:text-base">
            <p>{LINE1}</p>
            <p>{LINE2}</p>
            <p>{LINE3}</p>
          </div>

          <motion.div
            initial="hidden"
            animate={popupOpen ? "show" : "hidden"}
            variants={{
              hidden: { opacity: 0, y: 6 },
              show: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.35, ease: "easeOut", delay: 0.08 }}
            className="mt-4 rounded-lg bg-amber-50 px-3 py-3 ring-1 ring-amber-100/80"
          >
            <p className="text-sm font-bold text-amber-950 sm:text-[15px]">{HIGHLIGHT_INTRO}</p>
            <p className="mt-1.5 text-sm font-semibold leading-snug text-amber-950 sm:text-[15px]">{HIGHLIGHT_BODY}</p>
          </motion.div>

          <div className="mt-4 space-y-2 text-xs text-slate-600 sm:text-sm">
            <p className="font-semibold text-slate-700">{SUB_LINE}</p>
            <p className="flex flex-wrap items-baseline gap-x-1.5 text-slate-700">
              <span aria-hidden className="text-base leading-none">
                🗓
              </span>
              <span className="font-semibold text-slate-800">{DEADLINE}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={advanceWithAdvantage}
            className="cv-campaign-cta-pulse mt-5 w-full rounded-full bg-gradient-to-r from-sky-600 via-sky-500 to-sky-600 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-sky-500/25 transition hover:scale-[1.05] hover:shadow-xl hover:shadow-sky-500/35 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 active:scale-[0.99] sm:py-4 sm:text-base"
          >
            {CTA_LABEL}
          </button>
        </div>
      </div>
    </div>
  );
}
