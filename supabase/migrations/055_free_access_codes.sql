-- WhatsApp / ücretsiz erişim kodları (iş başvuru mektubu sayfası vb.)
-- Sadece sunucu (service role) ve güvenli API üzerinden erişilir; RLS ile doğrudan client erişimi yok.

create table if not exists public.free_access_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  description text,
  target_slug text not null default 'is-basvuru-mektubu-olustur',
  starts_at timestamptz not null,
  expires_at timestamptz not null,
  is_active boolean not null default true,
  usage_limit integer,
  usage_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint free_access_codes_expires_after_start check (expires_at > starts_at),
  constraint free_access_codes_usage_non_negative check (usage_count >= 0),
  constraint free_access_codes_usage_limit_positive check (usage_limit is null or usage_limit > 0)
);

comment on table public.free_access_codes is 'Dönemsel ücretsiz erişim kodları (admin yönetimli).';

create unique index if not exists free_access_codes_code_unique on public.free_access_codes (code);

create index if not exists free_access_codes_target_slug_idx on public.free_access_codes (target_slug);
create index if not exists free_access_codes_active_window_idx on public.free_access_codes (target_slug, is_active, starts_at, expires_at);

alter table public.free_access_codes enable row level security;
