"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { ChannelsSidebar } from "./ChannelsSidebar";
import { ChannelsFeed } from "./ChannelsFeed";

export function ChannelsLayout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);

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
          const channels = row?.channels;
          const firstSlug = Array.isArray(channels) ? channels[0]?.slug : (channels as { slug?: string } | null)?.slug;
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
        <ChannelsFeed selectedSlug={selectedSlug} />
      </div>
    </div>
  );
}
