-- Premium Plus: abonelik seviyesi (standard = mevcut haftalık, plus = cover letter vb. özellikler).
alter table public.premium_subscriptions
  add column if not exists tier text not null default 'standard'
  check (tier in ('standard', 'plus'));

comment on column public.premium_subscriptions.tier is 'standard: Nasıl Başvururum vb. | plus: Cover letter sihirbazı dahil.';

create index if not exists idx_premium_subscriptions_user_tier_ends
  on public.premium_subscriptions(user_id, tier) where (tier = 'plus' and ends_at > now());
