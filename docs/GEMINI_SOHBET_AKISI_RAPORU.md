# Gemini Sohbet Akışı — Başvuru Paneli Raporu

Bu dokümanda Başvuru Paneli (Job Guide) sohbet akışının en güncel mimarisi özetlenir: API, deterministik soru akışı, RAG/grounding, prompt yapısı ve yanıt şeması.

---

## 1. API ve Girdi

**Endpoint:** `POST /api/job-guide/chat`

**Auth:** `Authorization: Bearer <Supabase access_token>`

**Body (JSON):**

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `jobGuideId` | string | Evet | Rehber kaydı ID |
| `jobPostId` | string | Evet | İlan kaydı ID |
| `mode` | `"bootstrap"` \| `"chat"` | Hayır | bootstrap = ilk açılış, chat = kullanıcı mesajı sonrası |
| `message_text` / `user_message` | string | Hayır | Kullanıcının son mesajı |
| `last_ask_id` | string | Hayır | Az önce sorulan sorunun step id’si (örn. `cv_status`) |
| `answers_json` | object | Hayır | Mevcut cevaplar (answerKey → değer) |
| `chat_history` | array | Hayır | Kullanımda değil; ileride context için |
| `wants_live_visa` | boolean | Hayır | true ise vize için canlı kaynak çekilir |
| `wants_live_salary` | boolean | Hayır | true ise maaş için canlı kaynak çekilir |

**Akış kararı:**

- `mode === "bootstrap"` veya `user_message === "__start__"` veya boş mesaj → **Bootstrap** (Gemini çağrılmaz).
- Aksi halde mesaj varsa → **Chat** (Gemini + RAG).

---

## 2. Bootstrap Akışı (Gemini yok)

1. `job_guides` ve `job_posts` doğrulanır; ülke `channels.slug` + `location_text` ile çıkarılır.
2. `jobContent` (başlık, pozisyon, konum, ülke, kaynak, özet) hazırlanır.
3. **Hızlı Rehber** kaynağa göre deterministik seçilir: `QUICK_GUIDE_TEMPLATES.GLASSDOOR` / `EURES` / default (`jobGuideConfig.ts`).
4. **Sıradaki soru** config’ten alınır: `getNextStep(mergedAnswers, sourceKey)` → ilk cevaplanmamış step; `getQuestionTextAndChoices(step)` ile metin + choices/input.
5. Yanıt: `assistant_message` = Hızlı Rehber metni, `next_question` = ilk soru, `answers_json`, `checklist_snapshot`, `report_json` (mevcut), `next: { should_finalize: false }`.

---

## 3. Chat Akışı (Gemini + RAG)

### 3.1 Ön işlemler

- **Cevap birleştirme:** `mergedAnswers = { ...answers_json, ...normalizeUserMessageToAnswers(rawUserText, last_ask_id) }`. Kullanıcı metni seçenek/textarea/multiselect’e göre ilgili `answerKey`’e yazılır.
- **Sıradaki adım:** `nextStep = getNextStep(mergedAnswers, sourceKey)`. `null` ise tüm sorular bitmiş kabul edilir; “Tüm sorular tamamlandı…” mesajı ve `next: { should_finalize: true }` dönülür, Gemini çağrılmaz.
- **currentStepId:** Bir sonraki sorunun id’si (örn. `passport_status`, `cv_status`). Bu id Gemini’ye “şu an odaklanılacak soru” olarak gider.

### 3.2 RAG / Grounding (context toplama)

**İlan sayfası metni**

- `jobPost.source_url` varsa: `fetchUrlToPlainText(source_url)` ile sayfa çekilir, HTML’den düz metin çıkarılır (~15K karakter).
- Sonuç `groundingContext`’in ilk parçasına eklenir.

**Vize canlı kaynak**

- **wantsVisa:** `wants_live_visa === true` veya `currentStepId` vize/pasaport ile ilgili (örn. `visa_need_clarity`, `passport_status`).
- wantsVisa + country varsa:
  1. **Supabase yolu:** `getCountrySources(country, "visa", 2)` → `country_sources` tablosundan URL’ler. Her URL için `fetchExternalWithCache({ kind: "visa", purpose: "visa", ... })` → domain `external_whitelist_domains`’te olmalı; cache hit/miss, fetch, `external_cache`’e yazma.
  2. En az bir başarılı sonuç varsa `liveItems`’a eklenir; ilk başarılı metin `visaContextBlock` ve `visaSourceForReport` (kaynak + tarih) için kullanılır.
  3. Hiç başarılı sonuç yoksa: `getVisaContextForCountry(country)` (in-memory fallback, `jobGuideGrounding.ts`). O da yoksa `visaContextError` set edilir; prompt’a “resmi veri alınamadı” notu gider.

**Maaş canlı kaynak**

- `wants_live_salary === true` ve country varsa: `getCountrySources(country, "salary", 1)` + `fetchExternalWithCache` (TTL 7 gün). Sonuçlar `liveItems`’a eklenir.

**groundingContext birleşimi**

- İlan sayfası metni (varsa)
- Vize özeti (Supabase veya in-memory; kaynak + tarih)
- Vize çekilemediyse: “Resmî vize verisi bu oturumda alınamadı (…); resmi veri alınamadı notu ekle” uyarısı

### 3.3 Prompt üretimi

- **System:** `buildGeminiSystemPrompt()` (`src/lib/job-guide/prompts.ts`). Kurallar: sadece verilen context, “araştırın” yasak, 4–8 satır rehber + tek soru (sunucu asıl soruyu belirler), CV paket + CV79, mesleki kanıtlar, vize/maaş/1 haftalık plan, çıktı sadece JSON.
- **User:** `buildGeminiUserPrompt({ jobPost, answersJson: mergedAnswers, messageText: rawUserText, currentStepId, jobContent, groundingContext, live: liveItems, cvUpsellUrl, cvDiscountCode: "CV79" })`. İçerik: JOB_POST, CURRENT_STEP_ID, ANSWERS_JSON, USER_MESSAGE, GROUNDING_CONTEXT, LIVE_CONTEXT (bloklar veya BLOCKED), BUSINESS (CV URL + CV79).

### 3.4 Gemini çağrısı ve parse

- **Çağrı:** `callGeminiJson({ system, user: userPrompt, timeoutMs: 25000, maxOutputTokens: 1600 })` (`src/lib/ai/gemini.ts`).
- **Parse:** `extractJsonStrict<ParsedShape>(rawText)`. Beklenen alanlar: `assistant_message`, `next_question`, `report_patch` (notes, source_guide, documents, visa_work, salary, one_week_plan), `flags` (should_offer_cv_package, needs_official_source, final_ready).
- Parse hata verirse: fallback mesaj + sunucunun belirlediği `next_question` (currentStepId) dönülür; `job_guide_events`’e error yazılır.

### 3.5 Yanıt sonrası işlemler

- **Mesaj:** `extractAssistantMessage(parsed, rawText)`. Boşsa “Kısa bir yanıt geldi; devam edelim.”
- **Yasak ifade:** `redactForbiddenPhrases(assistantMessage)` (“araştırın”, “google’layın”, “kaynaklara bakın” vb.) → temizlenmiş metin kullanılır.
- **CV “hazır değil”:** `last_ask_id === "cv_status"` ve `cv_status === "Hazır değil"` ve (madde listesi yok veya “dikkat edin” ile bitiyorsa) → sunucu tarafı 4 maddelik varsayılan CV rehberi ekler.
- **CV paketi CTA:** `cv_status === "Hazır değil"` ve (`cv_status` veya `cv_offer_if_missing` az önce sorulduysa) → mesaja CV paketi linki + “Sizin için indirim kodu: CV79” eklenir.
- **Onay cümlesi:** `last_ask_id` + cevap varsa `getConfirmationMessage(last_ask_id, lastAnswerValue)` ile tek cümle eklenir (örn. “Tamam, pasaportun var…”).

### 3.6 Rapor birleştirme (report_patch → reportJson)

- `reportJson = mapGeminiReportToOur(reportFromGemini)` (mevcut full report yapısından legacy alanlar).
- `parsed.report_patch` varsa:
  - `notes` → reportJson.notes’a eklenir.
  - `source_guide`, `documents`, `salary`, `one_week_plan` → reportJson’a aynen yazılır.
  - `visa_work` → steps, source, dateFetched, note/warning normalize edilir; backend’in çektiği kaynak varsa `visaSourceForReport` ile source/dateFetched doldurulur.
- Resmî vize verisi hiç yoksa: `visa_work = { steps: [], source: "", dateFetched: "", note: "Resmî veri alınamadı" }`.
- Rapor metni: `visa_work`’ten `vize_izin` string’i üretilir; `buildReportMd(reportJson, reportFromGemini)` güncel reportJson (one_week_plan dahil) ile çağrılır.

### 3.7 DB ve yanıt

- `job_guides`: `answers_json`, `report_json`, `report_md`, `updated_at`, `status: "in_progress"`, isteğe bağlı `score`, `risk_level`.
- `job_guide_events`: kullanıcı mesajı (varsa), ardından asistan mesajı + next_question payload.
- **next_question:** Her zaman sunucudan: `getQuestionTextAndChoices(nextStep)` (deterministik; Gemini’nin next_question’ı akışı yönetmez).
- **flags:** `grounded: true`, `live_sources_used: liveItems.length > 0`, `needs_official_source: !!visaContextError`, `should_offer_cv_package`, `final_ready` (parsed.flags’ten veya CTA kuralından).

---

## 4. Deterministik Soru Akışı (Config)

**Dosya:** `src/data/jobGuideConfig.ts` (QUESTION_FLOW, COMMON + kaynak varyantları)

**Kurallar:**

- **answerKey doluysa** o soru bir daha gösterilmez.
- **showIf** koşulu tutmuyorsa adım atlanır (örn. `visible_headings_text` sadece `found_apply_section === "Göremedim"` ve henüz cevap yokken).
- **İlk cevaplanmamış** adım sıradaki soru olur.

**Örnek adımlar (COMMON):** opened_source_page → found_apply_section → (gerekirse visible_headings_text) → apply_method → passport_status → (gerekirse passport_followup_if_applied) → cv_status → (gerekirse cv_offer_if_missing) → qualification_proof_bundle → … → finalize_and_week_plan.

**Progress:** `getProgressFromConfig(answers, sourceKey)` → total, done, pct (checklist ve ilerleme yüzdesi).

---

## 5. Dosya Referansları

| Bileşen | Dosya |
|--------|--------|
| Chat API | `src/app/api/job-guide/chat/route.ts` |
| Soru akışı config | `src/data/jobGuideConfig.ts` |
| Checklist / progress | `src/lib/checklistRules.ts` |
| Prompt (system + user) | `src/lib/job-guide/prompts.ts` |
| Gemini (callGeminiJson, extractJsonStrict, redactForbiddenPhrases) | `src/lib/ai/gemini.ts` |
| İlan sayfası + in-memory vize | `src/lib/jobGuideGrounding.ts` |
| Supabase cache + whitelist fetch | `src/lib/external/fetchWithCache.ts` |
| Ülke kaynakları (visa/salary) | `src/lib/external/sources.ts` |
| Cache/whitelist tabloları | `supabase/migrations/028_external_cache_whitelist.sql` |
| Örnek seed | `supabase/migrations/029_external_whitelist_seed_example.sql` |

---

## 6. Özet Diyagram

```
[Client] POST /api/job-guide/chat { jobGuideId, jobPostId, mode, message_text, last_ask_id, answers_json, wants_live_visa?, wants_live_salary? }
    │
    ▼
[Auth] Bearer token → job_guides + job_posts okunur, country infer edilir
    │
    ├─ mode=bootstrap veya boş mesaj
    │      → Hızlı Rehber (config) + getNextStep() → next_question
    │      → 200 { assistant_message, next_question, checklist_snapshot, report_json, ... }
    │
    └─ Chat
           → mergedAnswers = answers_json + normalizeUserMessageToAnswers(...)
           → getNextStep() === null → "Tüm sorular tamamlandı", should_finalize: true
           │
           → RAG: fetchUrlToPlainText(source_url)  [ilan sayfası]
           → wantsVisa: getCountrySources(country,"visa",2) + fetchExternalWithCache (veya getVisaContextForCountry)
           → wants_live_salary: getCountrySources(country,"salary",1) + fetchExternalWithCache
           → groundingContext + liveItems
           │
           → buildGeminiSystemPrompt() + buildGeminiUserPrompt(...)
           → callGeminiJson() → extractJsonStrict()
           → redactForbiddenPhrases(assistant_message)
           → CV fallback (madde listesi) + CV CTA (link + CV79) + confirmationMsg
           → report_patch → reportJson (visa_work, source_guide, documents, salary, one_week_plan, vize_izin, report_md)
           → job_guides update, job_guide_events insert
           │
           → next_question = getQuestionTextAndChoices(nextStep)  [sunucu deterministik]
           → 200 { assistant_message, next_question, report_json, report_md, checklist_snapshot, answers_json, assistant, state_patch, next, flags }
```

---

*Son güncelleme: Bu rapor mevcut kod tabanına (Gemini sohbet akışı, RAG, Supabase cache/whitelist, CV79, 1 haftalık plan, flags) göre yazılmıştır.*
