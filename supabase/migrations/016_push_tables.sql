-- Push subscriptions: tarayıcı push endpoint/keys
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_user
  on public.push_subscriptions(user_id);

create index if not exists idx_push_subscriptions_active
  on public.push_subscriptions(is_active) where is_active = true;

-- Push prefs: kanal bazlı bildirim tercihleri
create table if not exists public.push_prefs (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  channel_id uuid not null references public.channels(id) on delete cascade,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique(subscription_id, channel_id)
);

create index if not exists idx_push_prefs_subscription
  on public.push_prefs(subscription_id);

create index if not exists idx_push_prefs_channel
  on public.push_prefs(channel_id);

create index if not exists idx_push_prefs_enabled
  on public.push_prefs(channel_id, enabled) where enabled = true;

-- Push delivery log: gönderim logu (opsiyonel ama faydalı)
create table if not exists public.push_delivery_log (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  channel_id uuid references public.channels(id) on delete set null,
  status text not null, -- sent | failed | expired
  error text,
  created_at timestamptz not null default now()
);

create index if not exists idx_push_delivery_log_subscription
  on public.push_delivery_log(subscription_id);

create index if not exists idx_push_delivery_log_channel
  on public.push_delivery_log(channel_id);

create index if not exists idx_push_delivery_log_status
  on public.push_delivery_log(status);

-- RLS
alter table public.push_subscriptions enable row level security;
alter table public.push_prefs enable row level security;
alter table public.push_delivery_log enable row level security;

-- Push subscriptions: user owns
create policy "push_sub_select_own"
  on public.push_subscriptions for select
  using (user_id = auth.uid());

create policy "push_sub_insert_own"
  on public.push_subscriptions for insert
  with check (user_id = auth.uid());

create policy "push_sub_update_own"
  on public.push_subscriptions for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Push prefs: only for user's subscriptions
create policy "push_prefs_select_own"
  on public.push_prefs for select
  using (
    exists (
      select 1 from public.push_subscriptions ps
      where ps.id = push_prefs.subscription_id
        and ps.user_id = auth.uid()
    )
  );

create policy "push_prefs_insert_own"
  on public.push_prefs for insert
  with check (
    exists (
      select 1 from public.push_subscriptions ps
      where ps.id = push_prefs.subscription_id
        and ps.user_id = auth.uid()
    )
  );

create policy "push_prefs_update_own"
  on public.push_prefs for update
  using (
    exists (
      select 1 from public.push_subscriptions ps
      where ps.id = push_prefs.subscription_id
        and ps.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.push_subscriptions ps
      where ps.id = push_prefs.subscription_id
        and ps.user_id = auth.uid()
    )
  );

-- Push delivery log: user can read their own logs
create policy "push_delivery_log_select_own"
  on public.push_delivery_log for select
  using (
    exists (
      select 1 from public.push_subscriptions ps
      where ps.id = push_delivery_log.subscription_id
        and ps.user_id = auth.uid()
    )
  );
