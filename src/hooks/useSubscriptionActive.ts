"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Aktiflik SADECE premium_subscriptions üzerinden belirlenir.
 * ends_at > now() → aktif (Supabase timestamptz; ISO string ile karşılaştırma tutarlı).
 */
async function fetchSubscriptionActive(userId: string): Promise<boolean> {
  const now = new Date().toISOString();
  const { data: premium, error } = await supabase
    .from("premium_subscriptions")
    .select("id")
    .eq("user_id", userId)
    .gt("ends_at", now)
    .limit(1);

  console.log("SUBSCRIPTION RESULT", {
    userId,
    rowCount: premium?.length ?? 0,
    error: error?.message ?? null,
    active: !error && (premium?.length ?? 0) > 0,
  });

  if (error) {
    console.error("[useSubscriptionActive] premium_subscriptions query error", error.message, { userId });
    return false;
  }
  return (premium?.length ?? 0) > 0;
}

/**
 * Kullanıcının premium aboneliği aktif mi?
 * - Tek kaynak: premium_subscriptions (ends_at > now()).
 * - refetch: Ödeme dönüşü / invalidate event ile yeniden sorgular.
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

  return { active, loading, refetch };
}
