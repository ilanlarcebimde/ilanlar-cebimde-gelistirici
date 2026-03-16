-- cv_orders v2: yeni wizard alanları (backward compatible, nullable + jsonb defaults)

alter table public.cv_orders
  add column if not exists target_country text,
  add column if not exists job_category text,
  add column if not exists job_title text,
  add column if not exists position_summary text,
  add column if not exists education_level text,
  add column if not exists photo_url text,
  add column if not exists availability_date text,
  add column if not exists salary_expectation text,
  add column if not exists work_type text,
  add column if not exists shift_preference text,
  add column if not exists accommodation_acceptance text,
  add column if not exists experience_entries jsonb not null default '[]'::jsonb,
  add column if not exists education_entries jsonb not null default '[]'::jsonb,
  add column if not exists certificate_entries jsonb not null default '[]'::jsonb,
  add column if not exists language_entries jsonb not null default '[]'::jsonb,
  add column if not exists reference_entries jsonb not null default '[]'::jsonb;

