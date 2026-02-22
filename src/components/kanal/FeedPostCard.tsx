"use client";

import Link from "next/link";
import { formatPublishedAt } from "@/lib/formatTime";

const SNIPPET_MAX_LINES = 3;
const SNIPPET_LINE_HEIGHT = 1.45;

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

/** Meta satırında başlıkla birebir aynı metni tekrar gösterme */
function metaParts(post: FeedPost): string[] {
  const titleNorm = post.title?.trim().toLowerCase() ?? "";
  const parts: string[] = [];
  if (post.position_text?.trim()) {
    if (post.position_text.trim().toLowerCase() !== titleNorm) {
      parts.push(post.position_text.trim());
    }
  }
  if (post.location_text?.trim()) parts.push(post.location_text.trim());
  if (post.source_name?.trim()) parts.push(post.source_name.trim());
  return parts;
}

export function FeedPostCard({ post, brandColor }: { post: FeedPost; brandColor?: string }) {
  const snippet = post.snippet
    ? truncateSnippet(post.snippet, SNIPPET_MAX_LINES)
    : null;
  const detailHref = post.source_url ? `/r/${post.id}` : null;
  const color = brandColor || "rgb(59, 130, 246)";
  const metaItems = metaParts(post);

  return (
    <article
      className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] sm:p-6 lg:p-6"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      {/* Header: başlık (baskın) + tarih (ikincil); mobilde başlık üstte */}
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <h2 className="min-w-0 flex-1 text-base font-bold leading-snug text-slate-900 sm:text-lg">
          {post.title}
        </h2>
        <span className="shrink-0 text-xs text-slate-500 sm:text-sm" aria-label="Yayın tarihi">
          {formatPublishedAt(post.published_at)}
        </span>
      </div>

      {/* Meta: pozisyon / konum / kaynak — tek blok, wrap ile kırılır */}
      {metaItems.length > 0 && (
        <div className="mt-2 flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-sm text-slate-500">
          {metaItems.map((item, i) => (
            <span key={i} className="truncate max-w-full sm:max-w-none">
              {item}
            </span>
          ))}
        </div>
      )}

      {/* Snippet: max 3 satır, taşan … ile kesilir; boşsa alan yok */}
      {snippet ? (
        <p
          className="mt-3 text-sm text-slate-600"
          style={{ lineHeight: SNIPPET_LINE_HEIGHT }}
        >
          {snippet}
        </p>
      ) : null}

      {/* Footer: kaynak solda, buton sağda; mobilde buton full-width */}
      <div className="mt-4 flex min-w-0 flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-medium text-slate-500 shrink-0">
          {post.source_name || "Kaynak"}
        </span>
        {detailHref ? (
          <Link
            href={detailHref}
            className="flex min-h-[44px] w-full shrink-0 items-center justify-center rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 sm:w-auto sm:py-2.5"
          >
            İlana Git
          </Link>
        ) : null}
      </div>
    </article>
  );
}
