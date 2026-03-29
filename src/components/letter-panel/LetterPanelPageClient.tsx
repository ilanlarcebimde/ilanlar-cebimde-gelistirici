"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Sparkles } from "lucide-react";
import { CoverLetterWizardModal } from "@/components/apply/cover-letter/CoverLetterWizardModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { safeParseJsonResponse } from "@/lib/safeJsonResponse";
import {
  LETTER_PANEL_AMOUNT_TRY,
  LETTER_PANEL_BASKET,
  LETTER_PANEL_PAYMENT_TYPE,
} from "@/lib/letterPanelUnlock";

const WHATSAPP_CHANNEL_URL = "https://whatsapp.com/channel/0029VbCOluF3mFYESfECMG0i";

function generateMerchantOid(): string {
  return "ord_" + Date.now() + "_" + Math.random().toString(36).slice(2, 11);
}

export function LetterPanelPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [unlocked, setUnlocked] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwLoading, setPwLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [payIframeUrl, setPayIframeUrl] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const refreshAccess = useCallback(async (): Promise<boolean> => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? null;
    setAccessToken(token);
    if (!token) {
      setUnlocked(false);
      return false;
    }
    const res = await fetch("/api/letter-panel/access", {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });
    if (res.status === 401) {
      setUnlocked(false);
      return false;
    }
    const data = (await res.json().catch(() => ({}))) as { unlocked?: boolean };
    const ok = !!data.unlocked;
    setUnlocked(ok);
    return ok;
  }, []);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    (async () => {
      setCheckingAccess(true);
      await refreshAccess();
      if (!cancelled) setCheckingAccess(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, refreshAccess, user?.id]);

  const payFail = searchParams.get("pay");
  useEffect(() => {
    if (payFail !== "fail") return;
    setPayError("Ödeme tamamlanamadı veya iptal edildi.");
    router.replace("/is-basvuru-mektubu-olustur", { scroll: false });
  }, [payFail, router]);

  const paidParam = searchParams.get("paid");
  useEffect(() => {
    if (paidParam !== "1") return;
    const clean = () => router.replace("/is-basvuru-mektubu-olustur", { scroll: false });
    let attempts = 0;
    const id = window.setInterval(async () => {
      attempts += 1;
      const ok = await refreshAccess();
      if (ok || attempts > 40) {
        window.clearInterval(id);
        clean();
      }
    }, 500);
    return () => window.clearInterval(id);
  }, [paidParam, refreshAccess, router]);

  const handleUnlockPassword = async () => {
    setPwError(null);
    if (!user) {
      router.push("/giris?next=" + encodeURIComponent("/is-basvuru-mektubu-olustur"));
      return;
    }
    setPwLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setPwError("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
        return;
      }
      const res = await fetch("/api/letter-panel/unlock-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "include",
        body: JSON.stringify({ code: password }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok) {
        if (data.error === "usage_exhausted") {
          setPwError("Bu kodun kullanım limiti dolmuş.");
        } else {
          setPwError("Kod geçersiz veya süresi dolmuş. Tekrar deneyin.");
        }
        return;
      }
      setUnlocked(true);
      setPassword("");
    } finally {
      setPwLoading(false);
    }
  };

  const handlePay = async () => {
    setPayError(null);
    if (!user) {
      router.push("/giris?next=" + encodeURIComponent("/is-basvuru-mektubu-olustur"));
      return;
    }
    setPayLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        setPayError("E-posta bulunamadı. Lütfen tekrar giriş yapın.");
        return;
      }
      const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
      const merchant_oid = generateMerchantOid();
      const body = {
        merchant_oid,
        email: session.user.email.trim(),
        amount: LETTER_PANEL_AMOUNT_TRY,
        user_name:
          (session.user.user_metadata?.full_name as string | undefined)?.trim?.() ||
          session.user.email.split("@")[0] ||
          "Müşteri",
        user_address: "Adres girilmedi",
        user_phone: "5550000000",
        merchant_ok_url: `${siteUrl}/is-basvuru-mektubu-olustur?paid=1`,
        merchant_fail_url: `${siteUrl}/is-basvuru-mektubu-olustur?pay=fail`,
        basket_description: LETTER_PANEL_BASKET,
        payment_type: LETTER_PANEL_PAYMENT_TYPE,
        user_id: session.user.id,
      };
      const res = await fetch("/api/paytr/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.status === 503) {
        setPayError(
          "Ödeme işlemi geçici olarak durdurulmuştur. Sizlere daha iyi hizmet vermek için çalışmalarımız sürüyor; lütfen daha sonra tekrar deneyin.",
        );
        return;
      }
      const data = await safeParseJsonResponse<{ success?: boolean; iframe_url?: string; error?: string }>(res, {
        logPrefix: "[letter-panel paytr]",
      });
      if (data.success && data.iframe_url) {
        setPayIframeUrl(data.iframe_url);
      } else {
        setPayError(
          data.error === "payments_paused"
            ? "Ödeme işlemi geçici olarak durdurulmuştur. Lütfen daha sonra tekrar deneyin."
            : data.error || "Ödeme başlatılamadı.",
        );
      }
    } catch {
      setPayError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setPayLoading(false);
    }
  };

  const locked = !unlocked;
  const ready = !authLoading && !checkingAccess;
  const hasSession = !!user && !!accessToken;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/90 pb-16 pt-4 md:pt-8">
      {payIframeUrl ? (
        <Script
          src="https://www.paytr.com/js/iframeResizer.min.js"
          strategy="afterInteractive"
          onLoad={() => {
            if (typeof (window as unknown as { iFrameResize?: (opts: unknown, id: string) => void }).iFrameResize === "function") {
              (window as unknown as { iFrameResize: (opts: unknown, id: string) => void }).iFrameResize({}, "#letterpaytriframe");
            }
          }}
        />
      ) : null}

      <div className="mx-auto max-w-3xl px-4 text-center md:px-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">İş Başvuru Mektubu Oluştur</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
          İşverene maaş beklentiniz, konaklama talebiniz, vize durumunuz ve çalışma şartlarına dair beklentilerinizi daha düzenli ve profesyonel şekilde iletin.
        </p>
        <ul className="mx-auto mt-6 grid max-w-xl gap-2 text-left text-sm text-slate-700 sm:grid-cols-2">
          {[
            "İşverene profesyonel ilk mesaj oluşturma",
            "Vize, maaş ve konaklama taleplerini net iletme",
            "Güven veren ve düzenli başvuru yapısı",
            "İngilizce iş başvuru mektubu sürecini kolaylaştırma",
            "Mevcut sihirbaz ile hızlı kullanım",
          ].map((t) => (
            <li key={t} className="flex items-start gap-2 rounded-xl border border-slate-200/80 bg-white/60 px-3 py-2.5 shadow-sm">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative mx-auto mt-10 max-w-3xl px-4 md:px-6">
        {!ready ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200 bg-white/80 p-8 text-slate-600">
            Yükleniyor…
          </div>
        ) : (
          <div className="relative">
            <div
              className={
                locked
                  ? "pointer-events-none select-none opacity-[0.92] saturate-[0.88]"
                  : ""
              }
              style={locked ? { filter: "blur(7px)" } : undefined}
              aria-hidden={locked ? true : undefined}
            >
              {hasSession ? (
                <CoverLetterWizardModal
                  open
                  variant="inline"
                  generic
                  accessToken={accessToken!}
                  onClose={() => {}}
                  userId={user?.id}
                />
              ) : (
                <div
                  className="min-h-[min(70vh,640px)] w-full rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 shadow-lg md:mx-auto md:max-w-[720px] lg:max-w-[840px]"
                  aria-hidden
                />
              )}
            </div>

            {locked ? (
              <div
                className="absolute inset-0 z-20 flex items-center justify-center p-3 md:p-6"
                role="presentation"
              >
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-slate-900/45 backdrop-blur-[2px]" aria-hidden />
                <div className="pointer-events-auto relative w-full max-w-md rounded-2xl border border-white/10 bg-white/95 p-6 shadow-2xl shadow-slate-900/20 backdrop-blur-md md:p-8">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg">
                    <Lock className="h-6 w-6" aria-hidden />
                  </div>
                  <h2 className="text-center text-lg font-semibold text-slate-900 md:text-xl">Panel kilitli</h2>
                  <p className="mt-2 text-center text-sm text-slate-600">
                    İş başvuru mektubu paneline erişmek için tek seferlik ödeme yapın veya WhatsApp kanal şifresini girin.
                  </p>

                  {!user ? (
                    <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-center text-sm text-amber-900">
                      Devam etmek için{" "}
                      <Link href="/giris?next=%2Fis-basvuru-mektubu-olustur" className="font-semibold underline">
                        giriş yapın
                      </Link>
                      .
                    </p>
                  ) : null}

                  <button
                    type="button"
                    onClick={handlePay}
                    disabled={payLoading || !user}
                    className="mt-6 w-full rounded-xl bg-slate-900 py-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    {payLoading ? "Yönlendiriliyor…" : "79 TL Tek Seferlik Ödeme Yap"}
                  </button>
                  {payError ? <p className="mt-2 text-center text-sm text-red-600">{payError}</p> : null}

                  <div className="my-6 flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-400">veya</span>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>

                  <label className="block text-left text-xs font-medium text-slate-500">Şifre ile erişim</label>
                  <input
                    type="password"
                    autoComplete="off"
                    placeholder="Erişim şifresini girin"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleUnlockPassword()}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-slate-300/80 placeholder:text-slate-400 focus:border-slate-400 focus:ring-2"
                  />
                  {pwError ? <p className="mt-2 text-sm text-red-600">{pwError}</p> : null}
                  <button
                    type="button"
                    onClick={handleUnlockPassword}
                    disabled={pwLoading || !user}
                    className="mt-3 w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    {pwLoading ? "Kontrol ediliyor…" : "Şifre ile Kilidi Aç"}
                  </button>

                  <p className="mt-5 text-center text-xs leading-relaxed text-slate-500">
                    WhatsApp kanalına özel ücretsiz erişim şifresi belirli dönemlerde paylaşılır.
                  </p>
                  <a
                    href={WHATSAPP_CHANNEL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-600/30 bg-emerald-50/90 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                  >
                    WhatsApp Kanalına Abone Ol
                  </a>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {payIframeUrl ? (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/50 p-4">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setPayIframeUrl(null);
                void refreshAccess();
              }}
              className="absolute right-3 top-3 z-10 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Kapat
            </button>
            <div className="max-h-[85vh] overflow-auto p-4 pt-14">
              <iframe
                id="letterpaytriframe"
                src={payIframeUrl}
                className="min-h-[420px] w-full rounded-lg border border-slate-200"
                title="PayTR ödeme"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
