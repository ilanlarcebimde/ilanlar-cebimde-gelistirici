-- profiles: draft/completed/paid CV başvuru verisi
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  status text not null default 'draft' check (status in ('draft','completed','paid','processing','delivered')),
  method text not null check (method in ('voice','chat','form')),
  country text,
  job_area text,
  job_branch text,
  answers jsonb default '{}',
  photo_url text
);

create index if not exists idx_profiles_user_id on public.profiles(user_id);
create index if not exists idx_profiles_status on public.profiles(status);

-- events: olay kayıtları
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  type text not null check (type in ('profile_created','answer_saved','photo_uploaded','checkout_started','payment_success','payment_fail')),
  payload jsonb default '{}'
);

create index if not exists idx_events_user_id on public.events(user_id);
create index if not exists idx_events_profile_id on public.events(profile_id);

-- uploads: fotoğraf / belge
create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  type text not null check (type in ('photo','passport','document')),
  url text not null
);

create index if not exists idx_uploads_user_id on public.uploads(user_id);
create index if not exists idx_uploads_profile_id on public.uploads(profile_id);

-- RLS
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.uploads enable row level security;

create policy "Users can manage own profiles"
  on public.profiles for all using (auth.uid() = user_id);

create policy "Users can insert profiles without user_id (draft)"
  on public.profiles for insert with check (true);

create policy "Users can manage own events"
  on public.events for all using (auth.uid() = user_id);

create policy "Users can insert events"
  on public.events for insert with check (true);

create policy "Users can manage own uploads"
  on public.uploads for all using (auth.uid() = user_id);

create policy "Users can insert uploads"
  on public.uploads for insert with check (true);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
