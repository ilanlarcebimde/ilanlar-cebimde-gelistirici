-- Merkez: mektup üretimi, görüntülenme, beğeni

-- n8n webhook cevabı (mektup)
create table if not exists public.merkezi_generated_letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  post_id uuid not null references public.merkezi_posts(id) on delete cascade,
  letter_en text,
  letter_tr text,
  subject_en text,
  subject_tr text,
  created_at timestamptz not null default now()
);
create index if not exists idx_merkezi_generated_letters_post on public.merkezi_generated_letters(post_id);
create index if not exists idx_merkezi_generated_letters_user on public.merkezi_generated_letters(user_id);
alter table public.merkezi_generated_letters enable row level security;
create policy "merkezi_generated_letters_select_own"
  on public.merkezi_generated_letters for select using (auth.uid() = user_id);
create policy "merkezi_generated_letters_insert_authenticated"
  on public.merkezi_generated_letters for insert with check (auth.uid() is not null);

-- Görüntülenme (throttle: uygulama tarafında 12h/post_id+viewer_key)
create table if not exists public.merkezi_post_views (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.merkezi_posts(id) on delete cascade,
  viewer_key text not null,
  viewed_at timestamptz not null default now()
);
create index if not exists idx_merkezi_post_views_post on public.merkezi_post_views(post_id);
create index if not exists idx_merkezi_post_views_post_key on public.merkezi_post_views(post_id, viewer_key);
create index if not exists idx_merkezi_post_views_viewed_at on public.merkezi_post_views(viewed_at);
alter table public.merkezi_post_views enable row level security;
create policy "merkezi_post_views_select_public"
  on public.merkezi_post_views for select using (true);
create policy "merkezi_post_views_insert_public"
  on public.merkezi_post_views for insert with check (true);

-- Beğeni (girişli: user_id; anon: liker_key)
create table if not exists public.merkezi_post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.merkezi_posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  liker_key text,
  created_at timestamptz not null default now(),
  constraint merkezi_post_likes_user_or_key check (
    (user_id is not null and liker_key is null) or (user_id is null and liker_key is not null)
  )
);
create unique index if not exists idx_merkezi_post_likes_post_user
  on public.merkezi_post_likes(post_id, user_id) where user_id is not null;
create unique index if not exists idx_merkezi_post_likes_post_liker_key
  on public.merkezi_post_likes(post_id, liker_key) where liker_key is not null;
create index if not exists idx_merkezi_post_likes_post on public.merkezi_post_likes(post_id);
alter table public.merkezi_post_likes enable row level security;
create policy "merkezi_post_likes_select_public"
  on public.merkezi_post_likes for select using (true);
create policy "merkezi_post_likes_insert_authenticated"
  on public.merkezi_post_likes for insert with check (true);
create policy "merkezi_post_likes_delete_own"
  on public.merkezi_post_likes for delete using (auth.uid() = user_id);

comment on table public.merkezi_post_views is 'Görüntülenme; throttle (örn. 12h/post+viewer_key) uygulama tarafında.';
comment on table public.merkezi_post_likes is 'Beğeni; user_id (girişli) veya liker_key (anon).';
