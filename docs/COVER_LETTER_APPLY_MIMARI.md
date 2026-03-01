# Cover Letter (Başvuru Mektubu) Akışı — Mimari (PDF’siz)

Bu dokümanda **iş başvuru mektubu** sihirbazı (howto-step `intent=cover_letter_generate`) mimarisi özetlenir. **PDF üretimi, dosya sistemi ve Supabase storage kullanılmaz.**

---

## Backend

- **Endpoint:** `POST /api/apply/howto-step`  
  Body’de `intent: "cover_letter_generate"`, `step: 1..6`.
- **Yetki:** Giriş zorunlu (Bearer). **Premium Plus** aboneliği gerekir (`premium_subscriptions.tier = 'plus'`).
- **Step 1–5:** Sadece validasyon; n8n çağrılmaz. Cevap: `{ type: "cover_letter_progress", status: "ok", next_step: step + 1 }`.
- **Step 6:** `N8N_LETTER_WEBHOOK_URL` ile n8n’e POST; n8n **sadece metin üretir** (TR/EN). Response **yalnızca JSON** döner; PDF yok.
- **Step 6 response şeması:**

```json
{
  "type": "cover_letter",
  "status": "success",
  "data": {
    "turkish_version": "...",
    "english_version": "...",
    "ui_notes": {
      "tr_notice": "Sizin okumanız ve incelemeniz için oluşturulmuştur.",
      "en_notice": "Bu mektubu kopyalayın ve işveren iletişim bilgisi ile gerekli kanal aracılığıyla iletin."
    }
  }
}
```

- Route bu JSON’u **aynen** client’a iletir; ek PDF/storage işlemi yok.

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

## Genel mektup (ilan bağımsız) — Premium Plus

- **Amaç:** İlan verisine bağlı olmayan, yalnızca kullanıcının girdiği bilgilere göre mektup.
- **Backend:** Aynı endpoint `POST /api/apply/howto-step`, `intent: "cover_letter_generate"`, **job_id gönderilmez**.
  - Premium Plus zorunlu.
  - Step 1: `answers.role` zorunlu; Step 2–5 aynı validation; Step 6: n8n’e sadece `answers` + `session_id`, `locale`, `request` (job yok).
- **n8n payload (genel):** `{ intent, session_id, step: 6, approved, locale, answers, request }` — **job alanı yok**.
- **n8n prompt (genel):**
  - İlan/şirket bilgisi yok; mektup tamamen genel ve profesyonel.
  - English mektup sonunda yine: *"This English version is prepared to be sent through the employer's official communication channel (email or application portal)."*
  - Markdown yok, emoji yok, strict JSON.
- **Giriş:** Yurtdışı İş Başvuru Merkezi sayfasında “Genel İş Başvuru Mektubu (Premium Plus)” butonu.
