alter table public.payments
  add column if not exists payment_type text,
  add column if not exists coupon_code text;

comment on column public.payments.payment_type is 'Odeme tipi: weekly, coupon, discounted veya standard.';
comment on column public.payments.coupon_code is 'Odeme sirasinda uygulanan kupon kodu varsa burada tutulur.';

alter table public.premium_subscriptions
  add column if not exists payment_type text,
  add column if not exists coupon_code text;

comment on column public.premium_subscriptions.payment_type is 'Premium abonelik kaynagi: weekly, coupon, discounted veya standard.';
comment on column public.premium_subscriptions.coupon_code is 'Premium abonelik kupon ile olustuysa ilgili kod burada tutulur.';
