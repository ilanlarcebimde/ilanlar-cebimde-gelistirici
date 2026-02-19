-- Kanal renk sistemi: her kanala brand_color ekle
alter table public.channels add column if not exists brand_color text;

-- Seed: kanallara renk ata (pastel tonlar)
update public.channels set brand_color = '#8B1538' where slug = 'katar'; -- Bordo
update public.channels set brand_color = '#169B62' where slug = 'irlanda'; -- Yeşil
update public.channels set brand_color = '#1E3A8A' where slug = 'alaska'; -- Mavi
update public.channels set brand_color = '#FCDD09' where slug = 'belcika'; -- Sarı

-- Index yok, brand_color sadece UI için
