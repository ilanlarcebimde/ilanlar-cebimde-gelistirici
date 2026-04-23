"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { supabase, normalizeProfileRow } from "@/lib/supabase";
import { Copy, RefreshCw } from "lucide-react";
import {
  YurtdisiBasvuruPurchaseCard,
  type YurtdisiPanelApplicationRow,
} from "@/components/panel/YurtdisiBasvuruPurchaseCard";
import { YURTDISI_BASVURU_PAYMENT_TYPE } from "@/lib/yurtdisiIsBasvuruDestegi/paytr";

type ProfileRow = {
  id: string;
  status: string;
  method: string;
  country: string | null;
  job_area: string | null;
  job_branch: string | null;
  created_at: string;
};
type PaymentRow = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  created_at: string;
  payment_type?: string | null;
  coupon_code?: string | null;
};
type PremiumSubscriptionRow = {
  id: string;
  payment_id: string | null;
  ends_at: string;
  created_at: string;
  payment_type?: string | null;
  coupon_code?: string | null;
  payments?: PaymentRow | PaymentRow[] | null;
};
type CvOrderRow = {
  id: string;
  email: string;
  full_name: string | null;
  target_country: string | null;
  job_category: string | null;
  job_title: string | null;
  payment_status: string;
  order_status: string;
  created_at: string;
  merchant_oid: string | null;
};
type SubWithChannel = {
  id: string;
  channel_id: string;
  created_at: string;
  channels: { slug: string; name: string; country_code: string } | null;
};
const FLAG_CDN = "https://flagcdn.com";

const PROFILE_STATUS_LABELS: Record<string, string> = {
  draft: "Taslak",
  completed: "Tamamlandı",
  checkout_started: "Ödeme başlatıldı",
  paid: "Ödendi",
  failed: "Başarısız",
  processing: "İşleniyor",
  delivered: "Teslim edildi",
};

const METHOD_LABELS: Record<string, string> = {
  voice: "Sesli",
  chat: "Sohbet",
  form: "Form",
};

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  weekly: "Haftalık",
  coupon: "Kupon",
  discounted: "İndirimli",
  standard: "Standart",
  letter_panel_unlock: "İş başvuru mektubu paneli",
  yurtdisi_is_basvuru_destegi: "Yurtdışı iş başvuru desteği",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} ${hh}:${mm}`;
}

function PanelSkeleton() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-6">
      <div className="mb-6 h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
      <div className="mb-2 h-4 w-full max-w-xl animate-pulse rounded bg-slate-100" />
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-slate-50" />
        ))}
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 h-5 w-32 animate-pulse rounded bg-slate-200" />
          <div className="space-y-3">
            {[1, 2].map((j) => (
              <div key={j} className="flex items-center gap-3 border-b border-slate-100 pb-3 last:border-0">
                <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
                <div className="h-4 flex-1 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PanelPage() {
  const { user, loading: authLoading } = useAuth();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [premiumSubscriptions, setPremiumSubscriptions] = useState<PremiumSubscriptionRow[]>([]);
  const [cvOrders, setCvOrders] = useState<CvOrderRow[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubWithChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [unsubscribing, setUnsubscribing] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [yurtdisiBasvurular, setYurtdisiBasvurular] = useState<YurtdisiPanelApplicationRow[]>([]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setFetchError(null);
    setLoading(true);
    const uid = user.id;
    try {
      const [p, pay, premium, sub, cvByUser, cvByEmail] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, status, method, country, job_area, job_branch, created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: false }),
        supabase
          .from("payments")
          .select("id, status, amount, currency, created_at, payment_type, coupon_code")
          .eq("user_id", uid)
          .order("created_at", { ascending: false }),
        supabase
          .from("premium_subscriptions")
          .select(
            "id, payment_id, ends_at, created_at, payment_type, coupon_code, payments(id, status, amount, currency, created_at, payment_type, coupon_code)"
          )
          .eq("user_id", uid)
          .order("ends_at", { ascending: false }),
        supabase
          .from("channel_subscriptions")
          .select("id, channel_id, created_at, channels(slug, name, country_code)")
          .eq("user_id", uid)
          .order("created_at", { ascending: false }),
        supabase
          .from("cv_orders")
          .select("id, email, full_name, target_country, job_category, job_title, payment_status, order_status, created_at, merchant_oid")
          .eq("user_id", uid)
          .order("created_at", { ascending: false }),
        user.email
          ? supabase
              .from("cv_orders")
              .select("id, email, full_name, target_country, job_category, job_title, payment_status, order_status, created_at, merchant_oid")
              .eq("email", user.email)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [], error: null }),
      ]);

      const rows = (p.data as ProfileRow[]) ?? [];
      setProfiles(rows.map((r) => normalizeProfileRow(r) ?? r));
      setPayments((pay.data as PaymentRow[]) ?? []);
      const premiumRows = ((premium.data as PremiumSubscriptionRow[]) ?? []).map((item) => ({
        ...item,
        payments: Array.isArray(item.payments) ? item.payments[0] ?? null : item.payments ?? null,
      }));
      setPremiumSubscriptions(premiumRows);
      const mergedCv = [...((cvByUser.data as CvOrderRow[]) ?? []), ...((cvByEmail.data as CvOrderRow[]) ?? [])];
      const dedupCv = Array.from(new Map(mergedCv.map((row) => [row.id, row])).values())
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setCvOrders(dedupCv);
      const subData = (sub.data ?? []).map((item: any) => ({
        id: item.id,
        channel_id: item.channel_id,
        created_at: item.created_at,
        channels: Array.isArray(item.channels) ? item.channels[0] : item.channels,
      })) as SubWithChannel[];
      setSubscriptions(subData);

      const yb = await supabase
        .from("yurtdisi_basvuru_applications")
        .select("id, status, profession_label, country_count, listing_package_id, amount_try, created_at, payment_id, full_payload")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });
      if (yb.error) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[panel] yurtdisi_basvuru_applications", yb.error.message);
        }
        setYurtdisiBasvurular([]);
      } else {
        setYurtdisiBasvurular((yb.data as YurtdisiPanelApplicationRow[]) ?? []);
      }
    } catch {
      setFetchError("Veriler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user, fetchData]);

  useEffect(() => {
    if (!user) return;

    const refresh = () => fetchData();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh();
    };

    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    window.addEventListener("premium-subscription-invalidate", refresh);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
      window.removeEventListener("premium-subscription-invalidate", refresh);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [fetchData, user]);

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-4">
        {!user && !authLoading ? (
          <div className="text-center">
            <p className="mb-4 text-slate-600">Giriş yaparak hesabınızı görüntüleyebilirsiniz.</p>
            <Link href="/" className="rounded-lg bg-slate-900 px-4 py-2 text-white">
              Ana sayfaya dön
            </Link>
          </div>
        ) : (
          <p className="text-slate-600">Yükleniyor…</p>
        )}
      </div>
    );
  }

  if (!user) return null;

  const lastProfile = profiles[0];
  const lastPayment = payments[0];
  const activePremium = premiumSubscriptions.find(
    (sub) => new Date(sub.ends_at).getTime() > Date.now()
  ) ?? null;
  const displayPayments: PaymentRow[] = [
    ...payments,
    ...premiumSubscriptions
      .filter((s) => !s.payment_id)
      .map((s) => ({
        id: `coupon-${s.id}`,
        status: "success",
        amount: 0,
        currency: "TRY",
        created_at: s.created_at,
        payment_type: s.payment_type ?? "coupon",
        coupon_code: s.coupon_code ?? null,
      })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  /** Başarılı yurtdışı başvuru desteği üst bölümde kartla gösterildiği için aşağıdaki listeden düşer. */
  const paymentsExcludingYurtdisi = displayPayments.filter(
    (p) =>
      p.payment_type !== YURTDISI_BASVURU_PAYMENT_TYPE || p.status !== "success"
  );
  const activityItems = [
    ...payments.map((pay) => ({
      id: `payment-${pay.id}`,
      created_at: pay.created_at,
      kind: "payment" as const,
      title:
        pay.payment_type === YURTDISI_BASVURU_PAYMENT_TYPE
          ? "Yurtdışı Başvuru Desteği — satın alım"
          : `Ödeme ${pay.status === "success" ? "başarılı" : pay.status === "fail" ? "başarısız" : "işlemde"}`,
      detail:
        pay.payment_type === YURTDISI_BASVURU_PAYMENT_TYPE
          ? `${pay.amount} ${pay.currency} · Ayrıntılı kart üstte “Yurtdışı İş Başvuru Desteği” bölümünde`
          : `${pay.amount} ${pay.currency} · ${PAYMENT_TYPE_LABELS[pay.payment_type ?? "standard"] ?? "Standart"}${pay.coupon_code ? ` · Kupon: ${pay.coupon_code}` : ""}`,
      tone:
        pay.status === "success"
          ? "bg-emerald-100 text-emerald-700"
          : pay.status === "fail"
            ? "bg-red-100 text-red-700"
            : "bg-slate-100 text-slate-700",
      badge: pay.payment_type === YURTDISI_BASVURU_PAYMENT_TYPE ? "Hizmet" : "Ödeme",
    })),
    ...premiumSubscriptions.map((sub) => {
      const paymentRow = Array.isArray(sub.payments) ? sub.payments[0] ?? null : sub.payments ?? null;
      const type = sub.payment_type ?? paymentRow?.payment_type ?? "standard";
      const coupon = sub.coupon_code ?? paymentRow?.coupon_code ?? null;
      return {
        id: `premium-${sub.id}`,
        created_at: sub.created_at,
        kind: "premium" as const,
        title: "Premium abonelik oluşturuldu",
        detail: `${PAYMENT_TYPE_LABELS[type] ?? "Standart"} · Bitiş: ${formatDate(sub.ends_at)}${coupon ? ` · Kupon: ${coupon}` : ""}`,
        tone: "bg-brand-100 text-brand-700",
        badge: "Abonelik",
      };
    }),
    ...profiles.map((p) => ({
      id: `profile-${p.id}`,
      created_at: p.created_at,
      kind: "profile" as const,
      title: "Başvuru kaydı güncellendi",
      detail: `${PROFILE_STATUS_LABELS[p.status] ?? p.status} · ${METHOD_LABELS[p.method] ?? p.method}${(p.country || p.job_area) ? ` · ${[p.country, p.job_area, p.job_branch].filter(Boolean).join(" / ")}` : ""}`,
      tone: "bg-slate-100 text-slate-700",
      badge: "Başvuru",
    })),
    ...cvOrders.map((o) => ({
      id: `cv-order-${o.id}`,
      created_at: o.created_at,
      kind: "cv_order" as const,
      title: "CV paketi formu kaydedildi",
      detail: `${o.payment_status === "paid" ? "Ödeme alındı" : "Ödeme bekleniyor"} · ${o.order_status}`,
      tone: "bg-indigo-100 text-indigo-700",
      badge: "CV",
    })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      // Basit geri bildirim; isteğe bağlı toast eklenebilir
    });
  };

  const handleUnsubscribe = async (subId: string) => {
    if (!confirm("Bu kanalı aboneliklerinizden kaldırmak istediğinize emin misiniz?")) return;
    setUnsubscribing(subId);
    await supabase.from("channel_subscriptions").delete().eq("id", subId);
    setSubscriptions((prev) => prev.filter((s) => s.id !== subId));
    setUnsubscribing(null);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-3 px-4 md:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2 text-slate-900">
            <Image src="/logo.png" alt="Logo" width={32} height={32} className="object-contain" />
            <span className="font-bold">İlanlar Cebimde</span>
          </Link>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
            <span className="truncate text-sm text-slate-600" title={user.email ?? ""}>
              {user.email ?? ""}
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard(user.email ?? "", "E-posta")}
              className="shrink-0 rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="E-postayı kopyala"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 py-8 md:px-6">
        <h1 className="text-2xl font-semibold text-slate-900">Hesabım</h1>
        <p className="mt-1 text-sm text-slate-500">
          Geçmiş başvuruların, ödemelerin ve aboneliklerin burada. Verilerin güvenle saklanır.
        </p>

        {fetchError && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-medium">{fetchError}</p>
            <button
              type="button"
              onClick={() => fetchData()}
              className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              <RefreshCw className="h-4 w-4" />
              Yeniden Dene
            </button>
          </div>
        )}

        {loading ? (
          <PanelSkeleton />
        ) : (
          <div className="mt-6 space-y-6">
            {/* Özet şeridi */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Başvurular</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{profiles.length + cvOrders.length}</p>
                {(lastProfile || cvOrders[0]) && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    Son: {formatDate((lastProfile?.created_at ?? cvOrders[0]?.created_at) as string)}
                  </p>
                )}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Ödemeler</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{displayPayments.length}</p>
                {(displayPayments[0] || lastPayment) && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    Son: {(displayPayments[0] ?? lastPayment)?.status === "success" ? "Başarılı" : (displayPayments[0] ?? lastPayment)?.status === "fail" ? "Başarısız" : "İşlemde"}
                  </p>
                )}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Kanal Abonelikleri</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{subscriptions.length}</p>
                <p className="mt-0.5 text-xs text-slate-500">Hesabınızla senkronize</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Premium Durumu</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {activePremium ? "Aktif" : "Pasif"}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {activePremium
                    ? `Bitiş: ${formatDate(activePremium.ends_at)}`
                    : "Aktif premium bulunmuyor"}
                </p>
              </div>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-900">Premium Aboneliğim</h2>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  activePremium ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                }`}>
                  {activePremium ? "Aktif" : "Pasif"}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Haftalık premium durumunuz, bitiş tarihiniz ve ödeme/kupon kaydınız burada hesabınızla senkronize şekilde gösterilir.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Abonelik, ödeme ve kupon hatırlamaları giriş yaptığınız tüm cihazlarda aynı hesapla geçerlidir.
              </p>
              {premiumSubscriptions.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="font-medium text-slate-700">Henüz premium abonelik kaydınız yok</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Haftalık premium veya kupon kullandığınızda burada görünecek.
                  </p>
                </div>
              ) : (
                <ul className="mt-4 space-y-0 divide-y divide-slate-100">
                  {premiumSubscriptions.map((sub) => {
                    const paymentRow = Array.isArray(sub.payments) ? sub.payments[0] ?? null : sub.payments ?? null;
                    const type = sub.payment_type ?? paymentRow?.payment_type ?? "standard";
                    const coupon = sub.coupon_code ?? paymentRow?.coupon_code ?? null;
                    const active = new Date(sub.ends_at).getTime() > Date.now();

                    return (
                      <li
                        key={sub.id}
                        className="flex min-w-0 flex-wrap items-center gap-3 py-4 first:pt-0 sm:flex-nowrap"
                      >
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                          active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                        }`}>
                          {active ? "Aktif" : "Süresi doldu"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800">
                            {PAYMENT_TYPE_LABELS[type] ?? "Standart"} premium
                          </p>
                          <p className="text-xs text-slate-500">
                            Başlangıç: {formatDate(sub.created_at)} · Bitiş: {formatDate(sub.ends_at)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {paymentRow ? `Ödeme: ${paymentRow.amount} ${paymentRow.currency}` : "Ödeme: kupon ile aktif edildi"}
                            {coupon ? ` · Kupon: ${coupon}` : ""}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Yurtdışı İş Başvuru Desteği</h2>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">Satın alım kartınız</p>
                </div>
                <Link
                  href="/yurtdisi-is-basvuru-destegi"
                  className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline"
                >
                  Hizmet sayfası →
                </Link>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Hizmet durumu, ödeme özeti ve başvuru kapsamı aşağıdaki premium kartlarda ayrıntılı gösterilir; sıradan
                ödeme satırlarından ayrılmıştır.
              </p>
              {yurtdisiBasvurular.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="font-medium text-slate-700">Bu hizmete ait kayıt yok</p>
                  <p className="mt-1 text-sm text-slate-500">Ödeme tamamlandığında kartınız burada listelenir.</p>
                </div>
              ) : (
                <div className="mt-5 flex flex-col gap-5">
                  {yurtdisiBasvurular.map((row) => (
                    <YurtdisiBasvuruPurchaseCard key={row.id} row={row} />
                  ))}
                </div>
              )}
            </section>

            {/* Aboneliklerim */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-900">Aboneliklerim</h2>
                <Link
                  href="/aboneliklerim"
                  className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline"
                >
                  Tümünü yönet →
                </Link>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Yurtdışı iş ilanı kanallarına abonelikleriniz. Abonelikten çıkmak istediğiniz kanalı buradan kaldırabilirsiniz.
              </p>
              {subscriptions.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="font-medium text-slate-700">Henüz kanal aboneliğiniz yok</p>
                  <p className="mt-1 text-sm text-slate-500">
                    <Link href="/ucretsiz-yurtdisi-is-ilanlari" className="text-brand-600 hover:underline">
                      Ücretsiz ilan akışından
                    </Link>{" "}
                    kanallara abone olabilirsiniz.
                  </p>
                </div>
              ) : (
                <ul className="mt-4 space-y-0 divide-y divide-slate-100">
                  {subscriptions.map((sub) => {
                    const ch = sub.channels;
                    if (!ch) return null;
                    const flagSrc = `${FLAG_CDN}/w80/${ch.country_code.toLowerCase()}.png`;
                    return (
                      <li
                        key={sub.id}
                        className="flex min-w-0 flex-wrap items-center gap-3 py-4 first:pt-0 sm:flex-nowrap"
                      >
                        <span className="flex h-8 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-slate-100">
                          <img src={flagSrc} alt="" className="h-full w-full object-contain object-center" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-800">{ch.name}</p>
                          <p className="text-xs text-slate-500">Abone olma: {formatDate(sub.created_at)}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Link
                            href={`/kanal/${ch.slug}`}
                            className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
                          >
                            Akışı Aç
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleUnsubscribe(sub.id)}
                            disabled={unsubscribing === sub.id}
                            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                          >
                            {unsubscribing === sub.id ? "Çıkılıyor…" : "Abonelikten Çık"}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* Başvurularım */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Başvurularım</h2>
              {profiles.length === 0 && cvOrders.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="font-medium text-slate-700">Henüz başvurun yok</p>
                  <p className="mt-1 text-sm text-slate-500">
                    CV&apos;ni oluşturup buradan geçmişini takip edebilirsin.
                  </p>
                  <Link
                    href="/yurtdisi-cv-paketi"
                    className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    CV bilgilerini tamamla
                  </Link>
                </div>
              ) : (
                <ul className="mt-4 space-y-0 divide-y divide-slate-100">
                  {cvOrders.map((o) => (
                    <li
                      key={o.id}
                      className="flex min-w-0 flex-wrap items-center gap-3 py-4 first:pt-0 sm:flex-nowrap"
                    >
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                        o.payment_status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                      }`}>
                        {o.payment_status === "paid" ? "Ödendi" : "Ödeme bekliyor"}
                      </span>
                      <span className="min-w-0 flex-1 text-sm text-slate-700">
                        CV Paketi · {[o.target_country, o.job_category, o.job_title].filter(Boolean).join(" / ") || "Form kaydı"}
                      </span>
                      <span className="shrink-0 text-xs text-slate-500">{formatDate(o.created_at)}</span>
                    </li>
                  ))}
                  {profiles.map((p) => (
                    <li
                      key={p.id}
                      className="flex min-w-0 flex-wrap items-center gap-3 py-4 first:pt-0 sm:flex-nowrap"
                    >
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                          p.status === "delivered"
                            ? "bg-emerald-100 text-emerald-700"
                            : p.status === "failed"
                              ? "bg-red-100 text-red-700"
                              : p.status === "processing" || p.status === "paid"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {PROFILE_STATUS_LABELS[p.status] ?? p.status}
                      </span>
                      <span className="min-w-0 flex-1 text-sm text-slate-700">
                        {METHOD_LABELS[p.method] ?? p.method}
                        {(p.country || p.job_area) && (
                          <> · {[p.country, p.job_area, p.job_branch].filter(Boolean).join(" / ")}</>
                        )}
                      </span>
                      <span className="shrink-0 text-xs text-slate-500">{formatDate(p.created_at)}</span>
                      <span className="shrink-0 text-xs text-slate-400">Detay</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Ödemelerim */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Diğer ödemelerim</h2>
              <p className="mt-1 text-sm text-slate-500">
                Yurtdışı İş Başvuru Desteği <span className="font-medium">başarılı</span> ödemeleri yukarıdaki
                hizmet kartlarındadır. Burada yalnızca diğer ürünler veya yarım kalan / başarısız yurtdışı denemeleri
                listelenir.
              </p>
              {paymentsExcludingYurtdisi.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="font-medium text-slate-700">Gösterilecek başka ödeme satırı yok</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Sadece Yurtdışı Başvuru Desteği aldıysanız özet yukarıdadır; diğer işlemleriniz eklendikçe burada
                    görünür.
                  </p>
                </div>
              ) : (
                <ul className="mt-4 space-y-0 divide-y divide-slate-100">
                  {paymentsExcludingYurtdisi.map((pay) => (
                    <li
                      key={pay.id}
                      className="flex min-w-0 flex-wrap items-center gap-3 py-4 first:pt-0 sm:flex-nowrap"
                    >
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                          pay.status === "success"
                            ? "bg-emerald-100 text-emerald-700"
                            : pay.status === "fail"
                              ? "bg-red-100 text-red-700"
                              : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {pay.status === "success" ? "Başarılı" : pay.status === "fail" ? "Başarısız" : "İşlemde"}
                      </span>
                      <span className="min-w-0 flex-1 text-sm text-slate-700">
                        <span className="font-medium text-slate-800">
                          {pay.amount > 0 ? `${pay.amount} ${pay.currency}` : "Kupon ile aktivasyon"}
                        </span>
                        <span className="ml-2 text-xs text-slate-500">
                          · {PAYMENT_TYPE_LABELS[pay.payment_type ?? "standard"] ?? "Standart"}
                          {pay.coupon_code ? ` · Kupon: ${pay.coupon_code}` : ""}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-slate-500">{formatDate(pay.created_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">İşlem Geçmişi</h2>
              <p className="mt-1 text-sm text-slate-500">
                Ödeme, abonelik ve başvuru hareketleriniz zaman sırasıyla burada tutulur.
              </p>
              {activityItems.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="font-medium text-slate-700">Henüz işlem kaydı yok</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Ödeme veya başvuru işlemi yaptığınızda burada görünecek.
                  </p>
                </div>
              ) : (
                <ul className="mt-4 space-y-0 divide-y divide-slate-100">
                  {activityItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex min-w-0 flex-wrap items-start gap-3 py-4 first:pt-0 sm:flex-nowrap"
                    >
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${item.tone}`}>
                        {item.badge}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800">{item.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{item.detail}</p>
                      </div>
                      <span className="shrink-0 text-xs text-slate-500">{formatDateTime(item.created_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

          </div>
        )}

        <div className="mt-8">
          <Link href="/" className="text-sm text-slate-600 underline hover:text-slate-900">
            ← Ana sayfaya dön
          </Link>
        </div>
      </main>
    </div>
  );
}
