"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionActive } from "@/hooks/useSubscriptionActive";
import { ChannelsSidebar } from "./ChannelsSidebar";
import { ChannelsFeed } from "./ChannelsFeed";
import { AuthModal } from "@/components/AuthModal";
import { PremiumIntroModal } from "@/components/modals/PremiumIntroModal";
import type { FeedPost } from "@/components/kanal/FeedPostCard";

export function ChannelsLayout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { active: subscriptionActive, loading: subscriptionLoading } = useSubscriptionActive(user?.id);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [applyToast, setApplyToast] = useState<string | null>(null);

  const handleHowToApplyClick = useCallback(
    (post: FeedPost) => {
      console.log("APPLY FLOW", {
        user: !!user,
        subscriptionLoading,
        subscriptionActive,
        postId: post.id,
      });
      setApplyToast("Kontrol ediliyor…");
      const clearToast = () => {
        setTimeout(() => setApplyToast(null), 2000);
      };
      try {
        if (!user) {
          setAuthOpen(true);
          clearToast();
          return;
        }
        if (!subscriptionLoading && !subscriptionActive) {
          setPremiumOpen(true);
          clearToast();
          return;
        }
        const target = "/premium/job-guide/" + post.id;
        console.log("[ChannelsLayout] opening panel", target);
        setTimeout(() => {
          router.push(target);
          clearToast();
        }, 0);
      } catch (err) {
        console.error("[ChannelsLayout] applyGuide error", err);
        setApplyToast("Bir hata oluştu. Tekrar deneyin.");
        clearToast();
      }
    },
    [user, subscriptionActive, subscriptionLoading, router]
  );

  // URL'den kanal slug'ını oku veya ilk abone olunan kanalı seç
  useEffect(() => {
    const slug = searchParams.get("kanal");
    if (slug) {
      setSelectedSlug(slug);
      setInitialized(true);
      return;
    }

    // URL'de kanal yoksa, ilk abone olunan kanalı seç
    if (!initialized && user) {
      supabase
        .from("channel_subscriptions")
        .select("channels(slug)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .then(({ data }) => {
          const row = data?.[0];
          if (!row) {
            setInitialized(true);
            return;
          }
          const channels = row.channels;
          let firstSlug: string | undefined;
          if (Array.isArray(channels)) {
            firstSlug = channels[0]?.slug;
          } else if (channels && typeof channels === 'object' && 'slug' in channels) {
            firstSlug = (channels as { slug?: string }).slug;
          }
          if (firstSlug && typeof firstSlug === "string") {
            setSelectedSlug(firstSlug);
            router.replace(`/aboneliklerim?kanal=${firstSlug}`, { scroll: false });
          }
          setInitialized(true);
        });
    } else if (!initialized && !user) {
      setInitialized(true);
    }
  }, [searchParams, user, initialized, router]);

  const handleChannelSelect = useCallback(
    (slug: string) => {
      setSelectedSlug(slug || null);
      setSidebarOpen(false); // Mobilde drawer'ı kapat
      // URL'i güncelle (history push, sayfa yenileme yok)
      const newUrl = slug ? `/aboneliklerim?kanal=${slug}` : "/aboneliklerim";
      router.push(newUrl, { scroll: false });
    },
    [router]
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobil overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[280px] bg-white transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <ChannelsSidebar selectedSlug={selectedSlug} onChannelSelect={handleChannelSelect} />
      </div>

      {/* Ana feed alanı */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobil header */}
        <header className="lg:hidden sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
          <div className="flex h-14 items-center justify-between px-4">
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
            <span className="font-semibold text-slate-900">Kanal Paneli</span>
            <span className="w-10" />
          </div>
        </header>

        {/* Feed */}
        <ChannelsFeed selectedSlug={selectedSlug} onHowToApplyClick={handleHowToApplyClick} />
      </div>

      <AnimatePresence>
        <AuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          onGoogle={() => setAuthOpen(false)}
          onEmailSubmit={() => setAuthOpen(false)}
          redirectNext="/aboneliklerim"
        />
      </AnimatePresence>
      <PremiumIntroModal open={premiumOpen} onClose={() => setPremiumOpen(false)} />

      {applyToast && (
        <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm text-white shadow-lg">
          {applyToast}
        </div>
      )}
    </div>
  );
}
