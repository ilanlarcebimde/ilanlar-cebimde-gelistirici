-- content_type: 'job' | 'blog' (net ayrım; heuristik yok)
-- summary: blog için zorunlu alan; job için opsiyonel
-- sector_slug: blog için null olabilir

alter table public.merkezi_posts
  add column if not exists content_type text not null default 'job' check (content_type in ('job', 'blog')),
  add column if not exists summary text;

alter table public.merkezi_posts
  alter column sector_slug drop not null;

create index if not exists idx_merkezi_posts_content_type on public.merkezi_posts(content_type);

comment on column public.merkezi_posts.content_type is 'job = ilan/başvuru, blog = bilgilendirme yazısı';
comment on column public.merkezi_posts.summary is 'Özet metin; blog için zorunlu (160-240 karakter önerilir).';
