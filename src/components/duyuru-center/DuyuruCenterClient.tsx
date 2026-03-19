"use client";

import { useMemo, useState } from "react";
import { DuyuruEmptyState } from "./DuyuruEmptyState";
import { DuyuruFeaturedCard } from "./DuyuruFeaturedCard";
import { DuyuruGridCard } from "./DuyuruGridCard";
import { DuyuruFilterBar } from "./DuyuruFilterBar";
import { formatCountryLabel, isBreakingPost, isImportantPost, normalizeNewsType } from "./helpers";
import { DuyuruCountry, DuyuruPost, DuyuruSort, DuyuruStatusFilter } from "./types";

type DuyuruCenterClientProps = {
  posts: DuyuruPost[];
  countries: DuyuruCountry[];
};

function getPublishedTime(post: DuyuruPost): number {
  if (!post.published_at) return 0;
  const value = new Date(post.published_at).getTime();
  return Number.isNaN(value) ? 0 : value;
}

export function DuyuruCenterClient({ posts, countries }: DuyuruCenterClientProps) {
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<DuyuruStatusFilter>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<DuyuruSort>("newest");
  const [onlyImportant, setOnlyImportant] = useState(false);

  const countryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const country of countries) map.set(country.slug, country.name);
    return map;
  }, [countries]);

  const newsTypes = useMemo(
    () =>
      Array.from(new Set(posts.map((p) => normalizeNewsType(p.news_type)).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, "tr")
      ),
    [posts]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");

    const list = posts.filter((post) => {
      if (selectedCountry && post.country_slug !== selectedCountry) return false;
      if (selectedType && normalizeNewsType(post.news_type) !== selectedType) return false;
      if (onlyImportant && !isImportantPost(post)) return false;

      if (selectedStatus === "featured" && !post.is_featured) return false;
      if (selectedStatus === "breaking" && !isBreakingPost(post)) return false;
      if (selectedStatus === "important" && !isImportantPost(post)) return false;

      if (query) {
        const countryName = post.country_slug ? countryMap.get(post.country_slug) ?? "" : "";
        const source = post.source_name ?? "";
        const text = `${post.title} ${post.summary ?? ""} ${source} ${countryName}`.toLocaleLowerCase("tr-TR");
        if (!text.includes(query)) return false;
      }
      return true;
    });

    if (sortBy === "priority") {
      const priorityScore = (post: DuyuruPost) => {
        if (post.priority_level === "critical") return 3;
        if (post.priority_level === "important") return 2;
        if (post.priority_level === "normal") return 1;
        return 0;
      };
      return [...list].sort((a, b) => {
        const byPriority = priorityScore(b) - priorityScore(a);
        if (byPriority !== 0) return byPriority;
        return getPublishedTime(b) - getPublishedTime(a);
      });
    }

    if (sortBy === "oldest") {
      return [...list].sort((a, b) => getPublishedTime(a) - getPublishedTime(b));
    }

    return [...list].sort((a, b) => getPublishedTime(b) - getPublishedTime(a));
  }, [posts, selectedCountry, selectedType, selectedStatus, onlyImportant, search, sortBy, countryMap]);

  const featuredPost = useMemo(() => {
    if (filtered.length === 0) return null;
    return filtered[0];
  }, [filtered]);

  const restPosts = useMemo(() => {
    if (!featuredPost) return filtered;
    return filtered.filter((post) => post.id !== featuredPost.id);
  }, [filtered, featuredPost]);

  const clearFilters = () => {
    setSelectedCountry("");
    setSelectedType("");
    setSelectedStatus("all");
    setSearch("");
    setSortBy("newest");
    setOnlyImportant(false);
  };

  const hasFilters =
    Boolean(selectedCountry) ||
    Boolean(selectedType) ||
    selectedStatus !== "all" ||
    Boolean(search.trim()) ||
    sortBy !== "newest" ||
    onlyImportant;

  return (
    <div className="min-h-screen bg-slate-50 py-6 md:py-10">
      <div className="mx-auto max-w-7xl space-y-4 px-4 md:space-y-6">
        <header className="space-y-1.5 md:space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Yurtdışı Çalışma &amp; Vize Duyuruları
          </h1>
          <p className="hidden max-w-3xl text-sm leading-6 text-slate-600 md:block">
            Resmi kurum kaynaklı güncellemeleri tek merkezde takip edin. Ülke, duyuru türü ve durum filtreleriyle
            ihtiyaç duyduğunuz duyuruya hızla ulaşın.
          </p>
          <p className="max-w-xl text-sm leading-6 text-slate-600 md:hidden">
            Resmi kurum duyurularını tek merkezden takip edin.
          </p>
        </header>

        <DuyuruFilterBar
          countries={countries}
          newsTypes={newsTypes}
          selectedCountry={selectedCountry}
          selectedType={selectedType}
          selectedStatus={selectedStatus}
          search={search}
          sortBy={sortBy}
          onlyImportant={onlyImportant}
          onCountryChange={setSelectedCountry}
          onTypeChange={setSelectedType}
          onStatusChange={setSelectedStatus}
          onSearchChange={setSearch}
          onSortChange={setSortBy}
          onOnlyImportantChange={setOnlyImportant}
        />

        {filtered.length === 0 || !featuredPost ? (
          <DuyuruEmptyState hasFilters={hasFilters} onClear={clearFilters} />
        ) : (
          <>
            <DuyuruFeaturedCard
              post={featuredPost}
              countryLabel={featuredPost.country_slug ? countryMap.get(featuredPost.country_slug) ?? formatCountryLabel(featuredPost.country_slug) : null}
            />

            {restPosts.length > 0 ? (
              <section className="space-y-4">
                {restPosts.map((post) => (
                  <DuyuruGridCard
                    key={post.id}
                    post={post}
                    countryLabel={post.country_slug ? countryMap.get(post.country_slug) ?? formatCountryLabel(post.country_slug) : null}
                  />
                ))}
              </section>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
