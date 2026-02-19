"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { ChannelPushToggle } from "@/components/push/ChannelPushToggle";

const FLAG_CDN = "https://flagcdn.com";

type Channel = {
  id: string;
  slug: string;
  name: string;
  country_code: string;
  brand_color: string | null;
  description: string | null;
};

type Subscription = {
  id: string;
  channel_id: string;
  channels: Channel | null;
};

const UCRETSIZ_PATH = "/ucretsiz-yurtdisi-is-ilanlari";

type ChannelsSidebarProps = {
  selectedSlug: string | null;
  onChannelSelect: (slug: string) => void;
  /** Base path for redirects (e.g. /ucretsiz-yurtdisi-is-ilanlari or /aboneliklerim) */
  basePath?: string;
  /** Public sayfada giriş yapmamış kullanıcıya "Aboneliklerim" altında info + Giriş Yap CTA göster */
  showLoginCta?: boolean;
};

export function ChannelsSidebar({ selectedSlug, onChannelSelect, basePath = "/aboneliklerim", showLoginCta = false }: ChannelsSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [subscribed, setSubscribed] = useState<Subscription[]>([]);
  const [discover, setDiscover] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) {
      // Anon: tüm kanalları keşfet'e göster
      const { data: allChannels } = await supabase
        .from("channels")
        .select("id, slug, name, country_code, brand_color, description")
        .eq("is_active", true)
        .order("name");
      setDiscover((allChannels ?? []) as Channel[]);
      setSubscribed([]);
      setLoading(false);
      return;
    }

    // Kullanıcı: abonelikler + keşfet
    const [subsRes, allRes] = await Promise.all([
      supabase
        .from("channel_subscriptions")
        .select("id, channel_id, channels(id, slug, name, country_code, brand_color, description)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("channels")
        .select("id, slug, name, country_code, brand_color, description")
        .eq("is_active", true)
        .order("name"),
    ]);

    // Supabase relation query returns channels as object or array - normalize it
    const subs = (subsRes.data ?? []).map((item: any) => ({
      id: item.id,
      channel_id: item.channel_id,
      channels: Array.isArray(item.channels) ? item.channels[0] : item.channels,
    })) as Subscription[];
    const all = (allRes.data ?? []) as Channel[];
    const subIds = new Set(subs.map((s) => s.channels?.id).filter(Boolean));

    setSubscribed(subs);
    setDiscover(all.filter((ch) => !subIds.has(ch.id)));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("sidebar-subscriptions-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "channel_subscriptions", filter: `user_id=eq.${user.id}` },
        () => loadData()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, loadData]);

  const handleSubscribe = useCallback(
    async (channel: Channel) => {
      if (!user) {
        const next = basePath === UCRETSIZ_PATH
          ? `${UCRETSIZ_PATH}?c=${channel.slug}`
          : `${basePath}?kanal=${channel.slug}`;
        router.push(`/giris?next=${encodeURIComponent(next)}&subscribe=${encodeURIComponent(channel.slug)}`);
        return;
      }

      setSubscribing(channel.slug);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;

        const res = await fetch("/api/subscriptions/ensure", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ channelSlug: channel.slug }),
        });

        if (res.ok) {
          // Optimistic UI: hemen sidebar'ı güncelle
          const newSub: Subscription = {
            id: "",
            channel_id: channel.id,
            channels: channel,
          };
          setSubscribed((prev) => [newSub, ...prev]);
          setDiscover((prev) => prev.filter((ch) => ch.id !== channel.id));
          // Feed'i güncelle
          onChannelSelect(channel.slug);
          // Veriyi yeniden yükle (gerçek ID için)
          await loadData();
        }
      } finally {
        setSubscribing(null);
      }
    },
    [user, router, onChannelSelect, loadData, basePath]
  );

  const handleUnsubscribe = useCallback(
    async (sub: Subscription) => {
      if (!confirm("Bu kanaldan abonelikten çıkmak istediğinize emin misiniz?")) return;
      if (!sub.channels) return;

      await supabase.from("channel_subscriptions").delete().eq("id", sub.id);
      // Optimistic UI
      setSubscribed((prev) => prev.filter((s) => s.id !== sub.id));
      setDiscover((prev) => {
        if (sub.channels && !prev.find((ch) => ch.id === sub.channels!.id)) {
          return [...prev, sub.channels!].sort((a, b) => a.name.localeCompare(b.name));
        }
        return prev;
      });
      // Eğer seçili kanal bu ise, ilk abone olunan kanala geç veya boş durum
      if (selectedSlug === sub.channels.slug) {
        const next = subscribed.find((s) => s.id !== sub.id && s.channels);
        if (next?.channels) {
          onChannelSelect(next.channels.slug);
        } else {
          onChannelSelect("");
        }
      }
      await loadData();
    },
    [selectedSlug, subscribed, onChannelSelect, loadData]
  );

  const getBrandColor = (color: string | null) => {
    if (!color) return "rgb(59, 130, 246)"; // default blue
    return color;
  };

  if (loading) {
    return (
      <aside className="h-full w-[280px] border-r border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">Yükleniyor…</p>
      </aside>
    );
  }

  return (
    <aside className="h-full w-[280px] border-r border-slate-200 bg-white overflow-y-auto">
      {/* Aboneliklerim */}
      <div className="p-4 border-b border-slate-100">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Aboneliklerim
        </h2>
        {!user && showLoginCta ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-600">
              Giriş yaparak aboneliklerini yönetebilir ve ilanları kişiselleştirebilirsin.
            </p>
            <Link
              href={`/giris?next=${encodeURIComponent(pathname || UCRETSIZ_PATH)}`}
              className="mt-3 flex w-full items-center justify-center rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Giriş Yap
            </Link>
          </div>
        ) : subscribed.length === 0 ? (
          <div className="text-xs text-slate-500">
            <p>Henüz hiçbir kanala abone değilsiniz.</p>
            <p className="mt-1">Aşağıdaki Keşfet bölümünden bir ülke seçin.</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {subscribed.map((sub) => {
              const ch = sub.channels;
              if (!ch) return null;
              const isSelected = selectedSlug === ch.slug;
              const brandColor = getBrandColor(ch.brand_color);
              const flagSrc = `${FLAG_CDN}/w40/${ch.country_code.toLowerCase()}.png`;

              return (
                <li key={sub.id}>
                  <div className="group/item flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onChannelSelect(ch.slug)}
                      className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isSelected
                          ? "bg-slate-50 font-medium text-slate-900"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                      style={
                        isSelected
                          ? {
                              borderLeft: `3px solid ${brandColor}`,
                              backgroundColor: `${brandColor}08`,
                            }
                          : {}
                      }
                    >
                      <span className="flex h-6 w-8 shrink-0 items-center justify-center overflow-hidden rounded bg-slate-100">
                        <img src={flagSrc} alt="" className="h-full w-full object-contain object-center" />
                      </span>
                      <span className="flex-1 min-w-0 text-left truncate">{ch.name}</span>
                      {isSelected && (
                        <span className="shrink-0 text-xs text-slate-400">●</span>
                      )}
                    </button>
                    <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <ChannelPushToggle channelSlug={ch.slug} channelId={sub.channel_id} />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnsubscribe(sub);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded"
                        aria-label="Abonelikten çık"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Keşfet */}
      <div className="p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Keşfet
        </h2>
        {discover.length === 0 ? (
          <p className="text-xs text-slate-400">Tüm kanallara abone oldunuz</p>
        ) : (
          <ul className="space-y-1">
            {discover.map((ch) => {
              const flagSrc = `${FLAG_CDN}/w40/${ch.country_code.toLowerCase()}.png`;
              const isSubscribing = subscribing === ch.slug;

              return (
                <li key={ch.id}>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg group hover:bg-slate-50">
                    <span className="flex h-6 w-8 shrink-0 items-center justify-center overflow-hidden rounded bg-slate-100">
                      <img src={flagSrc} alt="" className="h-full w-full object-contain object-center" />
                    </span>
                    <span className="flex-1 min-w-0 text-sm text-slate-600 truncate">{ch.name}</span>
                    <button
                      type="button"
                      onClick={() => handleSubscribe(ch)}
                      disabled={isSubscribing}
                      className="shrink-0 text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline disabled:opacity-50"
                    >
                      {isSubscribing ? "Ekleniyor…" : "Abone Ol"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
