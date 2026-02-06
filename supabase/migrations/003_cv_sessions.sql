-- Wizard oturumları: session_id ile partial/final CV kaydı (normalize+validate sonrası).
create table if not exists public.cv_sessions (
  session_id text primary key,
  user_id text null,
  cv_json jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create index if not exists idx_cv_sessions_updated_at on public.cv_sessions(updated_at);
