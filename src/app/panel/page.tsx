"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { supabase, normalizeProfileRow } from "@/lib/supabase";
import { Copy, RefreshCw, Info, Play } from "lucide-react";

/** /assistant?session=... sayfası yoksa "Devam et" ve boş state CTA disabled gösterilir. */
const ASSISTANT_PAGE_AVAILABLE = false;

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
};
type SessionRow = {
  session_id: string;
  completed: boolean;
  updated_at: string;
};

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

function formatDate(iso: string) {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

/** session_id'nin son 6-8 karakteri (ekranda ham id göstermemek için). */
function getSessionShortId(session_id: string): string {
  return session_id.length >= 8 ? session_id.slice(-8) : session_id;
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
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [sessionInfoOpen, setSessionInfoOpen] = useState(false);
  const sessionInfoRef = useRef<HTMLDivElement>(null);
  const sessionInfoTriggerRef = useRef<HTMLButtonElement>(null);

  const fetchData = useCallback(() => {
    if (!user) return;
    setFetchError(null);
    setLoading(true);
    const uid = user.id;
    Promise.all([
      supabase
        .from("profiles")
        .select("id, status, method, country, job_area, job_branch, created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false }),
      supabase
        .from("payments")
        .select("id, status, amount, currency, created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false }),
      supabase
        .from("assistant_sessions")
        .select("session_id, completed, updated_at")
        .eq("user_id", uid)
        .order("updated_at", { ascending: false }),
    ])
      .then(([p, pay, s]) => {
        const rows = (p.data as ProfileRow[]) ?? [];
        setProfiles(rows.map((r) => normalizeProfileRow(r) ?? r));
        setPayments((pay.data as PaymentRow[]) ?? []);
        setSessions((s.data as SessionRow[]) ?? []);
      })
      .catch(() => setFetchError("Veriler yüklenirken bir hata oluştu."))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user, fetchData]);

  useEffect(() => {
    if (!sessionInfoOpen) return;
    const onEscape = (e: KeyboardEvent) => e.key === "Escape" && setSessionInfoOpen(false);
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        sessionInfoRef.current?.contains(target) ||
        sessionInfoTriggerRef.current?.contains(target)
      )
        return;
      setSessionInfoOpen(false);
    };
    window.addEventListener("keydown", onEscape);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      window.removeEventListener("keydown", onEscape);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [sessionInfoOpen]);

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
  const sessionsOngoing = sessions.filter((s) => !s.completed).length;
  const sessionsDone = sessions.filter((s) => s.completed).length;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      // Basit geri bildirim; isteğe bağlı toast eklenebilir
    });
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
          Geçmiş başvuruların, ödemelerin ve oturumların burada. Verilerin güvenle saklanır.
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Başvurular</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{profiles.length}</p>
                {lastProfile && (
                  <p className="mt-0.5 text-xs text-slate-500">Son: {formatDate(lastProfile.created_at)}</p>
                )}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Ödemeler</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{payments.length}</p>
                {lastPayment && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    Son: {lastPayment.status === "success" ? "Başarılı" : lastPayment.status === "fail" ? "Başarısız" : "İşlemde"}
                  </p>
                )}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Oturumlar</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{sessions.length}</p>
                {sessions.length > 0 && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    {sessionsOngoing} devam ediyor, {sessionsDone} tamamlandı
                  </p>
                )}
              </div>
            </div>

            {/* Başvurularım */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Başvurularım</h2>
              {profiles.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="font-medium text-slate-700">Henüz başvurun yok</p>
                  <p className="mt-1 text-sm text-slate-500">
                    CV&apos;ni oluşturup buradan geçmişini takip edebilirsin.
                  </p>
                  <Link
                    href="/#yontem-secimi"
                    className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    CV bilgilerini tamamla
                  </Link>
                </div>
              ) : (
                <ul className="mt-4 space-y-0 divide-y divide-slate-100">
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
              <h2 className="text-lg font-semibold text-slate-900">Ödemelerim</h2>
              {payments.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="font-medium text-slate-700">Henüz ödeme kaydın yok</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Bir işlem yaptığında burada görünecek.
                  </p>
                </div>
              ) : (
                <ul className="mt-4 space-y-0 divide-y divide-slate-100">
                  {payments.map((pay) => (
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
                        {pay.amount} {pay.currency}
                      </span>
                      <span className="shrink-0 text-xs text-slate-500">{formatDate(pay.created_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Asistan Oturumlarım */}
            <section className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="relative flex items-start gap-2">
                <h2 className="text-lg font-semibold text-slate-900">Asistan Oturumlarım</h2>
                <button
                  ref={sessionInfoTriggerRef}
                  type="button"
                  onClick={() => setSessionInfoOpen((o) => !o)}
                  className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Oturum bilgisi"
                >
                  <Info className="h-4 w-4" />
                </button>
                {sessionInfoOpen && (
                  <div
                    ref={sessionInfoRef}
                    role="tooltip"
                    className="absolute left-0 top-full z-50 mt-1 max-w-[260px] rounded-lg border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-600 shadow-lg"
                  >
                    Oturum, sesli asistan/sohbet sırasında toplanan bilgilerin kaydıdır. Devam eden
                    oturumlar daha sonra sürdürülebilir.
                  </div>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Sesli asistan ve sohbet üzerinden yaptığın görüşmelerin kayıtları. Kaldığın yerden
                devam edebilirsin.
              </p>
              {sessions.length === 0 ? (
                <div className="py-5 text-center">
                  <p className="font-medium text-slate-700">Henüz asistan oturumun yok</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Sesli asistan veya sohbet ile CV&apos;ni oluşturduğunda burada görünür.
                  </p>
                  {ASSISTANT_PAGE_AVAILABLE ? (
                    <Link
                      href="/assistant"
                      className="mt-3 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    >
                      <Play className="h-4 w-4" />
                      Sesli asistanı başlat
                    </Link>
                  ) : (
                    <span
                      className="mt-3 inline-flex cursor-not-allowed items-center gap-2 rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-500"
                      aria-disabled
                    >
                      <Play className="h-4 w-4" />
                      Sesli asistanı başlat
                    </span>
                  )}
                </div>
              ) : (
                <>
                  <p className="mt-3 text-xs text-slate-400">Bu liste hesabınla senkronizedir.</p>
                  <ul className="mt-2 space-y-0 divide-y divide-slate-100">
                    {sessions.map((s) => (
                      <li
                        key={s.session_id}
                        className="flex min-w-0 flex-wrap items-center gap-2 py-3 first:pt-2 sm:flex-nowrap"
                      >
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                            s.completed
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {s.completed ? "Tamamlandı" : "Devam ediyor"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-800">
                            Oturum: #{getSessionShortId(s.session_id)}
                          </p>
                          <p className="text-xs text-slate-500">
                            Son güncelleme: {formatDate(s.updated_at)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(s.session_id, "Oturum ID")}
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            aria-label="Oturum ID kopyala"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          {!s.completed &&
                            (ASSISTANT_PAGE_AVAILABLE ? (
                              <Link
                                href={`/assistant?session=${encodeURIComponent(s.session_id)}`}
                                className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                              >
                                Devam et
                              </Link>
                            ) : (
                              <span
                                className="cursor-not-allowed rounded-lg bg-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-500"
                                aria-disabled
                              >
                                Devam et
                              </span>
                            ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
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
