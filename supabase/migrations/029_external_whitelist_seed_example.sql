-- Örnek: Resmî vize/maaş kaynakları için domain whitelist + ülke kaynakları.
-- Bu dosyayı çalıştırmadan önce domain'leri ve URL'leri kendi resmî kaynaklarınıza göre güncelleyin.
-- Sadece örnek; production'da country_sources ve external_whitelist_domains'i admin panel veya SQL ile doldurun.

-- Örnek whitelist domain'leri (purpose: visa). Bu domain'lerden fetch yapılabilir.
insert into public.external_whitelist_domains (domain, purpose, is_active, notes)
values
  ('make-it-in-germany.com', 'visa', true, 'Almanya resmî vize rehberi'),
  ('irishimmigration.ie', 'visa', true, 'İrlanda göç'),
  ('gov.uk', 'visa', true, 'UK vize'),
  ('migrationsverket.se', 'visa', true, 'İsveç göç'),
  ('udi.no', 'visa', true, 'Norveç UDI'),
  ('migri.fi', 'visa', true, 'Finlandiya göç'),
  ('nyidanmark.dk', 'visa', true, 'Danimarka'),
  ('ind.nl', 'visa', true, 'Hollanda IND'),
  ('ec.europa.eu', 'visa', true, 'AB/EURES')
on conflict (domain) do update set purpose = excluded.purpose, is_active = excluded.is_active, notes = excluded.notes;

-- Örnek ülke kaynakları (ülke adı = inferCountry çıktısıyla eşleşmeli: Katar, Almanya, İrlanda, vb.)
insert into public.country_sources (country, purpose, title, url, domain, priority, is_active)
values
  ('Almanya', 'visa', 'Make it in Germany', 'https://www.make-it-in-germany.com/en/visa-residence', 'make-it-in-germany.com', 100, true),
  ('İrlanda', 'visa', 'Irish Immigration', 'https://www.irishimmigration.ie/coming-to-work-in-ireland/', 'irishimmigration.ie', 100, true),
  ('İsveç', 'visa', 'Migrationsverket', 'https://www.migrationsverket.se/English/Private-individuals/Working-in-Sweden.html', 'migrationsverket.se', 100, true)
on conflict (country, purpose, url) do update set title = excluded.title, domain = excluded.domain, priority = excluded.priority, is_active = excluded.is_active;
