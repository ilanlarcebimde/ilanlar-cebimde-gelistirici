-- merkezi_posts: içerik ve zamanlama alanları genişletme

alter table public.merkezi_posts
  add column if not exists scheduled_at timestamptz,
  add column if not exists content_html_raw text,
  add column if not exists content_html_sanitized text;

