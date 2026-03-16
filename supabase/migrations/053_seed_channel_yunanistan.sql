-- Yunanistan kanali: ucretsiz yurtdisi is ilanlari sayfasinda gorunur (channels)
-- page_url -> /ucretsiz-yurtdisi-is-ilanlari?c=yunanistan
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
  'yunanistan',
  'Yunanistan',
  'GR',
  '🇬🇷',
  'Yunanistan''daki guncel is ilanlari ve kariyer firsatlari. AB uyesi ulke is piyasasi.',
  true,
  'https://www.ilanlarcebimde.com/ucretsiz-yurtdisi-is-ilanlari?c=yunanistan',
  null,
  '#0D5EAF'
)
on conflict (slug) do update set
  name = excluded.name,
  country_code = excluded.country_code,
  flag_emoji = excluded.flag_emoji,
  description = excluded.description,
  is_active = excluded.is_active,
  page_url = excluded.page_url,
  brand_color = excluded.brand_color;
