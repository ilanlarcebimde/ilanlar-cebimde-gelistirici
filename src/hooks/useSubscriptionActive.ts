"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Kullanıcının premium aboneliği aktif mi?
 * - Haftalık abonelik: premium_subscriptions.ends_at > now() ise aktif.
 * - Eski kayıtlar (migration öncesi): premium_subscriptions yoksa profiles.status === "paid" ile fallback.
 */
export function useSubscriptionActive(userId: string | undefined): { active: boolean; loading: boolean } {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(!!userId);

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
        const now = new Date().toISOString();
        const { data: premium } = await supabase
          .from("premium_subscriptions")
          .select("id")
          .eq("user_id", userId)
          .gt("ends_at", now)
          .limit(1);
        if (!cancelled && (premium?.length ?? 0) > 0) {
          setActive(true);
          setLoading(false);
          return;
        }
        if (cancelled) return;
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "paid")
          .limit(1);
        if (!cancelled) {
          setActive((profiles?.length ?? 0) > 0);
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

  return { active, loading };
}
