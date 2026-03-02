-- Tier ayrımı kaldırıldı; iki hizmet de tek Premium (99 TL/hafta). Eski tier kolonu ve index kaldırılır.
drop index if exists public.idx_premium_subscriptions_user_tier_ends;
alter table public.premium_subscriptions drop column if exists tier;
