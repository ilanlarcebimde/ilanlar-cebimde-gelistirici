-- Bireysel fatura bilgileri (ödeme / kupon sonrası arşiv)
create table if not exists public.billing_individual_details (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  order_id uuid references public.cv_orders (id) on delete set null,
  payment_id text null,
  payment_provider text not null default 'paytr',
  service_name text not null,
  payer_type text not null default 'individual',
  first_name text not null,
  last_name text not null,
  tckn text null,
  email text not null,
  phone text not null,
  address_line1 text not null,
  address_line2 text null,
  district text not null,
  city text not null,
  postal_code text not null,
  invoice_note text null,
  coupon_code text null,
  gross_amount numeric null,
  discount_amount numeric null,
  net_amount numeric null,
  payment_status text not null,
  paytr_callback_reference text null,
  source text null,
  confirm_invoice_accuracy boolean not null default false,
  confirm_terms boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.billing_individual_details is 'Ödeme öncesi alınan bireysel fatura bilgileri; PayTR merchant_oid veya kupon/profile anahtarı ile ilişkilendirilir.';

create index if not exists idx_billing_individual_user_id on public.billing_individual_details (user_id);
create index if not exists idx_billing_individual_order_id on public.billing_individual_details (order_id);
create index if not exists idx_billing_individual_payment_id on public.billing_individual_details (payment_id);

create unique index if not exists billing_individual_paytr_oid_unique
  on public.billing_individual_details (paytr_callback_reference)
  where paytr_callback_reference is not null and length(trim(paytr_callback_reference)) > 0;

create unique index if not exists billing_individual_payment_id_unique
  on public.billing_individual_details (payment_id)
  where payment_id is not null and length(trim(payment_id)) > 0;

alter table public.billing_individual_details enable row level security;

-- Kullanıcı yalnızca kendi kayıtlarını görebilir (insert/update yalnız service_role / API)
create policy "billing_individual_select_own"
  on public.billing_individual_details for select
  to authenticated
  using (auth.uid() = user_id);

create policy "billing_individual_no_insert"
  on public.billing_individual_details for insert
  to authenticated
  with check (false);

create policy "billing_individual_no_update"
  on public.billing_individual_details for update
  to authenticated
  using (false);
