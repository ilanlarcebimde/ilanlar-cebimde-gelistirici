import Image from "next/image";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { DuyuruBadge } from "./DuyuruBadge";
import { formatDateTR, isBreakingPost, isImportantPost, NEWS_TYPE_LABELS, toTurkishBadgeText } from "./helpers";
import { DuyuruPost } from "./types";

type DuyuruFeaturedCardProps = {
  post: DuyuruPost;
  countryLabel: string | null;
};

export function DuyuruFeaturedCard({ post, countryLabel }: DuyuruFeaturedCardProps) {
  const typeLabel = post.news_type ? NEWS_TYPE_LABELS[post.news_type] ?? "Resmi Duyuru" : "Resmi Duyuru";
  const badgeLabel = toTurkishBadgeText(post.news_badge);
  const source = post.source_name?.trim() || "Resmi kaynak";

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-0 lg:grid-cols-2">
        <div className="relative min-h-[220px] border-b border-slate-100 lg:min-h-[320px] lg:border-b-0 lg:border-r">
          {post.cover_image_url ? (
            <Image
              src={post.cover_image_url}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              unoptimized={post.cover_image_url.includes("supabase")}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500">
              <ShieldCheck className="h-10 w-10" />
            </div>
          )}
        </div>

        <div className="space-y-4 p-5 lg:p-7">
          <div className="flex flex-wrap gap-2">
            <DuyuruBadge text="Öne Çıkan Duyuru" tone="default" />
            {isImportantPost(post) ? <DuyuruBadge text="Önemli" tone="important" /> : null}
            {isBreakingPost(post) ? <DuyuruBadge text="Son Dakika" tone="breaking" /> : null}
            <DuyuruBadge text={typeLabel} tone="type" />
            {countryLabel ? <DuyuruBadge text={countryLabel} tone="country" /> : null}
            {badgeLabel ? <DuyuruBadge text={badgeLabel} /> : null}
          </div>

          <h2 className="text-2xl font-bold leading-tight tracking-tight text-slate-900 lg:text-3xl">
            {post.title}
          </h2>

          <p className="line-clamp-3 text-sm leading-7 text-slate-600 lg:text-base">
            {post.summary?.trim() || "Detaylı duyuru içeriği için devamını görüntüleyin."}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <div className="text-xs text-slate-500">
              <p>{formatDateTR(post.published_at)}</p>
              <p className="mt-1 font-medium text-slate-600">{source}</p>
            </div>
            <Link
              href={`/yurtdisi-calisma-ve-vize-duyurulari/${post.slug}`}
              className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Duyurunun Tamamını Gör
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
