-- Almanya kanali: ucretsiz yurtdisi is ilanlari sayfasinda gorunur (channels)
-- page_url -> /ucretsiz-yurtdisi-is-ilanlari?c=almanya
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
  'almanya',
  'Almanya',
  'DE',
  '🇩🇪',
  'Almanya''daki guncel is ilanlari ve kariyer firsatlari. Nitelikli is gucu ve sanayi odakli pazar.',
  true,
  'https://www.ilanlarcebimde.com/ucretsiz-yurtdisi-is-ilanlari?c=almanya',
  null,
  '#000000'
)
on conflict (slug) do update set
  name = excluded.name,
  country_code = excluded.country_code,
  flag_emoji = excluded.flag_emoji,
  description = excluded.description,
  is_active = excluded.is_active,
  page_url = excluded.page_url,
  brand_color = excluded.brand_color;
