"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

const STORAGE_KEY = "merkezi_conversion_popup_dismissed";
export const MERKEZI_POPUP_COUPON_KEY = "merkezi_popup_coupon";
export const MERKEZI_POPUP_COUPON_CODE = "İYİUSTALAR";
const CTA_HREF = "/#hero";

export function PremiumConversionPopup() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (dismissed === "1") return;
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, [mounted]);

  useEffect(() => {
    if (!visible) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });
    return () => {
      cancelAnimationFrame(t);
      document.body.style.overflow = originalOverflow;
    };
  }, [visible]);

  const handleClose = () => {
    setVisible(false);
    setEntered(false);
    sessionStorage.setItem(STORAGE_KEY, "1");
  };

  const handleCta = () => {
    sessionStorage.setItem(STORAGE_KEY, "1");
    sessionStorage.setItem(MERKEZI_POPUP_COUPON_KEY, MERKEZI_POPUP_COUPON_CODE);
  };

  if (!mounted || !visible) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center pb-0 md:pb-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-title"
    >
      {/* Overlay — hafif koyu, blur yok */}
      <div
        className={`absolute inset-0 bg-black/15 transition-opacity duration-300 md:bg-black/10 ${entered ? "opacity-100" : "opacity-0"}`}
        onClick={handleClose}
        aria-hidden
      />

      {/* Mobil: alttan sheet (y: 80 → 0) • Masaüstü: alt orta panel (y: 48 → 0) */}
      <div
        className={`relative z-[10000] w-full overflow-hidden shadow-2xl transition-all duration-300 ease-out
          max-h-[48vh] rounded-t-3xl border-t border-x border-white/10
          md:max-h-[85vh] md:w-full md:max-w-[580px] md:rounded-2xl md:border md:border-white/10
          ${entered ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 md:translate-y-12 md:opacity-0"}`}
        style={{ backgroundColor: "#0f172a" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobil: üst çizgi */}
        <div className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-slate-500/50 md:hidden" />

        {/* Kapat — belirgin, büyük tıklanabilir alan */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-3 top-3 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/90 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30 md:right-4 md:top-4 md:h-11 md:w-11"
          aria-label="Kapat"
        >
          <svg className="h-7 w-7 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-4 pb-6 pt-5 md:p-6 md:pb-6 md:pt-6">
          {/* Badge */}
          <div
            className="mb-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-900 md:mb-3 md:px-3 md:py-1.5 md:text-xs"
            style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }}
          >
            <span aria-hidden>⭐</span>
            Yurtdışı Başvuru Sistemi
          </div>

          <h2 id="popup-title" className="mb-1.5 text-lg font-bold leading-tight text-white md:mb-2 md:text-xl">
            Yurtdışı Başvurunu Güçlendir
          </h2>
          <p className="mb-3 text-xs leading-snug text-slate-300 md:mb-4 md:text-sm">
            Türkçe CV, İngilizce CV ve kişiselleştirilmiş başvuru mektubu ile profesyonel başvuru altyapınızı hazırlayın.
          </p>

          {/* Fayda satırları */}
          <ul className="mb-3 space-y-1 text-xs text-slate-200 md:mb-4 md:text-sm">
            <li className="flex items-center gap-2">
              <span className="shrink-0 text-emerald-400">✔</span>
              Türkçe CV + İngilizce CV + Başvuru Mektubu
            </li>
            <li className="flex items-center gap-2">
              <span className="shrink-0 text-emerald-400">✔</span>
              Seçtiğiniz ülkeye ve mesleğinize göre güncel iş ilanları araştırması + profil fotoğrafı düzenleme
            </li>
          </ul>

          {/* Kupon */}
          <div className="merkezi-popup-pulse mb-4 rounded-xl border border-amber-500/50 bg-amber-500/10 px-3 py-2.5 md:mb-5 md:px-4 md:py-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-amber-400 md:text-xs">
              Sadece bu sayfaya özel
            </p>
            <p className="mt-0.5 text-center">
              <code className="rounded bg-amber-500/25 px-2 py-0.5 text-sm font-bold text-amber-200 md:text-base">
                İYİUSTALAR
              </code>
            </p>
            <p className="mt-0.5 text-center text-xs font-semibold text-white md:text-sm">129 TL indirim</p>
            <p className="mt-0.5 text-center text-[10px] text-slate-400">Sınırlı sayıda kullanım hakkı</p>
          </div>

          {/* CTA */}
          <Link
            href={CTA_HREF}
            onClick={handleCta}
            className="block w-full rounded-xl py-3.5 text-center text-sm font-bold text-white transition-all hover:shadow-[0_0_16px_rgba(34,197,94,0.45)] md:py-4 md:text-base"
            style={{ backgroundColor: "#22c55e" }}
          >
            Usta Başvuru Paketini Başlat
          </Link>
          <p className="mt-1.5 text-center text-[10px] text-slate-500 md:text-xs">
            PDF teslim • Uluslararası standartlara uygun hazırlık
          </p>

          {/* Açılır detay */}
          <div className="mt-4 border-t border-slate-700/80 pt-3 md:mt-5">
            <button
              type="button"
              onClick={() => setDetailsOpen((o) => !o)}
              className="flex w-full items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-300"
              aria-expanded={detailsOpen}
            >
              Paket detaylarını {detailsOpen ? "gizle" : "göster"}
              <svg
                className={`h-4 w-4 transition-transform ${detailsOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {detailsOpen && (
              <div className="mt-3 space-y-1.5 rounded-lg bg-slate-800/50 px-3 py-2 text-xs text-slate-300">
                <p>• ATS uyumlu CV formatı, İngilizce başvuru altyapısı</p>
                <p>• Kişiselleştirilmiş başvuru mektubu</p>
                <p>• Seçtiğiniz ülkeye ve mesleğinize göre güncel iş ilanları araştırması</p>
                <p>• Gelişmiş profil fotoğrafı düzenleme, ek ücret talep edilmez</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
