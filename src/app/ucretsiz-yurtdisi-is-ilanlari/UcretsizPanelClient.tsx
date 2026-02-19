"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { ChannelsSidebar } from "@/components/kanallar/ChannelsSidebar";
import { PanelFeed } from "@/components/kanallar/PanelFeed";

const BASE_PATH = "/ucretsiz-yurtdisi-is-ilanlari";
const DEBOUNCE_MS = 300;

type ChannelInfo = { id: string; slug: string; name: string; brand_color: string | null };

export function UcretsizPanelClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [allChannels, setAllChannels] = useState<ChannelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [chip, setChip] = useState<string>("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      .select("id, slug, name, brand_color")
      .eq("is_active", true)
      .order("name");
    const list: ChannelInfo[] = (data ?? []).map((row: any) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      brand_color: row.brand_color ?? null,
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
      const params = new URLSearchParams(searchParams.toString());
      if (newChip === "all") params.delete("c");
      else params.set("c", newChip);
      router.push(`${BASE_PATH}?${params.toString()}`, { scroll: false });
      setSidebarOpen(false);
    },
    [router, searchParams]
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
      const params = new URLSearchParams(searchParams.toString());
      if (c === "all") params.delete("c");
      else params.set("c", c);
      router.push(`${BASE_PATH}?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-4">
        <p className="text-slate-600">Yükleniyor…</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-[280px] transform border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <ChannelsSidebar
          selectedSlug={chip === "all" ? null : chip}
          onChannelSelect={handleChannelSelect}
          basePath={BASE_PATH}
          showLoginCta
        />
      </div>

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md">
          <div className="mx-auto max-w-[1100px] w-full px-4 lg:px-6">
            <div className="flex h-14 items-center gap-2 lg:hidden">
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
              <span className="font-semibold text-slate-900">Ücretsiz Yurtdışı İş İlanları</span>
            </div>

            <div className="border-t border-slate-100 py-4 lg:border-t-0">
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

            <div className="flex flex-col gap-3 pb-4">
              <input
                type="search"
                placeholder="Meslek ara… örn: Forklift operatörü"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-thin sm:mx-0 sm:px-0">
                <button
                  type="button"
                  onClick={() => handleChipClick("all")}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    chip === "all"
                      ? "bg-brand-600 text-white shadow-sm"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                >
                  Tümü
                </button>
                {allChannels.map((ch) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => handleChipClick(ch.slug)}
                    className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                      chip === ch.slug
                        ? "bg-brand-600 text-white shadow-sm"
                        : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                    }`}
                  >
                    {ch.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        <PanelFeed
          channels={allChannels}
          selectedChip={chip === "all" ? null : chip}
          searchQuery={searchQuery}
          subscribedOnlyEmpty={false}
        />
      </div>
    </div>
  );
}
