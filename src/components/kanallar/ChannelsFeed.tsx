"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { FeedPostCard, type FeedPost } from "@/components/kanal/FeedPostCard";
import { FeedSkeleton } from "@/components/kanal/FeedSkeleton";

const FLAG_CDN = "https://flagcdn.com";
const PAGE_SIZE = 30;

type Channel = {
  id: string;
  slug: string;
  name: string;
  country_code: string;
  brand_color: string | null;
  description: string | null;
};

type ChannelsFeedProps = {
  selectedSlug: string | null;
  onHowToApplyClick?: (post: FeedPost) => void;
};

export function ChannelsFeed({ selectedSlug, onHowToApplyClick }: ChannelsFeedProps) {
  const { user } = useAuth();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchChannel = useCallback(async (slug: string) => {
    const { data } = await supabase
      .from("channels")
      .select("id, slug, name, country_code, brand_color, description")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();
    return data as Channel | null;
  }, []);

  const fetchPage = useCallback(async (channelId: string, page: number) => {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, count } = await supabase
      .from("job_posts")
      .select("id, title, position_text, location_text, source_name, source_url, snippet, published_at", { count: "exact" })
      .eq("channel_id", channelId)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .range(from, to);
    return { data: (data ?? []) as FeedPost[], count: count ?? 0 };
  }, []);

  const loadChannel = useCallback(async () => {
    if (!selectedSlug) {
      setChannel(null);
      setPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const ch = await fetchChannel(selectedSlug);
    if (!ch) {
      setError("Kanal bulunamadı.");
      setLoading(false);
      return;
    }

    setChannel(ch);

    const { data, count } = await fetchPage(ch.id, 1);
    setPosts(data);
    setTotalCount(count);
    setCurrentPage(1);
    setLoading(false);
  }, [selectedSlug, fetchChannel, fetchPage]);

  useEffect(() => {
    loadChannel();
  }, [loadChannel]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const goToPage = useCallback(
    (page: number) => {
      if (!channel || page < 1 || page > totalPages || pageLoading) return;
      setPageLoading(true);
      fetchPage(channel.id, page).then(({ data, count }) => {
        setPosts(data);
        setTotalCount(count);
        setCurrentPage(page);
        setPageLoading(false);
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [channel, totalPages, pageLoading, fetchPage]
  );

  const getBrandColor = (color: string | null) => {
    if (!color) return "rgb(59, 130, 246)";
    return color;
  };

  // Boş durum: Kanal seçilmemiş
  if (!selectedSlug) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <p className="text-lg font-medium text-slate-800 mb-2">
            Henüz hiçbir kanala abone değilsiniz.
          </p>
          <p className="text-sm text-slate-500">
            Soldaki Keşfet bölümünden bir kanal seçin.
          </p>
        </div>
      </div>
    );
  }

  // Yükleniyor
  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6">
          <div className="mb-6">
            <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="space-y-4">
            <FeedSkeleton />
            <FeedSkeleton />
            <FeedSkeleton />
          </div>
        </div>
      </div>
    );
  }

  // Hata
  if (error || !channel) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-2">{error ?? "Kanal bulunamadı."}</p>
        </div>
      </div>
    );
  }

  const brandColor = getBrandColor(channel.brand_color);
  const flagSrc = `${FLAG_CDN}/w80/${channel.country_code.toLowerCase()}.png`;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6">
        {/* Kanal başlığı */}
        <header className="mb-6 pb-4 border-b" style={{ borderColor: `${brandColor}30` }}>
          <div className="flex items-center gap-3 mb-2">
            <img src={flagSrc} alt="" className="h-12 w-auto rounded-lg shadow-sm" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{channel.name} İş İlanları</h1>
              {channel.description && (
                <p className="mt-1 text-sm text-slate-600">{channel.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span
              className="rounded-full px-3 py-1 text-xs font-medium text-white"
              style={{ backgroundColor: brandColor }}
            >
              Günlük Güncellenir
            </span>
          </div>
        </header>

        {/* Post listesi */}
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-slate-600">Bu kanalda henüz ilan yok.</p>
            <p className="mt-1 text-sm text-slate-500">Günlük olarak güncellenir.</p>
          </div>
        ) : (
          <>
            <ul className="space-y-4">
              {posts.map((post) => (
                <li key={post.id}>
                  <FeedPostCard post={post} brandColor={brandColor} onHowToApplyClick={onHowToApplyClick} />
                </li>
              ))}
            </ul>

            {totalCount > PAGE_SIZE && (
              <nav className="mt-8 flex flex-wrap items-center justify-center gap-2 border-t border-slate-200 pt-6" aria-label="Sayfa numaraları">
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
                        p === currentPage ? "bg-brand-600 text-white" : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
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
          </>
        )}
      </div>
    </div>
  );
}
