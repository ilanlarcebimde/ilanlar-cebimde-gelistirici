"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useSubscriptionCount(userId: string | undefined) {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    if (!userId) {
      setCount(0);
      return;
    }
    supabase
      .from("channel_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .then(({ count: c }) => setCount(c ?? 0));
  }, [userId]);

  return count;
}
