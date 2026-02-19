"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

function fetchCount(userId: string): Promise<number> {
  return supabase
    .from("channel_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .then(({ count: c }) => c ?? 0);
}

export function useSubscriptionCount(userId: string | undefined) {
  const [count, setCount] = useState<number>(0);

  const refresh = useCallback(() => {
    if (!userId) return;
    fetchCount(userId).then(setCount);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setCount(0);
      return;
    }
    fetchCount(userId).then(setCount);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("subscription-count-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "channel_subscriptions", filter: `user_id=eq.${userId}` },
        () => refresh()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refresh]);

  return count;
}
