export type DuyuruPriority = "low" | "normal" | "important" | "critical" | null;

export type DuyuruPost = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  country_slug: string | null;
  news_type: string | null;
  priority_level: DuyuruPriority;
  news_badge: string | null;
  published_at: string | null;
  is_featured: boolean;
  source_name: string | null;
  cover_image_url: string | null;
};

export type DuyuruCountry = {
  slug: string;
  name: string;
};

export type DuyuruSort = "newest" | "oldest" | "priority";
export type DuyuruStatusFilter = "all" | "featured" | "breaking" | "important";
