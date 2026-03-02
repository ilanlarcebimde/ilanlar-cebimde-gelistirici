"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [session, setSession] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(!!s);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(!!s);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) {
        setError(err.message || "Şifre güncellenemedi.");
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/panel";
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  if (session === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <p className="text-slate-600">Yükleniyor…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
          <h1 className="mb-4 text-xl font-bold text-slate-900">Şifre sıfırlama</h1>
          <p className="mb-4 text-sm text-slate-600">
            Bağlantı geçersiz veya süresi dolmuş. Giriş sayfasından &quot;Şifremi unuttum&quot; ile yeni sıfırlama
            bağlantısı alabilirsiniz.
          </p>
          <Link
            href="/giris"
            className="inline-block rounded-xl bg-slate-800 px-4 py-2 font-medium text-white hover:bg-slate-700"
          >
            Giriş sayfasına dön
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
          <p className="text-center font-medium text-green-700">Şifreniz güncellendi. Yönlendiriliyorsunuz…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
        <h1 className="mb-2 text-xl font-bold text-slate-900">Yeni şifre belirleyin</h1>
        <p className="mb-6 text-sm text-slate-600">Hesabınız için yeni bir şifre girin (en az 6 karakter).</p>

        {error ? (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-slate-700">
              Yeni şifre
            </label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              autoComplete="new-password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
            />
          </div>
          <div>
            <label htmlFor="new-password-confirm" className="mb-1 block text-sm font-medium text-slate-700">
              Şifre tekrar
            </label>
            <input
              id="new-password-confirm"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              autoComplete="new-password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-800 py-3 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Güncelleniyor…
              </span>
            ) : (
              "Şifreyi güncelle"
            )}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          <Link href="/giris" className="underline hover:text-slate-900">
            Girişe dön
          </Link>
        </p>
      </div>
    </div>
  );
}
