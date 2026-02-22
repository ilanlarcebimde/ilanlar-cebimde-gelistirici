# Gönderi Kartı (FeedPostCard) Stil Raporu

Bu rapor, `src/components/kanal/FeedPostCard.tsx` bileşeninde **yazı tipi**, **yerleşim**, **boyut** ve **renk** ayarlarının nasıl yapıldığını açıklar.

---

## 1. Yazı tipi (Tipografi)

### Genel font ailesi
- **Kaynak:** `tailwind.config.ts` → `theme.extend.fontFamily`
- **Değer:** `system-ui`, `Segoe UI`, `sans-serif` (varsayılan `sans` ve `display`)
- Kart bu fontları miras alır; bileşende özel `font-*` sınıfı yoksa Tailwind varsayılanı kullanılır.

### Bölümlere göre yazı tipi

| Bölüm | Sınıflar | Anlamı |
|--------|----------|--------|
| **Başlık** | `text-base font-bold leading-snug` (mobil), `sm:text-lg` (masaüstü) | 16px kalın, sık satır; sm’de 18px |
| **Tarih** | `text-xs` (mobil), `sm:text-sm` | 12px; sm’de 14px |
| **Meta (pozisyon/konum/kaynak)** | `text-sm` | 14px, normal ağırlık |
| **Snippet (özet)** | `text-sm` + `style={{ lineHeight: 1.45 }}` | 14px, satır yüksekliği 1.45 |
| **Footer – kaynak** | `text-xs font-medium` | 12px, orta kalınlık |
| **Footer – buton** | `text-sm font-semibold` | 14px, yarı kalın |

### Özet
- **Boyut:** `text-xs` (12px), `text-sm` (14px), `text-base` (16px), `text-lg` (18px).
- **Ağırlık:** `font-bold` (başlık), `font-semibold` (buton), `font-medium` (kaynak).
- **Satır yüksekliği:** Başlıkta `leading-snug`; snippet’te sabit `lineHeight: 1.45` (inline style).

---

## 2. Yerleşim (Layout)

### Kart konteyneri (`<article>`)
- **Blok:** `flex` yok; içerik dikey akar (blok yerleşim).
- **İç boşluk:** `p-5` (mobil), `sm:p-6` ve `lg:p-6` (daha geniş ekran) → 20px / 24px padding.
- **Köşe:** `rounded-2xl` (16px).
- **Sol çizgi:** `style={{ borderLeft: '3px solid ${color}' }}` — renk `brandColor` prop’undan veya varsayılan mavi.

### Header (başlık + tarih)
- **Konteyner:** `flex flex-col gap-2` (mobil), `sm:flex-row sm:items-start sm:justify-between sm:gap-3`.
- Mobilde başlık üstte, tarih altta; sm’de yan yana, başlık sola yaslı, tarih sağda.
- Başlık: `min-w-0 flex-1` (taşmayı engeller, kalan alanı alır).
- Tarih: `shrink-0` (küçülmez).

### Meta satırı (pozisyon / konum / kaynak)
- **Konteyner:** `flex flex-wrap gap-x-3 gap-y-1` — öğeler yan yana, gerekirse alt satıra geçer.
- **Her öğe:** `truncate max-w-full sm:max-w-none` — mobilde taşan metin kesilir.

### Snippet
- Sadece metin bloğu; üst boşluk `mt-3`.

### Footer (kaynak + buton)
- **Konteyner:** `flex flex-wrap items-center justify-between gap-3`.
- Solda kaynak (veya boş), sağda “İlana Git” butonu; mobilde buton `w-full` (tam genişlik), sm’de `sm:w-auto`.

---

## 3. Boyut

| Öğe | Sınıflar / stil | Değer |
|-----|------------------|--------|
| Kart padding | `p-5` / `sm:p-6` / `lg:p-6` | 20px / 24px |
| Kart köşe | `rounded-2xl` | 16px |
| Sol border | inline `3px solid` | 3px |
| Başlık | `text-base` / `sm:text-lg` | 16px / 18px |
| Buton min yükseklik | `min-h-[44px]` | 44px (dokunma hedefi) |
| Buton padding | `px-4 py-3` / `sm:py-2.5` | yatay 16px; dikey 12px / 10px |
| Buton köşe | `rounded-xl` | 12px |
| Snippet satır sayısı | `truncateSnippet(..., 3)` | En fazla 3 satır (kod ile) |

---

## 4. Renk

### Kaynaklar
- **Tailwind tema:** `tailwind.config.ts` → `brand` (50–900), varsayılan **slate** paleti.
- **Bileşen prop:** `brandColor` (opsiyonel) — kanal rengi; yoksa `rgb(59, 130, 246)` (mavi) kullanılır.

### Bölümlere göre renk

| Bölüm | Sınıf / stil | Renk |
|--------|----------------|------|
| Kart arka plan | `bg-white` | Beyaz |
| Kart gölge | `shadow-[0_2px_12px_rgba(0,0,0,0.06)]` | Açık gri gölge |
| Hover gölge | `hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]` | Daha koyu gölge |
| Kart çerçeve | `border border-slate-200` | Açık gri çerçeve |
| Sol çizgi | `style={{ borderLeft: '3px solid ${color}' }}` | `brandColor` veya varsayılan mavi |
| Başlık | `text-slate-900` | Koyu gri (neredeyse siyah) |
| Tarih | `text-slate-500` | Orta gri |
| Meta satırı | `text-slate-500` | Orta gri |
| Snippet | `text-slate-600` | Koyu gri |
| Footer – kaynak | `text-slate-500` | Orta gri |
| Buton arka plan | `bg-brand-600` | Tema rengi (#0284c7) |
| Buton hover | `hover:bg-brand-700` | Koyu tema (#0369a1) |
| Buton yazı | `text-white` | Beyaz |

### Renk hiyerarşisi
1. **Vurgu:** Sol border ve buton → `brandColor` / brand paleti.
2. **İçerik:** Başlık `slate-900`, gövde metinleri `slate-600` / `slate-500`.
3. **Arka plan:** Kart `bg-white`, buton `bg-brand-600`.

---

## 5. Özet tablo

| Kategori | Nasıl ayarlanıyor |
|----------|--------------------|
| **Yazı tipi** | Tailwind: `text-xs/sm/base/lg`, `font-medium/semibold/bold`, `leading-snug`; snippet’te inline `lineHeight: 1.45`. |
| **Yerleşim** | Flex (header, meta, footer); `flex-col` / `sm:flex-row`; `justify-between`, `gap-*`, `flex-wrap`. |
| **Boyut** | `p-5/p-6`, `rounded-2xl`, `min-h-[44px]`, `text-*` ile tipografi boyutları. |
| **Renk** | `brandColor` prop + inline `borderLeft`; `slate-*` metin; `bg-brand-600/700` buton; `bg-white` kart. |

Tüm stiller **Tailwind CSS** sınıfları ve tek bir **inline style** (sol border + snippet `lineHeight`) ile verilir; ayrı bir CSS modülü kullanılmaz.
