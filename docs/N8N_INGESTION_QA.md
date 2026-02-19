# n8n Ingestion + Supabase Insert — Soru-Cevap Özeti

Kod tabanı ve migration’lara göre mevcut durum + öneriler. Cursor’a sorulacak soruların cevapları.

---

## A) n8n Mimari / Tetikleyici

**n8n akışı hangi tetikleyiciyle çalışacak? (Cron / manual webhook / queue?)**

- Kod tabanında **ilan ingestion’a özel tetikleyici yok**. Sadece push bildirimi için `/api/push/notify-daily` var; bu route **Cron + secret header** ile n8n’den çağrılıyor (`x-cron-secret`).
- **Öneri:** Günlük 1 yayın için **Cron** (Schedule Trigger) kullan; zaman dilimi n8n instance timezone’una göre (örn. Europe/Istanbul 09:00).

**Günlük 1 yayın: Cron saat/dakika nerede, timezone ne?**

- Uygulama tarafında **Cron ayarı yok**; n8n workflow’unda Schedule node’da ayarlanır.
- **Öneri:** Cron expression örn. `0 9 * * *` (her gün 09:00), timezone: `Europe/Istanbul` veya n8n’in çalıştığı sunucu timezone’u.

**“15 ülke / kanal” için tek workflow mu, kanal başına mı?**

- Kodda **kanal sayısına dair sabit yok**; `channels` tablosu ve seed’de 4 kanal (katar, irlanda, alaska, belcika) var.
- **Öneri:** **Tek workflow** + loop (her kanal için aynı mantık: scrape → normalize → Supabase insert). Kanal listesini **hard-coded değil**, **Supabase’den çek**: ilk adımda Supabase node ile `channels` tablosundan `is_active = true` olanları oku (örn. `id`, `slug`, `name`), sonra bu liste üzerinde **Loop** (SplitInBatches / Loop Over Items) ile her kanal için scrape → eşleştir → job_posts insert. Böylece yeni kanal eklediğinde workflow’u değiştirmene gerek kalmaz.

---

## B) Veri Kaynağı / Scrape Çıktısı

**Ham veri n8n’e hangi formatla geliyor? (JSON / RSS / HTML parse / başka)**

- Uygulama tarafında **scrape veya harici veri formatı tanımı yok**. Veri n8n’de toplanıyor; format n8n tarafında belirlenir.
- **Öneri:** Mümkünse **JSON** (RSS’i Parse to JSON, HTML’i parse edip tek tip JSON’a çevir).

**Her ilan için kesin gelen alanlar: source_url, title, country/channel, snippet, location, position, image_url?**

- **job_posts** şeması (011, 017): `channel_id`, `title`, `position_text`, `location_text`, `source_name`, `source_url`, `snippet`, `image_url`, `published_at`, `status`.
- **Zorunlu (DB):** `channel_id`, `title`, `status` (default `'published'`). Diğerleri nullable.
- **Öneri:** Dedupe için **source_url kesin gelsin**; yoksa aşağıdaki “tekil anahtar” fallback’i kullan.

**source_url yoksa dedupe için tekil anahtar ne olacak?**

- Şu an **unique** olan: `job_posts.source_url` (011: unique index WHERE source_url IS NOT NULL; 017: unique constraint).
- **source_url yoksa:** Tabloda ikinci bir unique alan yok. Seçenekler: (1) n8n’de `source_url`’i her zaman üret (örn. `source_name + title + published_at` ile sentetik URL), (2) veya ileride `(channel_id, external_id)` gibi composite unique eklenebilir.

---

## C) Kanal Eşleştirme (En kritik)

**n8n ilanı hangi channel_id’ye bağlayacak?**

- **channel_id** UUID; `channels.id`. n8n’in **slug veya country_code ile lookup** yapıp `id` alması gerekir.

**country_code → channels.slug mi?**

- **channels** kolonları: `id`, `slug`, `name`, `country_code`, `flag_emoji`, `description`, `is_active`, `brand_color` (013, 017).
- **Öneri:** Eşleştirme **slug** üzerinden (örn. `katar`, `irlanda`, `alaska`, `belcika`). country_code (QA, IE, US, BE) da kullanılabilir; slug daha stabil.

**channels tablosundan lookup mu? Hard-coded mü?**

- **Hard-coded değil.** Kanal listesi workflow başında **Supabase node ile `channels` tablosundan** çekilmeli (`SELECT id, slug, name WHERE is_active = true`). Loop bu liste üzerinde döner; her ilanı hangi kanala ait olduğuna göre (scrape çıktısındaki ülke/slug) ilgili döngü öğesindeki `id` ile `job_posts.channel_id` olarak kullanırsın. Tekil ilan için “bu slug hangi channel_id?” dersen: aynı Supabase’den “Get row(s)” ile `channels.slug = <scrape_slug>` yapıp `id` al.

**channels tablosunda kanal tanımı nasıl?**

- `slug` (unique), `name`, `country_code`, `flag_emoji`, `description`, `is_active`, `brand_color`. Seed: katar, irlanda, alaska, belcika.

**Katar/İrlanda/Alaska/Belçika dışında kanal yoksa ne yapacak? (auto-create / skip / error?)**

- Kodda **auto-create yok**. **Öneri:** Bilinen slug’lar için insert; bilinmeyen için **skip + log** (veya ayrı “diğer” kanalı tanımlayıp oraya at).

---

## D) Çeviri + Standartlaştırma (AI Agent)

**AI Agent prompt/şeması ne? Çıktı kesin JSON mu?**

- Kod tabanında **ilan üretimi için AI Agent şeması / prompt yok**.

**AI Agent hangi alanları üretiyor / normalize ediyor?**

- **Öneri:** Agent çıktısı = job_posts’a yazılacak alanlarla uyumlu tek JSON: `title`, `snippet`, `position_text`, `location_text`, `source_name`, `source_url` (ve isteğe bağlı `image_url`). Dil: Türkçe veya ham metin (aşağıdaki gibi).

**title_tr, snippet_tr yok; direkt title ve snippet Türkçe mi?**

- Şemada **title_tr / snippet_tr yok**; sadece `title`, `snippet`. **Öneri:** AI çıktısını doğrudan `title` ve `snippet` olarak yaz (Türkçe tercih edilirse Agent’a “Türkçe üret” denir).

**Token/latency: tek ilan tek çağrı mı, batch mi?**

- Uygulama tarafında kural yok. **Öneri:** Günlük az ilan için **ilan başına tek çağrı**; çok ilan için batch (ör. 5’er) düşünülebilir.

**AI Agent hata verirse fallback?**

- Kodda tanım yok. **Öneri:** Fallback = **ham İngilizce (veya ham başlık/açıklama) ile yayınla**; opsiyonel olarak `source_name`’e “(çeviri yok)” eklenebilir veya ayrı flag tutulabilir.

---

## E) Supabase Insert / Upsert (Duplicate engeli)

**n8n Supabase’e hangi yetkiyle yazıyor? (service_role / supabase node?)**

- Uygulama tarafında **job_posts insert API route yok**. Migration yorumu: “n8n / service_role ile yazılır”.
- **Öneri:** n8n’de **Supabase node** + **service_role key** (SUPABASE_SERVICE_ROLE_KEY) ile RLS bypass ederek yaz.

**Insert mi, upsert mi?**

- **Öneri:** **Upsert**; duplicate’da conflict olunca skip veya update (genelde skip yeterli).

**Unique constraint: job_posts.source_url unique. n8n’de conflict target ne?**

- 011: `CREATE UNIQUE INDEX ... ON job_posts(source_url) WHERE source_url IS NOT NULL`
- 017: `ALTER TABLE job_posts ADD CONSTRAINT job_posts_source_url_unique UNIQUE (source_url)`
- **Conflict target:** `source_url`. source_url NULL olan kayıtlar için unique ihlali olmaz (PostgreSQL’de NULL’lar unique’e dahil değil); yine de mümkünse **source_url her zaman dolu** gönder.

**onConflict: source_url kullanıyor musun?**

- Kod tabanında job_posts insert/upsert **yok**. n8n Supabase node’da: **Upsert** modu, **Conflict column(s):** `source_url`. Böylece aynı source_url tekrar gelirse insert atlanır (veya isteğe bağlı update).

**Duplicate gelirse akış ne yapacak?**

- **Öneri:** Upsert + onConflict source_url → duplicate’da **skip** (0 row updated/inserted). n8n’de hata sayılmaz; isteğe bağlı “inserted count” ile log.

---

**n8n Supabase node – net ayar (kontrol listesi)**

| Ayar | Değer | Not |
|------|--------|-----|
| **Operation** | **Upsert** | Insert değil; duplicate’da fail olmamak için Upsert. |
| **Conflict column(s)** | **source_url** | Tek kolon: `source_url`. Supabase node’da “Conflict Columns” / “On Conflict” alanına `source_url` yaz. |
| **Duplicate gelince** | **Skip (fail değil)** | Upsert + conflict = source_url ile aynı source_url gelirse satır güncellenmez (veya “do update” boş bırakılırsa efekt skip). Workflow **fail etmez**; node başarılı döner, etkilenen satır 0 olabilir. İstersen sonraki node’da “etkilenen satır 0 ise log” yaparsın. |

---

## F) job_posts Alan Map’i (Final payload)

**n8n’in job_posts’a attığı örnek JSON:**

```json
{
  "channel_id": "uuid-from-channels-table",
  "title": "Forklift Operatörü – Katar",
  "snippet": "XYZ şirketi Katar’da deneyimli forklift operatörü arıyor. Tam zamanlı.",
  "position_text": "Forklift Operatörü",
  "location_text": "Katar, Doha",
  "source_name": "Resmi İlan Portalı",
  "source_url": "https://example.com/ilan/12345",
  "image_url": "https://example.com/thumb.jpg",
  "status": "published",
  "published_at": "2026-02-19T09:00:00.000Z"
}
```

- **channel_id:** Zorunlu; `channels.id` (UUID).
- **title:** Zorunlu.
- **snippet, position_text, location_text, source_name, source_url, image_url:** Opsiyonel ama önerilir.
- **status:** Varsayılan `'published'`; açık yazılabilir.
- **published_at:** Opsiyonel; yoksa DB default `now()`.

Trigger (020) sadece **INSERT** (ve opsiyonel **UPDATE status → published**) sonrası `channel_stats.published_seq` / `published_last_at` günceller; n8n sadece `job_posts`’a yazar.

---

## G) Trigger & Realtime Doğrulama

**Insert sonrası trigger çalışıyor mu? Nasıl doğruladın?**

- **020_realtime_notifications.sql:** `trg_job_posts_to_channel_stats_ins` (AFTER INSERT), `trg_job_posts_to_channel_stats_upd` (AFTER UPDATE OF status).
- **Doğrulama:**  
  1) `INSERT INTO job_posts (channel_id, title, status) VALUES ('<channel_uuid>', 'Test', 'published');`  
  2) `SELECT channel_id, published_seq, published_last_at FROM channel_stats WHERE channel_id = '<channel_uuid>';`  
  → `published_seq` artmış, `published_last_at` dolu olmalı.

**channel_stats.published_seq artıyor mu?**

- Evet; trigger INSERT/UPDATE (published) ile artırıyor (020).

**Feed sayfasında refresh gerekmeyen bildirim için channel_stats Realtime subscribe hazır mı?**

- **Evet.** `src/hooks/useNotifications.ts`: `channel_stats` tablosuna **postgres_changes (UPDATE)** subscribe; event’te veri yeniden çekiliyor, badge güncelleniyor. Publication’a `channel_stats` 020’de ekleniyor.

---

## H) Gözlem / Log / Hata Yönetimi

**n8n’de başarısız insertler nerede loglanıyor? (n8n executions + Supabase events?)**

- Uygulama tarafında **job_posts insert loglama yok**. PayTR/coupon tarafında `events` tablosu kullanılıyor (n8n_webhook_failed vb.).
- **Öneri:** Başarısız insert’leri n8n **Error Workflow** veya **execution log** ile kaydet; isteğe bağlı olarak Supabase `events` tablosuna da “job_posts_insert_failed” tipi yazılabilir.

**Rate limit / ban riski: scrape tarafında throttle var mı?**

- Kod tarafında **scrape veya throttle yok**; n8n’de yapılmalı.
- **Öneri:** İstekler arası bekleme (örn. 2–5 sn), günlük tek tur; gerekirse User-Agent ve politika uyumu.

**Link sahiplenmiyoruz: source_url redirect mi, direkt ilan sayfası mı? UTM ekliyor musun?**

- **src/app/r/[post_id]/route.ts:** `job_posts.source_url`’e **302 redirect**; yani **direkt kaynak URL**’e gidiyor, link sahiplenme yok.
- UTM eklenmiyor; eklenmek istenirse redirect URL’e query string eklenebilir (n8n’de veya route’ta).

---

## I) İçerik Politikası / Güvenlik

**snippet ve title’da HTML gelebilir. n8n’de HTML strip/sanitize yapıyor musun?**

- Uygulama tarafında **HTML strip/sanitize yok**; sadece PayTR için `sanitizeMerchantOid` var.
- **Öneri:** n8n’de insert öncesi **strip tags** (veya DOMPurify benzeri) uygula; UI’da React zaten varsayılan olarak escape eder, ama DB’ye ham HTML yazılmamalı.

**image_url dış kaynaktan: broken image durumunda UI fallback var mı?**

- **FeedPostCard** (`src/components/kanal/FeedPostCard.tsx`): `image_url` kullanılmıyor; sadece title, snippet, meta, CTA. Yani şu an **görsel alanı yok**, broken image fallback’i de yok.
- İleride image gösterilirse: `onError` ile placeholder veya gizleme yapılabilir.

---

## Özet Tablo

| Konu | Mevcut durum | Öneri |
|------|----------------|--------|
| Tetikleyici | Yok (sadece notify-daily cron) | Cron, günlük 1 tur |
| Kanal eşleme | channels tablosu var, lookup yok | slug → channels.id |
| job_posts insert | Uygulama tarafında yok | n8n + service_role, upsert on source_url |
| Trigger | 020’de tanımlı | INSERT/UPDATE sonrası channel_stats güncellenir |
| Realtime badge | useNotifications + channel_stats UPDATE | Hazır |
| Dedupe | source_url unique | Upsert, conflict = source_url |
| HTML | Yok | n8n’de strip/sanitize |
| Log/hata | job_posts için yok | n8n execution + isteğe bağlı events |

---

*Bu dosya Cursor AI tarafından oluşturuldu; n8n ingestion + Supabase insert sorularına göre kod tabanı ve migration’lardan derlendi.*
