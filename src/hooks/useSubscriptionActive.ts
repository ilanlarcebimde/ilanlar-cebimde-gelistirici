"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

async function fetchSubscriptionActive(userId: string): Promise<boolean> {
  const now = new Date().toISOString();
  const { data: premium } = await supabase
    .from("premium_subscriptions")
    .select("id")
    .eq("user_id", userId)
    .gt("ends_at", now)
    .limit(1);
  if ((premium?.length ?? 0) > 0) return true;
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "paid")
    .limit(1);
  return (profiles?.length ?? 0) > 0;
}

/**
 * Kullanıcının premium aboneliği aktif mi?
 * - Haftalık abonelik: premium_subscriptions.ends_at > now() ise aktif.
 * - Eski kayıtlar (migration öncesi): premium_subscriptions yoksa profiles.status === "paid" ile fallback.
 * - refetch: Abonelik kontrolünü tekrar çalıştırır (ödeme dönüşü / layout retry için).
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
    } catch {
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
      } catch {
        if (!cancelled) {
          setActive(false);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { active, loading, refetch };
}
