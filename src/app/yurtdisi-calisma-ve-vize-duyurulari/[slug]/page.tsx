import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSupabasePublic } from "@/lib/supabase/server";
import { SITE_ORIGIN } from "@/lib/og";
import { DuyuruDetailHero } from "@/components/duyuru-center/detail/DuyuruDetailHero";
import { DuyuruMetaCards } from "@/components/duyuru-center/detail/DuyuruMetaCards";
import { DuyuruCoverImage } from "@/components/duyuru-center/detail/DuyuruCoverImage";
import { DuyuruBodyContent } from "@/components/duyuru-center/detail/DuyuruBodyContent";
import { DuyuruTags } from "@/components/duyuru-center/detail/DuyuruTags";
import { DuyuruFooterActions } from "@/components/duyuru-center/detail/DuyuruFooterActions";
import { DuyuruDetailData, DuyuruTag, PrevNextItem } from "@/components/duyuru-center/detail/types";

function nowIso() {
  return new Date().toISOString();
}

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = getSupabasePublic();
  const { data: post } = await supabase
    .from("merkezi_posts")
    .select("title, summary, seo_title, og_title, og_description, og_image, canonical_url")
    .eq("slug", slug)
    .eq("content_type", "international_work_visa_news")
    .eq("status", "published")
    .or(`published_at.is.null,published_at.lte.${nowIso()}`)
    .maybeSingle();

  if (!post) return { title: "Bulunamadi | Ilanlar Cebimde" };

  const title = (post as { seo_title?: string | null; title?: string }).seo_title || (post as { title: string }).title;
  const description = (post as { summary?: string | null; og_description?: string | null }).og_description || (post as { summary?: string | null }).summary || "";
  const canonical = (post as { canonical_url?: string | null }).canonical_url || `${SITE_ORIGIN}/yurtdisi-calisma-ve-vize-duyurulari/${slug}`;
  const ogTitle = (post as { og_title?: string | null }).og_title || title;
  const ogImage = (post as { og_image?: string | null }).og_image || undefined;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: ogTitle,
      description,
      url: canonical,
      type: "article",
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function InternationalNewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = getSupabasePublic();

  const { data: postRaw } = await supabase
    .from("merkezi_posts")
    .select(
      "id, title, summary, content_html_sanitized, country_slug, city, news_type, source_name, source_url, effective_date, priority_level, news_badge, structured_summary, user_impact, application_impact, published_at, cover_image_url"
    )
    .eq("slug", slug)
    .eq("content_type", "international_work_visa_news")
    .eq("status", "published")
    .or(`published_at.is.null,published_at.lte.${nowIso()}`)
    .maybeSingle();

  if (!postRaw) notFound();
  const post = postRaw as DuyuruDetailData;

  const [{ data: countries }, { data: navRows }, { data: tagRelRows }] = await Promise.all([
    supabase.from("merkezi_countries").select("slug, name").eq("is_active", true),
    supabase
      .from("merkezi_posts")
      .select("id, title, slug, published_at, news_type")
      .eq("content_type", "international_work_visa_news")
      .eq("status", "published")
      .or(`published_at.is.null,published_at.lte.${nowIso()}`)
      .order("published_at", { ascending: false, nullsFirst: false }),
    supabase.from("merkezi_post_tags").select("tag_id").eq("post_id", post.id),
  ]);

  const countryMap = new Map<string, string>();
  for (const row of countries ?? []) {
    const rowSlug = (row as { slug: string }).slug;
    const name = (row as { name: string }).name;
    if (rowSlug) countryMap.set(rowSlug, name || rowSlug);
  }

  const ordered = (navRows ?? []) as Array<{
    id: string;
    title: string;
    slug: string;
    published_at: string | null;
    news_type: string | null;
  }>;
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
        <DuyuruMetaCards post={post} countryMap={countryMap} />
        <DuyuruCoverImage title={post.title} imageUrl={post.cover_image_url ?? null} />

        <DuyuruBodyContent htmlContent={post.content_html_sanitized} pageTitle={post.title} />
        <DuyuruTags tags={tags} />
        <DuyuruFooterActions previous={previous} next={next} />
      </div>
    </div>
  );
}
