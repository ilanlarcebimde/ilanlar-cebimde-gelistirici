-- Premium Başvuru Paneli: kullanıcı–ilan eşleşmesi, cevaplar ve Gemini raporu
create table if not exists public.job_guides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_post_id uuid not null references public.job_posts(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','in_progress','completed')),
  progress_step smallint not null default 1 check (progress_step >= 1 and progress_step <= 7),
  answers_json jsonb not null default '{}',
  report_json jsonb default null,
  report_md text default null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, job_post_id)
);

create index if not exists idx_job_guides_user_id on public.job_guides(user_id);
create index if not exists idx_job_guides_job_post_id on public.job_guides(job_post_id);
create index if not exists idx_job_guides_updated_at on public.job_guides(updated_at desc);

comment on table public.job_guides is 'Premium: ilan başına kullanıcı rehberi; cevaplar + Gemini raporu.';

alter table public.job_guides enable row level security;

create policy "Users can manage own job_guides"
  on public.job_guides for all using (auth.uid() = user_id);

-- Canlılık: soru/cevap ve rapor güncelleme olayları
create table if not exists public.job_guide_events (
  id uuid primary key default gen_random_uuid(),
  job_guide_id uuid not null references public.job_guides(id) on delete cascade,
  type text not null check (type in ('question','answer','system','report_update')),
  content text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_job_guide_events_job_guide_id on public.job_guide_events(job_guide_id);
create index if not exists idx_job_guide_events_created_at on public.job_guide_events(created_at);

comment on table public.job_guide_events is 'Premium: chat ve rapor güncelleme geçmişi.';

alter table public.job_guide_events enable row level security;

create policy "Users can view job_guide_events for own guides"
  on public.job_guide_events for select using (
    exists (
      select 1 from public.job_guides g
      where g.id = job_guide_events.job_guide_id and g.user_id = auth.uid()
    )
  );
create policy "Users can insert job_guide_events for own guides"
  on public.job_guide_events for insert with check (
    exists (
      select 1 from public.job_guides g
      where g.id = job_guide_events.job_guide_id and g.user_id = auth.uid()
    )
  );

-- job_guides updated_at trigger
create or replace function public.set_job_guides_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists job_guides_updated_at on public.job_guides;
create trigger job_guides_updated_at
  before update on public.job_guides
  for each row execute function public.set_job_guides_updated_at();
