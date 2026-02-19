-- channels: ülke kanalları (Yurtdışı İş İlanları)
create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  country_code text not null,
  flag_emoji text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_channels_slug on public.channels(slug);
create index if not exists idx_channels_is_active on public.channels(is_active);

-- channel_subscriptions: kullanıcı abonelikleri (idempotent: unique user_id + channel_id)
create table if not exists public.channel_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  channel_id uuid not null references public.channels(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, channel_id)
);

create index if not exists idx_channel_subscriptions_user_id on public.channel_subscriptions(user_id);
create index if not exists idx_channel_subscriptions_channel_id on public.channel_subscriptions(channel_id);

-- job_posts: ilan havuzu (n8n / service_role ile yazılır)
create table if not exists public.job_posts (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  title text not null,
  position_text text,
  location_text text,
  source_name text,
  source_url text,
  snippet text,
  image_url text,
  published_at timestamptz not null default now(),
  status text not null default 'published' check (status in ('published','expired')),
  created_at timestamptz not null default now()
);

create unique index if not exists idx_job_posts_source_url on public.job_posts(source_url) where source_url is not null;
create index if not exists idx_job_posts_channel_published on public.job_posts(channel_id, published_at desc);
create index if not exists idx_job_posts_status on public.job_posts(status);

-- RLS
alter table public.channels enable row level security;
alter table public.channel_subscriptions enable row level security;
alter table public.job_posts enable row level security;

-- channels: herkes okuyabilsin
create policy "channels_select_public"
  on public.channels for select using (true);

-- channel_subscriptions: sadece kendi kayıtları
create policy "channel_subscriptions_select_own"
  on public.channel_subscriptions for select using (auth.uid() = user_id);
create policy "channel_subscriptions_insert_own"
  on public.channel_subscriptions for insert with check (auth.uid() = user_id);
create policy "channel_subscriptions_delete_own"
  on public.channel_subscriptions for delete using (auth.uid() = user_id);

-- job_posts (MOD B): sadece abone olunan kanalların published kayıtları
create policy "job_posts_select_subscribed"
  on public.job_posts for select using (
    status = 'published'
    and exists (
      select 1 from public.channel_subscriptions cs
      where cs.user_id = auth.uid() and cs.channel_id = job_posts.channel_id
    )
  );

-- Seed: 4 ülke kanalı
insert into public.channels (slug, name, country_code, flag_emoji, description) values
  ('katar', 'Katar', 'QA', '🇶🇦', 'Katar''daki güncel iş ilanları ve resmi duyurular. Bölgeye özel fırsatlar.'),
  ('irlanda', 'İrlanda', 'IE', '🇮🇪', 'İrlanda iş piyasası ve vize duyuruları. AB üyesi ülke fırsatları.'),
  ('alaska', 'Alaska', 'US', '🇺🇸', 'ABD Alaska bölgesi iş ilanları ve çalışma izni bilgileri.'),
  ('belcika', 'Belçika', 'BE', '🇧🇪', 'Belçika''daki güncel iş ilanları ve resmi kaynaklara yönlendirme.')
on conflict (slug) do nothing;
