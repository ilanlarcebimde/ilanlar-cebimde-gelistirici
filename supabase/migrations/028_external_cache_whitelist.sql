-- External cache (admin/API writes, users read via API only)
-- RAG: job page HTML, visa, salary — whitelist domain'lerden fetch, temiz metin cache'lenir
create table if not exists public.external_cache (
  id bigserial primary key,
  cache_key text not null unique,
  kind text not null,
  url text not null,
  domain text not null,
  country text,
  source_name text,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null,
  http_status int,
  etag text,
  content_text text,
  content_md text,
  meta jsonb not null default '{}'::jsonb,
  constraint external_cache_kind check (kind in ('job_html', 'visa', 'salary', 'other'))
);

create index if not exists external_cache_expires_at_idx on public.external_cache (expires_at);
create index if not exists external_cache_domain_idx on public.external_cache (domain);

comment on table public.external_cache is 'RAG: fetched & cleaned content from whitelisted URLs; TTL cache.';

-- Whitelist domains (sadece bu domain'lerden fetch yapılır)
create table if not exists public.external_whitelist_domains (
  id bigserial primary key,
  domain text not null unique,
  purpose text not null,
  is_active boolean not null default true,
  notes text,
  constraint external_whitelist_purpose check (purpose in ('visa', 'salary', 'job'))
);

comment on table public.external_whitelist_domains is 'Sadece bu domain''lerden canlı veri çekilir; diğerleri BLOCKED.';

-- Country -> official sources (visa / salary)
create table if not exists public.country_sources (
  id bigserial primary key,
  country text not null,
  purpose text not null,
  title text not null,
  url text not null,
  domain text not null,
  priority int not null default 100,
  is_active boolean not null default true,
  constraint country_sources_purpose check (purpose in ('visa', 'salary')),
  unique(country, purpose, url)
);

create index if not exists country_sources_country_purpose_idx on public.country_sources (country, purpose);

comment on table public.country_sources is 'Ülkeye göre resmî vize/maaş kaynağı URL''leri; priority ile sıra.';

-- RLS: deny direct user access (API uses service role only)
alter table public.external_cache enable row level security;
alter table public.external_whitelist_domains enable row level security;
alter table public.country_sources enable row level security;

-- No policies = no direct client access; server uses service_role to read/write
