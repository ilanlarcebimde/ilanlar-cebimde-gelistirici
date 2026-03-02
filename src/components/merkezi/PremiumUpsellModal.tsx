"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const DEFAULT_BULLETS = [
  "Firma İletişim Bilgileri",
  "Doğrudan E-posta / Başvuru Kanalı",
  "Konaklama ve Maaş Detayları",
  "Pasaport / Vize Gereksinimi Bilgisi",
  "Kendi Bilgilerinize Göre İngilizce İş Başvuru Mektubu Oluşturma Aracı",
  "Öncelikli Destek",
];

const DEFAULT_INFO_TEXT =
  "Bu iş ilanları, işverenler tarafından adayların iletişim bilgileri üzerinden doğrudan başvuru alabilmesi amacıyla yayınlanmaktadır. Premium üyelik ile firma iletişim bilgilerine erişebilir ve başvurunuzu doğrudan iletebilirsiniz.";

const DEFAULT_TRUST_BULLETS = [
  "İşe alım için sizden kimse para istemez.",
  "Hiçbir platform iş garantisi vermez.",
  "Vize ve pasaport işlemleri için resmi kurumlara başvurunuz.",
];

interface PremiumUpsellModalProps {
  open: boolean;
  onClose: () => void;
  onCta: () => void;
  title?: string;
  subtitle?: string;
  bullets?: string[];
  infoText?: string;
  trustBullets?: string[];
  priceLabel?: string;
  priceText?: string;
  ctaText?: string;
  secondaryText?: string;
  fomoText?: string;
  showFomoLine?: boolean;
  fomoLineText?: string;
}

export function PremiumUpsellModal({
  open,
  onClose,
  onCta,
  title = "Premium ile Başvurunu Güçlendir",
  subtitle = "Firma iletişim bilgilerine eriş ve kendi bilgilerine göre hazırlanmış İngilizce iş başvuru mektubu ile öne çık.",
  bullets = DEFAULT_BULLETS,
  infoText = DEFAULT_INFO_TEXT,
  trustBullets = DEFAULT_TRUST_BULLETS,
  priceLabel = "Haftalık Premium",
  priceText = "99 TL/Hafta",
  ctaText = "Premium'u Aç",
  secondaryText = "Şimdilik Vazgeç",
  fomoText: fomoTextProp,
  showFomoLine = true,
  fomoLineText = "Bu ilana bugün birçok kişi başvurdu. Öne çıkmak ister misiniz?",
}: PremiumUpsellModalProps) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const titleId = useMemo(() => `premium-popup-title-${Math.random().toString(36).slice(2)}`, []);

  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState(false);

  const fomoContent = fomoTextProp ?? (showFomoLine ? fomoLineText : undefined);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);

    const t = setTimeout(() => {
      const firstBtn = panelRef.current?.querySelector<HTMLElement>("button[data-autofocus='true']");
      firstBtn?.focus();
    }, 0);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
      clearTimeout(t);
    };
  }, [open, onClose]);

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
        setCouponLoading(false);
        onClose();
        const current = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
        router.push("/giris?next=" + encodeURIComponent(current));
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
      setTimeout(() => onClose(), 800);
    } catch {
      setCouponError("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setCouponLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label="Kapat"
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px] animate-premium-backdrop cursor-default"
      />

      <div className="relative mx-auto flex min-h-dvh items-start justify-center px-3 pb-[max(16px,env(safe-area-inset-bottom))] pt-[max(72px,env(safe-area-inset-top))] sm:pt-20 md:pt-24">
        <div
          ref={panelRef}
          className="w-full max-w-[640px] animate-premium-panel rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
        >
          <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
            <div className="min-w-0">
              <h2 id={titleId} className="text-[18px] font-semibold leading-6 text-slate-900 sm:text-xl">
                {title}
              </h2>
              <p className="mt-1 text-sm leading-5 text-slate-600">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 active:scale-95"
              aria-label="Kapat"
              title="Kapat"
            >
              ✕
            </button>
          </div>

          <div className="max-h-[calc(100dvh-160px)] overflow-y-auto px-5 pb-5 pt-4 sm:max-h-[calc(100dvh-190px)] sm:px-6 sm:pb-6">
            <div className="animate-premium-item premium-delay-1 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white">
              <span className="font-semibold">Kilidi aç:</span> Firma iletişim bilgileri + İngilizce iş başvuru
              mektubu aracı
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-900">Kilit açılacaklar</p>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 ring-1 ring-slate-200">
                  Premium
                </span>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {bullets.map((item, idx) => (
                  <li
                    key={`${item}-${idx}`}
                    className="flex gap-2 animate-premium-stagger"
                    style={{ animationDelay: `${140 + idx * 40}ms` }}
                  >
                    <span className="mt-[2px] inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] text-white">
                      ✓
                    </span>
                    <span className="leading-5">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 animate-premium-item premium-delay-2 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Not</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{infoText}</p>
            </div>

            <div className="mt-4 animate-premium-item premium-delay-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
              <p className="text-sm font-semibold text-amber-900">Güven Hatırlatması</p>
              <ul className="mt-2 space-y-1 text-sm leading-6 text-amber-900/90">
                {trustBullets.map((t, i) => (
                  <li key={`${t}-${i}`}>• {t}</li>
                ))}
              </ul>
            </div>

            <div className="mt-4 animate-premium-item premium-delay-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3 sm:p-4">
              <p className="text-sm font-medium text-slate-700">Kupon kodunuz var mı?</p>
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
              {couponSuccess && (
                <p className="mt-1.5 text-xs text-emerald-600">Kupon uygulandı. Premium erişiminiz açıldı.</p>
              )}
            </div>

            {fomoContent ? (
              <div className="mt-4 animate-premium-item premium-delay-4 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white">
                {fomoContent}
              </div>
            ) : null}

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr,auto] sm:items-stretch">
              <div className="animate-premium-item premium-delay-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{priceLabel}</p>
                <p className="mt-1 text-lg font-semibold text-slate-900 animate-premium-price">{priceText}</p>
                <p className="mt-1 text-xs text-slate-600">Tüm özellikler tek paket içinde açılır.</p>
              </div>
              <div className="flex gap-2 sm:flex-col">
                <button
                  type="button"
                  data-autofocus="true"
                  onClick={onCta}
                  className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:translate-y-[-1px] hover:shadow-md active:translate-y-0 active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-slate-300"
                >
                  {ctaText}
                  <span className="ml-2 text-white/80">({priceText})</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-slate-200"
                >
                  {secondaryText}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes premiumBackdropIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            .animate-premium-backdrop { animation: premiumBackdropIn 180ms ease-out both; }
            @keyframes premiumPanelIn {
              from { opacity: 0; transform: translateY(14px) scale(0.985); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
            .animate-premium-panel { animation: premiumPanelIn 220ms ease-out both; }
            @keyframes premiumItemIn {
              from { opacity: 0; transform: translateY(8px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-premium-item { animation: premiumItemIn 240ms ease-out both; }
            .premium-delay-1 { animation-delay: 60ms; }
            .premium-delay-2 { animation-delay: 110ms; }
            .premium-delay-3 { animation-delay: 160ms; }
            .premium-delay-4 { animation-delay: 210ms; }
            @keyframes premiumStaggerIn {
              from { opacity: 0; transform: translateY(6px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-premium-stagger { animation: premiumStaggerIn 220ms ease-out both; }
            @keyframes premiumPricePulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.012); }
            }
            .animate-premium-price { animation: premiumPricePulse 900ms ease-in-out 1; }
          `,
        }}
      />
    </div>
  );
}
