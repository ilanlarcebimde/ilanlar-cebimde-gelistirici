-- Feed'i giriş yapmadan da göstermek: job_posts SELECT herkese açık (sadece published)
drop policy if exists "job_posts_select_subscribed" on public.job_posts;

create policy "job_posts_select_public"
  on public.job_posts for select using (status = 'published');
