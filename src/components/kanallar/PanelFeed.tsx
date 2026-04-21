"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FeedPostCard, type FeedPost } from "@/components/kanal/FeedPostCard";
import { FeedSkeleton } from "@/components/kanal/FeedSkeleton";

export type OnHowToApplyClick = (post: FeedPost) => void;

const PAGE_SIZE = 30;

type ChannelInfo = { id: string; slug: string; name: string; brand_color: string | null };

type PanelFeedProps = {
  channels: ChannelInfo[];
  selectedChip: string | null;
  searchQuery: string;
  subscribedOnlyEmpty?: boolean;
  onHowToApplyClick?: OnHowToApplyClick;
};

function buildBaseQuery(
  supabaseClient: typeof supabase,
  channelIdForFilter: string | null,
  searchQuery: string
) {
  let q = supabaseClient
    .from("job_posts")
    .select("id, channel_id, title, position_text, location_text, source_name, source_url, snippet, published_at", { count: "exact" })
    .eq("status", "published")
    .order("published_at", { ascending: false });

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
  return q;
}

export function PanelFeed({ channels, selectedChip, searchQuery, subscribedOnlyEmpty = false, onHowToApplyClick }: PanelFeedProps) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [channelMap, setChannelMap] = useState<Record<string, ChannelInfo>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPage, setNextPage] = useState(2);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const channelIdForFilter = selectedChip
    ? channels.find((c) => c.slug === selectedChip)?.id ?? null
    : null;

  const fetchPage = useCallback(
    async (page: number) => {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const q = buildBaseQuery(supabase, channelIdForFilter, searchQuery)
        .range(from, to);
      const { data, count } = await q;
      return { data: (data ?? []) as (FeedPost & { channel_id: string })[], count: count ?? 0 };
    },
    [channelIdForFilter, searchQuery]
  );

  const loadFirstPage = useCallback(
    async () => {
      setLoading(true);
      const map: Record<string, ChannelInfo> = {};
      channels.forEach((c) => {
        map[c.id] = c;
      });
      setChannelMap(map);

      if (subscribedOnlyEmpty && channels.length === 0) {
        setPosts([]);
        setTotalCount(0);
        setHasMore(false);
        setNextPage(2);
        setLoading(false);
        return;
      }

      const { data, count } = await fetchPage(1);
      setPosts(data);
      setTotalCount(count);
      setHasMore(data.length < count);
      setNextPage(2);
      setLoading(false);
    },
    [channels, fetchPage, subscribedOnlyEmpty]
  );

  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const { data, count } = await fetchPage(nextPage);
    setPosts((prev) => [...prev, ...data]);
    setTotalCount(count);
    const loadedCount = (nextPage - 1) * PAGE_SIZE + data.length;
    setHasMore(loadedCount < count && data.length > 0);
    setNextPage((prev) => prev + 1);
    setLoadingMore(false);
  }, [fetchPage, hasMore, loading, loadingMore, nextPage]);

  useEffect(() => {
    if (!hasMore) return;
    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadMore();
        }
      },
      { root: null, rootMargin: "240px 0px", threshold: 0.01 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

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

  if (loading && posts.length === 0) {
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
    <div className="flex flex-1 flex-col overflow-y-auto bg-[#f8fafc]">
      <div className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-6 sm:px-6">
        <ul className="space-y-4">
            {posts.map((post) => {
              const p = post as FeedPost & { channel_id: string };
              const ch = channelMap[p.channel_id];
              const brandColor = ch?.brand_color || "rgb(59, 130, 246)";
              return (
                <li key={post.id}>
                  <FeedPostCard post={post} brandColor={brandColor} onHowToApplyClick={onHowToApplyClick} />
                </li>
              );
            })}
          </ul>

        {totalCount > PAGE_SIZE ? (
          <div className="mt-8 border-t border-slate-200 pt-6">
            <div ref={loadMoreRef} className="h-1 w-full" aria-hidden />
            {hasMore ? (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => void loadMore()}
                  disabled={loadingMore}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
                >
                  {loadingMore ? "Yükleniyor..." : "Daha fazla ilan yükle"}
                </button>
              </div>
            ) : (
              <p className="text-center text-sm text-slate-500">Tüm ilanlar yüklendi.</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
