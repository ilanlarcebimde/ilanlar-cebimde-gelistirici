/**
 * Merkez verisi — sadece server tarafında (getSupabaseAdmin).
 * Premium iletişim burada okunmaz; ayrı API ile premium doğrulama sonrası verilir.
 */

import { getSupabaseAdmin } from "@/lib/supabase/server";
import type {
  MerkeziPost,
  MerkeziPostLandingItem,
  MerkeziTag,
  MerkeziSeoPage,
  SegmentPost,
  SegmentSector,
  SegmentCountrySector,
  MerkeziPage,
} from "./types";

const NOW = new Date().toISOString();

function stripHtmlToPlain(html: string | null | undefined, maxLen = 200): string {
  if (!html?.trim()) return "";
  const plain = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return plain.length > maxLen ? plain.slice(0, maxLen) + "…" : plain;
}

/** Yayındaki tek post (slug ile); tags ile birlikte. */
export async function getPublishedPostBySlug(slug: string): Promise<SegmentPost | null> {
  const supabase = getSupabaseAdmin();
  const { data: post, error } = await supabase
    .from("merkezi_posts")
    .select("id, created_at, updated_at, published_at, status, title, slug, cover_image_url, content, content_html_raw, content_html_sanitized, country_slug, city, sector_slug, is_paid, show_contact_when_free, company_logo_url, company_name, company_short_description")
    .eq("slug", slug)
    .eq("status", "published")
    .or(`published_at.is.null,published_at.lte.${NOW}`)
    .maybeSingle();

  if (error || !post) return null;

  const { data: ptRows } = await supabase
    .from("merkezi_post_tags")
    .select("tag_id")
    .eq("post_id", post.id);
  const tagIds = (ptRows ?? []).map((r: { tag_id: string }) => r.tag_id);
  let tags: MerkeziTag[] = [];
  if (tagIds.length > 0) {
    const { data: tagList } = await supabase
      .from("merkezi_tags")
      .select("id, name, slug")
      .in("id", tagIds);
    tags = (tagList ?? []) as MerkeziTag[];
  }

  return { kind: "post", post: post as MerkeziPost, tags };
}

/** Sektör landing: seo_page + o sektördeki yayındaki postlar. */
export async function getSectorBySlug(sectorSlug: string): Promise<SegmentSector | null> {
  const supabase = getSupabaseAdmin();
  const { data: seoRow } = await supabase
    .from("merkezi_seo_pages")
    .select("*")
    .eq("type", "sector")
    .eq("sector_slug", sectorSlug)
    .maybeSingle();

  const { data: posts } = await supabase
    .from("merkezi_posts")
    .select("id, created_at, updated_at, published_at, status, title, slug, cover_image_url, content, content_html_raw, content_html_sanitized, country_slug, city, sector_slug, is_paid, show_contact_when_free, company_logo_url, company_name, company_short_description")
    .eq("sector_slug", sectorSlug)
    .eq("status", "published")
    .or(`published_at.is.null,published_at.lte.${NOW}`)
    .order("published_at", { ascending: false, nullsFirst: false });

  const seoPage: MerkeziPage | null = seoRow
    ? {
        title: (seoRow as MerkeziSeoPage).title,
        meta_description: (seoRow as MerkeziSeoPage).meta_description,
        cover_image_url: (seoRow as MerkeziSeoPage).cover_image_url,
        content: (seoRow as MerkeziSeoPage).content,
      }
    : null;

  return {
    kind: "sector",
    sectorSlug,
    seoPage,
    posts: (posts ?? []) as MerkeziPost[],
  };
}

/** Ülke+sektör landing (segment örn. "almanya-insaat"). */
export async function getCountrySectorBySegment(
  segment: string
): Promise<SegmentCountrySector | null> {
  const lastDash = segment.lastIndexOf("-");
  if (lastDash <= 0) return null;
  const countrySlug = segment.slice(0, lastDash);
  const sectorSlug = segment.slice(lastDash + 1);
  if (!countrySlug || !sectorSlug) return null;

  const supabase = getSupabaseAdmin();
  const { data: seoRow } = await supabase
    .from("merkezi_seo_pages")
    .select("*")
    .eq("type", "country_sector")
    .eq("country_slug", countrySlug)
    .eq("sector_slug", sectorSlug)
    .maybeSingle();

  const { data: posts } = await supabase
    .from("merkezi_posts")
    .select("id, created_at, updated_at, published_at, status, title, slug, cover_image_url, content, content_html_raw, content_html_sanitized, country_slug, city, sector_slug, is_paid, show_contact_when_free, company_logo_url, company_name, company_short_description")
    .eq("country_slug", countrySlug)
    .eq("sector_slug", sectorSlug)
    .eq("status", "published")
    .or(`published_at.is.null,published_at.lte.${NOW}`)
    .order("published_at", { ascending: false, nullsFirst: false });

  const seoPage: MerkeziPage | null = seoRow
    ? {
        title: (seoRow as MerkeziSeoPage).title,
        meta_description: (seoRow as MerkeziSeoPage).meta_description,
        cover_image_url: (seoRow as MerkeziSeoPage).cover_image_url,
        content: (seoRow as MerkeziSeoPage).content,
      }
    : null;

  return {
    kind: "country_sector",
    countrySlug,
    sectorSlug,
    seoPage,
    posts: (posts ?? []) as MerkeziPost[],
  };
}

/** Tek post için görüntülenme ve beğeni sayısı (server-side; userLiked client'da güncellenir). */
export async function getPostCounts(postId: string): Promise<{ viewCount: number; likeCount: number }> {
  const supabase = getSupabaseAdmin();
  const [viewsRes, likesRes] = await Promise.all([
    supabase.from("merkezi_post_views").select("id", { count: "exact", head: true }).eq("post_id", postId),
    supabase.from("merkezi_post_likes").select("id", { count: "exact", head: true }).eq("post_id", postId),
  ]);
  return {
    viewCount: viewsRes.count ?? 0,
    likeCount: likesRes.count ?? 0,
  };
}

/** Birden fazla post için tag listesi: { postId: MerkeziTag[] }. */
export async function getTagsByPostIds(
  postIds: string[]
): Promise<Record<string, MerkeziTag[]>> {
  if (postIds.length === 0) return {};
  const supabase = getSupabaseAdmin();
  const { data: rows } = await supabase
    .from("merkezi_post_tags")
    .select("post_id, tag_id")
    .in("post_id", postIds);
  const tagIds = [...new Set((rows ?? []).map((r: { tag_id: string }) => r.tag_id))];
  if (tagIds.length === 0) {
    const map: Record<string, MerkeziTag[]> = {};
    for (const id of postIds) map[id] = [];
    return map;
  }
  const { data: tags } = await supabase
    .from("merkezi_tags")
    .select("id, name, slug")
    .in("id", tagIds);
  const tagMap = new Map<string, MerkeziTag>();
  for (const t of tags ?? []) tagMap.set((t as MerkeziTag).id, t as MerkeziTag);
  const map: Record<string, MerkeziTag[]> = {};
  for (const id of postIds) map[id] = [];
  for (const r of rows ?? []) {
    const t = tagMap.get((r as { tag_id: string }).tag_id);
    if (t && (r as { post_id: string }).post_id) {
      map[(r as { post_id: string }).post_id].push(t);
    }
  }
  return map;
}

/** Merkez landing sayfasında gösterilmeyecek başlık eşleşmeleri (kısmi metin). */
const EXCLUDED_FROM_LANDING_TITLES = [
  "Isı Pompası Teknisyeni – İsveç / Svedala",
];

/** Merkez feed için yayındaki yazılar. summary server-side türetilir (content_html_sanitized'dan). limit 30. */
export async function getPublishedPostsForMerkeziLanding(limit = 30): Promise<{
  posts: MerkeziPostLandingItem[];
  tagsByPostId: Record<string, MerkeziTag[]>;
}> {
  const supabase = getSupabaseAdmin();
  const { data: rows } = await supabase
    .from("merkezi_posts")
    .select("id, title, slug, cover_image_url, country_slug, city, sector_slug, is_paid, published_at, created_at, content_html_sanitized, application_deadline_date, application_deadline_text, content_type, summary")
    .eq("status", "published")
    .or(`published_at.is.null,published_at.lte.${NOW}`)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit + EXCLUDED_FROM_LANDING_TITLES.length * 2);

  const raw = (rows ?? []) as (MerkeziPostLandingItem & {
    content_html_sanitized?: string | null;
    content_type?: "job" | "blog" | null;
    summary?: string | null;
  })[];
  const filtered = raw.filter(
    (p) => !EXCLUDED_FROM_LANDING_TITLES.some((t) => (p.title || "").includes(t))
  ).slice(0, limit);

  const list: MerkeziPostLandingItem[] = filtered.map((p) => {
    const { content_html_sanitized, content_type, summary: dbSummary, ...rest } = p;
    const summary =
      (dbSummary && dbSummary.trim()) || stripHtmlToPlain(content_html_sanitized, 200);
    return {
      ...rest,
      content_type: content_type ?? "job",
      summary,
    };
  });
  const tagsByPostId = await getTagsByPostIds(list.map((p) => p.id));
  return { posts: list, tagsByPostId };
}

/** Segment çözümleme: önce post, sonra sektör, sonra ülke-sektör. */
export async function resolveSegment(
  segment: string
): Promise<SegmentPost | SegmentSector | SegmentCountrySector | null> {
  const post = await getPublishedPostBySlug(segment);
  if (post) return post;

  const sector = await getSectorBySlug(segment);
  if (sector) return sector;

  const countrySector = await getCountrySectorBySegment(segment);
  if (countrySector) return countrySector;

  return null;
}
