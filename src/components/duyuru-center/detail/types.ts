export type DuyuruDetailData = {
  id: string;
  title: string;
  summary: string | null;
  content_html_sanitized: string | null;
  country_slug: string | null;
  city: string | null;
  news_type: string | null;
  source_name: string | null;
  source_url: string | null;
  effective_date: string | null;
  priority_level: "low" | "normal" | "important" | "critical" | null;
  news_badge: string | null;
  structured_summary: string | null;
  user_impact: string | null;
  application_impact: string | null;
  published_at: string | null;
  cover_image_url?: string | null;
};

export type RelatedDuyuruItem = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  published_at: string | null;
  country_slug: string | null;
  news_type: string | null;
};

export type DuyuruTag = {
  id: string;
  name: string;
  slug: string;
};

export type PrevNextItem = {
  id: string;
  title: string;
  slug: string;
  published_at: string | null;
  news_type: string | null;
};
