-- Ödeme / abonelik / profil referansları ve ek bilgi tek tabloda
alter table public.billing_individual_details
  add column if not exists profile_id uuid references public.profiles (id) on delete set null,
  add column if not exists premium_subscription_id uuid references public.premium_subscriptions (id) on delete set null,
  add column if not exists metadata jsonb null;

comment on column public.billing_individual_details.profile_id is 'İlgili profil (Usta paketi / callback sonrası).';
comment on column public.billing_individual_details.premium_subscription_id is 'Haftalık premium satırı (ödeme veya kupon).';
comment on column public.billing_individual_details.metadata is 'PayTR tutarı, payment_type, payments uuid vb. (JSON).';

create index if not exists idx_billing_individual_profile_id on public.billing_individual_details (profile_id);
create index if not exists idx_billing_individual_premium_sub_id on public.billing_individual_details (premium_subscription_id);
