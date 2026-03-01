# İş Başvuru Mektubu — Step 6 Webhook Sözleşmesi (production-ready)

**Tek kaynak:** `src/lib/coverLetterWebhookContract.ts` — payload üretimi ve response tipleri.

---

## Step 6 payload (n8n'e tek sefer, değişmez)

n8n yalnızca bu yapıyı bekler. Backend her zaman `buildCoverLetterStep6Payload()` ile üretir.

```json
{
  "intent": "cover_letter_generate",
  "session_id": "uuid",
  "step": 6,
  "approved": true,
  "locale": "tr-TR",
  "answers": {
    "role": "string",
    "work_area": "string(optional)",
    "full_name": "string",
    "email": "string",
    "phone": "string(optional)",
    "city_country": "string(optional)",
    "total_experience_years": 6,
    "top_skills": ["...", "..."],
    "last_company": "string(optional)",
    "passport_status": "var|yok|yenileniyor",
    "visa_status": "var|yok|başvuracağım(optional)",
    "work_permit_status": "var|yok|başvuracağım",
    "documents": ["..."](optional),
    "availability": "hemen|1ay|2ay(optional)",
    "motivation": "string",
    "tone": "professional|very_formal(optional)"
  },
  "request": { "version": 1 }
}
```

- **Generic akış:** `job` ve `derived` gönderilmez.
- **İlanlı akış:** `job` (ilan verisi) ve `derived` (örn. `mode`) eklenir.
- **role:** Step 1'de toplanır; Step 6 payload'ında mutlaka yer alır.

---

## n8n response (kesin format)

### Başarı

```json
{
  "type": "cover_letter",
  "status": "success",
  "data": {
    "turkish_version": "....",
    "english_version": "....",
    "ui_notes": {
      "tr_notice": "Bu metin sizin okumanız ve incelemeniz için oluşturulmuştur.",
      "en_notice": "Bu mektubu kopyalayın ve işverenin iletişim bilgisi üzerinden gerekli kanal aracılığıyla iletin (e-posta / başvuru portalı)."
    }
  }
}
```

### Hata

```json
{
  "type": "cover_letter",
  "status": "error",
  "message": "..."
}
```

Backend, başarı cevabında `ui_notes` eksikse `COVER_LETTER_UI_NOTES` ile doldurur (`ensureCoverLetterResponseUiNotes`); UI bozulmaz.

---

## n8n akışı (önerilen)

1. **Webhook (POST)** → gelen body
2. **IF** `intent === "cover_letter_generate"` **AND** `step === 6` → devam
3. **Set** answers normalize + `ui_notes` sabitle
4. **OpenAI Chat** — strict JSON, prompt kurallarına uygun
5. **Code** — JSON parse/validate + fallback
6. **Respond to Webhook** — yukarıdaki response formatında dön

Step 6 dışında gelen istek olursa token harcanmadan `200` + `{ "type": "cover_letter_progress", "status": "ok" }` dönülebilir.

---

## n8n prompt kuralları (genel mektup)

- İlan/şirket bilgisi yok.
- `role` + skills + documents + legal + motivation üzerinden yaz.
- TR ve EN ayrı; EN kapanışında "resmi kanal" cümlesi zorunlu.
- Emoji/markdown yok; strict JSON.
