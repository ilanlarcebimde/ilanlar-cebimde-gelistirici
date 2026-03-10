-- Yunanistan kanalı: ücretsiz yurtdışı iş ilanları sayfasında görünür (channels)
-- page_url → /ucretsiz-yurtdisi-is-ilanlari?c=yunanistan
-- source_feed_url: n8n veri kaynağı doldurulunca güncellenir.
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
  'Yunanistan''daki güncel iş ilanları ve kariyer fırsatları. AB üyesi ülke iş piyasası.',
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
