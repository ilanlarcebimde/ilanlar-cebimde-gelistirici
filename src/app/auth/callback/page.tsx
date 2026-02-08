"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    const code = searchParams.get("code");
    // URL'deki next bazen OAuth redirect'te kayboluyor; sessionStorage'dan yedekle
    const nextFromUrl = searchParams.get("next");
    const nextFromStorage =
      typeof window !== "undefined" ? sessionStorage.getItem("auth_redirect_next") : null;
    const next = nextFromUrl ?? nextFromStorage ?? "/panel";
    if (typeof window !== "undefined" && nextFromStorage) {
      sessionStorage.removeItem("auth_redirect_next");
    }

    if (!code) {
      setStatus("error");
      return;
    }

    supabase.auth
      .exchangeCodeForSession(code)
      .then(async () => {
        if (next === "/odeme") {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.email) {
            const meta = user.user_metadata || {};
            const user_name =
              (typeof meta.full_name === "string" && meta.full_name.trim()) ||
              (typeof meta.name === "string" && meta.name.trim()) ||
              [meta.given_name, meta.family_name].filter(Boolean).join(" ").trim() ||
              user.email.split("@")[0] ||
              "Müşteri";
            sessionStorage.setItem(
              "paytr_pending",
              JSON.stringify({ email: user.email, user_name })
            );
          }
        }
        setStatus("ok");
        window.location.href = next;
      })
      .catch(() => setStatus("error"));
  }, [searchParams]);

  return (
    <div className="min-h-[40vh] flex items-center justify-center p-4">
      {status === "loading" && (
        <p className="text-slate-600">Giriş tamamlanıyor…</p>
      )}
      {status === "ok" && (
        <p className="text-slate-600">Yönlendiriliyorsunuz…</p>
      )}
      {status === "error" && (
        <div className="text-center">
          <p className="text-red-600 font-medium">Giriş yapılamadı.</p>
          <a href="/" className="mt-2 inline-block text-slate-600 underline">
            Ana sayfaya dön
          </a>
        </div>
      )}
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[40vh] flex items-center justify-center p-4">
          <p className="text-slate-600">Giriş tamamlanıyor…</p>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
