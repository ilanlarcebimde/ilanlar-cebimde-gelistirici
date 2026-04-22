-- Suudi Arabistan kanali: ucretsiz yurtdisi is ilanlari sayfasinda gorunur (channels)
-- page_url -> /ucretsiz-yurtdisi-is-ilanlari?c=suudi-arabistan
-- source_feed_url: n8n veri kaynagi doldurulunca guncellenir.
insert into public.channels (
  slug,
  name,
  country_code,
  flag_emoji,
  description,
  is_active,
  page_url,
  source_feed_url,
  brand_color
) values (
  'suudi-arabistan',
  'Suudi Arabistan',
  'SA',
  '🇸🇦',
  'Suudi Arabistan''daki guncel is ilanlari ve kariyer firsatlari. Buyuk proje ve altyapi odakli pazar.',
  true,
  'https://www.ilanlarcebimde.com/ucretsiz-yurtdisi-is-ilanlari?c=suudi-arabistan',
  null,
  '#006C35'
)
on conflict (slug) do update set
  name = excluded.name,
  country_code = excluded.country_code,
  flag_emoji = excluded.flag_emoji,
  description = excluded.description,
  is_active = excluded.is_active,
  page_url = excluded.page_url,
  brand_color = excluded.brand_color;
