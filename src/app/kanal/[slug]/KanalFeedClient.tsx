"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionActive } from "@/hooks/useSubscriptionActive";
import { Footer } from "@/components/layout/Footer";
import { FeedPostCard, type FeedPost } from "@/components/kanal/FeedPostCard";
import { FeedSkeleton } from "@/components/kanal/FeedSkeleton";
import { PremiumIntroModal } from "@/components/modals/PremiumIntroModal";

const FLAG_CDN = "https://flagcdn.com";
const PAGE_SIZE = 30;

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
  const { active: subscriptionActive, loading: subscriptionLoading } = useSubscriptionActive(user?.id);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [unsubscribing, setUnsubscribing] = useState(false);
  const [showNewPostsBanner, setShowNewPostsBanner] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [applyToast, setApplyToast] = useState<string | null>(null);

  const handleHowToApplyClick = useCallback(
    (post: FeedPost) => {
      setApplyToast("Kontrol ediliyor…");
      const clearToast = () => {
        setTimeout(() => setApplyToast(null), 2000);
      };
      try {
        if (!subscriptionLoading && !subscriptionActive) {
          setPremiumOpen(true);
          clearToast();
          return;
        }
        const target = "/premium/job-guide/" + post.id;
        console.log("[KanalFeed] opening panel", target);
        setTimeout(() => {
          router.push(target);
          clearToast();
        }, 0);
      } catch (err) {
        console.error("[KanalFeedClient] applyGuide error", err);
        setApplyToast("Bir hata oluştu. Tekrar deneyin.");
        clearToast();
      }
    },
    [subscriptionActive, subscriptionLoading, router]
  );

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

  const fetchPage = useCallback(
    async (channelId: string, page: number) => {
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
    },
    []
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
      const { data, count } = await fetchPage(ch.id, 1);
      setPosts(data);
      setTotalCount(count);
      setCurrentPage(1);
      setLoading(false);
      return;
    }

    const { data, count } = await fetchPage(ch.id, 1);
    setPosts(data);
    setTotalCount(count);
    setCurrentPage(1);
    setLoading(false);
  }, [user, slug, router, fetchChannel, fetchSubscription, fetchPage]);

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
        const { data, count } = await fetchPage(channel.id, 1);
        setPosts(data);
        setTotalCount(count);
        setCurrentPage(1);
      }
    } finally {
      setSubscribing(false);
    }
  }, [user, channel, slug, fetchSubscription, fetchPage]);

  const handleUnsubscribe = useCallback(async () => {
    if (!subscription?.id || !channel) return;
    if (!confirm("Bu kanaldan abonelikten çıkmak istediğinize emin misiniz?")) return;
    setUnsubscribing(true);
    await supabase.from("channel_subscriptions").delete().eq("id", subscription.id);
    setSubscription(null);
    setPosts([]);
    setUnsubscribing(false);
  }, [subscription, channel]);

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

  const handleRefresh = useCallback(async () => {
    if (!channel) return;
    setShowNewPostsBanner(false);
    const { data, count } = await fetchPage(channel.id, 1);
    setPosts(data);
    setTotalCount(count);
    setCurrentPage(1);
  }, [channel, fetchPage]);

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
        <Link href="/ucretsiz-yurtdisi-is-ilanlari" className="mt-4 text-brand-600 hover:underline">
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
            <Link href="/ucretsiz-yurtdisi-is-ilanlari" className="text-sm text-slate-500 hover:text-slate-700">
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
          <Link href="/ucretsiz-yurtdisi-is-ilanlari" className="text-sm text-slate-500 hover:text-slate-700">
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
              href="/ucretsiz-yurtdisi-is-ilanlari#ulkeler"
              className="mt-6 inline-block rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Diğer Kanalları Gör
            </Link>
          </div>
        ) : (
          <>
            <ul className="space-y-4">
              {posts.map((post) => (
                <li key={post.id}>
                  <FeedPostCard post={post} onHowToApplyClick={handleHowToApplyClick} />
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
      </main>

      <Footer />

      <PremiumIntroModal open={premiumOpen} onClose={() => setPremiumOpen(false)} />

      {applyToast && (
        <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm text-white shadow-lg">
          {applyToast}
        </div>
      )}
    </div>
  );
}
