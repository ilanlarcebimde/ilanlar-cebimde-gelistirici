import Image from "next/image";
import Link from "next/link";
import { FileText } from "lucide-react";
import { DuyuruBadge } from "./DuyuruBadge";
import { formatDateTR, formatNewsTypeLabel, isBreakingPost, isImportantPost, toTurkishBadgeText } from "./helpers";
import { DuyuruPost } from "./types";

type DuyuruCardProps = {
  post: DuyuruPost;
  countryLabel: string | null;
};

export function DuyuruCard({ post, countryLabel }: DuyuruCardProps) {
  const typeLabel = formatNewsTypeLabel(post.news_type);
  const badgeLabel = toTurkishBadgeText(post.news_badge);
  const source = post.source_name?.trim() || "Resmi kaynak";

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative h-40 overflow-hidden border-b border-slate-100">
        {post.cover_image_url ? (
          <Image
            src={post.cover_image_url}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            unoptimized={post.cover_image_url.includes("supabase")}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500">
            <FileText className="h-8 w-8" />
          </div>
        )}
      </div>

      <div className="space-y-3 p-4">
        <div className="flex flex-wrap gap-1.5">
          {isImportantPost(post) ? <DuyuruBadge text="Önemli" tone="important" /> : null}
          {isBreakingPost(post) ? <DuyuruBadge text="Son Dakika" tone="breaking" /> : null}
          <DuyuruBadge text={typeLabel} tone="type" />
          {countryLabel ? <DuyuruBadge text={countryLabel} tone="country" /> : null}
          {badgeLabel ? <DuyuruBadge text={badgeLabel} /> : null}
        </div>

        <h2 className="line-clamp-2 text-lg font-semibold leading-snug text-slate-900">{post.title}</h2>

        <p className="line-clamp-2 text-sm leading-6 text-slate-600">
          {post.summary?.trim() || "Detaylı duyuru içeriği için devamını görüntüleyin."}
        </p>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="min-w-0">
            <p className="truncate text-xs text-slate-500">{formatDateTR(post.published_at)}</p>
            <p className="truncate text-xs font-medium text-slate-600">{source}</p>
          </div>
          <Link
            href={`/yurtdisi-calisma-ve-vize-duyurulari/${post.slug}`}
            className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50"
          >
            Duyuruyu Oku
          </Link>
        </div>
      </div>
    </article>
  );
}
