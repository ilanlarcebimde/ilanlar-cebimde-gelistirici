-- payments tablosu
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  provider text not null default 'paytr' check (provider in ('paytr')),
  status text not null check (status in ('started','success','fail')),
  amount numeric not null,
  currency text not null default 'TRY',
  provider_ref text,
  created_at timestamptz default now()
);

create index if not exists idx_payments_profile_id on public.payments(profile_id);
create index if not exists idx_payments_user_id on public.payments(user_id);

alter table public.payments enable row level security;

create policy "Users can view own payments"
  on public.payments for select using (auth.uid() = user_id);
-- insert/update sadece server (service_role) ile yapılır; anon için kısıtlı
create policy "No anon insert payments"
  on public.payments for insert with check (false);
create policy "No anon update payments"
  on public.payments for update with check (false);

-- profiles status enum genişletmesi (checkout_started, failed)
alter table public.profiles drop constraint if exists profiles_status_check;
alter table public.profiles add constraint profiles_status_check
  check (status in ('draft','completed','checkout_started','paid','failed','processing','delivered'));

-- events type: method_selected, photo_uploaded zaten 001'de yok; ekleyelim
alter table public.events drop constraint if exists events_type_check;
alter table public.events add constraint events_type_check
  check (type in (
    'profile_created','answer_saved','photo_uploaded','method_selected',
    'checkout_started','payment_success','payment_fail'
  ));
