-- Kıbrıs kanalı: diğer ülkelerle aynı altyapı (channels + job_posts + webhook akışı)
-- İlan ID'leri mevcut Nasıl Başvururum webhook'una (N8N_HOWTO_WEBHOOK_URL) job_id ile gider.
-- source_feed_url: n8n'in Kıbrıs ilanlarını çektiği kaynak; doldurulunca güncellenir.
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
  'kibris',
  'Kıbrıs',
  'CY',
  '🇨🇾',
  'Kıbrıs''taki güncel iş ilanları ve resmi duyurular. AB üyesi ülke fırsatları.',
  true,
  'https://www.ilanlarcebimde.com/ucretsiz-yurtdisi-is-ilanlari?c=kibris',
  null,
  '#C4A35A'
)
on conflict (slug) do update set
  name = excluded.name,
  country_code = excluded.country_code,
  flag_emoji = excluded.flag_emoji,
  description = excluded.description,
  is_active = excluded.is_active,
  page_url = excluded.page_url,
  brand_color = excluded.brand_color;
