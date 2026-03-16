import type { Metadata } from "next";
import { getSupabasePublic } from "@/lib/supabase/server";
import { DuyuruCenterClient } from "@/components/duyuru-center/DuyuruCenterClient";
import { DuyuruCountry, DuyuruPost } from "@/components/duyuru-center/types";

export const metadata: Metadata = {
  title: "Yurtdışı Çalışma & Vize Duyuruları | İlanlar Cebimde",
  description:
    "Vize, pasaport, çalışma izni ve resmi kurum kaynaklı yurtdışı çalışma duyurularını ülke ve tür bazlı takip edin.",
};

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

export default async function InternationalNewsHubPage() {
  const supabase = getSupabasePublic();
  const nowMs = Date.now();

  const query = supabase
    .from("merkezi_posts")
    .select(
      "id, title, slug, summary, country_slug, news_type, priority_level, news_badge, published_at, scheduled_at, status, is_featured, source_name, cover_image_url"
    )
    .eq("content_type", "international_work_visa_news")
    .in("status", ["published", "scheduled"])
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("scheduled_at", { ascending: false, nullsFirst: false })
    .limit(200);

  const { data: rows } = await query;
  const posts: DuyuruPost[] = ((rows ?? []) as Array<
    DuyuruPost & { status: string | null; scheduled_at: string | null }
  >)
    .filter((row) => isLiveNewsPost(row.status, row.published_at, row.scheduled_at, nowMs))
    .map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      summary: row.summary,
      country_slug: row.country_slug,
      news_type: row.news_type,
      priority_level: row.priority_level,
      news_badge: row.news_badge,
      published_at: row.published_at ?? row.scheduled_at ?? null,
      is_featured: row.is_featured,
      source_name: row.source_name,
      cover_image_url: row.cover_image_url,
    }));

  const { data: countries } = await supabase
    .from("merkezi_countries")
    .select("slug, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const countryList: DuyuruCountry[] = (countries ?? []) as DuyuruCountry[];

  return (
    <DuyuruCenterClient posts={posts} countries={countryList} />
  );
}
