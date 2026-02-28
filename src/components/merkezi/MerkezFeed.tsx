"use client";

import { useMemo, useState } from "react";
import { MerkezFeedCard } from "./MerkezFeedCard";
import type { MerkeziPostLandingItem, MerkeziTag } from "@/lib/merkezi/types";

type FilterType = "all" | "premium" | "free";

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
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered = useMemo(() => {
    let list = posts.filter((p) => matchesSearch(p, search));
    if (filter === "premium") list = list.filter((p) => p.is_paid);
    if (filter === "free") list = list.filter((p) => !p.is_paid);
    return list;
  }, [posts, search, filter]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ülke, sektör veya başlık ara…"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:max-w-xs"
            aria-label="İçerik ara"
          />
          <div className="flex gap-2">
            {(["all", "free", "premium"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === f ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f === "all" ? "Tümü" : f === "free" ? "Ücretsiz" : "Premium"}
              </button>
            ))}
          </div>
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
