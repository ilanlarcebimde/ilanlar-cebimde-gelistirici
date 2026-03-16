/**
 * Yurtdışı İş Başvuru Merkezi — tip tanımları.
 * Mevcut job_posts / job_guides ile karışmaz.
 */

export type MerkeziPostStatus = "draft" | "published" | "scheduled" | "archived";
export type MerkeziContentType = "job" | "blog" | "international_work_visa_news";

export interface MerkeziPost {
  id: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  status: MerkeziPostStatus;
  title: string;
  slug: string;
  cover_image_url: string | null;
  content: string | null;
  content_html_raw?: string | null;
  content_html_sanitized?: string | null;
  country_slug: string | null;
  country_name?: string | null;
  city: string | null;
  sector_slug: string;
  sector_name?: string | null;
  is_paid: boolean;
  show_contact_when_free: boolean;
  company_logo_url: string | null;
  company_name: string | null;
  company_short_description: string | null;
  application_deadline_date?: string | null;
  application_deadline_text?: string | null;
  content_type?: MerkeziContentType;
  summary?: string | null;
  seo_title?: string | null;
  editorial_status?: "draft" | "in_review" | "published";
  news_type?: string | null;
  source_name?: string | null;
  source_url?: string | null;
  effective_date?: string | null;
  priority_level?: "low" | "normal" | "important" | "critical" | null;
  is_featured?: boolean;
  show_on_news_hub?: boolean;
  news_badge?: string | null;
  content_language?: string | null;
  target_audience?: string | null;
  news_category?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image?: string | null;
  canonical_url?: string | null;
  structured_summary?: string | null;
  user_impact?: string | null;
  application_impact?: string | null;
}

/** Landing sayfası kartı için minimal alanlar (contact/content yok). */
export interface MerkeziPostLandingItem {
  id: string;
  title: string;
  slug: string;
  cover_image_url: string | null;
  country_slug: string | null;
  country_name?: string | null;
  city: string | null;
  sector_slug: string | null;
  sector_name?: string | null;
  is_paid: boolean;
  published_at?: string | null;
  created_at?: string;
  /** Server-side: content_html_sanitized'dan türetilen kısa özet (≈200 karakter). */
  summary?: string;
  /** Son başvuru tarihi (YYYY-MM-DD). Öncelik: varsa bu gösterilir. */
  application_deadline_date?: string | null;
  /** Serbest metin notu (örn. "Başvurular dolana kadar"). Tarih yoksa kullanılır. */
  application_deadline_text?: string | null;
  /** job = ilan kartı, blog = bilgilendirme, international_work_visa_news = duyuru. */
  content_type?: MerkeziContentType;
  news_type?: string | null;
  priority_level?: "low" | "normal" | "important" | "critical" | null;
  is_featured?: boolean;
}

export interface MerkeziPostContact {
  contact_email: string | null;
  contact_phone: string | null;
  apply_url: string | null;
}

export interface MerkeziPostDetailData {
  post: MerkeziPost;
  tags: MerkeziTag[];
  contact: MerkeziPostContact | null;
  isPremium: boolean;
  viewCount: number;
  likeCount: number;
  userLiked: boolean;
}

export interface MerkeziTag {
  id: string;
  name: string;
  slug: string;
}

export type MerkeziSeoPageType = "sector" | "country_sector";

export interface MerkeziSeoPage {
  id: string;
  type: MerkeziSeoPageType;
  sector_slug: string;
  country_slug: string | null;
  title: string;
  meta_description: string | null;
  cover_image_url: string | null;
  content: string | null;
}

export type SegmentKind = "post" | "sector" | "country_sector" | "not_found";

export interface SegmentPost {
  kind: "post";
  post: MerkeziPost;
  tags: MerkeziTag[];
}

export interface SegmentSector {
  kind: "sector";
  sectorSlug: string;
  seoPage: MerkeziPage | null;
  posts: MerkeziPost[];
}

export interface SegmentCountrySector {
  kind: "country_sector";
  countrySlug: string;
  sectorSlug: string;
  seoPage: MerkeziPage | null;
  posts: MerkeziPost[];
}

export interface MerkeziPage {
  title: string;
  meta_description: string | null;
  cover_image_url: string | null;
  content: string | null;
}
