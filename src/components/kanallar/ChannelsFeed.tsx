"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { FeedPostCard, type FeedPost } from "@/components/kanal/FeedPostCard";
import { FeedSkeleton } from "@/components/kanal/FeedSkeleton";

const FLAG_CDN = "https://flagcdn.com";
const PAGE_SIZE = 15;

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
};

export function ChannelsFeed({ selectedSlug }: ChannelsFeedProps) {
  const { user } = useAuth();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const oldestPublishedAt = useRef<string | null>(null);

  const fetchChannel = useCallback(async (slug: string) => {
    const { data } = await supabase
      .from("channels")
      .select("id, slug, name, country_code, brand_color, description")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();
    return data as Channel | null;
  }, []);

  const fetchPosts = useCallback(
    async (channelId: string, cursor: string | null) => {
      let q = supabase
        .from("job_posts")
        .select("id, title, position_text, location_text, source_name, source_url, snippet, published_at")
        .eq("channel_id", channelId)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(PAGE_SIZE);
      if (cursor) {
        q = q.lt("published_at", cursor);
      }
      const { data } = await q;
      return (data ?? []) as FeedPost[];
    },
    []
  );

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

    // RLS MOD B: Sadece abone olunan kanalların postları görülebilir
    // Eğer kullanıcı yoksa veya abone değilse boş liste döner
    const first = await fetchPosts(ch.id, null);
    setPosts(first);
    if (first.length > 0) {
      oldestPublishedAt.current = first[first.length - 1].published_at;
    } else {
      oldestPublishedAt.current = null;
    }
    setLoading(false);
  }, [selectedSlug, fetchChannel, fetchPosts]);

  useEffect(() => {
    loadChannel();
  }, [loadChannel]);

  const loadMore = useCallback(async () => {
    if (!channel || loadingMore || !oldestPublishedAt.current) return;
    setLoadingMore(true);
    const next = await fetchPosts(channel.id, oldestPublishedAt.current);
    if (next.length > 0) {
      setPosts((prev) => [...prev, ...next]);
      oldestPublishedAt.current = next[next.length - 1].published_at;
    }
    if (next.length < PAGE_SIZE) oldestPublishedAt.current = null;
    setLoadingMore(false);
  }, [channel, loadingMore, fetchPosts]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loadingMore && oldestPublishedAt.current) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, loadingMore]);

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
          <ul className="space-y-4">
            {posts.map((post) => (
              <li key={post.id}>
                <FeedPostCard post={post} brandColor={brandColor} />
              </li>
            ))}
          </ul>
        )}

        {/* Infinite scroll */}
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
