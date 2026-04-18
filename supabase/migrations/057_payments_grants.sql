-- PayTR initiate (service_role) ile payments yazımının kesin çalışması için açık yetkiler
grant usage on schema public to service_role;
grant all on table public.payments to service_role;
