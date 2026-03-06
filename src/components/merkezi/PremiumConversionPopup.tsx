"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "merkezi_conversion_popup_dismissed";
/** Ödeme sayfasında kupon alanını doldurmak için (İYİUSTALAR). */
export const MERKEZI_POPUP_COUPON_KEY = "merkezi_popup_coupon";
export const MERKEZI_POPUP_COUPON_CODE = "İYİUSTALAR";

/** Ana sayfa hero; kullanıcı buradan başlayıp wizard ile ödemeye gelir, kupon ödeme adımında tanımlı olur. */
const CTA_HREF = "/#hero";

export function PremiumConversionPopup() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

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

  const handleClose = () => {
    setVisible(false);
    sessionStorage.setItem(STORAGE_KEY, "1");
  };

  const handleCta = () => {
    sessionStorage.setItem(STORAGE_KEY, "1");
    sessionStorage.setItem(MERKEZI_POPUP_COUPON_KEY, MERKEZI_POPUP_COUPON_CODE);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden
      />

      {/* Popup card - fade + scale */}
      <div
        className="merkezi-popup-in relative w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl"
        style={{ backgroundColor: "#111827" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-slate-400 hover:bg-slate-700/50 hover:text-white transition-colors"
          aria-label="Kapat"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 sm:p-8">
          {/* Premium badge */}
          <div
            className="mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-900"
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
            }}
          >
            <span aria-hidden>⭐</span>
            YURTDIŞI BAŞVURU SİSTEMİ
          </div>

          <h2 id="popup-title" className="mb-2 text-xl font-bold text-white sm:text-2xl">
            🌍 Yurtdışı İş Başvurunuzu Profesyonel Hale Getirin
          </h2>
          <p className="mb-5 text-sm leading-relaxed text-slate-300">
            Uluslararası standartlarda hazırlanmış CV ve başvuru altyapısı ile yurtdışı iş başvurularınızda
            güçlü bir ilk izlenim bırakın.
          </p>

          {/* Paket özeti */}
          <div className="mb-5 space-y-3 rounded-xl border border-slate-600/50 bg-slate-800/30 p-4">
            <div className="flex items-start gap-2 text-sm text-slate-200">
              <span className="mt-0.5 shrink-0 text-amber-400">✔</span>
              <span>Türkçe CV · İngilizce CV · Başvuru Mektubu</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-slate-200">
              <span className="mt-0.5 shrink-0 text-amber-400">✔</span>
              <span>1 Haftalık İş İlanı Araştırması · Profil Fotoğrafı Düzenleme</span>
            </div>
          </div>

          {/* Kupon alanı - pulse */}
          <div className="merkezi-popup-pulse mb-6 rounded-xl border-2 border-amber-500/60 bg-amber-500/10 p-4">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-amber-400">
              🎟 Sınırlı Kupon Fırsatı — Sadece bu sayfaya özel
            </p>
            <p className="mb-2 text-center">
              <code className="rounded bg-amber-500/30 px-2 py-1 text-lg font-bold text-amber-200">
                İYİUSTALAR
              </code>
            </p>
            <p className="text-center text-sm font-semibold text-white">129 TL İNDİRİM</p>
            <p className="mt-1 text-center text-xs text-slate-400">Kuponlar sınırlı sayıda kullanıcı için geçerlidir.</p>
          </div>

          {/* CTA */}
          <Link
            href={CTA_HREF}
            onClick={handleCta}
            className="block w-full rounded-xl py-4 text-center text-base font-bold text-white transition-all hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]"
            style={{ backgroundColor: "#22c55e" }}
          >
            🚀 Usta Başvuru Paketini Başlat
          </Link>
          <p className="mt-2 text-center text-xs text-slate-400">
            Profesyonel başvuru altyapınızı hemen oluşturun
          </p>

          {/* Güven */}
          <p className="mt-4 text-center text-xs leading-relaxed text-slate-500">
            Başvuru belgeleri uluslararası standartlara uygun formatta hazırlanır ve sistem üzerinden PDF olarak
            teslim edilir.
          </p>
        </div>
      </div>
    </div>
  );
}
