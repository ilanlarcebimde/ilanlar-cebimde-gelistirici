"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { supabase, normalizeProfileRow } from "@/lib/supabase";

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

export default function PanelPage() {
  const { user, loading: authLoading } = useAuth();
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const uid = user.id;

    Promise.all([
      supabase.from("profiles").select("id, status, method, country, job_area, job_branch, created_at").eq("user_id", uid).order("created_at", { ascending: false }),
      supabase.from("payments").select("id, status, amount, currency, created_at").eq("user_id", uid).order("created_at", { ascending: false }),
      supabase.from("assistant_sessions").select("session_id, completed, updated_at").eq("user_id", uid).order("updated_at", { ascending: false }),
    ])
      .then(([p, pay, s]) => {
        const rows = (p.data as ProfileRow[]) ?? [];
        setProfiles(rows.map((r) => normalizeProfileRow(r) as ProfileRow));
        setPayments((pay.data as PaymentRow[]) ?? []);
        setSessions((s.data as SessionRow[]) ?? []);
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        {!user && !authLoading ? (
          <div className="text-center">
            <p className="text-slate-600 mb-4">Giriş yaparak hesabınızı görüntüleyebilirsiniz.</p>
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

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-slate-900">
            <Image src="/logo.png" alt="Logo" width={32} height={32} className="object-contain" />
            <span className="font-bold">İlanlar Cebimde</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 truncate max-w-[160px]">{user.email ?? ""}</span>
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Hesabım</h1>

        {loading ? (
          <p className="text-slate-600">Veriler yükleniyor…</p>
        ) : (
          <div className="space-y-8">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Profil / Başvurular</h2>
              {profiles.length === 0 ? (
                <p className="text-slate-500 text-sm">Henüz kayıtlı profil yok.</p>
              ) : (
                <ul className="space-y-3">
                  {profiles.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center gap-2 text-sm border-b border-slate-100 pb-3 last:border-0">
                      <span className="font-medium text-slate-800">{p.status}</span>
                      <span className="text-slate-500">•</span>
                      <span>{p.method}</span>
                      {(p.country || p.job_area) && (
                        <>
                          <span className="text-slate-500">•</span>
                          <span>{[p.country, p.job_area, p.job_branch].filter(Boolean).join(" / ")}</span>
                        </>
                      )}
                      <span className="text-slate-400 text-xs">{new Date(p.created_at).toLocaleDateString("tr-TR")}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Ödeme Geçmişi</h2>
              {payments.length === 0 ? (
                <p className="text-slate-500 text-sm">Henüz ödeme kaydı yok.</p>
              ) : (
                <ul className="space-y-3">
                  {payments.map((pay) => (
                    <li key={pay.id} className="flex flex-wrap items-center gap-2 text-sm border-b border-slate-100 pb-3 last:border-0">
                      <span className={`font-medium ${pay.status === "success" ? "text-emerald-600" : pay.status === "fail" ? "text-red-600" : "text-slate-800"}`}>
                        {pay.status === "success" ? "Başarılı" : pay.status === "fail" ? "Başarısız" : "İşlemde"}
                      </span>
                      <span>{pay.amount} {pay.currency}</span>
                      <span className="text-slate-400 text-xs">{new Date(pay.created_at).toLocaleDateString("tr-TR")}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Sesli Asistan Oturumları</h2>
              {sessions.length === 0 ? (
                <p className="text-slate-500 text-sm">Bu hesapla bağlı oturum bulunamadı. Giriş yaptıktan sonra başlattığınız oturumlar burada listelenir.</p>
              ) : (
                <ul className="space-y-3">
                  {sessions.map((s) => (
                    <li key={s.session_id} className="flex flex-wrap items-center gap-2 text-sm border-b border-slate-100 pb-3 last:border-0">
                      <span className={s.completed ? "text-emerald-600 font-medium" : "text-slate-600"}>
                        {s.completed ? "Tamamlandı" : "Devam ediyor"}
                      </span>
                      <span className="text-slate-400 text-xs font-mono">{s.session_id.slice(0, 12)}…</span>
                      <span className="text-slate-400 text-xs">{new Date(s.updated_at).toLocaleDateString("tr-TR")}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}

        <div className="mt-8">
          <Link href="/" className="text-slate-600 underline text-sm hover:text-slate-900">
            ← Ana sayfaya dön
          </Link>
        </div>
      </main>
    </div>
  );
}
