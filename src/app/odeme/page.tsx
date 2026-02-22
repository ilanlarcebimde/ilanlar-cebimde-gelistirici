"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useAuth } from "@/hooks/useAuth";
import { safeParseJsonResponse } from "@/lib/safeJsonResponse";

const AMOUNT = 549;
const AMOUNT_DISPLAY = "549,00 TL";
const BASKET_DESCRIPTION = "Usta Başvuru Paketi";
const FREE_COUPON_CODE = "ADMIN549";

function generateMerchantOid(): string {
  return "ord_" + Date.now() + "_" + Math.random().toString(36).slice(2, 11);
}

export default function OdemePage() {
  const router = useRouter();
  const { user } = useAuth();
  const paytrIframeRef = useRef<HTMLDivElement>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [freeWithCoupon, setFreeWithCoupon] = useState(false);
  const [showPayHint, setShowPayHint] = useState(false);

  const scrollToPayForm = useCallback(() => {
    paytrIframeRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    setShowPayHint(true);
  }, []);

  useEffect(() => {
    if (!showPayHint) return;
    const t = setTimeout(() => setShowPayHint(false), 5000);
    return () => clearTimeout(t);
  }, [showPayHint]);

  const applyCoupon = useCallback(async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponMessage({ type: "error", text: "Kupon kodu girin." });
      return;
    }
    if (code === FREE_COUPON_CODE) {
      setCouponMessage({ type: "success", text: "Kupon uygulandı. Sipariş tamamlanıyor…" });
      setFreeWithCoupon(true);
      const pending = sessionStorage.getItem("paytr_pending");
      type PendingPayload = { method?: string; country?: string; job_area?: string; job_branch?: string; answers?: Record<string, unknown>; photo_url?: string | null };
      let parsed: PendingPayload | null = null;
      try {
        parsed = pending ? (JSON.parse(pending) as PendingPayload) : null;
      } catch {
        setCouponMessage({ type: "error", text: "Oturum verisi okunamadı. Lütfen formu doldurup tekrar ödeme sayfasına gelin." });
        setFreeWithCoupon(false);
        return;
      }
      if (!parsed || parsed.method == null) {
        setCouponMessage({ type: "error", text: "Eksik bilgi (yöntem). Lütfen formu baştan doldurup tekrar deneyin." });
        setFreeWithCoupon(false);
        return;
      }
      try {
        const body = {
          method: parsed.method,
          country: parsed.country ?? null,
          job_area: parsed.job_area ?? null,
          job_branch: parsed.job_branch ?? null,
          answers: typeof parsed.answers === "object" && parsed.answers !== null ? parsed.answers : {},
          photo_url: parsed.photo_url ?? null,
          ...(user?.id && { user_id: user.id }),
        };
        const res = await fetch("/api/profile/complete-coupon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        await safeParseJsonResponse(res, { logPrefix: "[complete-coupon]" });
        sessionStorage.removeItem("paytr_pending");
        router.replace("/odeme/basarili");
      } catch (e) {
        const message = e instanceof Error ? e.message : "Bağlantı hatası. Lütfen tekrar deneyin.";
        setCouponMessage({ type: "error", text: message });
        setFreeWithCoupon(false);
      }
      return;
    }
    setCouponMessage({ type: "error", text: "Geçersiz kupon kodu." });
  }, [couponCode, router, user]);

  useEffect(() => {
    const pending = typeof window !== "undefined" ? sessionStorage.getItem("paytr_pending") : null;
    const parsed = pending ? (JSON.parse(pending) as { email?: string; user_name?: string; method?: string; country?: string; job_area?: string; job_branch?: string; answers?: Record<string, unknown>; photo_url?: string | null }) : null;
    const email = parsed?.email?.trim() ?? null;
    if (!email) {
      router.replace("/");
      return;
    }

    const user_name =
      (parsed?.user_name && String(parsed.user_name).trim()) ||
      email.split("@")[0] ||
      "Müşteri";

    const merchant_oid = generateMerchantOid();
    const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
    const profile_snapshot =
      parsed?.method != null && parsed?.country != null
        ? {
            method: parsed.method,
            country: parsed.country ?? null,
            job_area: parsed.job_area ?? null,
            job_branch: parsed.job_branch ?? null,
            answers: parsed.answers ?? {},
            photo_url: parsed.photo_url ?? null,
          }
        : undefined;

    const body = {
      merchant_oid,
      email: email.trim(),
      amount: AMOUNT,
      user_name: user_name.trim().slice(0, 60),
      user_address: "Adres girilmedi",
      user_phone: "5550000000",
      merchant_ok_url: `${siteUrl}/odeme/basarili`,
      merchant_fail_url: `${siteUrl}/odeme/basarisiz`,
      basket_description: BASKET_DESCRIPTION,
      profile_snapshot,
    };

    fetch("/api/paytr/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(async (res) => {
        const data = await safeParseJsonResponse<{ success?: boolean; iframe_url?: string; error?: string }>(res, {
          logPrefix: "[paytr/initiate]",
        });
        if (data.success && data.iframe_url) {
          setIframeUrl(data.iframe_url);
        } else {
          setError(data.error || "Ödeme başlatılamadı");
        }
      })
      .catch((e) => {
        const message = e instanceof Error ? e.message : "Ödeme sayfası yüklenemedi. Lütfen tekrar deneyin.";
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Ödeme sayfası hazırlanıyor…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-xl bg-slate-800 px-4 py-2 text-white"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://www.paytr.com/js/iframeResizer.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof (window as unknown as { iFrameResize?: (opts: unknown, id: string) => void }).iFrameResize === "function") {
            (window as unknown as { iFrameResize: (opts: unknown, id: string) => void }).iFrameResize({}, "#paytriframe");
          }
        }}
      />
      {/* Tek scroll: sayfa. overflow yok, touch-action pan-y ile mobil kaydırma serbest. */}
      <div
        className="min-h-screen bg-slate-50 py-8 px-4 pb-28"
        style={{ touchAction: "pan-y", WebkitOverflowScrolling: "touch" }}
      >
        <div className="mx-auto max-w-2xl">
          <h1 className="text-xl font-bold text-slate-900 mb-4">Güvenli Ödeme</h1>

          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="mb-2 block text-sm font-medium text-slate-700">Kupon Kodu</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value);
                  setCouponMessage(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                placeholder="Kupon kodunu girin"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
              <button
                type="button"
                onClick={applyCoupon}
                className="rounded-lg bg-slate-800 px-4 py-2 font-medium text-white hover:bg-slate-700"
              >
                Uygula
              </button>
            </div>
            {couponMessage && (
              <p className={`mt-2 text-sm ${couponMessage.type === "success" ? "text-emerald-600" : "text-red-600"}`}>
                {couponMessage.text}
              </p>
            )}
          </div>

          {iframeUrl && (
            <div ref={paytrIframeRef} className="overflow-visible">
              <p className="mb-2 text-xs text-slate-500">
                Formda &quot;Gerekli değerleri post ediniz&quot; uyarısı görürseniz kart numarası, son kullanma tarihi, CVC ve kart sahibi adını eksiksiz doldurun.
              </p>
              {showPayHint && (
                <p className="mb-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
                  Aşağıdaki güvenli formda &quot;Ödeme Yap&quot; butonuna tıklayın.
                </p>
              )}
              <iframe
                id="paytriframe"
                src={iframeUrl}
                className="w-full border-0"
                style={{ minHeight: "500px" }}
                title="PayTR ödeme"
              />
            </div>
          )}
        </div>
      </div>

      {/* Sticky CTA: her zaman görünür, klavye açıkken de erişilebilir (safe-area). */}
      {iframeUrl && !freeWithCoupon && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-4 bg-white border-t border-slate-200 px-4 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <p className="text-sm font-medium text-slate-700">
            Ödemeniz gereken tutar: <span className="text-slate-900">{AMOUNT_DISPLAY}</span>
          </p>
          <button
            type="button"
            onClick={scrollToPayForm}
            className="shrink-0 rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 touch-manipulation"
          >
            Ödeme Yap
          </button>
        </div>
      )}
    </>
  );
}
