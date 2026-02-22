"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionActive } from "@/hooks/useSubscriptionActive";
import { ChannelsSidebar } from "@/components/kanallar/ChannelsSidebar";
import { PanelFeed } from "@/components/kanallar/PanelFeed";
import { FeedHeader } from "@/components/FeedHeader";
import { AuthModal } from "@/components/AuthModal";
import { PremiumIntroModal } from "@/components/modals/PremiumIntroModal";
import { JobApplyGuideModal } from "@/components/modals/JobApplyGuideModal";
import type { FeedPost } from "@/components/kanal/FeedPostCard";

const BASE_PATH = "/ucretsiz-yurtdisi-is-ilanlari";
const DEBOUNCE_MS = 300;

type ChannelInfo = { id: string; slug: string; name: string; brand_color: string | null; page_url: string | null };

function getFeedPathFromChannel(channel: { page_url?: string | null; slug: string }): string {
  if (channel?.page_url?.trim()) {
    try {
      const u = new URL(channel.page_url);
      return u.pathname + u.search;
    } catch {
      return `${BASE_PATH}?c=${channel.slug}`;
    }
  }
  return `${BASE_PATH}?c=${channel.slug}`;
}

export function UcretsizPanelClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const subscriptionActive = useSubscriptionActive(user?.id);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [jobGuideId, setJobGuideId] = useState<string | null>(null);
  const [allChannels, setAllChannels] = useState<ChannelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [chip, setChip] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleHowToApplyClick = useCallback(
    (post: FeedPost) => {
      if (!user) {
        setAuthOpen(true);
        return;
      }
      if (!subscriptionActive) {
        setPremiumOpen(true);
        return;
      }
      setJobGuideId(post.id);
    },
    [user, subscriptionActive]
  );

  useEffect(() => {
    const c = searchParams.get("c");
    const q = searchParams.get("q") ?? "";
    if (c) setChip(c);
    if (q) {
      setSearchInput(q);
      setSearchQuery(q);
    }
  }, [searchParams]);

  const loadChannels = useCallback(async () => {
    const { data } = await supabase
      .from("channels")
      .select("id, slug, name, brand_color, page_url")
      .eq("is_active", true)
      .order("name");
    const list: ChannelInfo[] = (data ?? []).map((row: any) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      brand_color: row.brand_color ?? null,
      page_url: row.page_url ?? null,
    }));
    setAllChannels(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  const handleChannelSelect = useCallback(
    (slug: string) => {
      const newChip = slug || "all";
      setChip(newChip);
      if (newChip === "all") {
        router.push(BASE_PATH + (searchParams.get("q") ? `?q=${encodeURIComponent(searchParams.get("q")!)}` : ""), { scroll: false });
      } else {
        const ch = allChannels.find((c) => c.slug === newChip);
        const path = ch ? getFeedPathFromChannel(ch) : `${BASE_PATH}?c=${newChip}`;
        const q = searchParams.get("q");
        const pathWithQ = q ? (path.includes("?") ? `${path}&q=${encodeURIComponent(q)}` : `${path}?q=${encodeURIComponent(q)}`) : path;
        router.push(pathWithQ, { scroll: false });
      }
      setSidebarOpen(false);
    },
    [router, searchParams, allChannels]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(searchInput);
      const params = new URLSearchParams(searchParams.toString());
      if (searchInput.trim()) params.set("q", searchInput.trim());
      else params.delete("q");
      const qs = params.toString();
      router.replace(qs ? `${BASE_PATH}?${qs}` : BASE_PATH, { scroll: false });
      debounceRef.current = null;
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput, router, searchParams]);

  const handleChipClick = useCallback(
    (c: string) => {
      setChip(c);
      if (c === "all") {
        const q = searchParams.get("q");
        router.push(q ? `${BASE_PATH}?q=${encodeURIComponent(q)}` : BASE_PATH, { scroll: false });
      } else {
        const ch = allChannels.find((x) => x.slug === c);
        const path = ch ? getFeedPathFromChannel(ch) : `${BASE_PATH}?c=${c}`;
        const q = searchParams.get("q");
        const pathWithQ = q ? (path.includes("?") ? `${path}&q=${encodeURIComponent(q)}` : `${path}?q=${encodeURIComponent(q)}`) : path;
        router.push(pathWithQ, { scroll: false });
      }
    },
    [router, searchParams, allChannels]
  );

  const handleSignOut = useCallback(async () => {
    setSidebarOpen(false);
    await supabase.auth.signOut();
  }, []);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-4">
        <p className="text-slate-600">Yükleniyor…</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      {/* Mobil: hafif backdrop, panel header altında popup */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/25 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Sol panel: masaüstünde statik, mobilde header altında popup — kapalıyken tamamen sola taşır (sağ kenar görünmez) */}
      <div
        className={`fixed left-4 top-[5.25rem] z-50 w-[280px] max-h-[calc(100vh-6rem)] rounded-xl border border-slate-200 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.12)] transition-transform duration-200 ease-out lg:static lg:left-0 lg:top-0 lg:max-h-none lg:rounded-none lg:border-r lg:border-slate-200 lg:shadow-none lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "translate-x-[calc(-100%-1rem)]"
        }`}
      >
        <div className="flex h-full max-h-[calc(100vh-6rem)] flex-col overflow-hidden lg:max-h-none">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <ChannelsSidebar
              selectedSlug={chip === "all" ? null : chip}
              onChannelSelect={handleChannelSelect}
              basePath={BASE_PATH}
              showLoginCta
            />
          </div>
          {user && (
            <div className="shrink-0 border-t border-slate-200 p-3">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Oturumu Sonlandır
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <FeedHeader
          onMenuClick={() => setSidebarOpen((prev) => !prev)}
          onAboneliklerimClick={() => setSidebarOpen((prev) => !prev)}
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          selectedChip={chip}
          onChipClick={handleChipClick}
          channels={allChannels}
          basePath={BASE_PATH}
        />

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="mx-auto w-full max-w-[1100px] shrink-0 px-4 py-3 sm:px-6">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Ücretsiz akış • Günlük güncellenir
            </p>
            <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
              Ücretsiz Yurtdışı İş İlanları
            </h1>
            <p className="mt-0.5 text-sm text-slate-600">
              Güncel ilanları ücretsiz takip edin. Resmi duyurular ve güvenli yönlendirmeler tek akışta.
            </p>
          </div>

          <PanelFeed
            channels={allChannels}
            selectedChip={chip === "all" ? null : chip}
            searchQuery={searchQuery}
            subscribedOnlyEmpty={false}
            onHowToApplyClick={handleHowToApplyClick}
          />
        </div>
      </div>

      <AnimatePresence>
        <AuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          onGoogle={() => setAuthOpen(false)}
          onEmailSubmit={() => setAuthOpen(false)}
          redirectNext="/panel"
        />
      </AnimatePresence>
      <AnimatePresence>
        <PremiumIntroModal open={premiumOpen} onClose={() => setPremiumOpen(false)} />
      </AnimatePresence>
      <JobApplyGuideModal
        open={!!jobGuideId}
        onClose={() => setJobGuideId(null)}
        jobId={jobGuideId}
      />
    </div>
  );
}
