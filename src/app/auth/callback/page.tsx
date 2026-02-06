"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/panel";

    if (!code) {
      setStatus("error");
      return;
    }

    supabase.auth
      .exchangeCodeForSession(code)
      .then(() => {
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
