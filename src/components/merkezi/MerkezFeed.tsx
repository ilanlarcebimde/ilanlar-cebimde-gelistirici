"use client";

import { useMemo, useState } from "react";
import { MerkezFeedCard } from "./MerkezFeedCard";
import { PremiumConversionPopup } from "./PremiumConversionPopup";
import type { MerkeziPostLandingItem, MerkeziTag } from "@/lib/merkezi/types";

interface MerkezFeedProps {
  posts: MerkeziPostLandingItem[];
  tagsByPostId: Record<string, MerkeziTag[]>;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function matchesSearch(post: MerkeziPostLandingItem, query: string): boolean {
  if (!query.trim()) return true;
  const q = normalize(query);
  const title = normalize(post.title);
  const country = normalize(post.country_slug ?? "");
  const city = normalize(post.city ?? "");
  const sector = normalize(post.sector_slug ?? "");
  return title.includes(q) || country.includes(q) || city.includes(q) || sector.includes(q);
}

export function MerkezFeed({ posts, tagsByPostId }: MerkezFeedProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    // Bu sayfada yalnızca premium ilanları göster.
    return posts.filter((p) => p.is_paid && matchesSearch(p, search));
  }, [posts, search]);

  return (
    <div className="min-h-screen bg-slate-50">
      <PremiumConversionPopup />
      <div className="mx-auto max-w-[1480px] px-4 py-6 sm:py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ülke, sektör veya başlık ara…"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:max-w-xs"
            aria-label="İçerik ara"
          />
          <span className="inline-flex items-center rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white">
            Premium
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-14 text-center">
            <span className="text-4xl text-slate-300" aria-hidden>📋</span>
            <p className="mt-3 text-sm font-medium text-slate-600">
              {posts.length === 0 ? "Henüz içerik yok." : "Arama veya filtreye uygun içerik bulunamadı."}
            </p>
          </div>
        ) : (
          <ul className="mt-6 space-y-5 sm:space-y-6">
            {filtered.map((post) => (
              <li key={post.id}>
                <MerkezFeedCard post={post} tags={tagsByPostId[post.id] ?? []} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
