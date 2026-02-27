# Yurtdışı İş Başvuru Merkezi — Route ve Bileşen Listesi

**Mevcut sistemlere dokunulmaz.** Tüm yeni sayfalar ve bileşenler bu listeye göre eklenecek.

---

## 1. Next.js Route Yapısı

### 1.1 Genel (SEO + içerik)

| Route | Açıklama | Not |
|-------|----------|-----|
| `/yurtdisi-is-ilanlari` | Mevcut sayfa | **Değiştirilmez** (YurtdisiPanelClient vb.) |
| `/yurtdisi-is-ilanlari/[segment]` | **Yeni** tek dinamik sayfa | segment = post slug \| sektör slug \| `ulke-sektor` |

**`[segment]` çözümleme sırası:**

1. `merkezi_posts` içinde `slug = segment` ara → bulunursa **tekil içerik sayfası**.
2. Bulunamazsa `merkezi_seo_pages` + sektör listesi: `type = 'sector'` ve `sector_slug = segment` → **sektör listesi**.
3. Hâlâ yoksa `segment`’i `ulke-sektor` (örn. `almanya-insaat`) olarak parse et; `merkezi_seo_pages`’da `type = 'country_sector'` ve eşleşen sector_slug + country_slug → **ülke+sektör listesi**.
4. Hiçbiri yoksa 404.

### 1.2 Admin panel

| Route | Açıklama |
|-------|----------|
| `/admin` | Panel layout + yönlendirme (örn. /admin/posts) |
| `/admin/posts` | İçerik listesi (Taslak / Yayında / Zamanlanmış / Arşiv) |
| `/admin/posts/new` | Yeni içerik formu |
| `/admin/posts/[id]` | Düzenle / Önizle / Yayınla / Arşivle |
| `/admin/seo` | Sektör ve ülke+sektör landing sayfa yönetimi |
| `/admin/tags` | Etiket ekle/sil |

---

## 2. API / Server Actions (Özet)

- **GET/POST iletişim:** Premium doğrulama sonrası iletişim bilgisi döndüren endpoint (service_role ile `merkezi_post_contact` okuma).
- **n8n mektup webhook:** Next.js API route (POST); body’de post_id + form alanları; premium kontrol → n8n çağrısı → cevabı kaydet/göster; webhook URL client’a hiç gitmez.
- **Görüntülenme artırma:** POST; viewer_key (IP/session hash) + post_id; throttle 12h (aynı post_id + viewer_key için).
- **Beğeni:** POST/DELETE; user_id veya liker_key; RLS ile.

---

## 3. Bileşen Listesi (UI)

### 3.1 Liste / kart

| Bileşen | Kullanım |
|---------|----------|
| **PostCard** | Sektör / ülke+sektör listesinde ve ana listelerde: başlık, kapak, kısa metin, etiket chip’leri, like + views. |
| **TagChips** | Etiketleri chip olarak gösterir; tıklanınca sayfa içi filtre (`?etiket=slug` veya state). |

### 3.2 Tekil içerik sayfası

| Bileşen | Kullanım |
|---------|----------|
| **CompanyCard** | Logo, firma adı, ülke/şehir, kısa açıklama (iletişim bu kartta değil). |
| **ContactCard** | Durum: **Kilitli** (Premium CTA butonu) veya **Açık** (email, telefon, apply link). SSR’de abonelik yoksa sadece kilitli görünüm; iletişim verisi HTML’de olmaz. |
| **LikeButton** | Beğeni butonu; sayı + “beğendim” state. |
| **ViewsCounter** | Görüntülenme sayısı (throttle’lı artış). |
| **PremiumUpsellModal** | Pop-up: başlık “Premium ile Hemen Başvur”, avantajlar, uyarı notu kutusu, “99 TL/hafta”, CTA “Premium’u Aç”, secondary “Şimdilik Vazgeç”. |
| **LetterGeneratorModal** | Mini form (ad/soyad, deneyim yılı, meslek, sertifika, İngilizce, pasaport/vize, maaş/konaklama beklentisi) → Gönder → API → n8n → İngilizce/Türkçe sekme + Kopyala. Sadece premium kullanıcıya açılır. |

### 3.3 Ücretsiz içerik (is_paid = false)

- Premium butonlar **gösterilmez**.
- Yerine: “Usta Başvuru Paketi”, “Yurtdışı CV Paketi”, “Ücretsiz Yurtdışı İş İlanları” link/butonları (şık konumda).
- `show_contact_when_free = true` ise iletişim kartı normal gösterilir.

### 3.4 Ücretli içerik (is_paid = true)

- Butonlar: “Hemen Başvur: Firma İletişim Bilgisi”, “İlana Özel Kişisel Başvuru Mektubu Oluştur”.
- Tıklanınca abonelik yoksa **PremiumUpsellModal** açılır.
- Abonelik varsa: iletişim kartı açılır, mektup modal’ı çalışır.

---

## 4. Metadata / OG Kuralları

- **Tekil sayfa `/yurtdisi-is-ilanlari/[slug]`:**  
  `title` = post title, `description` = excerpt, **og:image** = `cover_image_url` (mutlaka).
- **Sektör / ülke+sektör:** `merkezi_seo_pages`’daki title, meta_description, cover_image_url.
- **`?etiket=...`:**  
  `robots: noindex,follow`, **canonical** = aynı sayfanın etiketsiz URL’i. Sitemap’e etiket varyasyonu eklenmez.

---

## 5. Dosya Yapısı (Önerilen)

```
src/app/
  yurtdisi-is-ilanlari/
    page.tsx                    # Mevcut (değiştirme)
    [segment]/
      page.tsx                  # Yeni: segment çözümleme + post / sektör / ülke-sektor
  admin/
    layout.tsx                  # Admin kontrolü, sidebar
    page.tsx                    # Yönlendirme veya dashboard
    posts/
      page.tsx                  # Liste
      new/
        page.tsx                # Yeni içerik
      [id]/
        page.tsx                # Düzenle
    seo/
      page.tsx                  # SEO sayfa yönetimi
    tags/
      page.tsx                  # Etiket yönetimi

src/components/
  merkezi/                      # Yeni bileşenler (önek: merkezi)
    PostCard.tsx
    CompanyCard.tsx
    ContactCard.tsx
    TagChips.tsx
    LikeButton.tsx
    ViewsCounter.tsx
    PremiumUpsellModal.tsx
    LetterGeneratorModal.tsx
    RichContent.tsx             # Zengin metin render (content)
```

Bu liste, mimari doküman ve migration’larla uyumludur; uygulama adım adım bu yapıya göre geliştirilebilir.
