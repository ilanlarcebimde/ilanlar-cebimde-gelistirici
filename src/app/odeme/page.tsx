"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";

const AMOUNT = 549;
const BASKET_DESCRIPTION = "Usta Başvuru Paketi";
const FREE_COUPON_CODE = "ADMIN549";

function generateMerchantOid(): string {
  return "ord_" + Date.now() + "_" + Math.random().toString(36).slice(2, 11);
}

export default function OdemePage() {
  const router = useRouter();
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [freeWithCoupon, setFreeWithCoupon] = useState(false);

  const applyCoupon = useCallback(() => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponMessage({ type: "error", text: "Kupon kodu girin." });
      return;
    }
    if (code === FREE_COUPON_CODE) {
      setCouponMessage({ type: "success", text: "Kupon uygulandı. Ücretsiz sipariş tamamlanıyor…" });
      setFreeWithCoupon(true);
      sessionStorage.removeItem("paytr_pending");
      router.replace("/odeme/basarili");
      return;
    }
    setCouponMessage({ type: "error", text: "Geçersiz kupon kodu." });
  }, [couponCode, router]);

  useEffect(() => {
    const pending = typeof window !== "undefined" ? sessionStorage.getItem("paytr_pending") : null;
    const parsed = pending ? (JSON.parse(pending) as { email?: string; user_name?: string; profile_id?: string }) : null;
    const email = parsed?.email ?? null;
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
    const body = {
      merchant_oid,
      email,
      amount: AMOUNT,
      user_name: user_name.trim().slice(0, 100),
      user_address: "Adres bilgisi girilmedi",
      user_phone: "5550000000",
      merchant_ok_url: `${siteUrl}/odeme/basarili`,
      merchant_fail_url: `${siteUrl}/odeme/basarisiz`,
      basket_description: BASKET_DESCRIPTION,
      profile_id: parsed?.profile_id || undefined,
    };

    fetch("/api/paytr/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.iframe_url) {
          setIframeUrl(data.iframe_url);
        } else {
          setError(data.error || "Ödeme başlatılamadı");
        }
      })
      .catch(() => setError("Bağlantı hatası"))
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
      <div className="min-h-screen bg-slate-50 py-8 px-4">
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
            <iframe
              id="paytriframe"
              src={iframeUrl}
              className="w-full border-0 overflow-hidden"
              style={{ minHeight: "500px" }}
              title="PayTR ödeme"
            />
          )}
        </div>
      </div>
    </>
  );
}
