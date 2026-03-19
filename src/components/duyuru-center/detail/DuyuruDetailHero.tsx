import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { DuyuruBadge } from "../DuyuruBadge";
import { DuyuruDetailData } from "./types";
import { formatDateTR, getCountryLabel } from "./helpers";
import { NEWS_TYPE_LABELS, toTurkishBadgeText } from "../helpers";

type DuyuruDetailHeroProps = {
  post: DuyuruDetailData;
  countryMap: Map<string, string>;
};

export function DuyuruDetailHero({ post, countryMap }: DuyuruDetailHeroProps) {
  const countryLabel = getCountryLabel(post.country_slug, countryMap);
  const typeLabel = post.news_type ? NEWS_TYPE_LABELS[post.news_type] ?? "Resmi Duyuru" : "Resmi Duyuru";
  const badgeLabel = toTurkishBadgeText(post.news_badge);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-8">
      <nav className="mb-4 hidden items-center gap-1 text-xs font-medium text-slate-500 md:flex">
        <Link href="/" className="hover:text-slate-700">Ana Sayfa</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/yurtdisi-calisma-ve-vize-duyurulari" className="hover:text-slate-700">
          Yurtdışı Çalışma &amp; Vize Duyuruları
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="line-clamp-1 text-slate-700">{post.title}</span>
      </nav>
      <div className="mb-4 md:hidden">
        <Link
          href="/yurtdisi-calisma-ve-vize-duyurulari"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Duyurulara geri dön
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(post.priority_level === "important" || post.priority_level === "critical") ? (
          <DuyuruBadge text="Önemli" tone="important" />
        ) : null}
        {post.news_badge?.toLowerCase().includes("son") || post.news_badge?.toLowerCase().includes("break") ? (
          <DuyuruBadge text="Son Dakika" tone="breaking" />
        ) : null}
        <DuyuruBadge text={typeLabel} tone="type" />
        <DuyuruBadge text={countryLabel} tone="country" />
        {badgeLabel ? <DuyuruBadge text={badgeLabel} /> : null}
      </div>

      <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl">{post.title}</h1>

      {post.summary?.trim() ? (
        <p className="mt-4 max-w-4xl text-base leading-7 text-slate-600">{post.summary.trim()}</p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
        <span>{formatDateTR(post.published_at)}</span>
        <span>{post.source_name?.trim() || "Resmi kaynak"}</span>
        <span>{countryLabel}</span>
      </div>
    </section>
  );
}
