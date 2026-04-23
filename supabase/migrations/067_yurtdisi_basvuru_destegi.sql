-- Yurtdışı iş başvuru desteği: ödeme sonrası kayıt + gizli belge yolu
-- Storage: API (service role) ile yükleme; bucket private

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'basvuru-destegi-private',
  'basvuru-destegi-private',
  false,
  15728640,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.yurtdisi_basvuru_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  payment_id uuid references public.payments (id) on delete set null,
  merchant_oid text,
  status text not null default 'beklemede'
    check (status in ('beklemede', 'hazirlaniyor', 'islemde', 'tamamlandi', 'iptal')),
  amount_try numeric(12,2),
  profession_id text,
  profession_label text,
  country_count int,
  listing_package_id int,
  listing_count int,
  full_payload jsonb not null default '{}'::jsonb,
  document_metadata jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists yurtdisi_basvuru_applications_user_id_idx
  on public.yurtdisi_basvuru_applications (user_id);

create index if not exists yurtdisi_basvuru_applications_payment_id_idx
  on public.yurtdisi_basvuru_applications (payment_id);

create index if not exists yurtdisi_basvuru_applications_merchant_oid_idx
  on public.yurtdisi_basvuru_applications (merchant_oid);

create unique index if not exists yurtdisi_basvuru_applications_merchant_oid_uniq
  on public.yurtdisi_basvuru_applications (merchant_oid);

alter table public.yurtdisi_basvuru_applications enable row level security;

-- Kullanıcı yalnızca kendi satırlarını okuyabilir
create policy "yurtdisi_basvuru_applications_select_own"
  on public.yurtdisi_basvuru_applications
  for select
  using (auth.uid() = user_id);

-- Ekleme/güncelleme yalnızca service role (API) — anon/authenticated policy yok
comment on table public.yurtdisi_basvuru_applications is 'Yurtdışı başvuru desteği; yazma supabase service role / backend.';
