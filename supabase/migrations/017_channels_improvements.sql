-- Channels tablosu iyileştirmeleri
-- brand_color default değeri ve not null constraint
alter table public.channels 
  alter column brand_color set default '#2563eb',
  alter column brand_color set not null;

-- flag_emoji not null constraint
alter table public.channels 
  alter column flag_emoji set not null;

-- job_posts source_url unique constraint (zaten index var ama constraint yok)
alter table public.job_posts 
  add constraint job_posts_source_url_unique unique (source_url);
