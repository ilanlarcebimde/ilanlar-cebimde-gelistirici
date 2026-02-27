/**
 * Yurtdışı İş Başvuru Merkezi — tip tanımları.
 * Mevcut job_posts / job_guides ile karışmaz.
 */

export type MerkeziPostStatus = "draft" | "published" | "scheduled" | "archived";

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
  city: string | null;
  sector_slug: string;
  is_paid: boolean;
  show_contact_when_free: boolean;
  company_logo_url: string | null;
  company_name: string | null;
  company_short_description: string | null;
}

export interface MerkeziPostContact {
  contact_email: string | null;
  contact_phone: string | null;
  apply_url: string | null;
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
