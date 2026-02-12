-- cv-photos bucket: herkes görüntüleyebilir, sadece giriş yapmış kullanıcılar yükleyebilir
-- Bucket'ı Supabase Dashboard'dan oluşturduysanız bu policy'ler tabloya eklenir.

-- Herkesin fotoğrafları görmesine izin ver
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'cv-photos' );

-- Giriş yapmış kullanıcıların resim yüklemesine izin ver
create policy "Authenticated users can upload"
  on storage.objects for insert
  with check (
    bucket_id = 'cv-photos'
    and auth.role() = 'authenticated'
  );
