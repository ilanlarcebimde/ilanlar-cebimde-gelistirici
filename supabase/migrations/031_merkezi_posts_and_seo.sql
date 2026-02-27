-- Yurtdışı İş Başvuru Merkezi: Admin ile yayınlanan içerik + SEO landing sayfaları.
-- Mevcut job_posts, channels, premium_subscriptions vb. dokunulmaz.

-- Admin kullanıcıları (panel yetkisi)
create table if not exists public.app_admin (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists idx_app_admin_user_id on public.app_admin(user_id);
alter table public.app_admin enable row level security;
create policy "app_admin_select_own"
  on public.app_admin for select using (auth.uid() = user_id);
-- insert/delete sadece service_role veya migration ile

-- Etiketler (sadece filtre; SEO sayfası yok)
create table if not exists public.merkezi_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);
create index if not exists idx_merkezi_tags_slug on public.merkezi_tags(slug);
alter table public.merkezi_tags enable row level security;

-- Ana içerik tablosu (iletişim bilgisi burada YOK; merkezi_post_contact'ta)
create table if not exists public.merkezi_posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  status text not null default 'draft' check (status in ('draft','published','scheduled','archived')),
  title text not null,
  slug text not null unique,
  cover_image_url text,
  content text,
  country_slug text,
  city text,
  sector_slug text not null,
  is_paid boolean not null default true,
  show_contact_when_free boolean not null default false,
  company_logo_url text,
  company_name text,
  company_short_description text
);
create index if not exists idx_merkezi_posts_slug on public.merkezi_posts(slug);
create index if not exists idx_merkezi_posts_status on public.merkezi_posts(status);
create index if not exists idx_merkezi_posts_published on public.merkezi_posts(published_at) where status = 'published';
create index if not exists idx_merkezi_posts_sector on public.merkezi_posts(sector_slug) where status = 'published';
create index if not exists idx_merkezi_posts_country_sector on public.merkezi_posts(country_slug, sector_slug) where status = 'published';

create trigger merkezi_posts_updated_at
  before update on public.merkezi_posts
  for each row execute function public.set_updated_at();

-- Premium iletişim (public read YOK; sadece backend/service_role)
create table if not exists public.merkezi_post_contact (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.merkezi_posts(id) on delete cascade,
  contact_email text,
  contact_phone text,
  apply_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(post_id)
);
create index if not exists idx_merkezi_post_contact_post_id on public.merkezi_post_contact(post_id);
create trigger merkezi_post_contact_updated_at
  before update on public.merkezi_post_contact
  for each row execute function public.set_updated_at();
alter table public.merkezi_post_contact enable row level security;
-- Kasıtlı: hiçbir policy yok; okuma sadece service_role / backend API ile premium doğrulama sonrası

-- İçerik–etiket ilişkisi
create table if not exists public.merkezi_post_tags (
  post_id uuid not null references public.merkezi_posts(id) on delete cascade,
  tag_id uuid not null references public.merkezi_tags(id) on delete cascade,
  primary key (post_id, tag_id)
);
create index if not exists idx_merkezi_post_tags_tag on public.merkezi_post_tags(tag_id);
alter table public.merkezi_post_tags enable row level security;

-- SEO landing sayfaları (sektör / ülke+sektör)
create table if not exists public.merkezi_seo_pages (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('sector','country_sector')),
  sector_slug text not null,
  country_slug text,
  title text not null,
  meta_description text,
  cover_image_url text,
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists idx_merkezi_seo_pages_unique_type_sector_country
  on public.merkezi_seo_pages (type, sector_slug, coalesce(country_slug, ''));
create index if not exists idx_merkezi_seo_pages_type on public.merkezi_seo_pages(type);
create index if not exists idx_merkezi_seo_pages_sector_country on public.merkezi_seo_pages(sector_slug, country_slug);

create trigger merkezi_seo_pages_updated_at
  before update on public.merkezi_seo_pages
  for each row execute function public.set_updated_at();

alter table public.merkezi_posts enable row level security;
alter table public.merkezi_tags enable row level security;
alter table public.merkezi_post_tags enable row level security;
alter table public.merkezi_seo_pages enable row level security;

-- merkezi_posts: public sadece yayındaki kayıtları okur (premium alan bu tabloda yok)
create policy "merkezi_posts_select_published"
  on public.merkezi_posts for select using (
    status = 'published' and (published_at is null or published_at <= now())
  );
-- Admin tüm CRUD
create policy "merkezi_posts_admin_all"
  on public.merkezi_posts for all using (
    exists (select 1 from public.app_admin where user_id = auth.uid())
  );

-- merkezi_tags: herkes okur, sadece admin yazar
create policy "merkezi_tags_select_public"
  on public.merkezi_tags for select using (true);
create policy "merkezi_tags_admin_all"
  on public.merkezi_tags for all using (
    exists (select 1 from public.app_admin where user_id = auth.uid())
  );

-- merkezi_post_tags: herkes okur, admin yazar
create policy "merkezi_post_tags_select_public"
  on public.merkezi_post_tags for select using (true);
create policy "merkezi_post_tags_admin_all"
  on public.merkezi_post_tags for all using (
    exists (select 1 from public.app_admin where user_id = auth.uid())
  );

-- merkezi_seo_pages: herkes okur, admin yazar
create policy "merkezi_seo_pages_select_public"
  on public.merkezi_seo_pages for select using (true);
create policy "merkezi_seo_pages_admin_all"
  on public.merkezi_seo_pages for all using (
    exists (select 1 from public.app_admin where user_id = auth.uid())
  );

comment on table public.merkezi_posts is 'Yurtdışı İş Başvuru Merkezi: admin ile oluşturulan ilan/içerik. İletişim merkezi_post_contact tablosunda.';
comment on table public.merkezi_post_contact is 'Premium iletişim bilgileri; public read yok, sadece backend/service_role ile okunur.';
