"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionActive } from "@/hooks/useSubscriptionActive";
import { supabase } from "@/lib/supabase";
import { safeParseJsonResponse } from "@/lib/safeJsonResponse";

const AMOUNT_FULL = 549;
const AMOUNT_WEEKLY = 89;
const AMOUNT_CV_PACKAGE = 349;
const BASKET_FULL = "Usta Başvuru Paketi";
const BASKET_WEEKLY = "Haftalık Premium";
const BASKET_CV_PACKAGE = "Yurtdışı CV Paketi";
const FREE_COUPON_CODE = "ADMIN549";
/** Haftalık premium kuponları (7 gün abonelik, giriş gerekli) */
const PREMIUM_COUPON_CODES = ["ADMIN89", "99TLDENEME"];
/** Yurtdışı CV Paketi 79 TL indirim (349 - 79 = 270 TL) */
const CV_PACKAGE_DISCOUNT_CODE = "CV79";
const CV_PACKAGE_DISCOUNT_AMOUNT = 79;
const AMOUNT_CV_PACKAGE_DISCOUNTED = AMOUNT_CV_PACKAGE - CV_PACKAGE_DISCOUNT_AMOUNT;
/** Merkez conversion popup kuponu: Usta Başvuru Paketi 129 TL indirim (549 - 129 = 420 TL) */
const IYIUSTALAR_COUPON_CODE = "İYİUSTALAR";
const IYIUSTALAR_DISCOUNT_AMOUNT = 129;
const AMOUNT_FULL_IYIUSTALAR = AMOUNT_FULL - IYIUSTALAR_DISCOUNT_AMOUNT;

function generateMerchantOid(): string {
  return "ord_" + Date.now() + "_" + Math.random().toString(36).slice(2, 11);
}

function formatSubscriptionEndDate(iso: string): string {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function OdemePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { active: subscriptionActive, loading: subscriptionLoading, subscription, refetch } = useSubscriptionActive(user?.id);
  const paytrIframeRef = useRef<HTMLDivElement>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [freeWithCoupon, setFreeWithCoupon] = useState(false);
  const [showPayHint, setShowPayHint] = useState(false);
  const [cv79Applied, setCv79Applied] = useState(false);
  const [iyiustalarApplied, setIyiustalarApplied] = useState(false);

  const getPostPaymentTarget = useCallback(() => {
    let target = "/premium/job-guides";
    try {
      const saved = sessionStorage.getItem("premium_after_payment_redirect");
      if (saved && (saved.startsWith("/premium/job-guide/") || saved.startsWith("/ucretsiz-yurtdisi-is-ilanlari?openHowTo="))) {
        sessionStorage.removeItem("premium_after_payment_redirect");
        return saved;
      }
      const jobId = sessionStorage.getItem("premium_pending_job_id");
      if (jobId) {
        sessionStorage.removeItem("premium_pending_job_id");
        return "/premium/job-guide/" + jobId;
      }
    } catch {
      // ignore
    }
    const nextParam = searchParams.get("next");
    if (nextParam && nextParam.startsWith("/")) {
      target = nextParam;
    }
    return target;
  }, [searchParams]);

  const scrollToPayForm = useCallback(() => {
    paytrIframeRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    setShowPayHint(true);
  }, []);

  useEffect(() => {
    if (!showPayHint) return;
    const t = setTimeout(() => setShowPayHint(false), 5000);
    return () => clearTimeout(t);
  }, [showPayHint]);

  /** Merkez conversion popup'tan gelindiğinde kupon alanını İYİUSTALAR ile doldur. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = sessionStorage.getItem("merkezi_popup_coupon");
    if (stored?.trim().toUpperCase() === IYIUSTALAR_COUPON_CODE) {
      setCouponCode(IYIUSTALAR_COUPON_CODE);
      sessionStorage.removeItem("merkezi_popup_coupon");
    }
  }, []);

  const applyCoupon = useCallback(async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponMessage({ type: "error", text: "Kupon kodu girin." });
      return;
    }
    if (PREMIUM_COUPON_CODES.includes(code)) {
      setCouponMessage({ type: "success", text: "Kupon uygulanıyor…" });
      if (!user) {
        setCouponMessage({ type: "error", text: "Haftalık premium kuponu için giriş yapmanız gerekir." });
        return;
      }
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) {
          setCouponMessage({ type: "error", text: "Oturum bulunamadı. Lütfen tekrar giriş yapın." });
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
          return;
        }
        // DB yazımı + istemci senkronizasyonu yarış koşulu yaratabiliyor.
        // Premium satırı gerçekten aktif görünür görünmez yönlendirelim.
        setCouponMessage({ type: "success", text: "Haftalık premium aktif ediliyor…" });
        window.dispatchEvent(new Event("premium-subscription-invalidate"));
        const delays = [0, 600, 1200, 2000, 3500];
        let ok = false;
        for (const waitMs of delays) {
          if (waitMs > 0) await new Promise((r) => setTimeout(r, waitMs));
          ok = await refetch();
          if (ok) break;
        }
        const target = getPostPaymentTarget();
        setCouponMessage({ type: "success", text: ok ? "Haftalık premium aktif. Panele yönlendiriliyorsunuz…" : "Premium aktive edildi. Yönlendiriliyor…" });
        // Tam sayfa yenilemesi ile hedef hizmette aktif aboneliği kesin yansıt.
        window.location.href = target;
      } catch (e) {
        setCouponMessage({ type: "error", text: "Bağlantı hatası. Lütfen tekrar deneyin." });
      }
      return;
    }
    if (code === CV_PACKAGE_DISCOUNT_CODE) {
      const pending = typeof window !== "undefined" ? sessionStorage.getItem("paytr_pending") : null;
      const parsed = pending ? (JSON.parse(pending) as { plan?: string }) : null;
      if (parsed?.plan !== "cv_package") {
        setCouponMessage({ type: "error", text: "CV79 kuponu sadece Yurtdışı CV Paketi için geçerlidir." });
        return;
      }
      setCouponMessage({ type: "success", text: "79 TL indirim uygulandı. Ödemeniz: 270 TL." });
      try {
        const full = JSON.parse(pending!) as Record<string, unknown>;
        sessionStorage.setItem("paytr_pending", JSON.stringify({ ...full, cv79_discount: true }));
      } catch {
        setCouponMessage({ type: "error", text: "Oturum güncellenemedi. Sayfayı yenileyip tekrar deneyin." });
        return;
      }
      setCv79Applied(true);
      setIframeUrl(null);
      setLoading(true);
      try {
        const full = JSON.parse(sessionStorage.getItem("paytr_pending")!) as {
          email?: string; user_name?: string; method?: string; country?: string; job_area?: string; job_branch?: string;
          answers?: Record<string, unknown>; photo_url?: string | null; plan?: string; user_id?: string; profile_snapshot?: unknown;
          cv_order_id?: string;
        };
        const email = full?.email?.trim();
        if (!email) {
          setError("E-posta bulunamadı.");
          setLoading(false);
          return;
        }
        const user_name = (full?.user_name && String(full.user_name).trim()) || email.split("@")[0] || "Müşteri";
        const profile_snapshot = full?.method != null
          ? { method: full.method, country: full.country ?? null, job_area: full.job_area ?? null, job_branch: full.job_branch ?? null, answers: full.answers ?? {}, photo_url: full.photo_url ?? null }
          : undefined;
        const res = await fetch("/api/paytr/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            merchant_oid: "ord_" + Date.now() + "_" + Math.random().toString(36).slice(2, 11),
            email,
            amount: AMOUNT_CV_PACKAGE_DISCOUNTED,
            user_name: user_name.slice(0, 60),
            user_address: "Adres girilmedi",
            user_phone: "5550000000",
            merchant_ok_url: `${typeof window !== "undefined" ? window.location.origin : ""}/odeme/basarili`,
            merchant_fail_url: `${typeof window !== "undefined" ? window.location.origin : ""}/odeme/basarisiz`,
            basket_description: BASKET_CV_PACKAGE,
            profile_snapshot,
            payment_type: "discounted",
            coupon_code: CV_PACKAGE_DISCOUNT_CODE,
            ...(full?.user_id && { user_id: full.user_id }),
            ...(full?.cv_order_id && { cv_order_id: full.cv_order_id }),
          }),
        });
        const data = await safeParseJsonResponse<{ success?: boolean; iframe_url?: string; error?: string }>(res, { logPrefix: "[paytr/initiate]" });
        if (data.success && data.iframe_url) setIframeUrl(data.iframe_url);
        else setError(data.error || "Ödeme başlatılamadı");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ödeme yüklenemedi.");
      } finally {
        setLoading(false);
      }
      return;
    }
    if (code === IYIUSTALAR_COUPON_CODE) {
      const pending = typeof window !== "undefined" ? sessionStorage.getItem("paytr_pending") : null;
      const parsed = pending ? (JSON.parse(pending) as { plan?: string }) : null;
      if (parsed?.plan === "weekly" || parsed?.plan === "cv_package") {
        setCouponMessage({
          type: "error",
          text: "İYİUSTALAR kuponu sadece Usta Başvuru Paketi için geçerlidir.",
        });
        return;
      }
      setCouponMessage({
        type: "success",
        text: `${IYIUSTALAR_DISCOUNT_AMOUNT} TL indirim uygulandı. Ödemeniz: ${AMOUNT_FULL_IYIUSTALAR} TL.`,
      });
      try {
        const full = JSON.parse(pending!) as Record<string, unknown>;
        sessionStorage.setItem("paytr_pending", JSON.stringify({ ...full, iyiustalar_discount: true }));
      } catch {
        setCouponMessage({ type: "error", text: "Oturum güncellenemedi. Sayfayı yenileyip tekrar deneyin." });
        return;
      }
      setIyiustalarApplied(true);
      setIframeUrl(null);
      setLoading(true);
      try {
        const full = JSON.parse(sessionStorage.getItem("paytr_pending")!) as {
          email?: string; user_name?: string; method?: string; country?: string; job_area?: string; job_branch?: string;
          answers?: Record<string, unknown>; photo_url?: string | null; plan?: string; user_id?: string;
        };
        const email = full?.email?.trim();
        if (!email) {
          setError("E-posta bulunamadı.");
          setLoading(false);
          return;
        }
        const user_name = (full?.user_name && String(full.user_name).trim()) || email.split("@")[0] || "Müşteri";
        const profile_snapshot = full?.method != null
          ? { method: full.method, country: full.country ?? null, job_area: full.job_area ?? null, job_branch: full.job_branch ?? null, answers: full.answers ?? {}, photo_url: full.photo_url ?? null }
          : undefined;
        const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
        const res = await fetch("/api/paytr/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            merchant_oid: generateMerchantOid(),
            email,
            amount: AMOUNT_FULL_IYIUSTALAR,
            user_name: user_name.slice(0, 60),
            user_address: "Adres girilmedi",
            user_phone: "5550000000",
            merchant_ok_url: `${siteUrl}/odeme/basarili`,
            merchant_fail_url: `${siteUrl}/odeme/basarisiz`,
            basket_description: BASKET_FULL,
            profile_snapshot,
            payment_type: "discounted",
            coupon_code: IYIUSTALAR_COUPON_CODE,
            ...(full?.user_id && { user_id: full.user_id }),
          }),
        });
        const data = await safeParseJsonResponse<{ success?: boolean; iframe_url?: string; error?: string }>(res, { logPrefix: "[paytr/initiate]" });
        if (data.success && data.iframe_url) setIframeUrl(data.iframe_url);
        else setError(data.error || "Ödeme başlatılamadı");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ödeme yüklenemedi.");
      } finally {
        setLoading(false);
      }
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
          coupon_code: FREE_COUPON_CODE,
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
  }, [couponCode, router, user, refetch, getPostPaymentTarget]);

  useEffect(() => {
    const pending = typeof window !== "undefined" ? sessionStorage.getItem("paytr_pending") : null;
    const parsed = pending
      ? (JSON.parse(pending) as {
          email?: string;
          user_name?: string;
          method?: string;
          country?: string | null;
          job_area?: string | null;
          job_branch?: string | null;
          answers?: Record<string, unknown>;
          photo_url?: string | null;
          plan?: string;
          user_id?: string;
          cv_order_id?: string;
          cv79_discount?: boolean;
          iyiustalar_discount?: boolean;
        })
      : null;
    const email = parsed?.email?.trim() ?? null;
    if (!email) {
      router.replace("/");
      return;
    }

    const isWeekly = parsed?.plan === "weekly";
    const isCvPackage = parsed?.plan === "cv_package";
    const useCv79 = isCvPackage && !!parsed?.cv79_discount;
    const useIyiustalar = !isWeekly && !isCvPackage && !!parsed?.iyiustalar_discount;
    const amount = isWeekly
      ? AMOUNT_WEEKLY
      : isCvPackage
        ? (useCv79 ? AMOUNT_CV_PACKAGE_DISCOUNTED : AMOUNT_CV_PACKAGE)
        : useIyiustalar
          ? AMOUNT_FULL_IYIUSTALAR
          : AMOUNT_FULL;
    const basketDescription = isWeekly ? BASKET_WEEKLY : isCvPackage ? BASKET_CV_PACKAGE : BASKET_FULL;
    setCv79Applied(!!useCv79);
    setIyiustalarApplied(!!useIyiustalar);

    const user_name =
      (parsed?.user_name && String(parsed.user_name).trim()) ||
      email.split("@")[0] ||
      "Müşteri";

    const merchant_oid = generateMerchantOid();
    const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
    const profile_snapshot =
      parsed?.method != null
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
      amount,
      user_name: user_name.trim().slice(0, 60),
      user_address: "Adres girilmedi",
      user_phone: "5550000000",
      merchant_ok_url: `${siteUrl}/odeme/basarili`,
      merchant_fail_url: `${siteUrl}/odeme/basarisiz`,
      basket_description: basketDescription,
      profile_snapshot,
      payment_type: isWeekly ? "weekly" : useCv79 || useIyiustalar ? "discounted" : "standard",
      coupon_code: useCv79
        ? CV_PACKAGE_DISCOUNT_CODE
        : useIyiustalar
          ? IYIUSTALAR_COUPON_CODE
          : null,
      ...(parsed?.user_id && { user_id: parsed.user_id }),
      ...(parsed?.cv_order_id && { cv_order_id: parsed.cv_order_id }),
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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-4">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="" className="h-12 w-12 shrink-0 rounded-lg object-contain" />
          <p className="font-semibold text-slate-900">İlanlar Cebimde</p>
        </div>
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
          {/* Logo + site adı + güven verici bilgiler */}
          <header className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt=""
                className="h-10 w-10 shrink-0 rounded-lg object-contain"
              />
              <div>
                <p className="font-semibold text-slate-900">İlanlar Cebimde</p>
                <p className="text-sm text-slate-500">Güvenli ödeme</p>
              </div>
            </div>
            <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-4 text-xs text-slate-600">
              <li className="flex items-center gap-1.5">
                <span className="text-emerald-600" aria-hidden>🔒</span>
                <span>256-bit SSL ile güvenli</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-slate-500" aria-hidden>🛡️</span>
                <span>3D Secure ödeme</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-slate-500" aria-hidden>↩️</span>
                <span>İstediğin zaman iptal edebilirsin</span>
              </li>
            </ul>
          </header>

          {/* Abonelik / kupon / ödeme hatırlaması: hesaba bağlı, tüm cihazlarda geçerli */}
          {user && !subscriptionLoading && subscriptionActive && subscription && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
              <p className="text-sm font-medium text-emerald-900">Aktif aboneliğiniz var</p>
              <p className="mt-1 text-sm text-emerald-800">
                Bitiş tarihi: {formatSubscriptionEndDate(subscription.ends_at)}
                {subscription.coupon_code && ` · Kupon: ${subscription.coupon_code}`}
              </p>
              <p className="mt-1 text-xs text-emerald-700">
                Abonelik, ödeme ve kupon bilgileriniz giriş yaptığınız tüm cihazlarda aynı hesapla geçerlidir.
              </p>
              <Link
                href="/panel"
                className="mt-3 inline-block text-sm font-medium text-emerald-800 underline hover:text-emerald-900"
              >
                Hesabım → Ödemeler ve abonelik detayı
              </Link>
            </div>
          )}

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
              <p className="mb-2 text-sm text-slate-600">
                <span className="font-medium text-slate-700">3D Secure</span> ile korunan ödeme sayfası. Aboneliklerde istediğin zaman iptal edebilirsin.
              </p>
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
            {(() => {
              const p = typeof window !== "undefined" ? sessionStorage.getItem("paytr_pending") : null;
              const data = p ? (JSON.parse(p) as { plan?: string; cv79_discount?: boolean }) : null;
              if (data?.plan === "weekly") {
                return (
                  <>
                    <span className="text-slate-500">Haftalık Premium — </span>
                    <span className="text-slate-900">99,00 TL</span>
                  </>
                );
              }
              if (data?.plan === "cv_package") {
                const amount = data?.cv79_discount ? "270,00 TL" : "349,00 TL";
                return <>Ödemeniz gereken tutar: <span className="text-slate-900">{amount}</span></>;
              }
              return <>Ödemeniz gereken tutar: <span className="text-slate-900">549,00 TL</span></>;
            })()}
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
