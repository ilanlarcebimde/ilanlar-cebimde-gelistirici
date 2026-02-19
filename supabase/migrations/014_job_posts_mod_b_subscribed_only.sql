-- RLS MOD B: Sadece abone olunan kanalların published postları görülebilir
drop policy if exists "job_posts_select_public" on public.job_posts;

create policy "job_posts_select_subscribed"
  on public.job_posts for select using (
    status = 'published'
    and exists (
      select 1 from public.channel_subscriptions cs
      where cs.user_id = auth.uid() and cs.channel_id = job_posts.channel_id
    )
  );
