-- merkezi_posts: Son başvuru tarihi alanları (panel input, parse yok)

alter table public.merkezi_posts
  add column if not exists application_deadline_date date,
  add column if not exists application_deadline_text text;

comment on column public.merkezi_posts.application_deadline_date is 'Son başvuru tarihi (YYYY-MM-DD). Öncelik: varsa bu gösterilir.';
comment on column public.merkezi_posts.application_deadline_text is 'Serbest metin notu (örn. "Başvurular dolana kadar"). Tarih yoksa kullanılır.';
