"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionActive } from "@/hooks/useSubscriptionActive";
import { ChannelsSidebar } from "@/components/kanallar/ChannelsSidebar";
import { PanelFeed } from "@/components/kanallar/PanelFeed";
import { PremiumIntroModal } from "@/components/modals/PremiumIntroModal";
import type { FeedPost } from "@/components/kanal/FeedPostCard";

const DEBOUNCE_MS = 300;

type ChannelInfo = { id: string; slug: string; name: string; brand_color: string | null };

export function YurtdisiPanelClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { active: subscriptionActive, loading: subscriptionLoading } = useSubscriptionActive(user?.id);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [applyToast, setApplyToast] = useState<string | null>(null);
  const [subscribedChannels, setSubscribedChannels] = useState<ChannelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [chip, setChip] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        console.log("[YurtdisiPanel] opening panel", target);
        setTimeout(() => {
          router.push(target);
          clearToast();
        }, 0);
      } catch (err) {
        console.error("[YurtdisiPanel] applyGuide error", err);
        setApplyToast("Bir hata oluştu. Tekrar deneyin.");
        clearToast();
      }
    },
    [subscriptionActive, subscriptionLoading, router]
  );

  // URL'den c ve q oku
  useEffect(() => {
    const c = searchParams.get("c");
    const q = searchParams.get("q") ?? "";
    if (c) setChip(c);
    if (q) {
      setSearchInput(q);
      setSearchQuery(q);
    }
  }, [searchParams]);

  // Abone olunan kanalları yükle
  const loadSubscriptions = useCallback(async () => {
    if (!user) {
      setSubscribedChannels([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("channel_subscriptions")
      .select("channels(id, slug, name, brand_color)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    const list: ChannelInfo[] = [];
    (data ?? []).forEach((row: any) => {
      const ch = Array.isArray(row.channels) ? row.channels[0] : row.channels;
      if (ch) list.push({ id: ch.id, slug: ch.slug, name: ch.name, brand_color: ch.brand_color ?? null });
    });
    setSubscribedChannels(list);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  // Giriş yoksa girişe yönlendir (mevcut ?c= ve ?q= korunur)
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      const current = `/ucretsiz-yurtdisi-is-ilanlari${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
      router.replace(`/giris?next=${encodeURIComponent(current)}`);
    }
  }, [user, authLoading, router, searchParams]);

  const handleChannelSelect = useCallback(
    (slug: string) => {
      const newChip = slug || "all";
      setChip(newChip);
      const params = new URLSearchParams(searchParams.toString());
      if (newChip === "all") params.delete("c");
      else params.set("c", newChip);
      router.push(`/ucretsiz-yurtdisi-is-ilanlari?${params.toString()}`, { scroll: false });
      setSidebarOpen(false);
    },
    [router, searchParams]
  );

  // Arama debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(searchInput);
      const params = new URLSearchParams(searchParams.toString());
      if (searchInput.trim()) params.set("q", searchInput.trim());
      else params.delete("q");
      const qs = params.toString();
      router.replace(qs ? `/ucretsiz-yurtdisi-is-ilanlari?${qs}` : "/ucretsiz-yurtdisi-is-ilanlari", { scroll: false });
      debounceRef.current = null;
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]);

  const handleChipClick = useCallback(
    (c: string) => {
      setChip(c);
      const params = new URLSearchParams(searchParams.toString());
      if (c === "all") params.delete("c");
      else params.set("c", c);
      router.push(`/ucretsiz-yurtdisi-is-ilanlari?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  if (authLoading || (!user && loading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <p className="text-slate-600">Yükleniyor…</p>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-[280px] transform bg-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <ChannelsSidebar
          selectedSlug={chip === "all" ? null : chip}
          onChannelSelect={handleChannelSelect}
          basePath="/ucretsiz-yurtdisi-is-ilanlari"
        />
      </div>

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md lg:flex lg:items-center">
          <div className="flex h-14 items-center gap-2 px-4 lg:hidden">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-slate-600 hover:text-slate-900"
              aria-label="Menüyü aç"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-semibold text-slate-900">Yurtdışı İş İlanları</span>
          </div>

          <div className="flex-1 flex flex-col gap-3 border-t border-slate-100 px-4 py-3 lg:border-t-0 lg:px-6">
            <input
              type="search"
              placeholder="Meslek ara… örn: Forklift operatörü"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => handleChipClick("all")}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  chip === "all"
                    ? "bg-brand-600 text-white"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                Tümü
              </button>
              {subscribedChannels.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => handleChipClick(ch.slug)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    chip === ch.slug
                      ? "bg-brand-600 text-white"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                >
                  {ch.name}
                </button>
              ))}
            </div>
          </div>
        </header>

        <PanelFeed
          channels={subscribedChannels}
          selectedChip={chip === "all" ? null : chip}
          searchQuery={searchQuery}
          subscribedOnlyEmpty
          onHowToApplyClick={handleHowToApplyClick}
        />
      </div>

      <PremiumIntroModal open={premiumOpen} onClose={() => setPremiumOpen(false)} />

      {applyToast && (
        <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm text-white shadow-lg">
          {applyToast}
        </div>
      )}
    </div>
  );
}
