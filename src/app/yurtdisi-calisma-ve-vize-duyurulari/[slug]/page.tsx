import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSupabasePublic } from "@/lib/supabase/server";
import { absoluteOgImageUrl, SITE_ORIGIN } from "@/lib/og";
import { DuyuruDetailHero } from "@/components/duyuru-center/detail/DuyuruDetailHero";
import { DuyuruMetaCards } from "@/components/duyuru-center/detail/DuyuruMetaCards";
import { DuyuruCoverImage } from "@/components/duyuru-center/detail/DuyuruCoverImage";
import { DuyuruBodyContent } from "@/components/duyuru-center/detail/DuyuruBodyContent";
import { DuyuruTags } from "@/components/duyuru-center/detail/DuyuruTags";
import { DuyuruFooterActions } from "@/components/duyuru-center/detail/DuyuruFooterActions";
import { DuyuruDetailData, DuyuruTag, PrevNextItem } from "@/components/duyuru-center/detail/types";

// Yayın güncellemeleri ve yeni slug'lar için sayfayı dinamik tut.
export const dynamic = "force-dynamic";
export const revalidate = 0;

function toMs(value: string | null | undefined): number {
  if (!value) return Number.NaN;
  return new Date(value).getTime();
}

function isLiveNewsPost(
  status: string | null | undefined,
  publishedAt: string | null | undefined,
  scheduledAt: string | null | undefined,
  nowMs: number
): boolean {
  if (status === "published") {
    const publishedMs = toMs(publishedAt);
    return Number.isNaN(publishedMs) || publishedMs <= nowMs;
  }
  if (status === "scheduled") {
    const scheduledMs = toMs(scheduledAt);
    return !Number.isNaN(scheduledMs) && scheduledMs <= nowMs;
  }
  return false;
}

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = getSupabasePublic();
  const nowMs = Date.now();
  const { data: post } = await supabase
    .from("merkezi_posts")
    .select("title, summary, seo_title, og_title, og_description, og_image, canonical_url, status, published_at, scheduled_at")
    .eq("slug", slug)
    .in("content_type", ["international_work_visa_news", "blog"])
    .in("status", ["published", "scheduled"])
    .maybeSingle();

  if (
    !post ||
    !isLiveNewsPost(
      (post as { status?: string | null }).status,
      (post as { published_at?: string | null }).published_at,
      (post as { scheduled_at?: string | null }).scheduled_at,
      nowMs
    )
  ) {
    return { title: "Bulunamadi | Ilanlar Cebimde" };
  }

  const title = (post as { seo_title?: string | null; title?: string }).seo_title || (post as { title: string }).title;
  const description = (post as { summary?: string | null; og_description?: string | null }).og_description || (post as { summary?: string | null }).summary || "";
  const canonical = (post as { canonical_url?: string | null }).canonical_url || `${SITE_ORIGIN}/yurtdisi-calisma-ve-vize-duyurulari/${slug}`;
  const ogTitle = (post as { og_title?: string | null }).og_title || title;
  const ogImage = (post as { og_image?: string | null }).og_image;
  const hasCustomOg = !!(ogImage && String(ogImage).trim());
  const imageUrl = absoluteOgImageUrl(ogImage);
  const imgW = hasCustomOg ? 1200 : 500;
  const imgH = hasCustomOg ? 630 : 500;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: ogTitle,
      description,
      siteName: "İlanlar Cebimde",
      locale: "tr_TR",
      url: canonical,
      type: "article",
      images: [{ url: imageUrl, width: imgW, height: imgH, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: [imageUrl],
    },
  };
}

export default async function InternationalNewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = getSupabasePublic();
  const nowMs = Date.now();

  const { data: postRaw } = await supabase
    .from("merkezi_posts")
    .select(
      "id, title, summary, content_html_sanitized, country_slug, city, news_type, source_name, source_url, effective_date, priority_level, news_badge, structured_summary, user_impact, application_impact, published_at, scheduled_at, status, cover_image_url"
    )
    .eq("slug", slug)
    .in("content_type", ["international_work_visa_news", "blog"])
    .in("status", ["published", "scheduled"])
    .maybeSingle();

  if (
    !postRaw ||
    !isLiveNewsPost(
      (postRaw as { status?: string | null }).status,
      (postRaw as { published_at?: string | null }).published_at,
      (postRaw as { scheduled_at?: string | null }).scheduled_at,
      nowMs
    )
  ) {
    notFound();
  }
  const post = {
    ...(postRaw as DuyuruDetailData),
    published_at:
      (postRaw as { published_at?: string | null }).published_at ??
      (postRaw as { scheduled_at?: string | null }).scheduled_at ??
      null,
  } as DuyuruDetailData;

  const [{ data: countries }, { data: navRows }, { data: tagRelRows }] = await Promise.all([
    supabase.from("merkezi_countries").select("slug, name").eq("is_active", true),
    supabase
      .from("merkezi_posts")
      .select("id, title, slug, published_at, scheduled_at, status, news_type")
      .in("content_type", ["international_work_visa_news", "blog"])
      .in("status", ["published", "scheduled"])
      .order("published_at", { ascending: false, nullsFirst: false }),
    supabase.from("merkezi_post_tags").select("tag_id").eq("post_id", post.id),
  ]);

  const countryMap = new Map<string, string>();
  for (const row of countries ?? []) {
    const rowSlug = (row as { slug: string }).slug;
    const name = (row as { name: string }).name;
    if (rowSlug) countryMap.set(rowSlug, name || rowSlug);
  }

  const orderedRaw = (navRows ?? []) as Array<{
    id: string;
    title: string;
    slug: string;
    published_at: string | null;
    scheduled_at: string | null;
    status: string | null;
    news_type: string | null;
  }>;
  const ordered = orderedRaw
    .filter((item) => isLiveNewsPost(item.status, item.published_at, item.scheduled_at, nowMs))
    .map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      published_at: item.published_at ?? item.scheduled_at ?? null,
      news_type: item.news_type,
    }));
  const currentIndex = ordered.findIndex((item) => item.id === post.id);
  const previous: PrevNextItem | null =
    currentIndex >= 0 && ordered[currentIndex + 1]
      ? {
          id: ordered[currentIndex + 1].id,
          title: ordered[currentIndex + 1].title,
          slug: ordered[currentIndex + 1].slug,
          published_at: ordered[currentIndex + 1].published_at,
          news_type: ordered[currentIndex + 1].news_type,
        }
      : null;
  const next: PrevNextItem | null =
    currentIndex > 0 && ordered[currentIndex - 1]
      ? {
          id: ordered[currentIndex - 1].id,
          title: ordered[currentIndex - 1].title,
          slug: ordered[currentIndex - 1].slug,
          published_at: ordered[currentIndex - 1].published_at,
          news_type: ordered[currentIndex - 1].news_type,
        }
      : null;

  const tagIds = (tagRelRows ?? []).map((row) => (row as { tag_id: string }).tag_id);
  let tags: DuyuruTag[] = [];
  if (tagIds.length > 0) {
    const { data: tagsRaw } = await supabase.from("merkezi_tags").select("id, name, slug").in("id", tagIds);
    tags = (tagsRaw ?? []) as DuyuruTag[];
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-7xl space-y-5 px-4">
        <DuyuruDetailHero post={post} countryMap={countryMap} />
        <div className="hidden md:block">
          <DuyuruMetaCards post={post} countryMap={countryMap} />
        </div>
        <DuyuruCoverImage title={post.title} imageUrl={post.cover_image_url ?? null} />

        <DuyuruBodyContent htmlContent={post.content_html_sanitized} pageTitle={post.title} />
        <div className="md:hidden">
          <DuyuruMetaCards post={post} countryMap={countryMap} compact />
        </div>
        <DuyuruTags tags={tags} />
        <DuyuruFooterActions previous={previous} next={next} />
      </div>
    </div>
  );
}
