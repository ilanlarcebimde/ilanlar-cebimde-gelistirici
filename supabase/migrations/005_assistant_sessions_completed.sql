-- completed + completed_at + created_at (FINISH işaretleme ve oluşturma zamanı)
alter table public.assistant_sessions
  add column if not exists completed boolean not null default false,
  add column if not exists completed_at timestamptz null,
  add column if not exists created_at timestamptz not null default now();
