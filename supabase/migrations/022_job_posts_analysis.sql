-- job_posts: rehber analizi (AI/n8n ile doldurulur; uygulama sadece okur)
alter table public.job_posts
  add column if not exists analysis_status text default 'pending'
    check (analysis_status in ('pending', 'processing', 'ready', 'failed'));
comment on column public.job_posts.analysis_status is 'Rehber hazır mı: ready ise analysis_json kullanılır.';

alter table public.job_posts
  add column if not exists analysis_json jsonb default null;
comment on column public.job_posts.analysis_json is 'Başvuru rehberi, maaş/risk, kişisel analiz blokları (sadece okuma).';
