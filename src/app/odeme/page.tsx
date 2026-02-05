"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";

const AMOUNT = 549;
const BASKET_DESCRIPTION = "Usta Başvuru Paketi";

function generateMerchantOid(): string {
  return "ord_" + Date.now() + "_" + Math.random().toString(36).slice(2, 11);
}

export default function OdemePage() {
  const router = useRouter();
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const pending = typeof window !== "undefined" ? sessionStorage.getItem("paytr_pending") : null;
    const email = pending ? (JSON.parse(pending) as { email?: string }).email : null;
    if (!email) {
      router.replace("/");
      return;
    }

    const merchant_oid = generateMerchantOid();
    const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
    const body = {
      merchant_oid,
      email,
      amount: AMOUNT,
      user_name: "",
      user_address: "Adres bilgisi girilmedi",
      user_phone: "5550000000",
      merchant_ok_url: `${siteUrl}/odeme/basarili`,
      merchant_fail_url: `${siteUrl}/odeme/basarisiz`,
      basket_description: BASKET_DESCRIPTION,
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
