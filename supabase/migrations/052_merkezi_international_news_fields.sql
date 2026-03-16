-- merkezi_posts: international_work_visa_news içerik tipi ve duyuru alanları
-- Backward-compatible: tüm yeni alanlar nullable/default güvenli.

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'merkezi_posts_content_type_check'
      and conrelid = 'public.merkezi_posts'::regclass
  ) then
    alter table public.merkezi_posts
      drop constraint merkezi_posts_content_type_check;
  end if;
end $$;

alter table public.merkezi_posts
  add constraint merkezi_posts_content_type_check
  check (content_type in ('job', 'blog', 'international_work_visa_news'));

alter table public.merkezi_posts
  add column if not exists news_type text,
  add column if not exists source_name text,
  add column if not exists source_url text,
  add column if not exists effective_date date,
  add column if not exists priority_level text,
  add column if not exists is_featured boolean not null default false,
  add column if not exists show_on_news_hub boolean not null default true,
  add column if not exists news_badge text,
  add column if not exists content_language text,
  add column if not exists target_audience text,
  add column if not exists news_category text,
  add column if not exists seo_title text,
  add column if not exists og_title text,
  add column if not exists og_description text,
  add column if not exists og_image text,
  add column if not exists canonical_url text,
  add column if not exists structured_summary text,
  add column if not exists user_impact text,
  add column if not exists application_impact text,
  add column if not exists editorial_status text not null default 'draft';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'merkezi_posts_priority_level_check'
      and conrelid = 'public.merkezi_posts'::regclass
  ) then
    alter table public.merkezi_posts
      add constraint merkezi_posts_priority_level_check
      check (
        priority_level is null
        or priority_level in ('low', 'normal', 'important', 'critical')
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'merkezi_posts_editorial_status_check'
      and conrelid = 'public.merkezi_posts'::regclass
  ) then
    alter table public.merkezi_posts
      add constraint merkezi_posts_editorial_status_check
      check (editorial_status in ('draft', 'in_review', 'published'));
  end if;
end $$;

create index if not exists idx_merkezi_posts_content_country
  on public.merkezi_posts(content_type, country_slug);

create index if not exists idx_merkezi_posts_content_news_type
  on public.merkezi_posts(content_type, news_type);

create index if not exists idx_merkezi_posts_content_priority
  on public.merkezi_posts(content_type, priority_level);

create index if not exists idx_merkezi_posts_content_published
  on public.merkezi_posts(content_type, published_at desc nulls last)
  where status = 'published';

comment on column public.merkezi_posts.content_type is 'job = ilan/başvuru, blog = bilgilendirme, international_work_visa_news = yurtdışı çalışma ve vize duyuruları';
comment on column public.merkezi_posts.news_type is 'Duyuru türü: vize, pasaport, çalışma izni vb.';
comment on column public.merkezi_posts.priority_level is 'low | normal | important | critical';
comment on column public.merkezi_posts.editorial_status is 'Editoryal durum: draft | in_review | published';
