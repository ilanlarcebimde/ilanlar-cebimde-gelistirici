# İş İlanı Kartı — Yazı Boyutu, Butonlar, Başlık, Açıklama ve Yerleşim Stratejisi Raporu

**Bileşen:** `src/components/kanal/FeedPostCard.tsx`  
**Kullanıldığı yerler:** Feed sayfası (PanelFeed), Kanal sayfası (KanalFeedClient), ChannelsFeed.

---

## 1. Genel Yerleşim Stratejisi

- **Kart:** Dikey (flex-col) blok; üstten alta: başlık + tarih → meta satırı → snippet → alt bar (kaynak + buton).
- **Sol kenar vurgusu:** 3px dikey çizgi (`borderLeft`), kanal rengi (`brandColor`) veya varsayılan mavi.
- **Responsive:** Mobilde tek sütun; `sm` ve üzeri başlık ile tarih yan yana (flex-row), buton tam genişlikten çıkıp sağa hizalı.

---

## 2. Yazı Boyutları (Tipografi)

| Öğe | Sınıf | Anlamı | Yaklaşık piksel (1rem=16px) |
|-----|--------|--------|-----------------------------|
| **Başlık** | `text-base` → `sm:text-lg` | Mobil 16px, masaüstü 18px | 16px / 18px |
| **Tarih** | `text-xs` → `sm:text-sm` | Mobil 12px, masaüstü 14px | 12px / 14px |
| **Meta (pozisyon, konum, kaynak)** | `text-sm` | Sabit 14px | 14px |
| **Açıklama (snippet)** | `text-sm` + `leading-relaxed` | 14px, satır aralığı rahat | 14px |
| **Alt bar "Kaynak" etiketi** | `text-xs` + `font-medium` | 12px, orta kalınlık | 12px |
| **"İlana Git" butonu** | `text-sm` + `font-semibold` | 14px, yarı kalın | 14px |

**Özet:** Başlık en büyük (16–18px), tarih ve meta orta (12–14px), snippet okunaklı (14px), alt etiket ve buton metni küçük/orta (12–14px).

---

## 3. Başlık Stratejisi

- **Konum:** Kartın en üstü; solda (veya mobilde tam genişlik).
- **Stil:** `text-base font-bold leading-snug text-slate-900`, `sm:text-lg`; `min-w-0 flex-1` ile taşma önlenir, uzun başlıklar satır kırar.
- **Yerleşim:** Tarih sağda (`shrink-0`), başlık kalan alanı doldurur; mobilde başlık üstte, tarih hemen altında/sağında (flex-wrap ile).

---

## 4. Açıklama (Snippet) Stratejisi

- **Maksimum satır:** 3 satır (`SNIPPET_MAX_LINES = 3`); fazlası kesilir, sonuna "…" eklenir.
- **Satır yüksekliği:** 1.4 (`SNIPPET_LINE_HEIGHT`) — hem `leading-relaxed` hem inline `lineHeight` ile okunabilirlik artırılmış.
- **Konum:** Başlık + meta satırından sonra, `mt-3` ile araya boşluk.
- **Stil:** `text-sm text-slate-600`; paragraf etiketi ile semantik.

---

## 5. Butonlar ve Aksiyon Stratejisi

- **Tek aksiyon:** "İlana Git" linki (buton görünümlü).
- **Görünürlük:** Sadece `post.source_url` doluysa gösterilir; yoksa buton yok.
- **Stil:**
  - `rounded-xl`, `bg-brand-600`, `text-white`, `px-4 py-2.5`, `text-sm font-semibold`
  - Hover: `hover:bg-brand-700`
  - Mobil: `w-full sm:w-auto text-center` — mobilde tam genişlik, masaüstünde içerik genişliği.
- **Konum:** Alt barın sağ tarafı; sol tarafta "Kaynak" metni (`source_name` veya "Kaynak").

---

## 6. Yerleşim Hiyerarşisi (Yukarıdan Aşağıya)

1. **Başlık + Tarih** — `flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between`  
   Başlık sol/üst, tarih sağ/üst; mobilde dikey, sm+ yatay.

2. **Meta satırı** — `mt-2`, `flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-500`  
   Pozisyon, konum, kaynak adı yan yana; taşarsa satır kırar.

3. **Snippet (opsiyonel)** — `mt-3`, en fazla 3 satır, "…" ile kesme.

4. **Alt bar** — `mt-4 flex flex-wrap items-center justify-between gap-3`  
   Sol: "Kaynak" etiketi (`text-xs font-medium text-slate-500`).  
   Sağ: "İlana Git" butonu (varsa).

---

## 7. Kart Konteyner Stili

- **Padding:** `p-5` mobil, `sm:p-6` masaüstü.
- **Köşe:** `rounded-[16px]`.
- **Çerçeve:** `border border-slate-200` + sol kenar 3px renkli çizgi.
- **Gölge:** Varsayılan `shadow-[0_2px_12px_rgba(0,0,0,0.06)]`, hover `shadow-[0_8px_24px_rgba(0,0,0,0.12)]`.
- **Hover:** Hafif yukarı kayma `hover:-translate-y-0.5` ve gölge artışı.

---

## 8. Özet Tablo

| Bölüm | Yazı boyutu | Ağırlık | Renk | Yerleşim |
|-------|-------------|---------|------|----------|
| Başlık | 16px / 18px | bold | slate-900 | Üst, sol (tarih sağda) |
| Tarih | 12px / 14px | normal | slate-400 | Üst sağ |
| Meta (pozisyon, konum, kaynak) | 14px | normal | slate-500 | Başlığın altı, wrap |
| Snippet | 14px | normal | slate-600 | Meta altı, max 3 satır |
| Kaynak etiketi | 12px | medium | slate-500 | Alt sol |
| İlana Git butonu | 14px | semibold | beyaz (arka plan brand) | Alt sağ, mobilde full width |

Bu strateji, okunabilirlik öncelikli, tek CTA’lı ve mobil/masaüstü uyumlu bir ilan kartı sunar.
