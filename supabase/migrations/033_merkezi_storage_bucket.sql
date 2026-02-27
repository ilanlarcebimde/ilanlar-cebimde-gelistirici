-- Merkez içerik kapak ve firma logo yüklemeleri için bucket (public read).
-- Not: Supabase sürümüne göre bucket Dashboard'dan da oluşturulabilir; policy'ler aşağıda.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'merkezi-covers',
  'merkezi-covers',
  true,
  5242880,
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Herkes okuyabilsin (OG/kapak görselleri)
create policy "merkezi_covers_select_public"
  on storage.objects for select
  using ( bucket_id = 'merkezi-covers' );

-- Sadece admin yükleyebilsin (app_admin kontrolü)
create policy "merkezi_covers_insert_admin"
  on storage.objects for insert
  with check (
    bucket_id = 'merkezi-covers'
    and auth.role() = 'authenticated'
    and exists (select 1 from public.app_admin where user_id = auth.uid())
  );

create policy "merkezi_covers_update_admin"
  on storage.objects for update
  using (
    bucket_id = 'merkezi-covers'
    and exists (select 1 from public.app_admin where user_id = auth.uid())
  );

create policy "merkezi_covers_delete_admin"
  on storage.objects for delete
  using (
    bucket_id = 'merkezi-covers'
    and exists (select 1 from public.app_admin where user_id = auth.uid())
  );
