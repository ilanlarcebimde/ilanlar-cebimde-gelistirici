"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FeedPostCard, type FeedPost } from "@/components/kanal/FeedPostCard";
import { FeedSkeleton } from "@/components/kanal/FeedSkeleton";

const PAGE_SIZE = 30;

type ChannelInfo = { id: string; slug: string; name: string; brand_color: string | null };

type PanelFeedProps = {
  channels: ChannelInfo[];
  selectedChip: string | null;
  searchQuery: string;
  subscribedOnlyEmpty?: boolean;
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

export function PanelFeed({ channels, selectedChip, searchQuery, subscribedOnlyEmpty = false }: PanelFeedProps) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [channelMap, setChannelMap] = useState<Record<string, ChannelInfo>>({});
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const channelIdForFilter = selectedChip
    ? channels.find((c) => c.slug === selectedChip)?.id ?? null
    : null;

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

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

  const loadPage = useCallback(
    async (page: number) => {
      setLoading(true);
      const map: Record<string, ChannelInfo> = {};
      channels.forEach((c) => {
        map[c.id] = c;
      });
      setChannelMap(map);

      if (subscribedOnlyEmpty && channels.length === 0) {
        setPosts([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      const { data, count } = await fetchPage(page);
      setPosts(data);
      setTotalCount(count);
      setCurrentPage(page);
      setLoading(false);
    },
    [channels, fetchPage, subscribedOnlyEmpty]
  );

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  const goToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages || pageLoading) return;
      setPageLoading(true);
      fetchPage(page).then(({ data, count }) => {
        setPosts(data);
        setTotalCount(count);
        setCurrentPage(page);
        setPageLoading(false);
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [fetchPage, totalPages, pageLoading]
  );

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

  const showPagination = totalCount > PAGE_SIZE;

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
                  <FeedPostCard post={post} brandColor={brandColor} />
                </li>
              );
            })}
          </ul>

        {showPagination && (
          <nav
            className="mt-8 flex flex-wrap items-center justify-center gap-2 border-t border-slate-200 pt-6"
            aria-label="Sayfa numaraları"
          >
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1 || pageLoading}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
            >
              Önceki
            </button>
            <div className="flex flex-wrap items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => goToPage(p)}
                  disabled={pageLoading}
                  className={`min-w-[2.25rem] rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                    p === currentPage
                      ? "bg-brand-600 text-white"
                      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                  aria-current={p === currentPage ? "page" : undefined}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages || pageLoading}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
            >
              Sonraki
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
