-- Polonya kanalı: diğer ülkelerle aynı altyapı (channels + job_posts + webhook akışı)
-- page_url → /ucretsiz-yurtdisi-is-ilanlari?c=polonya
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
  'polonya',
  'Polonya',
  'PL',
  '🇵🇱',
  'Polonya''daki güncel iş ilanları ve resmi duyurular. AB üyesi Orta Avrupa fırsatları.',
  true,
  'https://www.ilanlarcebimde.com/ucretsiz-yurtdisi-is-ilanlari?c=polonya',
  null,
  '#DC143C'
)
on conflict (slug) do update set
  name = excluded.name,
  country_code = excluded.country_code,
  flag_emoji = excluded.flag_emoji,
  description = excluded.description,
  is_active = excluded.is_active,
  page_url = excluded.page_url,
  brand_color = excluded.brand_color;
