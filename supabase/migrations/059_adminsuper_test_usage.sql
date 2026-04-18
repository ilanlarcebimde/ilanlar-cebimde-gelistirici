-- ADMINSUPER2026 test kuponu: kullanıcı + hizmet başına son kullanım (1 saatlik aralık)
create table if not exists public.adminsuper_test_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  service_key text not null,
  last_used_at timestamptz not null,
  primary key (user_id, service_key)
);

comment on table public.adminsuper_test_usage is 'ADMINSUPER2026: hizmet başına test kuponu son kullanım zamanı (1 saat bekleme).';

alter table public.adminsuper_test_usage enable row level security;

grant all on table public.adminsuper_test_usage to service_role;
