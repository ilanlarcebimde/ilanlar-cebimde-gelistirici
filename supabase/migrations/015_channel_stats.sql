-- Channel stats: panel sidebar için mini istatistikler
create table if not exists public.channel_stats (
  channel_id uuid primary key references public.channels(id) on delete cascade,
  count_24h integer not null default 0,
  count_7d integer not null default 0,
  last_published_at timestamptz,
  updated_at timestamptz not null default now()
);

-- RLS: Sadece abone olunan kanalların stats'ını göster
alter table public.channel_stats enable row level security;

create policy "stats_select_subscribed"
  on public.channel_stats for select using (
    exists (
      select 1 from public.channel_subscriptions cs
      where cs.user_id = auth.uid()
        and cs.channel_id = channel_stats.channel_id
    )
  );
