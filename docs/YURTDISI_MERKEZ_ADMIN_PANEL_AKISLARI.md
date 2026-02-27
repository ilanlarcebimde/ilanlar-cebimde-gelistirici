# Yurtdışı İş Başvuru Merkezi — Admin Panel UI Akışları

**Hedef:** Admin panel ekranları, içerik oluşturma/düzenleme formu, yayınlama ve SEO sayfa yönetimi.

---

## 1. Yetkilendirme ve Layout

- **Route:** `/admin` ve altı (`/admin/posts`, `/admin/posts/new`, `/admin/seo`, `/admin/tags`).
- **Kontrol:** Sadece `app_admin` tablosunda `user_id = auth.uid()` olan kullanıcı erişebilir. Değilse `/giris` veya 403.
- **Layout:** Sol sidebar (veya üst nav) + ana alan.
  - Sidebar: “İçerikler”, “Yeni içerik”, “SEO sayfaları”, “Etiketler”, (opsiyonel) “Çıkış”.

---

## 2. İçerik Listesi (`/admin/posts`)

- **Sekmeler / filtre:** Taslak | Yayında | Zamanlanmış | Arşiv.
- **Tablo (veya kart) sütunları:** Başlık, Slug, Sektör, Ülke, Ücretli/Ücretsiz, Durum, Yayın tarihi, Aksiyonlar (Düzenle, Önizle, Yayınla, Arşivle).
- **Aksiyonlar:**
  - **Düzenle:** `/admin/posts/[id]` (edit formu).
  - **Önizle:** Aynı sayfada veya yeni sekmede `/yurtdisi-is-ilanlari/[slug]?preview=1` (draft için token/query ile önizleme; gerekirse geçici auth).
  - **Yayınla:** Draft/scheduled → status = published, published_at = now() (veya zamanlanmışsa olduğu gibi).
  - **Arşivle:** status = archived.

---

## 3. Yeni İçerik / Düzenleme Formu (`/admin/posts/new`, `/admin/posts/[id]`)

### 3.1 Alanlar (sıralı)

| Alan | Tip | Zorunlu | Not |
|------|-----|---------|-----|
| Başlık | text | Evet | |
| Slug | text | Evet | Otomatik üret (örn. title’dan), manuel düzenlenebilir; uniqueness kontrolü (API veya DB). |
| Kapak görseli | upload | Evet (OG için) | Supabase Storage `merkezi-covers`; URL `cover_image_url`. |
| İçerik | zengin editör | Evet | Bold, italic, underline, h1–h3, renk, link, liste, alıntı, ayırıcı, görsel embed. |
| Ülke | select/autocomplete | Hayır | `country_slug` (örn. almanya, katar). |
| Şehir | text | Hayır | `city`. |
| Sektör | select | Evet | `sector_slug` (sektör listesi veya merkezi_seo_pages’dan). |
| Etiketler | multi-select | Hayır | `merkezi_tags`; kayıt `merkezi_post_tags`. |
| Ücretli mi? | toggle | Evet | `is_paid` (true = premium iletişim kilitli). |
| Ücretsizse iletişim göster | toggle | is_paid=false时 görünür | `show_contact_when_free`. |
| Firma: logo | upload | Hayır | `company_logo_url`. |
| Firma: ad | text | Hayır | `company_name`. |
| Firma: kısa açıklama | textarea | Hayır | `company_short_description`. |
| İletişim (sadece ücretli içerikte anlamlı) | bölüm | Hayır | Email, telefon, apply URL → `merkezi_post_contact`. |
| Yayın tarihi | datetime / “Hemen” | Hayır | “Hemen” → published_at = now(); “Zamanla” → published_at = seçilen tarih; status = scheduled ise zamanı gelince published yapılır (cron veya manuel). |

### 3.2 Editör Özellikleri (minimum)

- Başlık seviyeleri: H1, H2, H3.
- Metin: kalın, italik, altı çizili, renk.
- Liste: madde işaretli, numaralı.
- Link ekleme.
- Alıntı (blockquote), yatay ayırıcı (divider).
- Görsel embed (URL veya upload → Storage’a; URL içeriğe eklenir).
- Çıktı: HTML veya JSON (saklama `content` alanında).

### 3.3 Kaydet / Önizle / Yayınla

- **Kaydet:** Draft olarak (status = draft) veya mevcut kaydı güncelle.
- **Önizle:** Yeni sekmede tekil sayfa; draft ise query/token ile önizleme modu.
- **Yayınla:** status = published, published_at = now() (veya zamanlanmış tarih).

---

## 4. SEO Sayfa Yönetimi (`/admin/seo`)

- **İki tip:** (1) Sektör landing, (2) Ülke+sektör landing.
- **Liste:** Tüm `merkezi_seo_pages` kayıtları; tip, sector_slug, country_slug (varsa), title.
- **Ekle / Düzenle formu:**
  - Tip: Sektör | Ülke+sektör.
  - Sektör slug (zorunlu).
  - Ülke slug (sadece ülke+sektör için).
  - SEO başlık, meta açıklama, kapak görseli (opsiyonel), zengin açıklama (opsiyonel).
- **Kaydet:** insert/update `merkezi_seo_pages`.

---

## 5. Etiket Yönetimi (`/admin/tags`)

- **Liste:** Tüm `merkezi_tags` (ad, slug).
- **Ekle:** Ad + slug (otomatik veya manuel); uniqueness.
- **Sil:** Tag silinince `merkezi_post_tags` ilişkisi cascade veya önce ilişki kontrolü.
- **Not:** Etiketler sadece filtre; SEO sayfası üretilmez; sitemap’e eklenmez.

---

## 6. Yayın Akışı Özeti

```
Draft → [Yayınla] → Published (published_at = now())
Draft → [Zamanla] → Scheduled (published_at = gelecek tarih)
Scheduled → (zamanı gelince veya manuel) → Published
Published/any → [Arşivle] → Archived
```

- Liste sayfalarında sadece **published** ve (published_at <= now()) içerikler listelenir.
- Önizleme: draft/scheduled için admin token veya session ile tekil sayfa gösterimi.

---

## 7. Ücretli / Ücretsiz Davranış (Özet)

- **İçerik “Ücretli”:** İletişim ve mektup butonları premium kilitli; abonelik yoksa PremiumUpsellModal.
- **İçerik “Ücretsiz”:** Premium butonlar yok; upsell linkleri (Usta Paketi, CV Paketi, Ücretsiz İlanlar). `show_contact_when_free` true ise iletişim kartı gösterilir.
- **Kaynak (EURES/Glassdoor):** UI’da hiç gösterilmez.

Bu doküman, route/bileşen listesi ve mimari dokümanla uyumludur; panel ekranları bu akışlara göre tasarlanabilir.
