"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { ChannelsSidebar } from "@/components/kanallar/ChannelsSidebar";
import { PanelFeed } from "@/components/kanallar/PanelFeed";
import { FeedHeader } from "@/components/FeedHeader";

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
        className={`fixed left-0 top-[6rem] bottom-0 z-50 w-[280px] transform border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out lg:static lg:top-0 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ maxHeight: "calc(100vh - 6rem)" }}
      >
        <ChannelsSidebar
          selectedSlug={chip === "all" ? null : chip}
          onChannelSelect={handleChannelSelect}
          basePath={BASE_PATH}
          showLoginCta
        />
      </div>

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <FeedHeader
          onMenuClick={() => setSidebarOpen((prev) => !prev)}
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
          />
        </div>
      </div>
    </div>
  );
}
