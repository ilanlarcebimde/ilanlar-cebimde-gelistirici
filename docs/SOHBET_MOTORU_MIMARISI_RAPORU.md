# Sohbet Motoru Mimarisi — Teknik Rapor (Cursor Talimatı)

Bu dokümanda Başvuru Paneli sohbet motorunun **mevcut durumu** ve **hedeflenen deterministik mimari** net cevaplarla yazılmıştır. Cursor’a verilecek talimatlar en sonda özetlenmiştir.

---

## 1. Sohbet Motoru Mimarisi — Soruların Kaynağı

### Soruları kim üretiyor?

**Cevap: Server’daki QUESTION_FLOW (config).**

- Sorular **Gemini’den gelmiyor**. `next_question` değeri API’de **her zaman** `getNextStep(mergedAnswers, sourceKey)` ile config’ten alınır.
- Gemini’nin döndüğü `next_question` alanı **kullanılmıyor** (ignore edilir).
- Kod: `src/app/api/job-guide/chat/route.ts` — Chat dalında `nextStep = getNextStep(...)`, `nextQuestionPayload = getQuestionTextAndChoices(nextStep)`; response’taki `next_question` bu payload’dur.

### “Serbest metin input” ne zaman açılıyor?

**Mevcut durum (problem):**

1. **blocking_issue === "Var (yazacağım)"** → `blocking_issue_text` adımı: **textarea** (serbest metin). ✅ İstenen tek yer burası olmalı.
2. **GLASSDOOR, found_apply_section === "Göremedim"** → `screen_headings` adımı: **textarea** (“Göremediyseniz ekranda hangi başlıkları görüyorsunuz? … Yazın lütfen.”). ❌ Bu serbest metin **kaldırılmalı**; yerine 3 sabit seçenek gelmeli: **"Sağ tarafta"**, **"Alt bölümde"**, **"Yok"**.

Yani şu an serbest metin **iki yerde** açılıyor; hedeflenen mimaride **sadece** `blocking_issue == "Var (yazacağım)"` için açılmalı.

### next_question nasıl belirleniyor?

- **next_question** = `getNextStep(answers, source)` ile bulunan ilk cevaplanmamış step’in `id`, `text`, `choices`, `input` bilgisi.
- **Soru seçimi LLM’den gelmiyor**; tamamen config (QUESTION_FLOW) + `showIf` + `doneRule` ile deterministik.

### Soru üretimi LLM’den mi, config’ten mi?

**Config’ten.** LLM sadece `assistant_message` (açıklama/rehber metni) ve `report_patch` üretir; soru metni ve sırası config’e aittir.

---

## 2. answers_json Yapısı (Gerçek Alan Adları)

Kaynak: `src/data/jobGuideConfig.ts` — her step’in `answerKey` alanı.

### EURES akışı

| answerKey | Açıklama | Seçenekler / tip |
|-----------|----------|-------------------|
| `found_apply_section` | Başvuru bölümü görüldü mü | Gördüm, Göremedim, Emin değilim |
| `apply_method` | Başvuru yöntemi | Form/Portal, E-posta, Şirket sitesi, Emin değilim |
| `needs_eu_login` | EU Login / EURES hesabı gerekli mi | Evet, Hayır, Emin değilim |
| `has_passport` | Pasaport var mı | Evet, Hayır, Emin değilim |
| `is_eu_eea_citizen` | AB/AEA vatandaşı mı | Evet, Hayır, Emin değilim |
| `cv_ready` | CV hazır mı | Evet, Hayır, Emin değilim |
| `proof_docs` | Mesleki kanıtlar (çoklu seçim) | Ustalık belgesi / MYK, Kalfalık, SGK hizmet dökümü, Sertifika, Referans mektubu, Portföy, Hiçbiri |
| `language_level` | Dil seviyesi | A0, A1–A2, B1, B2, C1+ |
| `blocking_issue` | Tıkayan sorun var mı | Yok, Var (yazacağım) |
| `blocking_issue_text` | Engel detayı (sadece Var ise) | Serbest metin (textarea) |

### GLASSDOOR akışı

| answerKey | Açıklama | Seçenekler / tip |
|-----------|----------|-------------------|
| `found_apply_section` | Apply alanı görüldü mü | Gördüm, Göremedim, Emin değilim |
| `screen_headings` | Apply nerede (Göremedim ise) | **Şu an:** textarea. **Hedef:** Sağ tarafta / Alt bölümde / Yok (3 buton) |
| `has_glassdoor_account` | Platformda hesap var mı | Evet, Hayır, Emin değilim |
| `redirects_to_company_site` | Başvuru şirket sitesine mi yönlendiriyor | Evet, Hayır, Emin değilim |
| `has_passport` | Pasaport var mı | Evet, Hayır, Emin değilim |
| `cv_ready` | CV hazır mı | Evet, Hayır, Emin değilim |
| `proof_docs` | Mesleki kanıtlar (çoklu) | Aynı liste |
| `language_level` | Dil seviyesi | A0, A1–A2, B1, B2, C1+ |
| `blocking_issue` | Tıkayan sorun var mı | Yok, Var (yazacağım) |
| `blocking_issue_text` | Engel detayı (sadece Var ise) | Serbest metin (textarea) |

### Örnek answers_json (minimal)

```json
{
  "found_apply_section": "Gördüm",
  "apply_method": "Form/Portal",
  "needs_eu_login": "Hayır",
  "has_passport": "Evet",
  "is_eu_eea_citizen": "Hayır",
  "cv_ready": "Hayır",
  "proof_docs": ["Ustalık belgesi / MYK"],
  "language_level": "B1",
  "blocking_issue": "Yok"
}
```

Serbest metin **sadece** `blocking_issue === "Var (yazacağım)"` iken `blocking_issue_text` dolar.

---

## 3. nextQuestion Mantığı (Config Tabanlı)

### Soru seçimi nasıl yapılıyor?

- **Fonksiyon:** `getNextStep(answers, source)` (`src/data/jobGuideConfig.ts`).
- **Mantık:**
  1. `getActiveFlowSteps(source)` → EURES veya GLASSDOOR dizisi (sıra sabit).
  2. Dizide **ilk** cevaplanmamış step seçilir.
  3. Bir step’in “cevaplanmamış” sayılması: `showIf` koşulu tutuyorsa ve `isStepAnswered(answers, step)` false ise.
  4. `isStepAnswered`: `answerKey` değeri dolu mu veya `doneRule` sağlanıyor mu (notEmpty, minLength, minSelected vb.).

### priority / when

- Config’te **priority** alanı yok; sıra tamamen dizideki **sıraya** göre (EURES/GLASSDOOR array order).
- **when** karşılığı: `showIf: { all: [ ... ] }`. Koşullar: `equals`, `equalsAny`, `isEmpty`, `includes`. Hepsi tutunca step “aktif” kabul edilir; biri tutmazsa step atlanır.

### İstenen formül (zaten uyumlu)

```
pickNextQuestion(flow, answers) {
  return flow
    .filter(q => evaluateWhen(q.showIf, answers))   // showIf
    .find(q => !isStepAnswered(answers, q))        // doneRule
}
```

Mevcut kod buna eşdeğer: `getNextStep` döngüde önce `showIf` sonra `isStepAnswered` kontrol ediyor; **LLM soru seçmiyor**.

### No-repeat

- Aynı turda `nextStep.id === last_ask_id` ise `getNextStepAfter(answers, source, last_ask_id)` ile bir sonraki cevaplanmamış step’e geçilir (aynı soru tekrar dönmez).

---

## 4. UI Davranışı

### “Hızlı Rehber” kaç kere gösteriliyor?

- **Bootstrap’ta:** Sadece **bir kez**. İlk açılışta `quick_guide_text` doldurulur ve **panelde** (Hızlı Rehber / Gizle) gösterilir.
- **Sohbet balonunda:** Uzun rehber metni **yazılmıyor**; ilk mesaj kısa: “Merhaba. Hızlı Rehber yukarıdaki panelde. Devam etmek için aşağıdaki butona tıklayın.”
- Her cevapta rehber **tekrarlanmıyor**; panel içeriği aynı kalır.

### Promo (CV79) kaç kere gösteriliyor?

- **Mevcut:** `cv_ready === "Hayır"` (veya `cv_status === "Hazır değil"`) ve son sorulan step `cv_ready` / `cv_status` / `cv_offer_if_missing` ise, o turda assistant mesajına CV linki + “İndirim kodu: CV79” ekleniyor.
- **promo_shown** benzeri bir flag yok; aynı oturumda başka sorularda da tekrar gösterilebilir. İstenen: **en fazla bir kez** (örn. `promo_shown` veya benzeri ile kilitleme).

### “Rapor hazırlanıyor” / “Yapılacaklar hazırlanıyor” metni

- **Mevcut:** Tüm sorular bittiğinde rapor üretilemediyse veya kısa gelirse:  
  `"Tüm sorular tamamlandı. Yapılacaklar hazırlanıyor; sayfayı yenileyebilir veya birkaç saniye sonra tekrar bakabilirsin."`
- **İstenen:** Bu ifade **kaldırılacak**. Bitirme mesajı sadece “Tüm sorular tamamlandı. Şu an netleşen yapılacaklar aşağıda.” (rapor varsa) veya benzeri sabit, kısa bir metin olmalı; “hazırlanıyor” vurgusu olmamalı.

---

## 5. LLM Prompt (Gemini)

### System prompt (özet)

- **Dosya:** `src/lib/job-guide/prompts.ts` → `buildGeminiSystemPrompt()`.
- **Ana kurallar:**
  - Sadece verilen CONTEXT ile konuş; context dışı bilgi üretme.
  - “Araştırın / kontrol edin” deme; veri yoksa “Resmi kaynak verisi alınamadı” de.
  - **SORU ÜRETME**; `next_question` sunucu tarafından yok sayılır; LLM sadece `assistant_message` ve `report_patch` yazar.
  - 4–8 satır kısa rehber; varsayım yapma (pasaport/“harika” vb.).
  - Çıktı **sadece JSON** (assistant_message, report_patch, flags).

### Tools / Grounding

- **Tools:** Yok. Gemini’ye tool call verilmiyor.
- **Grounding:** Evet. Backend ilan sayfası + vize/maaş için whitelist/cache’li fetch yapıyor; bu metin `groundingContext` ve `live` blokları olarak user prompt’a ekleniyor. LLM “sadece bu context’e dayan” talimatı alıyor.

### Sorun özeti (mevcut)

- Prompt’ta “soru üretme” ve “next_question sunucu belirler” yazıyor; pratikte de **soru config’ten** geliyor. Asıl UI problemi: **serbest metnin iki yerde açılması** (özellikle `screen_headings` textarea) ve yönlendirmenin dağınık görünmesi. Ayrıca “Yapılacaklar hazırlanıyor” ifadesi ve promo’nun tekrarlanması istenmiyor.

---

## 6. Hedeflenen 3 Katmanlı Mimari

### 1) STATE LAYER (Server)

- **answers_json** — yukarıdaki answerKey’ler.
- **checklist** — ilerleme (config’teki step’lere göre).
- **next_question** — yalnızca QUESTION_FLOW’dan.
- **promo_shown** (veya eşdeğer) — CV79’un bir kez gösterilmesi.
- **country**, **source** — ilan/kanal bilgisi.

### 2) QUESTION ENGINE (Deterministik)

- Soru seçimi **sadece** config’ten: `getNextStep(flow, answers)` (showIf + doneRule).
- LLM **hiçbir zaman** soru metni veya sırası üretmez.

### 3) LLM (Sadece Açıklama)

- “Pasaport yok dedi → ülkeye özel mini rehber üret” gibi **açıklama / rehber metni**.
- Soru sormaz; plan (one_week_plan) **en sonda**, tüm kritik alanlar dolduktan sonra otomatik üretilir.

---

## 7. Cursor’a Verilecek Net Talimat (Kopyala-Yapıştır)

1. **Soru üretimi LLM’den tamamen kaldırılacak.**  
   `next_question` yalnızca QUESTION_FLOW config’ten seçilecek (zaten öyle; kontrol edilsin).

2. **LLM yalnızca açıklama ve ülkeye özel rehber üretecek.**  
   Sistem prompt ve response işleme buna göre doğrulansın.

3. **Serbest metin input sadece `blocking_issue === "Var (yazacağım)"` durumunda açılacak.**  
   - `blocking_issue_text` dışında **hiçbir** step’te textarea/ serbest metin olmayacak.
   - **GLASSDOOR:** `screen_headings` step’i textarea yerine **3 seçenek** olacak: **"Sağ tarafta"**, **"Alt bölümde"**, **"Yok"** (answerKey istenirse `apply_section_location` veya `screen_headings` kalabilir; değerler bu üçünden biri).

4. **Hızlı Rehber yalnızca bootstrap aşamasında gösterilecek, tekrar etmeyecek.**  
   Sohbet balonunda uzun rehber metni yazılmayacak (şu an kısa mesaj var; aynı kalsın).

5. **"Rapor hazırlanıyor" / "Yapılacaklar hazırlanıyor" ifadesi kaldırılacak.**  
   Tüm sorular bittiğinde sadece sabit, kısa bitiş mesajı (ör. “Tüm sorular tamamlandı. Şu an netleşen yapılacaklar aşağıda.”) kullanılacak.

6. **Plan yalnızca tüm kritik alanlar dolduktan sonra otomatik üretilecek.**  
   `nextStep === null` iken `generateFinalReport` çağrılıyor; bu davranış korunacak.

7. **(Öneri) Promo CV79 en fazla bir kez gösterilsin.**  
   `promo_shown` veya benzeri bir flag (state/DB) ile ilk gösterimden sonra aynı oturumda tekrarlanmasın.

---

## 8. Dosya Referansları

| Konu | Dosya |
|------|--------|
| Soru config (EURES/GLASSDOOR) | `src/data/jobGuideConfig.ts` |
| next_question seçimi | `getNextStep`, `getNextStepAfter` aynı dosyada |
| Chat API, cevap birleştirme, Gemini çağrısı | `src/app/api/job-guide/chat/route.ts` |
| Gemini system/user prompt | `src/lib/job-guide/prompts.ts` |
| RAG / grounding | `src/lib/external/fetchWithCache.ts`, `sources.ts`; chat route içinde groundingContext |
| Final rapor | `src/lib/job-guide/generateReport.ts` |

Bu rapor, mevcut mimariyi ve Cursor’a verilecek talimatları tek yerde toplar; yukarıdaki maddelere göre değişiklik yapıldığında sistem deterministik, minimum serbest metin ve net yönlendirme hedefine uyumlu olur.
