-- cv_orders: profil fotoğrafı URL alanı

alter table public.cv_orders
  add column if not exists photo_url text;

