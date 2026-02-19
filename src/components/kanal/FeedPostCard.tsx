"use client";

import Link from "next/link";
import { formatPublishedAt } from "@/lib/formatTime";

const SNIPPET_MAX_LINES = 3;
const SNIPPET_LINE_HEIGHT = 1.4;

export type FeedPost = {
  id: string;
  title: string;
  position_text: string | null;
  location_text: string | null;
  source_name: string | null;
  source_url: string | null;
  snippet: string | null;
  published_at: string;
};

function truncateSnippet(text: string, maxLines: number): string {
  const lines = text.split(/\n/).slice(0, maxLines);
  const out = lines.join("\n").trim();
  if (text.length > out.length || lines.length === maxLines) {
    return out.replace(/\s+$/, "") + "…";
  }
  return out;
}

export function FeedPostCard({ post, brandColor }: { post: FeedPost; brandColor?: string }) {
  const snippet = post.snippet
    ? truncateSnippet(post.snippet, SNIPPET_MAX_LINES)
    : null;
  const detailHref = post.source_url ? `/r/${post.id}` : null;
  const color = brandColor || "rgb(59, 130, 246)";

  return (
    <article
      className="group rounded-[16px] border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] sm:p-6 relative"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="min-w-0 flex-1 text-base font-bold leading-snug text-slate-900 sm:text-lg">
          {post.title}
        </h2>
        <span className="shrink-0 text-xs text-slate-400 sm:text-sm">
          {formatPublishedAt(post.published_at)}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-500">
        {post.position_text && <span>{post.position_text}</span>}
        {post.location_text && <span>{post.location_text}</span>}
        {post.source_name && <span>{post.source_name}</span>}
      </div>

      {snippet && (
        <p
          className="mt-3 text-sm leading-relaxed text-slate-600"
          style={{ lineHeight: SNIPPET_LINE_HEIGHT }}
        >
          {snippet}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-medium text-slate-500">
          {post.source_name || "Kaynak"}
        </span>
        {detailHref && (
          <Link
            href={detailHref}
            className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 w-full sm:w-auto text-center"
          >
            İlana Git
          </Link>
        )}
      </div>
    </article>
  );
}
