"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Footer } from "@/components/layout/Footer";
import { FeedPostCard, type FeedPost } from "@/components/kanal/FeedPostCard";
import { FeedSkeleton } from "@/components/kanal/FeedSkeleton";

const FLAG_CDN = "https://flagcdn.com";
const PAGE_SIZE = 15;

type Channel = {
  id: string;
  slug: string;
  name: string;
  country_code: string;
  description: string | null;
};

type SubscriptionRow = { id: string; channel_id: string };

export function KanalFeedClient({ slug }: { slug: string }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [unsubscribing, setUnsubscribing] = useState(false);
  const [showNewPostsBanner, setShowNewPostsBanner] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const oldestPublishedAt = useRef<string | null>(null);

  const fetchChannel = useCallback(async () => {
    const { data } = await supabase
      .from("channels")
      .select("id, slug, name, country_code, description")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();
    return data as Channel | null;
  }, [slug]);

  const fetchSubscription = useCallback(
    async (channelId: string) => {
      if (!user) return null;
      const { data } = await supabase
        .from("channel_subscriptions")
        .select("id, channel_id")
        .eq("user_id", user.id)
        .eq("channel_id", channelId)
        .maybeSingle();
      return data as SubscriptionRow | null;
    },
    [user]
  );

  const fetchPosts = useCallback(
    async (cursor: string | null, append: boolean) => {
      if (!channel) return [];
      let q = supabase
        .from("job_posts")
        .select("id, title, position_text, location_text, source_name, source_url, snippet, published_at")
        .eq("channel_id", channel.id)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(PAGE_SIZE);
      if (cursor) {
        q = q.lt("published_at", cursor);
      }
      const { data } = await q;
      return (data ?? []) as FeedPost[];
    },
    [channel]
  );

  const loadInitial = useCallback(async () => {
    if (!user) {
      router.replace(`/giris?next=${encodeURIComponent(`/kanal/${slug}`)}&subscribe=${encodeURIComponent(slug)}`);
      return;
    }

    const ch = await fetchChannel();
    if (!ch) {
      setError("Kanal bulunamadı.");
      setLoading(false);
      return;
    }
    setChannel(ch);

    const sub = await fetchSubscription(ch.id);
    setSubscription(sub);
    if (!sub) {
      const first = await fetchPosts(null, false);
      setPosts(first);
      if (first.length > 0) oldestPublishedAt.current = first[first.length - 1].published_at;
      else oldestPublishedAt.current = null;
      setLoading(false);
      return;
    }

    const first = await fetchPosts(null, false);
    setPosts(first);
    if (first.length > 0) oldestPublishedAt.current = first[first.length - 1].published_at;
    else oldestPublishedAt.current = null;
    setLoading(false);
  }, [user, slug, router, fetchChannel, fetchSubscription, fetchPosts]);

  useEffect(() => {
    if (authLoading) return;
    loadInitial();
  }, [authLoading, loadInitial]);

  const handleSubscribe = useCallback(async () => {
    if (!user || !channel) return;
    setSubscribing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;
      const res = await fetch("/api/subscriptions/ensure", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ channelSlug: slug }),
      });
      if (res.ok) {
        const sub = await fetchSubscription(channel.id);
        setSubscription(sub ?? { id: "", channel_id: channel.id });
        const first = await fetchPosts(null, false);
        setPosts(first);
        if (first.length > 0) oldestPublishedAt.current = first[first.length - 1].published_at;
      }
    } finally {
      setSubscribing(false);
    }
  }, [user, channel, slug, fetchSubscription, fetchPosts]);

  const handleUnsubscribe = useCallback(async () => {
    if (!subscription?.id || !channel) return;
    if (!confirm("Bu kanaldan abonelikten çıkmak istediğinize emin misiniz?")) return;
    setUnsubscribing(true);
    await supabase.from("channel_subscriptions").delete().eq("id", subscription.id);
    setSubscription(null);
    setPosts([]);
    setUnsubscribing(false);
  }, [subscription, channel]);

  const loadMore = useCallback(async () => {
    if (!channel || loadingMore || !oldestPublishedAt.current) return;
    setLoadingMore(true);
    const next = await fetchPosts(oldestPublishedAt.current, true);
    if (next.length > 0) {
      setPosts((prev) => [...prev, ...next]);
      oldestPublishedAt.current = next[next.length - 1].published_at;
    }
    if (next.length < PAGE_SIZE) oldestPublishedAt.current = null;
    setLoadingMore(false);
  }, [channel, loadingMore, fetchPosts]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !subscription || loading) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "200px", threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [subscription, loading, loadMore]);

  const handleRefresh = useCallback(async () => {
    if (!channel) return;
    setShowNewPostsBanner(false);
    const first = await fetchPosts(null, false);
    setPosts(first);
    if (first.length > 0) oldestPublishedAt.current = first[first.length - 1].published_at;
    else oldestPublishedAt.current = null;
  }, [channel, fetchPosts]);

  if (!user) return null;

  if (authLoading || (loading && !channel && !error)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col gap-4 w-full max-w-2xl">
          <FeedSkeleton />
          <FeedSkeleton />
          <FeedSkeleton />
        </div>
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <p className="text-red-600 font-medium">{error ?? "Kanal bulunamadı."}</p>
        <Link href="/yurtdisi-is-ilanlari" className="mt-4 text-brand-600 hover:underline">
          Ülke kanallarına dön
        </Link>
      </div>
    );
  }

  const flagSrc = `${FLAG_CDN}/w80/${channel.country_code.toLowerCase()}.png`;

  if (user && !subscription) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
            <Link href="/yurtdisi-is-ilanlari" className="text-sm text-slate-500 hover:text-slate-700">
              ← Kanallar
            </Link>
            <span className="font-semibold text-slate-900">{channel.name}</span>
            <span className="w-16" />
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-4 py-12">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-medium text-slate-800">
              Bu kanalı görmek için abone olmalısınız.
            </p>
            <button
              type="button"
              onClick={handleSubscribe}
              disabled={subscribing}
              className="mt-6 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-70"
            >
              {subscribing ? "Ekleniyor…" : "Kanala Abone Ol"}
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {showNewPostsBanner && (
        <div className="sticky top-0 z-[60] flex items-center justify-between gap-4 border-b border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800 shadow-sm">
          <span>🔔 Yeni ilanlar eklendi — Listeyi yenile</span>
          <button
            type="button"
            onClick={handleRefresh}
            className="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 font-medium text-white hover:bg-brand-700"
          >
            Yenile
          </button>
        </div>
      )}

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Link href="/yurtdisi-is-ilanlari" className="text-sm text-slate-500 hover:text-slate-700">
            ← Kanallar
          </Link>
          <span className="font-semibold text-slate-900">{channel.name}</span>
          {user ? (
            <button
              type="button"
              onClick={handleUnsubscribe}
              disabled={unsubscribing}
              className="text-sm text-slate-500 hover:text-slate-700 hover:underline disabled:opacity-50"
            >
              Abonelikten Çık
            </button>
          ) : (
            <span className="w-16" />
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <section className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <img src={flagSrc} alt="" className="h-14 w-auto rounded-lg shadow-sm" />
            <div>
              <h1 className="text-xl font-bold text-slate-900">{channel.name} İş İlanları</h1>
              {channel.description && (
                <p className="mt-0.5 text-sm text-slate-600">{channel.description}</p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700">
              Günlük Güncellenir
            </span>
            <button
              type="button"
              onClick={handleRefresh}
              className="text-xs font-medium text-brand-600 hover:underline"
            >
              Listeyi yenile
            </button>
          </div>
        </section>

        {posts.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-slate-600">Bu kanalda henüz ilan yok.</p>
            <p className="mt-1 text-sm text-slate-500">Günlük olarak güncellenir.</p>
            <Link
              href="/yurtdisi-is-ilanlari#ulkeler"
              className="mt-6 inline-block rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Diğer Kanalları Gör
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {posts.map((post) => (
              <li key={post.id}>
                <FeedPostCard post={post} />
              </li>
            ))}
          </ul>
        )}

        {loadingMore && (
          <div className="mt-4 space-y-4">
            <FeedSkeleton />
            <FeedSkeleton />
          </div>
        )}

        <div ref={loadMoreRef} className="h-4 w-full" aria-hidden />
      </main>

      <Footer />
    </div>
  );
}
