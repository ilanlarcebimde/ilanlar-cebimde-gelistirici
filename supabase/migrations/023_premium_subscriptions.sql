-- Haftalık premium abonelik: ödeme/kupon sonrası 7 gün geçerli; süre bitince erişim sonlanır.
create table if not exists public.premium_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  payment_id uuid references public.payments(id) on delete set null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_premium_subscriptions_user_id on public.premium_subscriptions(user_id);
create index if not exists idx_premium_subscriptions_ends_at on public.premium_subscriptions(ends_at);

comment on table public.premium_subscriptions is 'Haftalık premium: ends_at sonrası abonelik iptal kabul edilir (uygulama ends_at > now() kontrolü yapar).';

alter table public.premium_subscriptions enable row level security;

create policy "Users can view own premium_subscriptions"
  on public.premium_subscriptions for select using (auth.uid() = user_id);
-- insert/update sadece server (service_role) ile
create policy "No anon insert premium_subscriptions"
  on public.premium_subscriptions for insert with check (false);
create policy "No anon update premium_subscriptions"
  on public.premium_subscriptions for update with check (false);
