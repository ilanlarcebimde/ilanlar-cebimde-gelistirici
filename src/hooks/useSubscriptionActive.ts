"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Panel erişimi: premium_subscriptions (ödeme/kupon) VEYA en az bir kanal aboneliği.
 * - premium_subscriptions: ends_at > now() → aktif.
 * - channel_subscriptions: Kanallara abone olan kullanıcı da panele erişebilir (giriş + kanal aboneliği yeterli).
 */
async function fetchSubscriptionActive(userId: string): Promise<boolean> {
  const now = new Date().toISOString();

  const [premiumRes, channelRes] = await Promise.all([
    supabase
      .from("premium_subscriptions")
      .select("id")
      .eq("user_id", userId)
      .gt("ends_at", now)
      .limit(1),
    supabase
      .from("channel_subscriptions")
      .select("id")
      .eq("user_id", userId)
      .limit(1),
  ]);

  const hasPremium = !premiumRes.error && (premiumRes.data?.length ?? 0) > 0;
  const hasChannel = !channelRes.error && (channelRes.data?.length ?? 0) > 0;
  const active = hasPremium || hasChannel;

  console.log("SUBSCRIPTION RESULT", {
    userId,
    hasPremium,
    hasChannel,
    active,
  });

  if (premiumRes.error) {
    console.error("[useSubscriptionActive] premium_subscriptions query error", premiumRes.error.message, { userId });
  }
  if (channelRes.error) {
    console.error("[useSubscriptionActive] channel_subscriptions query error", channelRes.error.message, { userId });
  }

  return active;
}

/**
 * Kullanıcı panele (Nasıl Başvururum?) erişebilir mi?
 * - premium_subscriptions (ends_at > now()) VEYA en az bir channel_subscriptions → aktif.
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
