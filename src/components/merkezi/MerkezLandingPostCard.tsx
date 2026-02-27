"use client";

import Link from "next/link";
import Image from "next/image";
import type { MerkeziPostLandingItem, MerkeziTag } from "@/lib/merkezi/types";

const BASE = "/yurtdisi-is-ilanlari";
const MAX_TAGS = 4;

interface MerkezLandingPostCardProps {
  post: MerkeziPostLandingItem;
  tags: MerkeziTag[];
}

export function MerkezLandingPostCard({ post, tags }: MerkezLandingPostCardProps) {
  const location = [post.country_slug, post.city].filter(Boolean).join(", ");
  const displayTags = tags.slice(0, MAX_TAGS);
  const extraCount = tags.length > MAX_TAGS ? tags.length - MAX_TAGS : 0;

  return (
    <Link
      href={`${BASE}/${post.slug}`}
      className="group block overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-900/5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:ring-slate-900/10 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
        {post.cover_image_url ? (
          <Image
            src={post.cover_image_url}
            alt=""
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized={post.cover_image_url.includes("supabase")}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <span className="text-4xl text-slate-400" aria-hidden>📄</span>
          </div>
        )}
        <span
          className={`absolute right-2 top-2 rounded-lg px-2 py-1 text-xs font-semibold shadow-sm ${
            post.is_paid
              ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white"
              : "bg-emerald-500/90 text-white"
          }`}
        >
          {post.is_paid ? "Premium" : "Ücretsiz"}
        </span>
      </div>
      <div className="p-4">
        <h2 className="line-clamp-2 font-semibold text-slate-900 group-hover:text-sky-700">
          {post.title}
        </h2>
        {(location || post.sector_slug) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            {location && (
              <span className="flex items-center gap-1">
                <span aria-hidden>📍</span>
                {location}
              </span>
            )}
            {post.sector_slug && (
              <span className="flex items-center gap-1">
                <span aria-hidden>🏷</span>
                {post.sector_slug}
              </span>
            )}
          </div>
        )}
        {displayTags.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {displayTags.map((t) => (
              <span
                key={t.id}
                className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600"
              >
                {t.name}
              </span>
            ))}
            {extraCount > 0 && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500">
                +{extraCount}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
