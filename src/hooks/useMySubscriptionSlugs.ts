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
          const channels = (row as any).channels;
          let slug: string | undefined;
          if (Array.isArray(channels)) {
            slug = channels[0]?.slug;
          } else if (channels && typeof channels === 'object' && 'slug' in channels) {
            slug = channels.slug;
          }
          if (slug && typeof slug === 'string') set.add(slug);
        }
        setSlugs(set);
      });
  }, [userId]);

  return slugs;
}
