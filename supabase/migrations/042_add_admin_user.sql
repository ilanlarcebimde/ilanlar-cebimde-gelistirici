-- Admin panele erişim: Bu user_id'yi app_admin'e ekle (Merkez Admin).
insert into public.app_admin (user_id)
values ('3556106e-a99f-430b-93a6-5b4acac705b1'::uuid)
on conflict (user_id) do nothing;
