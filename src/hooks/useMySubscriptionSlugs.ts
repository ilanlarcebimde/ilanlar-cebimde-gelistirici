"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useMySubscriptionSlugs(userId: string | undefined): Set<string> {
  const [slugs, setSlugs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) {
      setSlugs(new Set());
      return;
    }
    supabase
      .from("channel_subscriptions")
      .select("channels(slug)")
      .eq("user_id", userId)
      .then(({ data }) => {
        const set = new Set<string>();
        for (const row of data ?? []) {
          const slug = (row as { channels: { slug: string } | null }).channels?.slug;
          if (slug) set.add(slug);
        }
        setSlugs(set);
      });
  }, [userId]);

  return slugs;
}
