-- Bilgi toplama oturumları: session_id ile cv_json (düz anahtarlar) + filled_keys.
create table if not exists public.assistant_sessions (
  session_id text primary key,
  user_id text null,
  cv_json jsonb not null default '{}',
  filled_keys text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create index if not exists idx_assistant_sessions_updated_at on public.assistant_sessions(updated_at);
