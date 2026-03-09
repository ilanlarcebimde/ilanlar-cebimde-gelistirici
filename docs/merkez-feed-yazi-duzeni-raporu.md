# Yurtdışı İş Başvuru Merkezi — Post Yazı Düzeni ve Yayın Raporu

**Sayfa:** https://www.ilanlarcebimde.com/yurtdisi-is-basvuru-merkezi  
**Tarih:** Rapor kod tabanına göre hazırlanmıştır.

---

## 1. Sayfa yapısı

- **Route:** `src/app/yurtdisi-is-basvuru-merkezi/page.tsx`
- **Veri:** `getPublishedPostsForMerkeziLanding()` ile server’da çekilir.
- **Liste bileşeni:** `MerkezFeed` (`src/components/merkezi/MerkezFeed.tsx`)
- **Kart bileşeni:** Her post için `MerkezFeedCard` (`src/components/merkezi/MerkezFeedCard.tsx`)

---

## 2. Hangi postlar listelenir? (Yayınlanmış rapor)

### Veritabanı ve filtre

- **Tablo:** `merkezi_posts`
- **Koşullar:**
  - `status = 'published'`
  - `published_at IS NULL` **veya** `published_at <= şu an (UTC)`
- **Sıralama:**
  1. `published_at` azalan (en yeni yayın tarihi önce)
  2. `published_at` aynı/yoksa `created_at` azalan
- **Limit:** Varsayılan 500; en fazla 2000’e kadar çekilebilir.
- **Hariç tutulan başlıklar:** `EXCLUDED_FROM_LANDING_TITLES` içinde geçen başlığa sahip postlar listeden çıkarılır (şu an örnek: "Isı Pompası Teknisyeni – İsveç / Svedala").

### Liste için kullanılan alanlar

Server’dan gelen her post için kullanılan alanlar:

| Alan | Açıklama |
|------|----------|
| `id` | Benzersiz ID |
| `title` | Başlık |
| `slug` | URL parçası (`/yurtdisi-is-ilanlari/{slug}`) |
| `cover_image_url` | Kapak görseli |
| `country_slug` | Ülke slug (örn. dubai, katar) |
| `city` | Şehir |
| `sector_slug` | Sektör slug |
| `is_paid` | Premium (ücretli) ilan mı |
| `published_at` | Yayın tarihi |
| `created_at` | Oluşturulma tarihi |
| `application_deadline_date` | Son başvuru tarihi (ilan) |
| `application_deadline_text` | Son başvuru metni (ilan) |
| `content_type` | `"job"` = ilan, `"blog"` = bilgilendirme yazısı |
| `summary` | Kısa özet (≈200 karakter) |

Ülke ve sektör adları `merkezi_countries` / `merkezi_sectors` tablolarından alınarak `country_name` ve `sector_name` olarak eklenir. Etiketler `merkezi_post_tags` + `merkezi_tags` ile `tagsByPostId` içinde gelir.

---

## 3. Yazı düzeni: İki kart türü

Postlar **içerik türüne** göre iki farklı kartla gösterilir: **ilan** (`content_type === 'job'`) ve **yazı** (`content_type === 'blog'`). Aynı listede karışık sırada yer alır; sıra tamamen `published_at` / `created_at` sıralamasına göredir.

---

### 3.1 İlan kartı (`content_type === 'job'`)

**Layout:**

- **Mobil:** Tek sütun. Sırayla: kapak görseli (200px yükseklik) → metin → butonlar.
- **Masaüstü:** 3 sütun grid: `360px` (görsel) | `1fr` (metin) | `260px` (butonlar).

**Görsel:**

- Sol blok: `cover_image_url`; yoksa placeholder. `object-contain`, `rounded-xl`, sağ üstte **Premium** veya **Ücretsiz** badge.

**Metin (orta):**

- Başlık: `post.title` (text-lg / md:text-xl, font-semibold).
- Konum satırı: `ülke adı, şehir · sektör adı` (örn. "Birleşik Arap Emirlikleri, Dubai · İnşaat").
- Varsa son başvuru: tarih veya serbest metin (amber badge).
- Varsa özet: `post.summary` (line-clamp-2).

**Butonlar (sağ):**

- Birincil: "İlan Bilgilerinin Tamamını Görüntüle" → `/yurtdisi-is-ilanlari/{slug}`.
- Altında: `JobActionsStack` (Firma İletişim, Başvuru Mektubu Oluştur vb.).

**Kart:** `rounded-2xl`, `border`, `shadow-sm`, `hover:shadow-md`, `p-4` / `md:p-5`.

---

### 3.2 Blog / yazı kartı (`content_type === 'blog'`)

**Layout:**

- **Mobil:** Tek sütun. Üstte kapak (aspect-video), altta başlık, özet, etiketler, "Devamını Oku".
- **Masaüstü:** 2 sütun grid: `420px` (görsel) | `1fr` (içerik), `gap-6`, `items-center`.

**Görsel:**

- Sol: `cover_image_url`, `aspect-video`, `object-cover`, `rounded-xl`, hover’da hafif scale. Sağ üstte **Yazı** badge.

**İçerik (sağ):**

- Başlık: `post.title` (text-xl, font-semibold).
- Özet: `post.summary` (text-sm, line-clamp-2).
- Etiketler: En fazla 4 etiket + "+N" (flex, gap-2, rounded-full, bg-slate-100).
- Link: "Devamını Oku" → `/yurtdisi-is-ilanlari/{slug}`.

**Kart:** Aynı stil (rounded-2xl, border, shadow, hover), `group` ile görsel hover animasyonu.

---

## 4. Liste üstü kontroller (MerkezFeed)

- **Arama:** Tek satır input; placeholder "Ülke, sektör veya başlık ara…". Filtreleme: `title`, `country_slug`, `city`, `sector_slug` üzerinde normalize edilmiş metin eşleşmesi.
- **Filtre butonları:** **Tümü** | **Ücretsiz** (`is_paid === false`) | **Premium** (`is_paid === true`).
- **Liste:** `filtered` postlar `space-y-5 sm:space-y-6` ile dikey liste; her öğe `<li>` içinde tek bir `MerkezFeedCard`.

Liste boşsa: "Henüz içerik yok." veya "Arama veya filtreye uygun içerik bulunamadı." mesajı gösterilir.

---

## 5. Özet tablo

| Özellik | İlan (job) | Yazı (blog) |
|--------|------------|-------------|
| Görsel oranı (masaüstü) | 360px sabit | 420px sabit |
| Metin alanı | Başlık, konum, son başvuru, özet | Başlık, özet |
| Ek bilgi | Son başvuru badge | Etiketler (max 4 + N) |
| Birincil CTA | İlan Bilgilerinin Tamamını Görüntüle | Devamını Oku |
| Ek aksiyonlar | İletişim, Başvuru Mektubu | — |
| Badge | Premium / Ücretsiz | Yazı |

---

## 6. Teknik dosya referansları (liste sayfası)

- Liste sayfası: `src/app/yurtdisi-is-basvuru-merkezi/page.tsx`
- Veri: `src/lib/merkezi/server.ts` → `getPublishedPostsForMerkeziLanding()`
- Tipler: `src/lib/merkezi/types.ts` → `MerkeziPostLandingItem`, `MerkeziTag`
- Feed UI: `src/components/merkezi/MerkezFeed.tsx`
- Kart UI: `src/components/merkezi/MerkezFeedCard.tsx` (ilan vs blog ayrımı satır 23–26 ve 81–172 / 175–224)

---

# Yazı sayfası (detay) — Ücretli / Ücretsiz düzeni

**Sayfa:** `/yurtdisi-is-ilanlari/[slug]` (tek post/yazı detayı)  
**Bileşen:** `MerkeziPostView` (`src/app/yurtdisi-is-ilanlari/[segment]/MerkeziPostView.tsx`)

Bu bölüm, **yazı sayfasında** (bir ilan veya blog yazısına tıkladıktan sonra açılan sayfada) **ücretli (premium)** ve **ücretsiz** içeriğin nasıl gösterildiğini özetler.

---

## 7. Yazı sayfası ortak düzen

Tüm yazı sayfalarında (hem ücretli hem ücretsiz) sıra şöyle:

1. **Geri linki** → `/yurtdisi-is-basvuru-merkezi`
2. **Başlık** (`post.title`) + meta satır (ülke · şehir · sektör)
3. **Beğen / Görüntülenme** (LikeButton, ViewsCounter)
4. **Kapak görseli** (PostCover); ücretli ilanlarda sağ üstte **Premium** badge
5. **İçerik gövdesi** (RichContent: `content_html_sanitized` veya `content`)
6. **Etiketler** (TagChips)
7. **Nasıl Başvururum** (NasilBasvururum)
8. **Şirket kartı** (CompanyCard)
9. **Firma iletişim / CTA alanı** — bu kısım **ücretli vs ücretsiz**e göre değişir (aşağıda)

---

## 8. Ücretli (Premium) vs Ücretsiz davranışı

### 8.1 İletişim verisi ne zaman gelir?

Server tarafında (`page.tsx`):

- **Ücretsiz ilan** (`is_paid === false`): İletişim **sadece** `show_contact_when_free === true` ise çekilir; kullanıcı premium olmasa da görür.
- **Ücretli ilan** (`is_paid === true`): İletişim **sadece** kullanıcı **Premium abonesiyse** (`isPremiumSubscriptionActive`) çekilir; değilse `contact` null gelir.

Yani:

| İlan tipi    | Kullanıcı Premium değil      | Kullanıcı Premium           |
|-------------|------------------------------|------------------------------|
| Ücretsiz    | İletişim: sadece `show_contact_when_free` ise | Aynı (iletişim yine aynı kurala göre) |
| Ücretli     | İletişim **gösterilmez**     | İletişim **gösterilir**      |

---

### 8.2 Ücretli ilan sayfasında görünenler (`is_paid === true`)

- **Firma iletişim** bölümü her zaman vardır; içerik premium’a göre değişir:
  - **Premium değilse:** `ContactCard` **kilitli** gösterilir:
    - Metin: "Firma iletişim bilgisi — Premium üyeler için açıktır. Hemen başvurmak için Premium ile kilidi açın."
    - Buton: "Premium ile Hemen Başvur" → tıklanınca Premium satın alma modal’ı (giriş / ödeme yönlendirmesi).
  - **Premium ise:** İletişim verisi API’den alınır (açılışta veya "Firma İletişim Bilgisi" tıklanınca), kart **açık** (e-posta, telefon, başvuru linki) gösterilir.
- **Butonlar:**
  - "Hızlı Başvur: Firma İletişim Bilgisi" — Premium’sa iletişimi açar/gösterir; değilse Premium modal.
  - "İş Başvuru Mektubu Oluştur" — Sadece Premium kullanıcıya açık; değilse Premium modal.
- **Faydalı Linkler** bu kısımda **gösterilmez** (sadece ücretsiz ilanlarda gösterilir).

---

### 8.3 Ücretsiz ilan sayfasında görünenler (`is_paid === false`)

- **İletişim:** Sadece admin `show_contact_when_free === true` vermişse ve iletişim verisi varsa bir **İletişim** bölümü vardır. Kart **her zaman açık** (kilit yok).
- **Faydalı Linkler** (Usta Başvuru Paketi, Yurtdışı CV Paketi, Ücretsiz İlanlar, Tüm Hizmetleri Görüntüle) **gösterilir**.
- "Firma İletişim Bilgisi" / "Başvuru Mektubu Oluştur" tipi **premium kilidi** yok; ücretsiz ilanda bu butonlar bu blokta yer almaz (ücretli ilan tarafındaki CTA’lar sadece `is_paid` iken çıkıyor).

---

### 8.4 Özet tablo (yazı sayfası)

| Özellik              | Ücretli ilan (Premium değil)     | Ücretli ilan (Premium)        | Ücretsiz ilan                 |
|----------------------|-----------------------------------|--------------------------------|--------------------------------|
| İletişim verisi      | Server’da yok                     | Server’da var, açılır          | Varsa `show_contact_when_free` ile açık |
| İletişim kartı       | Kilitli (Premium’a yönlendirir)  | Açık (e-posta, tel, link)      | Açık (varsa)                  |
| Faydalı Linkler      | Yok                              | Yok                            | Var                            |
| Başvuru mektubu CTA  | Premium modal                     | Wizard açılır                  | —                              |

---

## 9. Teknik dosya referansları (yazı sayfası)

- Sayfa: `src/app/yurtdisi-is-ilanlari/[segment]/page.tsx` (post için `MerkeziPostView`, iletişim ve premium kontrolü)
- Görünüm: `src/app/yurtdisi-is-ilanlari/[segment]/MerkeziPostView.tsx`
- İletişim kartı: `src/components/merkezi/ContactCard.tsx` (locked / unlocked, isPaid)
- Premium modal: `src/components/merkezi/PremiumUpsellModal.tsx`
- İletişim API: `src/app/api/merkezi/post/[id]/contact/route.ts` (premium doğrulama sonrası iletişim döner)

Bu rapor, liste sayfasındaki yazı düzenini ve yazı (detay) sayfasındaki ücretli/ücretsiz düzenini özetler.
