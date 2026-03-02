/**
 * Merkez verisi — sadece server tarafında (getSupabaseAdmin).
 * Premium iletişim burada okunmaz; ayrı API ile premium doğrulama sonrası verilir.
 */

import { getSupabaseAdmin, getSupabasePublic } from "@/lib/supabase/server";
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

/** Ülke ve sektör slug → name map (UI'da slug yerine label göstermek için). */
async function getTaxonomyMaps(): Promise<{
  countryNameBySlug: Map<string, string>;
  sectorNameBySlug: Map<string, string>;
}> {
  const supabase = getSupabasePublic();
  const [{ data: countries }, { data: sectors }] = await Promise.all([
    supabase.from("merkezi_countries").select("slug, name").eq("is_active", true),
    supabase.from("merkezi_sectors").select("slug, name").eq("is_active", true),
  ]);
  const countryNameBySlug = new Map<string, string>();
  const sectorNameBySlug = new Map<string, string>();
  for (const c of countries ?? []) {
    const s = (c as { slug: string }).slug?.trim().toLowerCase();
    if (s) countryNameBySlug.set(s, (c as { name: string }).name ?? s);
  }
  for (const s of sectors ?? []) {
    const slug = (s as { slug: string }).slug?.trim().toLowerCase();
    if (slug) sectorNameBySlug.set(slug, (s as { name: string }).name ?? slug);
  }
  return { countryNameBySlug, sectorNameBySlug };
}

function enrichPostWithTaxonomyNames<T extends { country_slug?: string | null; sector_slug?: string | null }>(
  post: T,
  maps: { countryNameBySlug: Map<string, string>; sectorNameBySlug: Map<string, string> }
): T & { country_name?: string | null; sector_name?: string | null } {
  const countrySlug = post.country_slug?.trim().toLowerCase();
  const sectorSlug = post.sector_slug?.trim().toLowerCase();
  return {
    ...post,
    country_name: countrySlug ? maps.countryNameBySlug.get(countrySlug) ?? null : null,
    sector_name: sectorSlug ? maps.sectorNameBySlug.get(sectorSlug) ?? null : null,
  };
}

/** Yayındaki tek post (slug ile); tags ile birlikte. country_name, sector_name eklenir. */
export async function getPublishedPostBySlug(slug: string): Promise<SegmentPost | null> {
  const supabase = getSupabasePublic();
  const { data: post, error } = await supabase
    .from("merkezi_posts")
    .select("id, created_at, updated_at, published_at, status, title, slug, cover_image_url, content, content_html_raw, content_html_sanitized, country_slug, city, sector_slug, is_paid, show_contact_when_free, company_logo_url, company_name, company_short_description, content_type, summary")
    .eq("slug", slug)
    .eq("status", "published")
    .or(`published_at.is.null,published_at.lte.${NOW}`)
    .maybeSingle();

  if (error || !post) return null;

  const [taxonomyMaps, ptRows] = await Promise.all([
    getTaxonomyMaps(),
    supabase.from("merkezi_post_tags").select("tag_id").eq("post_id", post.id),
  ]);
  const enrichedPost = enrichPostWithTaxonomyNames(post as MerkeziPost, taxonomyMaps);

  const tagIds = (ptRows?.data ?? []).map((r: { tag_id: string }) => r.tag_id);
  let tags: MerkeziTag[] = [];
  if (tagIds.length > 0) {
    const { data: tagList } = await supabase
      .from("merkezi_tags")
      .select("id, name, slug")
      .in("id", tagIds);
    tags = (tagList ?? []) as MerkeziTag[];
  }

  return { kind: "post", post: enrichedPost as MerkeziPost, tags };
}

/** Sektör landing: seo_page + o sektördeki yayındaki postlar. */
export async function getSectorBySlug(sectorSlug: string): Promise<SegmentSector | null> {
  const supabase = getSupabasePublic();
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

  const supabase = getSupabasePublic();
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
  const supabase = getSupabasePublic();
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
  const supabase = getSupabasePublic();
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

/** Merkez feed için yayındaki yazılar. limit yüksek tutulur (tüm yazılar listelenebilir). */
export async function getPublishedPostsForMerkeziLanding(limit = 500): Promise<{
  posts: MerkeziPostLandingItem[];
  tagsByPostId: Record<string, MerkeziTag[]>;
}> {
  const supabase = getSupabasePublic();
  const requestLimit = Math.min(limit + EXCLUDED_FROM_LANDING_TITLES.length * 2, 2000);
  const { data: rows } = await supabase
    .from("merkezi_posts")
    .select("id, title, slug, cover_image_url, country_slug, city, sector_slug, is_paid, published_at, created_at, content_html_sanitized, application_deadline_date, application_deadline_text, content_type, summary")
    .eq("status", "published")
    .or(`published_at.is.null,published_at.lte.${NOW}`)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(requestLimit);

  const raw = (rows ?? []) as (MerkeziPostLandingItem & {
    content_html_sanitized?: string | null;
    content_type?: "job" | "blog" | null;
    summary?: string | null;
  })[];
  const filtered = raw.filter(
    (p) => !EXCLUDED_FROM_LANDING_TITLES.some((t) => (p.title || "").includes(t))
  ).slice(0, limit);

  const taxonomyMaps = await getTaxonomyMaps();
  const list: MerkeziPostLandingItem[] = filtered.map((p) => {
    const { content_html_sanitized, content_type, summary: dbSummary, ...rest } = p;
    const summary = (dbSummary && dbSummary.trim()) || "";
    const base = { ...rest, content_type: content_type ?? "job", summary };
    return enrichPostWithTaxonomyNames(base, taxonomyMaps) as MerkeziPostLandingItem;
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
