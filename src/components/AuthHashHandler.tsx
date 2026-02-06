"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * Supabase bazen OAuth sonrası token'ı callback yerine ana sayfaya hash ile gönderir
 * (#access_token=...&refresh_token=...). Bu bileşen hash'i okuyup oturumu kurar ve
 * panele yönlendirir. Ayrıca Supabase Dashboard'da Redirect URL olarak
 * http://localhost:3000/auth/callback eklenmeli (PKCE için).
 */
export function AuthHashHandler() {
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || handled.current) return;
    const hash = window.location.hash?.replace(/^#/, "");
    if (!hash) return;

    const params = new URLSearchParams(hash);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (!access_token || !refresh_token) return;

    handled.current = true;
    const next = params.get("next") ?? "/panel";

    supabase.auth
      .setSession({ access_token, refresh_token })
      .then(() => {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        router.replace(next);
      })
      .catch(() => {
        handled.current = false;
      });
  }, [router]);

  return null;
}
