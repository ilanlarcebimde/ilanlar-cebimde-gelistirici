"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Footer } from "@/components/layout/Footer";

const FLAG_CDN = "https://flagcdn.com";

type SubWithChannel = {
  id: string;
  channel_id: string;
  channels: { slug: string; name: string; country_code: string } | null;
};

export function AboneliklerimClient() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [list, setList] = useState<SubWithChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [unsubscribing, setUnsubscribing] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/giris?next=/aboneliklerim");
      return;
    }
    if (!user) return;

    supabase
      .from("channel_subscriptions")
      .select("id, channel_id, channels(slug, name, country_code)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setList((data ?? []) as SubWithChannel[]);
        setLoading(false);
      });
  }, [user, authLoading, router]);

  const handleUnsubscribe = async (subId: string) => {
    if (!confirm("Bu kanaldan abonelikten çıkmak istediğinize emin misiniz?")) return;
    setUnsubscribing(subId);
    await supabase.from("channel_subscriptions").delete().eq("id", subId);
    setList((prev) => prev.filter((s) => s.id !== subId));
    setUnsubscribing(null);
  };

  if (authLoading || (loading && user)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <p className="text-slate-600">Yükleniyor…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
            ← Ana sayfa
          </Link>
          <span className="font-semibold text-slate-900">Aboneliklerim</span>
          <Link href="/yurtdisi-is-ilanlari" className="text-sm text-brand-600 hover:underline">
            Kanallar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-xl font-bold text-slate-900 mb-6">Abone olduğunuz kanallar</h1>

        {list.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
            Henüz abone olduğunuz kanal yok.{" "}
            <Link href="/yurtdisi-is-ilanlari#ulkeler" className="text-brand-600 hover:underline">
              Ülke kanallarına göz atın
            </Link>
            .
          </p>
        ) : (
          <ul className="space-y-4">
            {list.map((sub) => {
              const ch = sub.channels;
              if (!ch) return null;
              const flagSrc = `${FLAG_CDN}/w80/${ch.country_code.toLowerCase()}.png`;
              return (
                <li
                  key={sub.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={flagSrc} alt="" className="h-10 w-auto shrink-0 rounded shadow-sm" />
                    <span className="font-semibold text-slate-900 truncate">{ch.name}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/kanal/${ch.slug}`}
                      className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                    >
                      Akışı Aç
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleUnsubscribe(sub.id)}
                      disabled={unsubscribing === sub.id}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {unsubscribing === sub.id ? "Çıkılıyor…" : "Abonelikten Çık"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <Footer />
    </div>
  );
}
