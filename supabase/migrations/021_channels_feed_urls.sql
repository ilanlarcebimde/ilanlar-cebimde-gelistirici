-- channels: site içi kanal sayfası URL'i + n8n veri kaynağı URL'i
-- page_url     → kullanıcıların gördüğü kanal linki (feed filtre)
-- source_feed_url → n8n'in veri çektiği kaynak (RSS / API / scrape); boşsa skip
alter table public.channels
  add column if not exists page_url text,
  add column if not exists source_feed_url text;

create index if not exists idx_channels_is_active on public.channels(is_active);

-- Mevcut kanalların page_url değerleri (tümü akışı + filtre)
update public.channels
set page_url = case slug
  when 'belcika' then 'https://www.ilanlarcebimde.com/ucretsiz-yurtdisi-is-ilanlari?c=belcika'
  when 'alaska'  then 'https://www.ilanlarcebimde.com/ucretsiz-yurtdisi-is-ilanlari?c=alaska'
  when 'irlanda' then 'https://www.ilanlarcebimde.com/ucretsiz-yurtdisi-is-ilanlari?c=irlanda'
  when 'katar'   then 'https://www.ilanlarcebimde.com/ucretsiz-yurtdisi-is-ilanlari?c=katar'
  else page_url
end
where slug in ('belcika','alaska','irlanda','katar');
