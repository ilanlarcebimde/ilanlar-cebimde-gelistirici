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
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-slate-100">
        {post.cover_image_url ? (
          <Image
            src={post.cover_image_url}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized={post.cover_image_url.includes("supabase")}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
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

      <div className="flex min-h-0 flex-1 flex-col px-4 py-3">
        <h2 className="line-clamp-2 font-semibold text-slate-900">{post.title}</h2>
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

        <div className="mt-auto border-t border-slate-200 pt-3">
          <Link
            href={`${BASE}/${post.slug}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          >
            Görüntüle <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
