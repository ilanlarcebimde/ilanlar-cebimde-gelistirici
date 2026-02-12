-- is_cv_sent: n8n CV gönderdikten sonra true yapar; uygulama sadece ödeme/kupon sonrası false ile yazar
alter table public.profiles
  add column if not exists is_cv_sent boolean not null default false;

comment on column public.profiles.is_cv_sent is 'n8n tarafından yönetilir; CV gönderildiğinde true yapılır. Uygulama sadece false yazar.';
