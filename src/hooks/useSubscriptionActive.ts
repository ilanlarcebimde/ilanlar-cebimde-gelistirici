"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Kullanıcının premium aboneliği (en az bir profile status === "paid") var mı?
 * Abonelik kontrolü: profiles tablosunda user_id ile eşleşen ve status = 'paid' olan kayıt.
 */
export function useSubscriptionActive(userId: string | undefined): boolean {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!userId) {
      setActive(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "paid")
          .limit(1);
        if (!cancelled) setActive((data?.length ?? 0) > 0);
      } catch {
        if (!cancelled) setActive(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return active;
}
