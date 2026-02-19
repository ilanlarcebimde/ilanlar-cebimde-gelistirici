-- Public feed: published job_posts herkes tarafından okunabilir
drop policy if exists "job_posts_select_subscribed" on public.job_posts;

create policy "job_posts_select_public"
  on public.job_posts for select using (status = 'published');
