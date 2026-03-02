# OG / Sosyal Paylaşım Kapak Görseli — Değişiklikler ve Test Planı

## Route Yapısı (Önemli)

- **Liste:** `/yurtdisi-is-basvuru-merkezi` — Başvuru merkezi ana sayfa; kartlar burada listelenir.
- **Detay:** `/yurtdisi-is-ilanlari/[slug]` — Yazıya tıklanınca açılan sayfa **bu URL’dedir** (başvuru merkezi altında `[slug]` route’u yok).

Sosyal ağlar sadece **paylaşılan URL’nin** meta etiketlerini okur. Liste sayfası paylaşılırsa liste meta’sı, yazı linki paylaşılırsa **yazı detay meta’sı** kullanılır. Bu yüzden `generateMetadata` **yazı detay route’unda** olmalıdır: `src/app/yurtdisi-is-ilanlari/[segment]/page.tsx`. Başvuru merkezi içeriklerinin detayı bu route’ta sunulduğu için metadata doğru yerde.

---

## Problem
Yurtdışı İş Başvuru Merkezi yazıları paylaşıldığında (WhatsApp, Facebook, X, LinkedIn) yazıya özel kapak/başlık/özet görünmüyordu.

## Yapılan Değişiklikler (Dosya Bazında)

| Dosya | Değişiklik |
|-------|------------|
| **`src/lib/og.ts`** | `SITE_ORIGIN`, `DEFAULT_OG_IMAGE` = `https://www.ilanlarcebimde.com/og/default-1200x630.jpg` (logo değil). `absoluteOgImageUrl()`. Signed URL uyarısı (yorum). |
| **`src/app/layout.tsx`** | `metadataBase: new URL("https://www.ilanlarcebimde.com")`. |
| **`src/app/yurtdisi-is-ilanlari/[segment]/page.tsx`** | `generateMetadata`: post/sector/country_sector için `og:title`, `og:description`, `og:image` (url, width: 1200, height: 630, alt); `openGraph.url` ve `alternates.canonical` absolute; `twitter: summary_large_image` + images. |
| **`src/app/yurtdisi-is-basvuru-merkezi/page.tsx`** | Liste için `openGraph` ve `twitter` metadata; `url`, `images` (width/height/alt) absolute. |
| **`public/og/README.md`** | 1200×630 fallback görsel talimatı: `default-1200x630.jpg` eklenmeli. |

## Kabul Kriterleri

- **Yazı detay** paylaşıldığında: `og:title` = yazı başlığı, `og:description` = özet, `og:image` = yazının kapak görseli (absolute); yoksa `DEFAULT_OG_IMAGE` (/og/default-1200x630.jpg).
- **twitter:card** = `summary_large_image`; `twitter.images` dolu.
- **Tüm URL’ler absolute:** `openGraph.url`, `alternates.canonical`, `openGraph.images[].url` — `SITE_ORIGIN` tek kaynak.
- **openGraph.images / twitter.images:** `url`, `width: 1200`, `height: 630`, `alt` (post/sayfa başlığı).
- **Liste sayfası:** Genel kapak ve başlık/açıklama.
- **Metadata server-side;** sayfa `use client` değil.
- **Supabase kapak görseli:** Signed URL **kullanılmamalı** (süre bitince botlar çekemez). Public bucket veya kalıcı public/CDN URL şart. `og:image` URL’i tarayıcıda açıldığında **HTTP 200** ve **Content-Type: image/** dönmeli.

## Fallback Kapak
- **DEFAULT_OG_IMAGE:** `https://www.ilanlarcebimde.com/og/default-1200x630.jpg` (1200×630, logo.png değil).
- Bu dosyayı `public/og/default-1200x630.jpg` olarak eklemeniz gerekir; yoksa 404 olur. Bkz. `public/og/README.md`.

---

## Test Planı (3 Gerçek Slug + Doğrulama Adımları)

### Örnek hedef URL
- `https://www.ilanlarcebimde.com/yurtdisi-is-ilanlari/kibris-lefkosa-da-tesisatci-alimi-1500-euro-maas-tam-zamanli`

**Beklenen:** Paylaşımda başlık “Kıbrıs Lefkoşa’da Tesisatçı Alımı – 1.500 € Maaş – Tam Zamanlı”, özet ve yazının kapak görseli; önizleme tıklanınca aynı URL’ye gitsin.

### Adım 1: Sayfa kaynağında meta kontrolü
Bu URL’yi tarayıcıda açıp **Sayfa kaynağı**nda şunları kontrol edin:

- `<meta property="og:image" content="https://...">` — **absolute** URL.
- `<meta property="og:title" content="...">`
- `<meta property="og:description" content="...">`
- `<meta property="og:url" content="https://www.ilanlarcebimde.com/yurtdisi-is-ilanlari/...">`
- `<meta name="twitter:card" content="summary_large_image">`

Bunlar yoksa veya `og:image` relative ise önizleme bozulur.

### Adım 2: og:image erişilebilirlik
- `og:image` içindeki URL’yi tarayıcıda açın.
- **HTTP 200** ve **Content-Type: image/jpeg** veya **image/png** vb. olmalı.
- Auth / hotlink engeli olmamalı.

### Adım 3: 3 gerçek slug ile test
1. Kapaklı 2 yazı + kapaksız 1 yazı için detay URL’lerini yazın (örn. yukarıdaki Kıbrıs tesisatçı + 2 tane daha).
2. Her URL için:
   - Facebook Sharing Debugger → URL gir → **Scrape Again** → doğru başlık, açıklama, **yazıya ait kapak** (veya fallback).
   - X Card Validator → `summary_large_image` ve doğru görsel.
   - LinkedIn Post Inspector → aynı kontrol.
3. Liste: `https://www.ilanlarcebimde.com/yurtdisi-is-basvuru-merkezi` → genel kapak ve liste meta’sı.

### Adım 4: WhatsApp
- WhatsApp genelde Facebook scraper mantığına benzer; önbellek **çok agresif** olabilir.
- Aynı linki farklı sohbetlerde test edin.
- Cache’i atlamak için geçici doğrulama: URL’ye anlamsız query ekleyip deneyin (örn. `?v=2`). Kalıcı çözüm değil, sadece “yeni meta çekildi mi?” doğrulaması için.

### Adım 5: Önbellek
- “Düzeldi ama hala eski görsel çıkıyor” → Facebook’ta **Scrape Again**, X/LinkedIn’de tekrar kontrol.
- Deploy sonrası birkaç dakika bekleyin; platformlar meta’yı cache’ler.

---

## Supabase / Signed URL (Kabul Kriteri)

- **cover_image_url** signed URL ise (token/signature içeriyorsa) OG için **kullanılmamalı**; süre bitince botlar görseli alamaz.
- Kapak görselleri: **public bucket** veya kalıcı **public/CDN** linki ile saklanmalı.
- Admin upload’ta `getPublicUrl()` kullanılıyorsa URL kalıcıdır; signed URL kullanmayın.

---

## Sitemap (`/sitemap.xml`) — Kontrol ve Düzeltmeler

### Tespit edilen eksikler (giderildi)
- **Yurtdışı İş Başvuru Merkezi listesi** (`/yurtdisi-is-basvuru-merkezi`) sitemap'te yoktu → statik route olarak eklendi.
- **Merkezi yazı detay URL'leri** (`/yurtdisi-is-ilanlari/[slug]`) sitemap'te yoktu → `merkezi_posts` (status=published, published_at uygun) üzerinden dinamik eklendi.
- **Sektör ve ülke-sektör landing sayfaları** sitemap'te yoktu → `merkezi_seo_pages` üzerinden dinamik eklendi.

### Güncel sitemap içeriği (`src/app/sitemap.ts`)
- **Statik:** ana sayfa, hakkımızda, iletişim, sss, yurtdisi-is-ilanlari, ucretsiz-yurtdisi-is-ilanlari, **yurtdisi-is-basvuru-merkezi**, yurtdisi-cv-paketi, premium/job-guides, giriş, yasal sayfalar.
- **Kanal:** `channels` tablosundan `/kanal/[slug]`.
- **Merkezi:** `merkezi_posts` (yayındaki yazılar) → `/yurtdisi-is-ilanlari/[slug]`; `merkezi_seo_pages` (sector + country_sector) → ilgili segment URL'leri.

### Doğrulama
- `https://www.ilanlarcebimde.com/sitemap.xml` açıldığında geçerli XML dönmeli.
- Yazı, sektör ve ülke-sektör sayfaları `<loc>` içinde absolute URL ile listelenmeli.
- `robots.txt` içinde `Sitemap: https://www.ilanlarcebimde.com/sitemap.xml` yer alıyor (`src/app/robots.ts`).
