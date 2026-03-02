"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toTurkishAuthError } from "@/lib/authErrors";

type AuthMode = "login" | "signup" | "forgot";

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export function AuthModal({
  open,
  onClose,
  onGoogle,
  onEmailSubmit,
  redirectNext,
}: {
  open: boolean;
  onClose: () => void;
  onGoogle: () => void;
  onEmailSubmit: (email: string, password: string) => void;
  redirectNext?: string;
}) {
  const pathname = usePathname();
  const next = redirectNext ?? (pathname && pathname !== "/giris" ? pathname : "/panel");

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (open) {
      setMode("login");
      setError("");
      setSuccessMessage("");
      setEmail("");
      setPassword("");
      setPasswordConfirm("");
    }
  }, [open]);

  const resetForm = () => {
    setError("");
    setSuccessMessage("");
    setEmail("");
    setPassword("");
    setPasswordConfirm("");
  };

  const goTo = (m: AuthMode) => {
    resetForm();
    setMode(m);
  };

  const handleGoogle = async () => {
    setError("");
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    if (typeof window !== "undefined") {
      sessionStorage.setItem("auth_redirect_next", next);
    }
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (err) {
      setError(toTurkishAuthError(err.message));
      if (typeof window !== "undefined") sessionStorage.removeItem("auth_redirect_next");
      return;
    }
    onGoogle();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        setError(toTurkishAuthError(err.message));
        return;
      }
      onEmailSubmit(email, password);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    if (passwordConfirm && password !== passwordConfirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.");
      return;
    }
    setLoading(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${origin}/auth/callback` },
      });
      if (err) {
        setError(toTurkishAuthError(err.message));
        return;
      }
      setSuccessMessage("E-posta doğrulama bağlantısı gönderildi. Lütfen e-postanızı kontrol edin.");
      setTimeout(() => {
        goTo("login");
      }, 2500);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/reset-password`,
      });
      if (err) {
        setError(toTurkishAuthError(err.message));
        return;
      }
      setSuccessMessage("Şifre sıfırlama bağlantısı e-postanıza gönderildi. Lütfen gelen kutunuzu kontrol edin.");
      setTimeout(() => goTo("login"), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const titles: Record<AuthMode, string> = {
    login: "Giriş Yap",
    signup: "Kayıt Ol",
    forgot: "Şifremi Unuttum",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 id="auth-modal-title" className="text-xl font-bold text-slate-900">
            {titles[mode]}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800" role="status">
            {successMessage}
          </div>
        ) : null}

        <AnimatePresence mode="wait">
          {mode === "login" && (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <button
                type="button"
                onClick={handleGoogle}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 py-3 font-medium text-slate-800 transition-colors hover:bg-slate-50"
              >
                <GoogleIcon />
                Google ile giriş
              </button>
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-sm text-slate-500">veya</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="auth-email" className="mb-1 block text-sm font-medium text-slate-700">
                    E-posta
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="ornek@email.com"
                    autoComplete="email"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label htmlFor="auth-password" className="mb-1 block text-sm font-medium text-slate-700">
                    Şifre
                  </label>
                  <input
                    id="auth-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-slate-800 py-3 font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Giriş yapılıyor…
                    </span>
                  ) : (
                    "E-posta ile giriş"
                  )}
                </button>
              </form>
              <div className="flex flex-col gap-2 pt-2 text-center text-sm">
                <button
                  type="button"
                  onClick={() => goTo("signup")}
                  className="text-slate-600 underline hover:text-slate-900"
                >
                  Hesabın yok mu? Kayıt ol
                </button>
                <button
                  type="button"
                  onClick={() => goTo("forgot")}
                  className="text-slate-600 underline hover:text-slate-900"
                >
                  Şifremi unuttum
                </button>
              </div>
            </motion.div>
          )}

          {mode === "signup" && (
            <motion.div
              key="signup"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <button
                type="button"
                onClick={handleGoogle}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 py-3 font-medium text-slate-800 transition-colors hover:bg-slate-50"
              >
                <GoogleIcon />
                Google ile giriş
              </button>
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-sm text-slate-500">veya</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label htmlFor="signup-email" className="mb-1 block text-sm font-medium text-slate-700">
                    E-posta
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="ornek@email.com"
                    autoComplete="email"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label htmlFor="signup-password" className="mb-1 block text-sm font-medium text-slate-700">
                    Şifre
                  </label>
                  <input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="En az 6 karakter"
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label htmlFor="signup-password-confirm" className="mb-1 block text-sm font-medium text-slate-700">
                    Şifre tekrar (opsiyonel)
                  </label>
                  <input
                    id="signup-password-confirm"
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-slate-800 py-3 font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Gönderiliyor…
                    </span>
                  ) : (
                    "Kayıt Ol"
                  )}
                </button>
              </form>
              <p className="text-center text-sm text-slate-600">
                Zaten hesabın var mı?{" "}
                <button type="button" onClick={() => goTo("login")} className="underline hover:text-slate-900">
                  Girişe dön
                </button>
              </p>
            </motion.div>
          )}

          {mode === "forgot" && (
            <motion.div
              key="forgot"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <p className="text-sm text-slate-600">
                E-posta adresinizi girin, size şifre sıfırlama bağlantısı göndereceğiz.
              </p>
              <form onSubmit={handleForgot} className="space-y-4">
                <div>
                  <label htmlFor="forgot-email" className="mb-1 block text-sm font-medium text-slate-700">
                    E-posta
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="ornek@email.com"
                    autoComplete="email"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-slate-800 py-3 font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Gönderiliyor…
                    </span>
                  ) : (
                    "Sıfırlama bağlantısı gönder"
                  )}
                </button>
              </form>
              <p className="text-center text-sm text-slate-600">
                <button type="button" onClick={() => goTo("login")} className="underline hover:text-slate-900">
                  Girişe dön
                </button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
