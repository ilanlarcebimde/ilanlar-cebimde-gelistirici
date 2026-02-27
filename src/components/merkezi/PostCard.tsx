"use client";

import Link from "next/link";
import Image from "next/image";
import type { MerkeziPost, MerkeziTag } from "@/lib/merkezi/types";

const BASE = "/yurtdisi-is-ilanlari";

export function PostCard({
  post,
  tags = [],
}: {
  post: MerkeziPost;
  tags?: MerkeziTag[];
}) {
  const excerpt = post.content
    ? stripHtml(post.content).slice(0, 140) + (stripHtml(post.content).length > 140 ? "…" : "")
    : "";

  return (
    <Link
      href={`${BASE}/${post.slug}`}
      className="block rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      {post.cover_image_url && (
        <div className="relative h-44 w-full overflow-hidden rounded-t-xl bg-slate-100">
          <Image
            src={post.cover_image_url}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
            unoptimized={post.cover_image_url.includes("supabase")}
          />
        </div>
      )}
      <div className="p-4">
        <h2 className="font-semibold text-slate-900 line-clamp-2">{post.title}</h2>
        {post.country_slug && (
          <p className="mt-1 text-xs text-slate-500">{post.country_slug}</p>
        )}
        {excerpt && (
          <p className="mt-2 text-sm text-slate-600 line-clamp-2">{excerpt}</p>
        )}
        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.slice(0, 4).map((t) => (
              <span
                key={t.id}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
              >
                {t.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
