"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FeedPostCard, type FeedPost } from "@/components/kanal/FeedPostCard";
import { FeedSkeleton } from "@/components/kanal/FeedSkeleton";

const PAGE_SIZE = 15;

type ChannelInfo = { id: string; slug: string; name: string; brand_color: string | null };

type PanelFeedProps = {
  /** Tüm kanallar (chip filtre + channel map). Public feed için tüm aktif kanallar; abonelik modunda abone olunanlar. */
  channels: ChannelInfo[];
  selectedChip: string | null;
  searchQuery: string;
  /** true: abonelik modu – kanal yoksa "Akışınız boş". false: public – boş durumlar farklı. */
  subscribedOnlyEmpty?: boolean;
};

export function PanelFeed({ channels, selectedChip, searchQuery, subscribedOnlyEmpty = false }: PanelFeedProps) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [channelMap, setChannelMap] = useState<Record<string, ChannelInfo>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const oldestPublishedAt = useRef<string | null>(null);

  const channelIdForFilter = selectedChip
    ? channels.find((c) => c.slug === selectedChip)?.id ?? null
    : null;

  const fetchPosts = useCallback(
    async (cursor: string | null) => {
      const select = "id, channel_id, title, position_text, location_text, source_name, source_url, snippet, published_at";
      let q = supabase
        .from("job_posts")
        .select(select)
        .eq("status", "published")
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
    [channelIdForFilter, searchQuery]
  );

  const loadInitial = useCallback(async () => {
    setLoading(true);
    const map: Record<string, ChannelInfo> = {};
    channels.forEach((c) => {
      map[c.id] = c;
    });
    setChannelMap(map);

    if (subscribedOnlyEmpty && channels.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }

    const first = await fetchPosts(null);
    setPosts(first);
    oldestPublishedAt.current = first.length > 0 ? first[first.length - 1].published_at : null;
    setLoading(false);
  }, [channels, fetchPosts, subscribedOnlyEmpty]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !oldestPublishedAt.current) return;
    setLoadingMore(true);
    const next = await fetchPosts(oldestPublishedAt.current);
    if (next.length > 0) {
      setPosts((prev) => [...prev, ...next]);
      oldestPublishedAt.current = next[next.length - 1].published_at;
    } else {
      oldestPublishedAt.current = null;
    }
    setLoadingMore(false);
  }, [loadingMore, fetchPosts]);

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

  if (subscribedOnlyEmpty && channels.length === 0) {
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
      <div className="flex-1 overflow-y-auto bg-[#f8fafc]">
        <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6">
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
    let emptyTitle: string;
    let emptySub: string;
    if (hasSearch) {
      emptyTitle = "Sonuç bulunamadı";
      emptySub = "Farklı bir meslek veya anahtar kelime deneyin.";
    } else if (selectedChip) {
      emptyTitle = "Bu kanalda henüz ilan yok";
      emptySub = "Günlük olarak güncellenir.";
    } else {
      emptyTitle = "Henüz yayın yok";
      emptySub = "İlanlar eklendiğinde burada görünecek.";
    }
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-medium text-slate-800">{emptyTitle}</p>
          <p className="mt-2 text-sm text-slate-500">{emptySub}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc]">
      <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6">
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
