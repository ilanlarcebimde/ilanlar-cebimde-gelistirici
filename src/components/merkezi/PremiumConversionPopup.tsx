"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionActive } from "@/hooks/useSubscriptionActive";
import { supabase } from "@/lib/supabase";

const STORAGE_KEY = "merkezi_conversion_popup_dismissed";
export const MERKEZI_POPUP_COUPON_KEY = "merkezi_popup_coupon";
export const MERKEZI_POPUP_COUPON_CODE = "İYİUSTALAR";
export function PremiumConversionPopup() {
  const { user, loading: authLoading } = useAuth();
  const { active: subscriptionActive, loading: subscriptionLoading } =
    useSubscriptionActive(user?.id);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (authLoading || subscriptionLoading) return;
    if (subscriptionActive) return;
    const dismissed = sessionStorage.getItem(STORAGE_KEY);
    if (dismissed === "1") return;
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, [authLoading, mounted, subscriptionActive, subscriptionLoading]);

  useEffect(() => {
    if (!mounted || !subscriptionActive) return;
    sessionStorage.removeItem(STORAGE_KEY);
    setVisible(false);
    setEntered(false);
  }, [mounted, subscriptionActive]);

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
    void (async () => {
      const currentPath =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "/yurtdisi-is-basvuru-merkezi";
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      const email = user?.email?.trim();

      if (!email) {
        window.location.href = "/giris?next=" + encodeURIComponent("/odeme?next=" + currentPath);
        return;
      }

      const paytrPending = {
        email,
        user_name:
          (user?.user_metadata?.full_name as string)?.trim() ||
          email.split("@")[0] ||
          "Müşteri",
        plan: "weekly" as const,
        ...(user?.id && { user_id: user.id }),
      };

      sessionStorage.removeItem(MERKEZI_POPUP_COUPON_KEY);
      sessionStorage.setItem("paytr_pending", JSON.stringify(paytrPending));
      window.location.href = "/odeme?next=" + encodeURIComponent(currentPath);
    })();
  };

  if (!mounted || authLoading || subscriptionLoading || subscriptionActive || !visible) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center pb-0 md:pb-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-title"
    >
      {/* Overlay — hafif koyu, blur yok */}
      <div
        className={`absolute inset-0 bg-[#07111f]/28 transition-opacity duration-300 md:bg-[#07111f]/18 ${entered ? "opacity-100" : "opacity-0"}`}
        onClick={handleClose}
        aria-hidden
      />

      {/* Mobil: alttan sheet (y: 80 → 0) • Masaüstü: alt orta panel (y: 48 → 0) */}
      <div
        className={`relative z-[10000] w-full overflow-hidden shadow-2xl transition-all duration-300 ease-out
          max-h-[88dvh] rounded-t-3xl border-t border-x border-[#9fb0c7]/12
          md:max-h-[85vh] md:w-full md:max-w-[580px] md:rounded-2xl md:border md:border-[#9fb0c7]/12
          ${entered ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 md:translate-y-12 md:opacity-0"}`}
        style={{
          background:
            "linear-gradient(180deg, #0f172a 0%, #1b2b45 55%, #223554 100%)",
          boxShadow:
            "0 24px 80px rgba(8, 15, 28, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        }}
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

        <div
          className="max-h-[88dvh] overflow-y-auto overscroll-contain touch-pan-y md:max-h-[85vh]"
          style={{
            paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
          }}
        >
        <div className="p-4 pb-6 pt-5 pr-16 md:p-6 md:pb-6 md:pt-6 md:pr-16">
          {/* Badge */}
          <div
            className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-amber-100/35 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#1f2937] md:mb-3 md:px-3 md:py-1.5 md:text-[11px]"
            style={{
              background:
                "linear-gradient(135deg, #fcd34d 0%, #f59e0b 58%, #d97706 100%)",
              boxShadow: "0 10px 24px rgba(245, 158, 11, 0.18)",
            }}
          >
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M4.16675 10H15.8334M15.8334 10L10.8334 5M15.8334 10L10.8334 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            ANINDA BAŞVURU İMKANI
          </div>

          <h2
            id="popup-title"
            className="mb-2 text-[20px] font-extrabold leading-7 tracking-[-0.02em] text-slate-50 md:mb-2.5 md:text-[22px] md:leading-8"
          >
            İŞVERENLE HEMEN İLETİŞİME GEÇ
          </h2>
          <p className="mb-2 text-[13px] leading-6 text-[#dbe4f0] md:text-[15px] md:leading-7">
            Yurtdışında çalışmak isteyen ustalar için hazırlanan bu araçlarla işverenlere daha hızlı, daha düzenli ve daha profesyonel şekilde ulaşın.
          </p>
          <p className="mb-3 text-[13px] leading-6 text-[#dbe4f0] md:mb-4 md:text-[15px] md:leading-7">
            Firma iletişim bilgilerine erişin veya profesyonel İngilizce iş başvuru mektubu oluşturarak başvurunuzu dakikalar içinde gönderin.
          </p>

          {/* Fayda satırları */}
          <ul className="mb-4 space-y-1.5 text-[13px] text-slate-50 md:mb-4 md:text-[15px]">
            <li className="flex items-center gap-2.5 font-medium leading-6">
              <span className="shrink-0 text-[#6ee7b7]">✔</span>
              İşe Hemen Başvur: Firma İletişim Bilgileri
            </li>
            <li className="flex items-center gap-2.5 font-medium leading-6">
              <span className="shrink-0 text-[#6ee7b7]">✔</span>
              Profesyonel İş Başvuru Mektubu Oluştur
            </li>
          </ul>

          <div className="mb-4 rounded-xl border border-white/10 bg-[#1a2c47] px-3 py-2.5 md:mb-5 md:px-4 md:py-3.5">
            <p className="text-center text-[12px] leading-6 text-[#dbe4f0] md:text-[14px] md:leading-7">
              Mesleğinizi, iş tecrübenizi, pasaport / vize durumunuzu, maaş beklentinizi ve konaklama taleplerinizi yazın.
            </p>
            <p className="mt-1.5 text-center text-[12px] leading-6 text-[#dbe4f0] md:text-[14px] md:leading-7">
              Gelişmiş sistem başvuru bilgilerinizi profesyonel İngilizce mektuba dönüştürür.
            </p>
            <p className="mt-2 text-center text-[11px] font-medium leading-5 text-[#a7f3d0] md:text-[12px]">
              Daha düzenli başvurular, işverenin dikkatini çekme olasılığını artırır.
            </p>
          </div>

          {/* Fiyat alanı */}
          <div className="merkezi-popup-pulse mb-4 rounded-xl border border-[rgba(245,158,11,0.6)] bg-[#14263f] px-3 py-2.5 md:mb-5 md:px-4 md:py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300 md:text-[11px]">
              SADECE BU SAYFAYA ÖZEL
            </p>
            <p className="mt-0.5 text-center">
              <span className="text-[15px] font-extrabold tracking-[-0.01em] text-amber-50 md:text-[18px]">
                HAFTALIK ABONELİK
              </span>
            </p>
            <p className="mt-1 text-center text-[16px] font-extrabold text-slate-50 md:text-[18px]">99 TL / hafta</p>
            <p className="mt-0.5 text-center text-[11px] text-[#9fb0c7]">Başvuru araçlarına sınırsız erişim</p>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={handleCta}
            className="block w-full rounded-xl py-3.5 text-center text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(22,163,74,0.22)] transition-all hover:shadow-[0_14px_28px_rgba(34,197,94,0.26)] md:py-4 md:text-[15px]"
            style={{ background: "linear-gradient(180deg, #22c55e 0%, #16a34a 100%)" }}
          >
            Başvuruyu Hemen Hazırla
          </button>
          <p className="mt-2 text-center text-[11px] leading-5 text-[#9fb0c7] md:text-[13px]">
            Firma iletişim bilgilerine erişim • Profesyonel İngilizce başvuru mektubu • Kolay başvuru
          </p>

          {/* Açılır detay */}
          <div className="mt-4 border-t border-slate-600/70 pt-3 md:mt-5">
            <button
              type="button"
              onClick={() => setDetailsOpen((o) => !o)}
              className="flex w-full items-center justify-center gap-1.5 text-[12px] text-[#9fb0c7] transition hover:text-slate-200"
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
              <div className="mt-3 space-y-1.5 rounded-lg border border-white/8 bg-[#1a2c47] px-3 py-2 text-[12px] leading-5 text-[#dbe4f0]">
                <p>• Oluşturulan mektubu ilan içindeki firma iletişim bilgileri üzerinden gönderin.</p>
                <p>• Telefon varsa WhatsApp ile başvurunuzu iletebilirsiniz.</p>
                <p>• E-posta varsa Gmail / Outlook ile başvurunuzu iletebilirsiniz.</p>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
