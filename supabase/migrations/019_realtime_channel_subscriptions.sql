-- Realtime: Abonelik ekleme/çıkarma sonrası header ve sidebar anında güncellenir
alter publication supabase_realtime add table public.channel_subscriptions;
