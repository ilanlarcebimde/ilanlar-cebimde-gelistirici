-- cv_orders: Yurtdışı CV Paketi siparişleri

create table if not exists public.cv_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  full_name text,
  phone text,
  email text not null,
  age text,
  city text,
  target_country text,
  job_category text,
  job_title text,
  role_description text,
  experience_years text,
  last_company text,
  last_position text,
  work_tasks text,
  equipments text,
  work_areas text,
  driving_license text,
  certificates text,
  master_certificate text,
  myk text,
  reference_info text,
  languages text,
  notes text,
  can_work_countries text,
  shift_preference text,
  can_accept_accommodation text,
  can_start_now text,
  salary_expectation text,
  work_mode text,
  price integer not null default 349,
  payment_status text not null default 'pending',
  order_status text not null default 'draft',
  merchant_oid text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_cv_orders_user_id on public.cv_orders(user_id);
create index if not exists idx_cv_orders_merchant_oid on public.cv_orders(merchant_oid);

alter table public.cv_orders enable row level security;

create policy "cv_orders_insert_public"
  on public.cv_orders for insert
  with check (true);

create policy "cv_orders_select_own"
  on public.cv_orders for select
  using (auth.uid() = user_id);

