"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FeedPostCard, type FeedPost } from "@/components/kanal/FeedPostCard";
import { FeedSkeleton } from "@/components/kanal/FeedSkeleton";

const PAGE_SIZE = 15;

type ChannelInfo = { id: string; slug: string; name: string; brand_color: string | null };

type PanelFeedProps = {
  subscribedChannels: ChannelInfo[];
  selectedChip: string | null;
  searchQuery: string;
};

export function PanelFeed({ subscribedChannels, selectedChip, searchQuery }: PanelFeedProps) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [channelMap, setChannelMap] = useState<Record<string, ChannelInfo>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const oldestPublishedAt = useRef<string | null>(null);

  const channelIds = subscribedChannels.map((c) => c.id);
  const channelIdForFilter = selectedChip && selectedChip !== "all"
    ? subscribedChannels.find((c) => c.slug === selectedChip)?.id
    : null;

  const fetchPosts = useCallback(
    async (cursor: string | null) => {
      const select = "id, channel_id, title, position_text, location_text, source_name, source_url, snippet, published_at";
      let q = supabase
        .from("job_posts")
        .select(select)
        .eq("status", "published")
        .in("channel_id", channelIds.length ? channelIds : ["00000000-0000-0000-0000-000000000000"])
        .order("published_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (channelIdForFilter) {
        q = q.eq("channel_id", channelIdForFilter);
      }

      const search = searchQuery.trim();
      if (search) {
        const safe = search.replace(/,/g, " ").trim();
        if (safe) {
          const pattern = `%${safe}%`;
          q = q.or(`title.ilike.${pattern},position_text.ilike.${pattern},location_text.ilike.${pattern},snippet.ilike.${pattern}`);
        }
      }

      if (cursor) {
        q = q.lt("published_at", cursor);
      }

      const { data } = await q;
      return (data ?? []) as (FeedPost & { channel_id: string })[];
    },
    [channelIds, channelIdForFilter, searchQuery]
  );

  const loadInitial = useCallback(async () => {
    setLoading(true);
    const map: Record<string, ChannelInfo> = {};
    subscribedChannels.forEach((c) => {
      map[c.id] = c;
    });
    setChannelMap(map);

    if (subscribedChannels.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }

    const first = await fetchPosts(null);
    setPosts(first);
    oldestPublishedAt.current = first.length > 0 ? first[first.length - 1].published_at : null;
    setLoading(false);
  }, [subscribedChannels, fetchPosts]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !oldestPublishedAt.current || subscribedChannels.length === 0) return;
    setLoadingMore(true);
    const next = await fetchPosts(oldestPublishedAt.current);
    if (next.length > 0) {
      setPosts((prev) => [...prev, ...next]);
      oldestPublishedAt.current = next[next.length - 1].published_at;
    } else {
      oldestPublishedAt.current = null;
    }
    setLoadingMore(false);
  }, [loadingMore, fetchPosts, subscribedChannels.length]);

  const loadMoreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loadingMore && oldestPublishedAt.current) loadMore();
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, loadingMore]);

  if (subscribedChannels.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-medium text-slate-800">Akışınız boş</p>
          <p className="mt-2 text-sm text-slate-500">
            Keşfet&apos;ten abone olun, ilanları burada görün.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          <div className="space-y-4">
            <FeedSkeleton />
            <FeedSkeleton />
            <FeedSkeleton />
          </div>
        </div>
      </div>
    );
  }

  const hasSearch = searchQuery.trim().length > 0;

  if (posts.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          {hasSearch ? (
            <>
              <p className="text-lg font-medium text-slate-800">Aradığınız kriterlere uygun ilan bulunamadı.</p>
              <p className="mt-2 text-sm text-slate-500">Farklı bir meslek adı deneyin.</p>
            </>
          ) : (
            <>
              <p className="text-slate-600">Bu kanalda henüz ilan yok.</p>
              <p className="mt-1 text-sm text-slate-500">Günlük olarak güncellenir.</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <ul className="space-y-4">
          {posts.map((post) => {
            const p = post as FeedPost & { channel_id: string };
            const ch = channelMap[p.channel_id];
            const brandColor = ch?.brand_color || "rgb(59, 130, 246)";
            return (
              <li key={post.id}>
                <FeedPostCard post={post} brandColor={brandColor} />
              </li>
            );
          })}
        </ul>
        {loadingMore && (
          <div className="mt-4 space-y-4">
            <FeedSkeleton />
            <FeedSkeleton />
          </div>
        )}
        <div ref={loadMoreRef} className="h-4 w-full" aria-hidden />
      </div>
    </div>
  );
}
