"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export type NotificationChannel = {
  channel_id: string;
  slug: string;
  name: string;
  country_code: string;
  page_url: string | null;
  newCount: number;
  published_seq: number;
  published_last_at: string | null;
};

type ChannelStatsRow = { channel_id: string; published_seq: number; published_last_at: string | null };
type SeenRow = { channel_id: string; last_seen_seq: number };

export function useNotifications(userId: string | undefined) {
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [totalBadge, setTotalBadge] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!userId) {
      setChannels([]);
      setTotalBadge(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: subs } = await supabase
      .from("channel_subscriptions")
      .select("channel_id, channels(id, slug, name, country_code, page_url)")
      .eq("user_id", userId);
    const subList = (subs ?? []).map((r: any) => ({
      channel_id: r.channel_id,
      ch: Array.isArray(r.channels) ? r.channels[0] : r.channels,
    })).filter((x: { ch: any }) => x.ch);
    const channelIds = subList.map((x: { channel_id: string }) => x.channel_id);

    if (channelIds.length === 0) {
      setChannels([]);
      setTotalBadge(0);
      setLoading(false);
      return;
    }

    const [statsRes, seenRes] = await Promise.all([
      supabase.from("channel_stats").select("channel_id, published_seq, published_last_at").in("channel_id", channelIds),
      supabase.from("user_channel_seen").select("channel_id, last_seen_seq").eq("user_id", userId).in("channel_id", channelIds),
    ]);
    const statsMap = new Map<string, ChannelStatsRow>((statsRes.data ?? []).map((r: ChannelStatsRow) => [r.channel_id, r]));
    const seenMap = new Map<string, number>((seenRes.data ?? []).map((r: SeenRow) => [r.channel_id, r.last_seen_seq]));

    const list: NotificationChannel[] = subList.map(({ channel_id, ch }: { channel_id: string; ch: any }) => {
      const stat = statsMap.get(channel_id);
      const lastSeen = seenMap.get(channel_id) ?? 0;
      const publishedSeq = stat?.published_seq ?? 0;
      const newCount = Math.max(0, publishedSeq - lastSeen);
      return {
        channel_id,
        slug: ch?.slug ?? "",
        name: ch?.name ?? "",
        country_code: ch?.country_code ?? "XX",
        page_url: ch?.page_url ?? null,
        newCount,
        published_seq: publishedSeq,
        published_last_at: stat?.published_last_at ?? null,
      };
    });
    setChannels(list);
    setTotalBadge(list.reduce((s, c) => s + c.newCount, 0));
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("notifications-stats-sync")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "channel_stats" },
        () => fetchData()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchData]);

  const markAllSeen = useCallback(async () => {
    if (!userId || channels.length === 0) return;
    await Promise.all(
      channels.map((c) =>
        supabase.from("user_channel_seen").upsert(
          {
            user_id: userId,
            channel_id: c.channel_id,
            last_seen_seq: c.published_seq,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,channel_id" }
        )
      )
    );
    setChannels((prev) => prev.map((c) => ({ ...c, newCount: 0 })));
    setTotalBadge(0);
  }, [userId, channels]);

  return { channels, totalBadge, loading, markAllSeen, refresh: fetchData };
}
