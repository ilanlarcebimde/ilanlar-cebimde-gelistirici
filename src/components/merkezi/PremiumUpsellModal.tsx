"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const DEFAULT_FEATURES = [
  "Firma İletişim Bilgileri",
  "Doğrudan E-posta / WhatsApp Başvuru Kanalı",
  "Konaklama ve Maaş Taleplerinizi Mektup Aracılığıyla İletin",
  "Pasaport / Vize Gereksinimi Taleplerinizi İletin",
  "Kendi Bilgilerinize Göre İngilizce İş Başvuru Mektubu Oluşturma Aracı",
];

const DEFAULT_INFO_TEXT =
  "Bu iş ilanları, işverenler tarafından adayların iletişim bilgileri üzerinden doğrudan başvuru alabilmesi amacıyla yayınlanmaktadır. Premium üyelik ile firma iletişim bilgilerine erişebilir ve başvurunuzu doğrudan iletebilirsiniz.";

const DEFAULT_TRUST = [
  "İşe alım için sizden kimse para istemez.",
  "Hiçbir platform iş garantisi vermez.",
  "Vize ve pasaport işlemleri için resmi kurumlara başvurunuz.",
];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(!!mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

interface PremiumUpsellModalProps {
  open: boolean;
  onClose: () => void;
  onCta: () => void;
  /** Kupon başarıyla uygulanınca parent'ın bloke olan aksiyonu otomatik devam ettirmesi için. */
  onPremiumApplied?: () => void;
  title?: string;
  subtitle?: string;
  priceText?: string;
  fomoText?: string;
}

export function PremiumUpsellModal({
  open,
  onClose,
  onCta,
  onPremiumApplied,
  title = "Premium ile Başvurunu Güçlendir",
  subtitle = "Firma iletişim bilgilerine eriş ve kendi bilgilerine göre hazırlanmış İngilizce iş başvuru mektubu ile öne çık.",
  priceText = "99 TL/Hafta",
  fomoText = "Bu ilana bugün birçok kişi başvurdu. Öne çıkmak ister misiniz?",
}: PremiumUpsellModalProps) {
  const router = useRouter();
  const reducedMotion = usePrefersReducedMotion();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const t = setTimeout(() => closeBtnRef.current?.focus(), 0);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
      clearTimeout(t);
    };
  }, [open, onClose]);

  const onOverlayMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

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
      // Premium aktif olduktan sonra bloke olan aksiyonu devam ettirmek için.
      try {
        onPremiumApplied?.();
      } catch {
        // ignore; aksiyon devam edemezse kullanıcı yine manuel tıklayabilir.
      }
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
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-6 sm:px-6"
      onMouseDown={onOverlayMouseDown}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={[
          "absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]",
          reducedMotion ? "" : "animate-premium-fadeIn",
        ].join(" ")}
        aria-hidden
      />

      <div
        ref={dialogRef}
        className={[
          "relative w-full max-w-[620px] rounded-2xl bg-white shadow-2xl",
          "max-h-[86vh] overflow-hidden flex flex-col",
          reducedMotion ? "" : "animate-premium-popIn",
        ].join(" ")}
      >
        {/* header */}
        <div className="shrink-0 px-5 pt-5 pb-4 sm:px-6 sm:pt-6 border-b border-slate-100">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-[18px] sm:text-[20px] font-semibold tracking-[-0.01em] text-slate-900">
                {title}
              </h2>
              <p className="mt-1 text-[13px] sm:text-[14px] leading-relaxed text-slate-600">{subtitle}</p>
            </div>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100 active:scale-[0.98] transition"
              aria-label="Kapat"
            >
              <span className="text-slate-500 text-xl leading-none">×</span>
            </button>
          </div>
        </div>

        {/* scroll area: (1) Kilit → (2) Kupon+Fiyat → (3) Not+Güven accordion */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-5" style={{ maxHeight: "calc(86vh - 76px - 88px)" }}>
          {/* 1) Unlock block */}
          <div
            className={[
              "rounded-2xl bg-slate-900 text-white px-4 py-4 sm:px-5",
              reducedMotion ? "" : "animate-premium-slideUp",
            ].join(" ")}
            style={!reducedMotion ? { animationDelay: "40ms" } : undefined}
          >
            <div className="text-[13px] sm:text-[14px] font-medium">
              Kilidi aç:{" "}
              <span className="font-normal opacity-90">
                Firma iletişim bilgileri + İngilizce iş başvuru mektubu aracı
              </span>
            </div>
          </div>

          {/* Features (Kilit açılacaklar) */}
          <div
            className={[
              "mt-4 rounded-2xl border border-slate-200 bg-slate-50/40 p-4 sm:p-5",
              reducedMotion ? "" : "animate-premium-fadeUp",
            ].join(" ")}
            style={!reducedMotion ? { animationDelay: "90ms" } : undefined}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[14px] sm:text-[15px] font-semibold text-slate-900">Kilit açılacaklar</h3>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[12px] font-medium text-slate-700">
                Premium
              </span>
            </div>
            <ul className="mt-3 space-y-2.5">
              {DEFAULT_FEATURES.map((t, i) => (
                <li
                  key={t}
                  className={[
                    "flex items-start gap-2.5 text-[13px] sm:text-[14px] text-slate-700",
                    reducedMotion ? "" : "opacity-0 animate-premium-staggerIn",
                  ].join(" ")}
                  style={!reducedMotion ? { animationDelay: `${140 + i * 55}ms` } : undefined}
                >
                  <span className="mt-[2px] inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white text-[12px]">
                    ✓
                  </span>
                  <span className="leading-relaxed">{t}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 2) Coupon + FOMO + Price */}
          <div
            className={[
              "mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5",
              reducedMotion ? "" : "animate-premium-fadeUp",
            ].join(" ")}
            style={!reducedMotion ? { animationDelay: "240ms" } : undefined}
          >
            <div className="text-[13px] sm:text-[14px] font-medium text-slate-900">Kupon kodunuz var mı?</div>
            <div className="mt-3 flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value);
                    setCouponError(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleCouponSubmit()}
                  placeholder="Kupon kodu"
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white px-4 text-[14px] outline-none focus:ring-2 focus:ring-slate-900/15 focus:border-slate-300 disabled:opacity-60"
                  disabled={couponLoading || couponSuccess}
                  aria-label="Kupon kodu"
                />
              </div>
              <button
                type="button"
                onClick={handleCouponSubmit}
                disabled={couponLoading || !couponCode.trim()}
                className={[
                  "h-11 rounded-xl px-4 font-semibold text-[14px] min-w-[140px]",
                  couponSuccess
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50",
                  "active:scale-[0.99] transition",
                ].join(" ")}
              >
                {couponLoading ? "..." : couponSuccess ? "Uygulandı ✓" : "Kuponu Uygula"}
              </button>
            </div>
            {couponError && <p className="mt-2 text-xs text-red-600">{couponError}</p>}

            <div className="mt-4 rounded-2xl bg-slate-900 px-4 py-3 text-white">
              <div className="text-[13px] sm:text-[14px] font-medium">{fomoText}</div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-[12px] tracking-wide text-slate-500 font-semibold">HAFTALIK PREMIUM</div>
              <div className="mt-1 text-[22px] sm:text-[24px] font-bold text-slate-900">{priceText}</div>
              <div className="mt-1 text-[13px] sm:text-[14px] text-slate-600">
                Tüm özellikler tek paket içinde açılır.
              </div>
            </div>
          </div>

          {/* 3) Not + Güven (accordion) */}
          <div
            className={[
              "mt-5 rounded-2xl border border-slate-200 bg-slate-50/40 overflow-hidden",
              reducedMotion ? "" : "animate-premium-fadeUp",
            ].join(" ")}
            style={!reducedMotion ? { animationDelay: "320ms" } : undefined}
          >
            <button
              type="button"
              onClick={() => setInfoOpen((s) => !s)}
              className="w-full px-4 sm:px-5 py-4 flex items-center justify-between gap-4 text-left"
            >
              <div>
                <div className="text-[12px] font-semibold tracking-wide text-slate-500">BİLGİLENDİRME</div>
                <div className="mt-0.5 text-[14px] sm:text-[15px] font-semibold text-slate-900">
                  Not ve Güven Hatırlatması
                </div>
              </div>
              <span
                className={[
                  "inline-flex h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-200 shrink-0",
                  reducedMotion ? "" : "transition-transform duration-200",
                  infoOpen ? "rotate-180" : "rotate-0",
                ].join(" ")}
                aria-hidden
              >
                <span className="text-slate-500">⌄</span>
              </span>
            </button>
            <div
              className={`grid ${infoOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
              style={{ transition: "grid-template-rows 220ms ease" }}
            >
              <div className="overflow-hidden">
                <div className="px-4 sm:px-5 pb-5 text-[13px] sm:text-[14px] text-slate-700 leading-relaxed">
                  <div className="text-[12px] font-semibold tracking-wide text-slate-500">NOT</div>
                  <p className="mt-2">{DEFAULT_INFO_TEXT}</p>
                  <div className="mt-4 text-[12px] font-semibold tracking-wide text-slate-500">
                    GÜVEN HATIRLATMASI
                  </div>
                  <ul className="mt-2 space-y-2">
                    {DEFAULT_TRUST.map((t, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-[2px] text-slate-900 shrink-0">•</span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="h-2" />
        </div>

        {/* footer: CTA (sayfaya yapışmaz, modal içinde) */}
        <div className="shrink-0 px-5 sm:px-6 py-4 border-t border-slate-100 bg-white">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onCta}
              className={[
                "h-12 rounded-2xl px-5 font-bold text-[14px] text-white",
                "bg-slate-900 hover:bg-slate-800 active:scale-[0.99] transition",
                reducedMotion ? "" : "animate-premium-ctaGlow",
              ].join(" ")}
            >
              Premium&apos;u Aç ({priceText})
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-12 rounded-2xl px-5 font-semibold text-[14px] text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.99] transition"
            >
              Şimdilik Vazgeç
            </button>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            {couponSuccess ? "Kupon uygulandı." : "Kuponunuz varsa uygulayın."}
          </p>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes premiumFadeIn { from { opacity: 0 } to { opacity: 1 } }
            .animate-premium-fadeIn { animation: premiumFadeIn .18s ease-out both; }
            @keyframes premiumPopIn {
              from { opacity: 0; transform: translateY(10px) scale(.98) }
              to { opacity: 1; transform: translateY(0) scale(1) }
            }
            .animate-premium-popIn { animation: premiumPopIn .22s cubic-bezier(.2,.9,.2,1) both; }
            @keyframes premiumSlideUp {
              from { opacity: 0; transform: translateY(10px) }
              to { opacity: 1; transform: translateY(0) }
            }
            .animate-premium-slideUp { animation: premiumSlideUp .24s ease-out both; }
            @keyframes premiumFadeUp {
              from { opacity: 0; transform: translateY(10px) }
              to { opacity: 1; transform: translateY(0) }
            }
            .animate-premium-fadeUp { animation: premiumFadeUp .26s ease-out both; }
            @keyframes premiumStaggerIn {
              from { opacity: 0; transform: translateY(6px) }
              to { opacity: 1; transform: translateY(0) }
            }
            .animate-premium-staggerIn { animation: premiumStaggerIn .26s ease-out forwards; }
            @keyframes premiumCtaGlow {
              0% { box-shadow: 0 0 0 rgba(0,0,0,0) }
              60% { box-shadow: 0 14px 30px rgba(15,23,42,.18) }
              100% { box-shadow: 0 0 0 rgba(0,0,0,0) }
            }
            .animate-premium-ctaGlow { animation: premiumCtaGlow .9s ease-out 1; }
          `,
        }}
      />
    </div>
  );
}
