"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export function AuthModal({
  open,
  onClose,
  onGoogle,
  onEmailSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onGoogle: () => void;
  onEmailSubmit: (email: string, password: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onEmailSubmit(email, password);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">Giriş Yap</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={onGoogle}
          className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 py-3 font-medium text-slate-800 hover:bg-slate-50 transition-colors"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google ile giriş
        </button>

        <div className="my-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-sm text-slate-500">veya</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <form onSubmit={handleEmail} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="ornek@email.com"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-800 py-3 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? "Giriş yapılıyor…" : "E-posta ile giriş"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
