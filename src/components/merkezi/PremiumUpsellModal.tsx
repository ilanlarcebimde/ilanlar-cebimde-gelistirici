"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface PremiumUpsellModalProps {
  open: boolean;
  onClose: () => void;
  onCta: () => void;
}

const ADVANTAGES = [
  "Hızlı şekilde kendinizi ifade edin",
  "Çalışma deneyiminizi gönderin",
  "Pasaport / vize durumunuzu iletin",
  "Zaman kazanın",
  "Konaklama ve maaş beklentilerinizi iletin",
];

export function PremiumUpsellModal({ open, onClose, onCta }: PremiumUpsellModalProps) {
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState(false);

  const handleCouponSubmit = async () => {
    const code = couponCode.trim();
    if (!code) {
      setCouponError("Kupon kodunu girin.");
      return;
    }
    setCouponError(null);
    setCouponLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setCouponError("Kuponu uygulamak için giriş yapın.");
        setCouponLoading(false);
        return;
      }
      const res = await fetch("/api/premium/apply-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
      if (!res.ok) {
        setCouponError(data?.error ?? "Kupon uygulanamadı.");
        setCouponLoading(false);
        return;
      }
      setCouponSuccess(true);
      if (typeof window !== "undefined") window.dispatchEvent(new Event("premium-subscription-invalidate"));
      setTimeout(() => {
        onClose();
      }, 800);
    } catch {
      setCouponError("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setCouponLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        aria-hidden
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="premium-modal-title"
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 id="premium-modal-title" className="text-xl font-bold text-slate-900">
          Premium ile Hemen Başvur
        </h2>
        <ul className="mt-4 space-y-2 text-slate-700">
          {ADVANTAGES.map((item, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="text-sky-500" aria-hidden>✓</span>
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-900">
          <p className="font-medium">Uyarı</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-amber-800">
            <li>İşe alım için sizden kimse para istemez; para isteyenlere dikkat edin.</li>
            <li>Hiçbir platform iş garantisi vermez.</li>
            <li>Vize/pasaport işlemleri için resmi makamlara başvurun.</li>
          </ul>
        </div>

        {/* Kupon alanı */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
          <p className="text-sm font-medium text-slate-700">Kupon kodunuz var mı?</p>
          <p className="mt-0.5 text-xs text-slate-500">Örn: 99TLDENEME</p>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value);
                setCouponError(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleCouponSubmit()}
              placeholder="Kupon kodu"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
              disabled={couponLoading || couponSuccess}
              aria-label="Kupon kodu"
            />
            <button
              type="button"
              onClick={handleCouponSubmit}
              disabled={couponLoading || couponSuccess}
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 disabled:opacity-50"
            >
              {couponLoading ? "..." : couponSuccess ? "Tamam" : "Kuponu Uygula"}
            </button>
          </div>
          {couponError && <p className="mt-1.5 text-xs text-red-600">{couponError}</p>}
          {couponSuccess && <p className="mt-1.5 text-xs text-emerald-600">Kupon uygulandı. Premium erişiminiz açıldı.</p>}
        </div>

        <p className="mt-4 font-semibold text-slate-900">Haftalık Premium: 99 TL</p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onCta}
            className="flex-1 rounded-xl bg-slate-800 py-3 text-sm font-medium text-white hover:bg-slate-700"
          >
            Premium&apos;u Aç (99 TL/hafta)
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Şimdilik Vazgeç
          </button>
        </div>
      </div>
    </div>
  );
}
