# Gemini API Kullanım Raporu

Bu dokümanda projede **Google Gemini API** ile yapılan tüm işlemler, endpoint’ler, istek/yanıt formatları ve hata davranışları özetlenmiştir.

---

## 1. Ortak Yapı

- **API taban URL:** `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}`
- **HTTP metodu:** `POST`
- **Header:** `Content-Type: application/json`
- **Model:** `process.env.GEMINI_MODEL` veya varsayılan `gemini-2.0-flash`
- **Env:** `GEMINI_API_KEY` zorunlu; yoksa `GEMINI_API_KEY_MISSING` fırlatılır ve ilgili route 503 döner.

Tüm çağrılarda tek mesaj gönderilir: sistem talimatı + kullanıcı girdisi tek metin olarak `contents[0].parts[0].text` içinde birleştirilir (role: `"user"`).

---

## 2. İşlem 1: Job Guide Chat (Sohbet)

**Dosya:** `src/app/api/job-guide/chat/route.ts`

### Ne zaman Gemini çağrılır?

- **Bootstrap (ilk mesaj):** Çağrılmaz. İlan kaynağına göre (EURES / Glassdoor / diğer) deterministik metin + soru döndürülür.
- **Chat (kullanıcı mesaj yazdığında):** `mode: "chat"` ve `message_text` dolu ise **tek bir Gemini çağrısı** yapılır.

### İstek (Next.js → Gemini)

| Alan | Değer |
|------|--------|
| URL | `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}` |
| Body | `contents`: `[{ role: "user", parts: [{ text: system + "\n\n---\n\nKullanıcı girdisi:\n" + user }] }]` |
| generationConfig | `temperature: 0.3`, `topP: 0.9`, `maxOutputTokens: 4096` |
| Timeout | 50 saniye (AbortController) |

**System (özet):** Yurtdışı iş başvuru asistanı; her yanıtta `next_question` (tek soru) zorunlu; ustalık belgesi sorusu; YouTube link uydurma yok; çıktı sadece JSON.

**User (chat modunda):** `job_post` metni, `Mevcut answers`, `checklist_snapshot`, kullanıcının son mesajı (`rawUserText`).

### Beklenen Gemini yanıtı (JSON)

```json
{
  "assistant_message": "string (Türkçe, 5-8 madde)",
  "next_question": { "text": "Soru metni", "choices": ["Var", "Yok", "Emin değilim"] },
  "answers_patch": {},
  "report": {
    "summary": { "one_liner": "...", "top_actions": [] },
    "how_to_apply": { "steps": [], "where_to_apply": "", "notes": [] },
    "documents": { "required": [], "optional": [], "warnings": [] },
    "work_permit_and_visa": { ... },
    "salary_and_life_calc": { ... },
    "risk_assessment": { "level": "low|medium|high", "items": [] },
    "fit_analysis": { "score": 0-100, "strengths": [], "gaps": [] },
    "plan_30_days": { "week1": [], ... }
  }
}
```

### Yanıt işleme (route içinde)

1. **Ham metin:** `data.candidates[0].content.parts[].text` birleştirilir.
2. **JSON çıkarma:** `extractJson(rawText)` (```json``` temizlenir, `{`–`}` arası parse edilir).
3. **Parse hatası:** `job_guide_events` tablosuna `type: "error"`, `content: { error: "JSON_PARSE_FAILED", snippet: rawText.slice(0,400) }` yazılır; API 500 + `gemini_parse_failed` döner.
4. **Başarı:** `assistant_message`, `next_question`, `answers_patch`, `report` kullanılır; `job_guides` (answers_json, report_json, report_md, score, risk_level) ve `job_guide_events` (user_message / assistant_message) güncellenir.

### API route çıkışı (client’a dönen)

```json
{
  "assistant_message": "string",
  "next_question": { "text": "...", "choices": [] },
  "report_json": {},
  "report_md": "string | null",
  "checklist_snapshot": { "total", "done", "percent", "missing_top3" },
  "answers_json": {},
  "assistant": { "message_md", "quick_replies", "ask": { "id", "question", "type", "choices" } },
  "state_patch": { "answers_patch", "checklist_patch", "progress": { "total", "done", "percent" } },
  "next": { "should_finalize", "reason" }
}
```

### Hatalar

| Durum | HTTP | Body |
|--------|------|------|
| GEMINI_API_KEY_MISSING | 503 | `{ "error": "gemini_not_configured" }` |
| JSON parse fail | 500 | `{ "error": "gemini_parse_failed", "detail": "Yanıt işlenemedi. Lütfen tekrar deneyin." }` |
| Diğer | 500 | `{ "error": "internal_error", "detail": "..." }` |

---

## 3. İşlem 2: Job Guide Update (Nihai rapor)

**Dosya:** `src/app/api/job-guide/update/route.ts`

### Ne zaman Gemini çağrılır?

- Kullanıcı “Raporu güncelle” / “Analiz oluştur” benzeri bir aksiyonla bu endpoint’i tetiklediğinde.
- Önce `job_guides.status` kontrol edilir; `report_generating` ise 409 dönülür, Gemini çağrılmaz.

### İstek (Next.js → Gemini)

| Alan | Değer |
|------|--------|
| URL | Aynı `generateContent` URL’i |
| Body | `contents`: sistem + kullanıcı metni tek blok; `generationConfig`: `temperature: 0.3`, `topP: 0.9`, `maxOutputTokens: 4096` |
| Timeout | Yok (fetch timeout yok) |

**System (özet):** “Yurtdışı iş başvuru asistanı”; sadece ilandaki verilerden analiz; Nasıl başvururum = ilana özel adımlar; link/URL yok; uydurma yok; çıktı sadece JSON. Şema: summary, how_to_apply, documents, work_permit_and_visa, salary_and_life_calc, risk_assessment, fit_analysis, plan_30_days.

**User:** `job_post` (başlık, sektör, konum, ülke, kaynak, özet) + `user_answers` (JSON) + `checklist_snapshot` (JSON).

### Beklenen Gemini yanıtı (JSON)

Yukarıdaki rapor şeması (summary, how_to_apply, documents, work_permit_and_visa, salary_and_life_calc, risk_assessment, fit_analysis, plan_30_days). `fit_analysis` içinde `score`, `strengths`, `gaps`, `next_questions` kullanılır.

### Yanıt işleme

1. `extractJson(rawText)` ile parse.
2. Metinler çıkarılır (rehber, belgeler, vize, maaş, risk, plan, sana_ozel).
3. `report_json` ve `report_md` oluşturulur.
4. `job_guides` güncellenir (report_json, report_md, progress_step, status: in_progress, score, risk_level).
5. `job_guide_events`’e `type: "report_update"` ile progress ve next_questions yazılır.

### API route çıkışı (client’a dönen)

```json
{
  "report_json": {},
  "report_md": "string",
  "progress_step": number,
  "next_questions": [],
  "score": number | undefined,
  "risk_level": "low" | "medium" | "high" | undefined
}
```

### Hatalar

| Durum | HTTP | Body |
|--------|------|------|
| GEMINI_API_KEY_MISSING | 503 | `{ "error": "gemini_not_configured" }` |
| Analiz zaten güncelleniyor | 409 | `{ "error": "Analiz zaten güncelleniyor, lütfen bekleyin." }` |
| Diğer | 500 | `{ "error": "internal_error", "detail": "..." }` |

---

## 4. İşlem 3: Assistant Next (Sihirbaz asistanı)

**Dosya:** `src/app/api/assistant/next/route.ts`

### Ne zaman Gemini çağrılır?

- Sihirbaz (CV/assistant) akışında bir sonraki adım/soru için `POST /api/assistant/next` çağrıldığında; gövdede `state` (sessionId, cv, filledKeys, history, allowedKeys, fieldRules vb.) gönderilir.

### İstek (Next.js → Gemini)

| Alan | Değer |
|------|--------|
| URL | Aynı `generateContent` URL’i |
| Body | `contents`: sistem + kullanıcı metni; `generationConfig`: `temperature: 0.4`, `topP: 0.9`, `maxOutputTokens: 800` |
| Timeout | Yok |

**System / User:** `buildSystemInstruction()` ve `buildUserPrompt(state)` ile üretilir; state’e göre izin verilen alanlar, kurallar ve geçmiş mesajlar gönderilir.

### Beklenen Gemini yanıtı (JSON)

Asistanın bir sonraki aksiyonu (ASK / CLARIFY / SAVE_AND_NEXT / FINISH), konuşma metni, cevap anahtarı, input tipi, örnekler vb. İçerik `validateReply()` ve `normalizeBySemantic()` ile doğrulanır/normalize edilir.

### API route çıkışı (client’a dönen)

```json
{
  "reply": {
    "speakText": "string",
    "displayText": "string",
    "answerKey": "string",
    "inputType": "text" | "textarea" | "number" | "date" | "select",
    "examples": [],
    "nextAction": "ASK" | "CLARIFY" | "SAVE_AND_NEXT" | "FINISH",
    "save": { "key": "...", "value": ... } | undefined,
    "progress": { "step", "total" } | undefined,
    ...
  }
}
```

### Hatalar

| Durum | HTTP | Body |
|--------|------|------|
| GEMINI_API_KEY_MISSING | 503 | `{ "error": "gemini_not_configured" }` |
| JSON_PARSE_FAILED / INVALID_REPLY | 400 | `{ "error": "assistant_bad_output", "detail": "..." }` |
| INVALID_STATE | 400 | `{ "error": "invalid_state", "detail": "..." }` |

---

## 5. Özet tablo

| İşlem | Route | Amaç | Gemini çağrısı | Timeout | Çıktı türü |
|--------|--------|------|----------------|---------|------------|
| Job Guide Chat | POST /api/job-guide/chat | Sohbet + 1 soru + rapor delta + checklist | Sadece chat modunda (bootstrap’ta yok) | 50 sn | JSON (message, question, answers_patch, report) |
| Job Guide Update | POST /api/job-guide/update | Nihai “Nasıl başvururum” raporu | Her çağrıda 1 kez | Yok | JSON (rapor şeması) |
| Assistant Next | POST /api/assistant/next | Sihirbaz bir sonraki adım/soru | Her çağrıda 1 kez | Yok | JSON (reply objesi) |

---

## 6. Ortak hata kodları (Gemini tarafı)

- **GEMINI_API_KEY_MISSING:** `GEMINI_API_KEY` env boş/eksik → 503, `gemini_not_configured`.
- **GEMINI_HTTP_{status}:** Gemini API HTTP hata kodu (örn. 429, 500) → ilgili route 500 veya 503 dönebilir.
- **GEMINI_EMPTY_RESPONSE:** `candidates[0].content.parts` boş veya metin yok → 500.
- **JSON_PARSE_FAILED:** Sadece chat route’ta; yanıt JSON’a parse edilemez → 500, `gemini_parse_failed`, event’e snippet yazılır.

Bu rapor, mevcut kod tabanına göre hazırlanmıştır; ek kullanım veya env değişikliği yapılırsa doküman güncellenmelidir.
