"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    const code = searchParams.get("code");
    const nextFromUrl = searchParams.get("next");
    const subscribeFromUrl = searchParams.get("subscribe");
    const nextFromStorage =
      typeof window !== "undefined" ? sessionStorage.getItem("auth_redirect_next") : null;
    const subscribeFromStorage =
      typeof window !== "undefined" ? sessionStorage.getItem("auth_redirect_subscribe") : null;
    const next = nextFromUrl ?? nextFromStorage ?? "/panel";
    const subscribe = subscribeFromUrl ?? subscribeFromStorage ?? "";
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("auth_redirect_next");
      sessionStorage.removeItem("auth_redirect_subscribe");
    }

    if (!code) {
      setStatus("error");
      return;
    }

    supabase.auth
      .exchangeCodeForSession(code)
      .then(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (subscribe && session?.access_token) {
          try {
            const res = await fetch("/api/subscriptions/ensure", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({ channelSlug: subscribe }),
            });
            if (!res.ok) {
              console.warn("ensure subscription failed", await res.text());
            }
          } catch (e) {
            console.warn("ensure subscription error", e);
          }
        }
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
