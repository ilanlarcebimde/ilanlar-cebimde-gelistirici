# n8n Webhook ve Supabase `profiles` Tablosu

## Kural

**CV oluşturma ile gelen tüm veriler Supabase `profiles` tablosunda tutulur.**  
n8n veya başka hiçbir dış sistem CV verisini kendi deposunda tutmaz; tek kaynak (source of truth) `profiles` tablosudur.

**NON-NEGOTIABLE:** `profiles` tablosunun kolonları, tipleri ve yapısı değiştirilmez. Detay için `.cursor/rules/profiles-and-n8n-webhook.mdc` kuralına bakın.

---

## `profiles` tablosu (özet — şema sabit)

| Alan        | Açıklama |
|------------|----------|
| `id`       | UUID, primary key |
| `user_id`  | auth.users referansı (giriş yapmış kullanıcı) |
| `status`   | draft \| completed \| checkout_started \| paid \| processing \| delivered |
| `method`   | voice \| chat \| form |
| `country`  | Ülke kodu |
| `job_area` | Meslek alanı |
| `job_branch` | Meslek dalı |
| `answers` | JSONB – tüm CV cevapları (nested key'ler: örn. personal.fullName, personal.email) |
| `photo_url` | Profil fotoğrafı URL'i (text) |
| `is_cv_sent` | bool — sadece n8n günceller; uygulama yazmaz |

CV içeriğinin tamamı `answers` + `country` / `job_area` / `job_branch` / `photo_url` alanlarından okunur.

---

## n8n webhook sözleşmesi

Ödeme başarılı olduğunda uygulama **n8n webhook'unu** tetikler (PayTR callback). **GET** isteği, **query parametreleri** ile.

### Ortam değişkeni

- `N8N_CV_WEBHOOK_URL` – n8n Webhook node tam URL'i (örn. `https://s02c0alq.rcld.app/webhook/3a77a8ff-c51b-4a03-98a4-931df0b22c0e`)

### Method ve parametreler

- **Method:** GET
- **Auth:** None
- **Body:** Yok; tüm bilgi query param ile.

| Parametre   | Zorunlu | Açıklama |
|-------------|--------|----------|
| `profile_id` | Evet   | `profiles.id` (UUID) |
| `payment_id` | Hayır  | PayTR merchant_oid |
| `status`     | Hayır  | `success` |
| `ts`         | Hayır  | ISO timestamp |

Örnek çağrı: `GET .../webhook/<path>?profile_id=<UUID>&payment_id=<OID>&status=success&ts=<ISO>`

### n8n tarafında yapılacaklar

1. Webhook'tan `profile_id` (query param) al.
2. Supabase'den `profiles` tablosunda `id = profile_id` satırını çek.
3. `answers`, `country`, `job_area`, `job_branch`, `photo_url` ile CV üretimi / e-posta / bülten vb. yap.
4. İstenirse `is_cv_sent` veya `status` (ör. `delivered`) n8n tarafından güncellenir; uygulama bu alanlara yazmaz.

**Önemli:** CV verisi body'de gönderilmez; tüm veri `profiles` tablosundan okunur.
