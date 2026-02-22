"use client";

import Link from "next/link";
import { formatPublishedAt } from "@/lib/formatTime";
import { isHiddenSourceName } from "@/lib/feedHiddenSources";


const SNIPPET_MAX_LINES = 3;
const SNIPPET_LINE_HEIGHT = 1.45;

/** Feed'deki ilan; id = job_posts.id (PanelFeed/KanalFeed job_posts'tan çeker). */
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
  if (post.source_name?.trim() && !isHiddenSourceName(post.source_name)) {
    parts.push(post.source_name.trim());
  }
  return parts;
}

export function FeedPostCard({
  post,
  brandColor,
  onHowToApplyClick,
  onApplyGuideError,
}: {
  post: FeedPost;
  brandColor?: string;
  /** Verilirse "Nasıl Başvururum?" butonu gösterilir; tıklanınca bu çağrılır. */
  onHowToApplyClick?: (post: FeedPost) => void;
  /** Tıklama sırasında hata olursa çağrılır (toast göstermek için). */
  onApplyGuideError?: (err: unknown) => void;
}) {
  const handleApplyClick = () => {
    console.log("HOWTO CLICK", post.id);
    try {
      if (onHowToApplyClick) {
        onHowToApplyClick(post);
      } else {
        console.warn("[FeedPostCard] onHowToApplyClick not provided");
      }
    } catch (err) {
      console.error("[FeedPostCard] applyGuide error", err);
      onApplyGuideError?.(err);
    }
  };

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
      {/* Header: başlık (baskın) + tarih + Nasıl Başvururum?; mobilde başlık üstte, buton full width */}
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:flex-wrap sm:gap-3">
        <h2 className="min-w-0 flex-1 text-base font-bold leading-snug text-slate-900 sm:text-lg">
          {post.title}
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 shrink-0">
          <span className="text-xs text-slate-500 sm:text-sm order-last sm:order-none" aria-label="Yayın tarihi">
            {formatPublishedAt(post.published_at)}
          </span>
          {onHowToApplyClick ? (
            <button
              type="button"
              onClick={handleApplyClick}
              className="rounded-xl border-2 font-semibold min-h-[44px] px-4 py-2.5 text-sm w-full sm:w-auto shrink-0 border-brand-600 text-brand-600 bg-transparent hover:bg-brand-50 transition"
              aria-label="Nasıl başvurulur rehberini aç"
            >
              Nasıl Başvururum?
            </button>
          ) : null}
        </div>
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
        {!isHiddenSourceName(post.source_name) ? (
          <span className="text-xs font-medium text-slate-500 shrink-0">
            {post.source_name || "Kaynak"}
          </span>
        ) : null}
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
