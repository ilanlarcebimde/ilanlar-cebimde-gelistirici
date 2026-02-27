# Yurtdışı İş Başvuru Merkezi — Mimari Tasarım

**Amaç:** Admin panel ile blog-tarzı ilan/içerik yayını, SEO sayfaları, premium kilitleme. Mevcut sistemler (job_posts, job_guides, profiles, PayTR, ucretsiz panel) **değiştirilmez**.

---

## 1. Genel Mimari

- **Yeni veri modeli:** Tüm merkez içerikleri `merkezi_*` tablolarında tutulur; mevcut `job_posts` (kanal/feed) ve `premium_subscriptions` aynen kullanılır.
- **Premium kontrol:** `premium_subscriptions` tablosunda `ends_at > now()` ile aktif abonelik; premium veri (iletişim, mektup) sadece server-side render / API’de abonelik doğrulandıktan sonra kullanılır.
- **Premium sızıntı önleme:** İletişim bilgileri `merkezi_post_contact` tablosunda; bu tabloya **public SELECT yok**. Sadece admin (service_role veya admin rolü) ve premium doğrulamalı RPC/server action ile okunur.

---

## 2. Veritabanı Şeması (Yeni Tablolar)

### 2.1 `merkezi_posts`

Admin’in oluşturduğu tekil içerik (ilan/yazı).

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | uuid | PK |
| created_at, updated_at | timestamptz | |
| published_at | timestamptz | Yayın tarihi (zamanlanmış için) |
| status | text | `draft` \| `published` \| `scheduled` \| `archived` |
| title | text | Başlık |
| slug | text | UNIQUE, URL parçası |
| cover_image_url | text | OG/kapak görseli (Supabase Storage) |
| content | text | Zengin metin (HTML veya JSON; editör çıktısı) |
| country_slug | text | Ülke (örn. almanya, katar) |
| city | text | Şehir (opsiyonel) |
| sector_slug | text | Sektör (örn. insaat, otelcilik) |
| is_paid | boolean | true = premium iletişim kilitli |
| show_contact_when_free | boolean | Ücretsiz içerikte iletişim gösterilsin mi |
| company_logo_url | text | Firma logosu |
| company_name | text | Firma adı |
| company_short_description | text | Kısa açıklama |

**Not:** İletişim (email, telefon, apply_url) bu tabloda **yok**; `merkezi_post_contact`’ta.

---

### 2.2 `merkezi_post_contact`

Premium iletişim bilgileri. **Public read yok.**

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | uuid | PK |
| post_id | uuid | FK → merkezi_posts(id) ON DELETE CASCADE |
| contact_email | text | |
| contact_phone | text | |
| apply_url | text | Başvuru linki |

RLS: Bu tabloda **hiçbir public policy yok**. Sadece service_role veya backend’de premium doğrulandıktan sonra kullanılan RPC/server action ile okunur.

---

### 2.3 `merkezi_tags`

Etiketler (sadece filtre; SEO sayfası üretilmez).

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | uuid | PK |
| name | text | Görünen ad |
| slug | text | UNIQUE |

---

### 2.4 `merkezi_post_tags`

Çoklu-etiket ilişkisi.

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| post_id | uuid | FK → merkezi_posts |
| tag_id | uuid | FK → merkezi_tags |
| PRIMARY KEY (post_id, tag_id) |

---

### 2.5 `merkezi_seo_pages`

Sektör ve ülke+sektör landing sayfaları (SEO içerik).

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | uuid | PK |
| type | text | `sector` \| `country_sector` |
| sector_slug | text | Sektör (örn. insaat) |
| country_slug | text | type=country_sector için (örn. almanya) |
| title | text | SEO başlık |
| meta_description | text | Meta açıklama |
| cover_image_url | text | Opsiyonel kapak |
| content | text | Opsiyonel zengin açıklama |

UNIQUE: (type, sector_slug, country_slug) — country_slug type=sector için null.

---

### 2.6 `merkezi_generated_letters`

n8n webhook cevabı (mektup üretimi).

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | uuid | PK |
| user_id | uuid | FK → auth.users (opsiyonel) |
| post_id | uuid | FK → merkezi_posts |
| letter_en, letter_tr | text | |
| subject_en, subject_tr | text | |
| created_at | timestamptz | |

---

### 2.7 `merkezi_post_views`

Görüntülenme (throttle: aynı viewer_key için 12 saatte 1 sayım).

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | uuid | PK |
| post_id | uuid | FK → merkezi_posts |
| viewer_key | text | IP/session hash |
| viewed_at | timestamptz | |

Index: (post_id, viewer_key), (post_id, viewed_at). Uygulama: aynı post_id + viewer_key için viewed_at > now() - 12h ise insert yapma (veya 1 satır tutup güncelle).

---

### 2.8 `merkezi_post_likes`

Beğeni (anon: liker_key; girişli: user_id).

| Kolon | Tip | Açıklama |
|-------|-----|----------|
| id | uuid | PK |
| post_id | uuid | FK → merkezi_posts |
| user_id | uuid | NULL = anon |
| liker_key | text | Anon için session/fingerprint |
| created_at | timestamptz | |

UNIQUE: (post_id, user_id) veya (post_id, liker_key) — user_id varsa liker_key null, yoksa liker_key dolu.

---

## 3. RLS Stratejisi

### 3.1 `merkezi_posts`

- **SELECT:** `status = 'published' AND (published_at IS NULL OR published_at <= now())` — sadece yayındaki içerik; **premium kolon yok** (iletişim ayrı tabloda).
- **INSERT/UPDATE/DELETE:** Sadece admin. Admin kontrolü: `auth.jwt() ->> 'role' = 'admin'` veya ayrı `app_admin` tablosu (user_id listesi). Başlangıçta service_role ile yazıp, uygulama tarafında admin middleware ile koruma yapılabilir; RLS’te admin için policy: `exists (select 1 from app_admin where user_id = auth.uid())`.

### 3.2 `merkezi_post_contact`

- **Hiçbir public policy yok.**  
- Okuma: Sadece backend (service_role veya Postgres RPC). RPC örneği: `get_post_contact(post_id uuid)` → abonelik kontrolü uygulama tarafında yapılacak; RPC sadece service_role ile çağrılır veya RPC içinde `current_setting('app.premium_checked')')` gibi bir flag’e güvenilmez; bu yüzden **uygulama**: abonelik doğrula → service_role client ile `merkezi_post_contact`’tan oku veya admin client ile oku.

En basit güvenli model: **RLS’te merkezi_post_contact için SELECT policy yok.** Tüm okumalar backend API (Next.js) üzerinden; backend premium kontrolü yapar, sonra Supabase service role veya admin key ile `merkezi_post_contact`’ı okur.

### 3.3 `merkezi_tags`, `merkezi_post_tags`

- SELECT: public (okuma).
- INSERT/UPDATE/DELETE: admin.

### 3.4 `merkezi_seo_pages`

- SELECT: public.
- INSERT/UPDATE/DELETE: admin.

### 3.5 `merkezi_generated_letters`

- SELECT: Kendi kaydı (user_id = auth.uid()) veya service_role.
- INSERT: Authenticated + premium (uygulama tarafında kontrol); RLS’te insert policy: authenticated.

### 3.6 `merkezi_post_views`

- SELECT: public (sadece sayı için aggregate; kişisel veri minimal).
- INSERT: public (viewer_key ile throttle uygulama tarafında veya trigger ile).

### 3.7 `merkezi_post_likes`

- SELECT: public (sayı + “ben beğendim mi” için user_id/liker_key).
- INSERT/DELETE: authenticated veya anon (liker_key ile).

---

## 4. Premium Veri Sızıntısı Önleme (Özet)

1. **İletişim bilgisi:** Sadece `merkezi_post_contact`’ta; bu tabloda public SELECT yok. Liste/tekil sayfa API’leri bu tabloyu **hiç döndürmez**; sadece “premium aç” butonu sonrası, backend abonelik kontrolü yapıp service_role ile okuyup tek seferlik gösterir.
2. **SSR:** Tekil sayfa (`/yurtdisi-is-ilanlari/[segment]`) render’da:
   - İçerik (title, cover, content, firma kartı **iletişim hariç**) herkese.
   - İletişim kartı / mektup butonu: Sadece abonelik doğrulandıysa server’da render; değilse “Premium ile aç” butonu. İletişim verisi HTML’e hiç yazılmaz.
3. **n8n webhook:** URL ve body sadece server’da; client asla webhook URL’ini görmez. Mektup formu → Next.js API → premium kontrol → n8n → cevap → session/store; client sadece sonucu görür.

---

## 5. Kaynak (EURES/Glassdoor)

Bu sistemde **kaynak alanı kullanılmaz / UI’da gösterilmez.** İstenirse `merkezi_posts`’a `source_internal` gibi bir alan eklenebilir (sadece dahili); UI’da kesinlikle yer almaz.

---

## 6. Etiket ve SEO Kuralları

- Etiketler: Sadece filtre; `?etiket=slug` ile sayfa içi filtre. **Etiket için ayrı SEO sayfası yok.**
- `?etiket=...` kullanıldığında: `robots: noindex,follow`, canonical = etiketsiz URL. Sitemap’e etiket varyasyonları eklenmez.
- Sitemap: Sadece tekil içerik (`/yurtdisi-is-ilanlari/[slug]`), sektör ve ülke+sektör landing’ler.

---

## 7. Route Yapısı (Next.js)

- **`/yurtdisi-is-ilanlari`** — Mevcut sayfa korunur (listeleme veya yönlendirme).
- **`/yurtdisi-is-ilanlari/[segment]`** — Tek route:
  - Önce `segment`’i post slug olarak ara; bulunursa tekil içerik sayfası.
  - Bulunamazsa `segment`’i sektör slug olarak ara; bulunursa sektör listesi.
  - Hâlâ yoksa `segment`’i `ulke-sektor` formatında parse et (örn. almanya-insaat); varsa ülke+sektör listesi.
- **`/admin`** — Panel layout (admin kontrolü).
- **`/admin/posts`**, **`/admin/posts/new`**, **`/admin/posts/[id]`** — İçerik listesi / yeni / düzenle.
- **`/admin/seo`** — Sektör ve ülke+sektör sayfa yönetimi.
- **`/admin/tags`** — Etiket yönetimi.

---

## 8. Bileşen Listesi (Özet)

- **PostCard** — Liste görünümü (başlık, kapak, kısa metin, etiketler, like/views).
- **CompanyCard** — Logo, firma adı, ülke/şehir, kısa açıklama.
- **ContactCard** — Kilitli (Premium CTA) / açık (email, telefon, apply link).
- **PremiumUpsellModal** — Avantajlar, uyarı notu, 99 TL/hafta, CTA.
- **LetterGeneratorModal** — Mini form → API → n8n → İngilizce/Türkçe sekme + Kopyala.
- **LikeButton**, **ViewsCounter** — Etkileşim (SEO’yu bozmayacak şekilde).
- **TagChips** — Sadece filtre; tıklanınca sayfa içi filtre/query.

Bu doküman, migration dosyaları ve route/bileşen detayları ile uyumludur; uygulama bu mimariye göre geliştirilir.
