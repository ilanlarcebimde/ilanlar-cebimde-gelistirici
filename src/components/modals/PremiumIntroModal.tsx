"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

const PREMIUM_COUPON_CODES = ["ADMIN89", "99TLDENEME"];

const CARDS = [
  {
    title: "Resmi Başvuru Adımları",
    desc: "Kaynağa göre doğru başvuru süreci, platform yönlendirmesi, hata risk kontrolü",
  },
  {
    title: "Vize & Oturum Yol Haritası",
    desc: "Ülkeye özel süreç, gerekli belgeler, başvuru sırası",
  },
  {
    title: "Net Maaş & Gider Analizi",
    desc: "Tahmini net maaş, vergi etkisi, aylık birikim projeksiyonu",
  },
  {
    title: "Niyet Mektubu Taslağı",
    desc: "Kopyalanabilir resmi format, yer tutuculu metin, vizeye uygun yapı",
  },
  {
    title: "30 Günlük Başvuru Planı",
    desc: "Günlük aksiyon listesi, risk uyarıları, kontrol adımları",
  },
];

export function PremiumIntroModal({
  open,
  onClose,
  /** Tıklanan ilanın id'si; kupon/ödeme sonrası bu ilan için wizard açılır. */
  initialJobId = null,
  /** Kupon veya ödeme başarılı olunca çağrılır; parent wizard'ı bu jobId ile açar. */
  onPremiumSuccess,
}: {
  open: boolean;
  onClose: () => void;
  initialJobId?: string | null;
  onPremiumSuccess?: (jobId: string | null) => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => setMounted(true), []);

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponMessage({ type: "error", text: "Kupon kodu girin." });
      return;
    }
    if (!PREMIUM_COUPON_CODES.includes(code)) {
      setCouponMessage({ type: "error", text: "Geçersiz kupon kodu." });
      return;
    }
    if (!user) {
      setCouponMessage({ type: "error", text: "Kupon için giriş yapmanız gerekir." });
      return;
    }
    setCouponLoading(true);
    setCouponMessage(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setCouponMessage({ type: "error", text: "Oturum bulunamadı. Lütfen tekrar giriş yapın." });
        setCouponLoading(false);
        return;
      }
      const res = await fetch("/api/premium/apply-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCouponMessage({ type: "error", text: (data as { error?: string }).error ?? "Kupon uygulanamadı." });
        setCouponLoading(false);
        return;
      }
      window.dispatchEvent(new Event("premium-subscription-invalidate"));
      setCouponMessage({ type: "success", text: "Premium aktif. Panel açılıyor…" });
      onClose();
      await new Promise((r) => setTimeout(r, 400));
      const jobId = initialJobId ?? (typeof window !== "undefined" ? sessionStorage.getItem("premium_pending_job_id") : null);
      if (onPremiumSuccess && jobId) {
        onPremiumSuccess(jobId);
      } else if (!onPremiumSuccess) {
        const target = jobId ? `/premium/job-guide/${encodeURIComponent(jobId)}` : "/premium/job-guides";
        router.replace(target);
      }
    } catch {
      setCouponMessage({ type: "error", text: "Bağlantı hatası. Tekrar deneyin." });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleWeeklyPay = () => {
    const email = user?.email?.trim();
    if (!email) {
      router.push("/giris?next=" + encodeURIComponent("/odeme"));
      onClose();
      return;
    }
    const payload = {
      email,
      plan: "weekly",
      method: "form",
      country: null,
      job_area: null,
      job_branch: null,
      answers: {},
      photo_url: null,
      ...(user?.id && { user_id: user.id }),
    };
    sessionStorage.setItem("paytr_pending", JSON.stringify(payload));
    try {
      if (initialJobId) {
        sessionStorage.setItem("premium_pending_job_id", initialJobId);
        sessionStorage.setItem("premium_after_payment_redirect", "/ucretsiz-yurtdisi-is-ilanlari?openHowTo=" + encodeURIComponent(initialJobId));
      }
    } catch {
      // ignore
    }
    onClose();
    router.push("/odeme");
  };

  if (!open || !mounted || typeof document === "undefined") return null;

  const content = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal
      aria-labelledby="premium-upgrade-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-block rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
              Premium Erişim Seviyesi
            </span>
            <p className="text-xs text-slate-500">Sınırlı Premium Erişim</p>
            <p className="text-xs text-slate-400">Bu hafta 184 kullanıcı Premium&apos;a geçti.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl p-2 text-slate-500 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div>
          <h2 id="premium-upgrade-title" className="text-xl font-bold text-slate-900 sm:text-2xl">
            Başvurunu Bir Üst Seviyeye Taşı
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Bu ilana özel tüm resmi süreçleri, belgeleri ve stratejik adımları tek panelde aç.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CARDS.map((card, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-100 bg-gray-50 p-4 transition hover:shadow-md"
            >
              <h3 className="text-sm font-semibold text-slate-900">{card.title}</h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
          <p className="text-base font-semibold text-slate-800">
            Bu erişimle başvuru sürecin sistematik ve planlı ilerler.
          </p>
          <p className="mt-0.5 text-xs text-slate-500">Resmi kaynaklara dayalı olarak hazırlanır.</p>
        </div>

        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-lg text-slate-400 line-through">199 TL</span>
          <span className="text-2xl font-bold text-slate-900">89 TL</span>
          <span className="text-sm text-slate-600">/ haftalık</span>
        </div>
        <p className="text-xs text-slate-500">
          Tek seferlik değil, haftalık erişim. İstediğin zaman iptal edebilirsin.
        </p>

        <div className="space-y-2 border-t border-slate-100 pt-4">
          <p className="text-sm font-medium text-slate-700">Kupon kodunuz var mı?</p>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value);
                setCouponMessage(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
              placeholder="Kupon kodu"
              className="min-w-[140px] flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              disabled={couponLoading}
            />
            <button
              type="button"
              onClick={applyCoupon}
              disabled={couponLoading}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {couponLoading ? "…" : "Uygula"}
            </button>
          </div>
          {couponMessage && (
            <p className={`text-sm ${couponMessage.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
              {couponMessage.text}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleWeeklyPay}
            className="min-h-[48px] rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-3 font-medium text-white shadow-md transition hover:shadow-lg"
          >
            Premium&apos;a Geç — 89 TL / haftalık
          </button>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] rounded-xl border border-gray-300 bg-white px-6 py-3 font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
