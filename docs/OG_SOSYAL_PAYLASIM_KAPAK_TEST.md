# OG / Sosyal Paylaşım Kapak Görseli — Yapılan Değişiklikler ve Test Planı

## Problem
Yurtdışı İş Başvuru Merkezi yazı detay sayfaları paylaşıldığında (WhatsApp, Facebook, X, LinkedIn) her yazının kendi kapak fotoğrafı görünmüyordu.

## Yapılan Değişiklikler (Dosya Bazında)

| Dosya | Değişiklik |
|-------|------------|
| **`src/lib/og.ts`** | Yeni: `SITE_ORIGIN`, `DEFAULT_OG_IMAGE`, `absoluteOgImageUrl()` — relative/absolute URL dönüşümü ve fallback. |
| **`src/app/layout.tsx`** | `metadataBase: new URL("https://www.ilanlarcebimde.com")` eklendi. |
| **`src/app/yurtdisi-is-ilanlari/[segment]/page.tsx`** | `generateMetadata`: yazı için `absoluteOgImageUrl(post.cover_image_url)` (yoksa varsayılan kapak); sector/country_sector için `absoluteOgImageUrl(seoPage.cover_image_url)`; her durumda tek absolute `og:image`; `twitter: summary_large_image` ve `images` dolu. |
| **`src/app/yurtdisi-is-basvuru-merkezi/page.tsx`** | Liste sayfası için `openGraph` ve `twitter` metadata eklendi; genel kapak olarak `DEFAULT_OG_IMAGE`. |

## Kabul Kriterleri (Karşılananlar)

- **Yazı detay** paylaşıldığında: `og:title` = yazı başlığı, `og:description` = özet/snippet, `og:image` = yazının kapak görseli (absolute); yoksa site varsayılanı.
- **twitter:card** = `summary_large_image`.
- Tüm görsel URL'leri **absolute** (`https://www.ilanlarcebimde.com/...` veya tam Supabase/public URL).
- **Liste sayfası** paylaşıldığında tek genel kapak görseli.
- Metadata **server-side** (generateMetadata / export metadata); client’a taşınmadı.

## Fallback Kapak
- Kapak yoksa: `https://www.ilanlarcebimde.com/logo.png` kullanılıyor (`DEFAULT_OG_IMAGE`).

## Test Planı (3 Gerçek Yazı Slug’ı ile)

1. **Slug’ları belirle**  
   Veritabanından veya canlı siteden kapaklı 2 yazı + kapaksız 1 yazı seç (örn. farklı merkezi post slug’ları).

2. **Yazı detay URL’lerini aç**  
   Örnek:  
   - `https://www.ilanlarcebimde.com/yurtdisi-is-ilanlari/katar-al-khor-su-tankeri-soforu`  
   - `https://www.ilanlarcebimde.com/yurtdisi-is-ilanlari/kibris-lefkosa-tesisatci`  
   - `https://www.ilanlarcebimde.com/yurtdisi-is-ilanlari/belcika-gent-ahsap-ustasi`  
   (Slug’ları kendi yayındaki yazılara göre güncelle.)

3. **Meta kontrolü (tarayıcı veya curl)**  
   - Sayfa kaynağında `<meta property="og:image" content="...">` ve `content` değerinin **absolute** (https:// ile başlayan) olduğunu doğrula.  
   - Kapaklı yazıda: kapak URL’i; kapaksız yazıda: `https://www.ilanlarcebimde.com/logo.png` olmalı.

4. **Facebook Sharing Debugger**  
   - https://developers.facebook.com/tools/debug/  
   - Yazı detay URL’ini gir → “Scrape Again” → Önizlemede doğru başlık, açıklama ve **yazıya ait kapak** (veya fallback) görünmeli.

5. **X (Twitter) Card Validator**  
   - https://cards-dev.twitter.com/validator (veya güncel Twitter geliştirici aracı)  
   - Aynı detay URL’ini gir → “summary_large_image” ve doğru görsel çıkmalı.

6. **LinkedIn Post Inspector**  
   - https://www.linkedin.com/post-inspector/  
   - Aynı detay URL’ini gir → Önizlemede kapak/fallback görünmeli.

7. **Liste sayfası**  
   - `https://www.ilanlarcebimde.com/yurtdisi-is-basvuru-merkezi`  
   - Paylaşım önizlemesinde genel başlık/açıklama ve varsayılan kapak görseli çıkmalı.

## Önbellek (Cache) Notu
Platformlar meta veriyi önbelleğe alır. “Düzeldi ama hala eski görsel çıkıyor” durumunda:
- Facebook: Sharing Debugger’da “Scrape Again”.
- X: Card Validator’da tekrar kontrol.
- Deploy sonrası birkaç dakika bekleyip tekrar deneyin.

## Görsel Erişilebilirlik Kontrolü
- `og:image` URL’i tarayıcıda açıldığında **HTTP 200** ve **Content-Type: image/...** dönmeli.
- Supabase Storage kullanılıyorsa: ilgili bucket **public** olmalı; signed URL kullanılmamalı (süre bitince botlar çekemez).
- Önerilen boyut: **1200×630** (en az 600×315).
