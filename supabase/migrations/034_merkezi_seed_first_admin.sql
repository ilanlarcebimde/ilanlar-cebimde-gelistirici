-- İsteğe bağlı: Belirli bir kullanıcıyı merkez admin yap.
-- Kendi UUID'nizi kullanmak için aşağıdaki satırda UUID'yi değiştirin.
insert into public.app_admin (user_id) values ('0e117423-8991-4a7c-b136-e90c6a8bff60')
on conflict (user_id) do nothing;
