# Cover Letter (Başvuru Mektubu) Akışı — Mimari (PDF’siz)

Bu dokümanda **iş başvuru mektubu** sihirbazı mimarisi özetlenir. **PDF üretimi, dosya sistemi ve Supabase storage kullanılmaz.**

---

## Backend (Sade Mimari — Tek Endpoint)

- **Endpoint:** `POST /api/cover-letter`  
  Body: `{ job_id?: string, post_id?: string, session_id: string, locale?: string, answers: {...} }`  
  - `job_id` varsa → ilanlı (job_posts’tan ilan çekilir)  
  - `post_id` varsa → merkez (merkezi_posts’tan ilan çekilir)  
  - ikisi de yoksa → generic (ilan yok)
- **Yetki:** Giriş zorunlu (Bearer). **Tüm akışlar Premium Plus** (`isPremiumPlusSubscriptionActive`).
- **Step 1–5:** Client-only; API çağrılmaz. Sadece **final submission (Step 6)** bu endpoint’i çağırır.
- **Step 6 (tek istek):** Cevap doğrulama → job/post varsa DB’den çek → `buildCoverLetterStep6Payload` → `N8N_LETTER_WEBHOOK_URL` ile n8n’e POST. Response **yalnızca JSON**; PDF yok.

**Eski (artık kullanılmıyor):** `POST /api/apply/howto-step` (intent=cover_letter_generate) ve `POST /api/merkezi/post/[id]/letter-wizard` — wizard tek endpoint’e taşındı.
- **Response şeması (n8n’den):** `ensureCoverLetterResponseUiNotes` ile normalize edilir; client aynı yapıyı bekler (turkish_version, english_version, ui_notes). Route bu JSON’u **aynen** client’a iletir; ek PDF/storage işlemi yok.

---

## Frontend — Son ekran (Step 6 sonrası)

- **Bileşen:** `src/components/apply/CoverLetterResultScreen.tsx`
- **İçerik:** İki sekme (🇹🇷 Türkçe, 🇬🇧 English). Her sekmede:
  - Üst not: `ui_notes.tr_notice` / `ui_notes.en_notice`
  - Scrollable metin: `turkish_version` / `english_version`
  - Buton: **Türkçe Kopyala** / **Copy English**
  - EN sekmesinde, ilanda e-posta varsa: **E-posta ile Gönder** (mailto) butonu.
- **Responsive:** Mobilde sekmeler full width; metin alanı ~60vh scroll; alt bar’da kopyala (sticky). Tablet/desktop aynı layout, daha geniş padding.
- **PDF:** Yok. Sadece metin gösterimi ve kopyalama / mailto.

---

## Özet

| Öğe              | Durum                          |
|------------------|--------------------------------|
| PDF üretimi      | Yok                            |
| Dosya sistemi    | Yok                            |
| Supabase storage | Yok                            |
| n8n çıktısı      | Sadece metin (JSON)            |
| Route çıktısı    | n8n JSON’u aynen döner         |
| UI               | `CoverLetterResultScreen`      |

---

## n8n prompt (Step 6) — OpenAI / System talimatları

n8n’de **OpenAI** (veya benzeri) node ile mektup üretirken kullanılacak kısa kurallar:

- **TR:** Kullanıcı incelemesi için (okuma / anlama).
- **EN:** Gönderim için (işveren e-posta veya başvuru portalı).
- **Girdi:** İlan bilgisi (job) + aday cevapları (answers) + `mode` (`job_specific` | `generic`).
- **Uzunluk:** Her dil için yaklaşık **350–450 kelime**; aşmayın.
- **Üslup:** Profesyonel, sade, **ATS uyumlu** (gereksiz formatlama yok).
- **Markdown:** Kullanma; düz metin çıktı.
- **Çıktı:** **Strict JSON** — `turkish_version`, `english_version`, `ui_notes.tr_notice`, `ui_notes.en_notice`.

**İngilizce mektup kapanış kuralı (içerik):**  
İngilizce metnin sonunda şu anlama gelen bir cümle mutlaka yer almalı (n8n prompt’a eklenmeli):

> *"This English version is prepared to be sent through the employer's official communication channel (email or application portal)."*

---

## Tek wizard, tek sözleşme

- **Adım 1:** Her zaman Meslek/Rol + Çalışma alanı (client-only). Mod seçimi yok.
- **Adım 2–5:** Kimlik, Deneyim, Belgeler, Motivasyon (client-only).
- **Adım 6:** Tek API çağrısı `POST /api/cover-letter`; backend job/post’u (varsa) çeker, n8n’e tek payload gönderir.
- **n8n:** `buildCoverLetterStep6Payload` ile tek contract; job varsa payload’da `job` alanı dolu, yoksa boş/gönderilmez.
- **Hata (404):** job_id/post_id ile ilan bulunamazsa `job_not_found` / `post_not_found`, mesaj: “Bu ilan artık yayında değil.” / “Bu içerik artık yayında değil.”
