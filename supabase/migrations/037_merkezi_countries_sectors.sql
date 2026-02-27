-- Merkez: ülkeler ve sektörler (dropdown kaynakları)

create table if not exists public.merkezi_countries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_merkezi_countries_slug on public.merkezi_countries(slug);
create index if not exists idx_merkezi_countries_active on public.merkezi_countries(is_active);

create table if not exists public.merkezi_sectors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_merkezi_sectors_slug on public.merkezi_sectors(slug);
create index if not exists idx_merkezi_sectors_active on public.merkezi_sectors(is_active);

alter table public.merkezi_countries enable row level security;
alter table public.merkezi_sectors enable row level security;

-- Herkes aktif kayıtları okuyabilir
create policy "merkezi_countries_select_public"
  on public.merkezi_countries for select
  using (is_active = true);

create policy "merkezi_sectors_select_public"
  on public.merkezi_sectors for select
  using (is_active = true);

-- Admin tüm CRUD
create policy "merkezi_countries_admin_all"
  on public.merkezi_countries for all using (
    exists (select 1 from public.app_admin where user_id = auth.uid())
  );

create policy "merkezi_sectors_admin_all"
  on public.merkezi_sectors for all using (
    exists (select 1 from public.app_admin where user_id = auth.uid())
  );

