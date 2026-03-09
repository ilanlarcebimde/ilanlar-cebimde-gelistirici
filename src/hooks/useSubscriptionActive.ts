"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Panel erişimi SADECE premium_subscriptions (kupon veya haftalık ödeme başarılı).
 * ends_at > now() → aktif. order + limit ile en güncel kayıt.
 */
async function fetchSubscriptionActive(userId: string): Promise<boolean> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("premium_subscriptions")
    .select("id, ends_at")
    .eq("user_id", userId)
    .gt("ends_at", nowIso)
    .order("ends_at", { ascending: false })
    .limit(1);

  const row = data?.[0] ?? null;
  const active = !error && !!row;
  console.log("[SUBSCRIPTION RESULT]", {
    userId,
    nowIso,
    row: row ? { id: row.id, ends_at: row.ends_at } : null,
    error: error?.message ?? null,
    active,
  });
  if (error) {
    console.error("[useSubscriptionActive] premium_subscriptions query error", error.message, { userId });
    return false;
  }
  return active;
}

/**
 * Kullanıcı Nasıl Başvururum paneline erişebilir mi?
 * Sadece premium_subscriptions (kupon kodu veya haftalık ödeme başarılı) → aktif.
 */
export function useSubscriptionActive(userId: string | undefined): {
  active: boolean;
  loading: boolean;
  refetch: () => Promise<boolean>;
} {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(!!userId);

  const refetch = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;
    setLoading(true);
    try {
      const result = await fetchSubscriptionActive(userId);
      setActive(result);
      return result;
    } catch (e) {
      console.error("[useSubscriptionActive] refetch error", e);
      setActive(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setActive(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    let cancelled = false;

    void (async () => {
      try {
        const result = await fetchSubscriptionActive(userId);
        if (!cancelled) {
          setActive(result);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          console.error("[useSubscriptionActive] initial fetch error", e);
          setActive(false);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Ödeme başarılı sayfasından tetiklenen invalidate: tüm hook instance'ları yeniden fetch eder
  useEffect(() => {
    const onInvalidate = () => {
      if (userId) void refetch();
    };
    window.addEventListener("premium-subscription-invalidate", onInvalidate);
    return () => window.removeEventListener("premium-subscription-invalidate", onInvalidate);
  }, [userId, refetch]);

  // Ödeme akışından geri dönüldüğünde (focus/pageshow/visible) abonelik durumunu tazele.
  useEffect(() => {
    if (!userId) return;

    const refreshIfNeeded = () => {
      void refetch();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshIfNeeded();
      }
    };

    window.addEventListener("focus", refreshIfNeeded);
    window.addEventListener("pageshow", refreshIfNeeded);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("focus", refreshIfNeeded);
      window.removeEventListener("pageshow", refreshIfNeeded);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [userId, refetch]);

  return { active, loading, refetch };
}
