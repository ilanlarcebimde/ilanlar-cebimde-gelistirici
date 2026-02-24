# Sohbet Arayüzü — Akış Mantığı, Sorular ve Yanıtlama Sistemi (Güncel Rapor)

**Tarih:** 2026-02  
**Config sürümü:** `JOB_GUIDE_CONFIG_VERSION = "2026-02-25"`  
**İlgili dosyalar:** `src/data/jobGuideConfig.ts`, `src/app/api/job-guide/chat/route.ts`, `src/lib/job-guide/deterministicGuide.ts`, `src/app/premium/job-guide/[jobId]/JobGuideClient.tsx`

---

## 1. Genel Mimari

- **Soru üretimi:** Tamamen **config (QUESTION_FLOW)** tabanlı. LLM asla soru üretmez; sadece rehber metni / rapor patch üretebilir (opsiyonel).
- **Tek otorite:** Bir sonraki soru her zaman `getNextStep(answers, source, last_ask_id)` ile config’ten seçilir.
- **Kaynak:** İlanın `source_name` değerine göre **EURES** veya **GLASSDOOR** akışı kullanılır; yoksa GLASSDOOR.
- **State:** Tüm cevaplar `answers_json` (job_guides tablosu) içinde saklanır; her turda `mergedAnswers = answers_json + normalizeUserMessageToAnswers(message_text, last_ask_id)` ve gerekirse `expandServicesSelected` ile zenginleştirilir.

---

## 2. Akış Katmanları

### 2.1 Bootstrap (ilk yükleme)

- **Tetikleyici:** `mode === "bootstrap"` veya mesaj boş / `__start__`.
- **Davranış:**
  - `getBootstrapMessage(source)` ile selam + kaynak + “Hızlı Rehber sol panelde” + EURES/Glassdoor başvuru adımları + “Şimdi 1 kritik soruya geçiyorum.”
  - **İlk soru aynı yanıtta döner:** `getNextStep(mergedAnswers, sourceKey)` ile (genelde `service_pick`) `next_question` ve `assistant.ask` doldurulur.
- **Sonuç:** Kullanıcı sayfa açtığında hem hoş geldin metnini hem de ilk soruyu (7’li hizmet seçimi) görür; “Devam”a basmadan seçim yapabilir.

### 2.2 “Devam” ile başlangıç (isContinueStart)

- **Tetikleyici:** `message_text` boş veya `__continue__` **ve** `mergedAnswers` boş (henüz hiç cevap yok).
- **Davranış:** Yine bootstrap mesajı + ilk soru döndürülür; `greeting_shown: true` patch’lenir.
- **Not:** Bootstrap artık ilk soruyu verdiği için bu dal çoğu zaman boş answers ile tetiklenmez (ilk açılışta zaten soru gelir).

### 2.3 Normal chat turu

- Kullanıcı metin veya seçenek gönderir.
- **Cevap işleme:**
  - `normalizeUserMessageToAnswers(rawUserText, last_ask_id)` → `answerKey`’e yazılacak değer üretilir.
  - `last_ask_id === "service_pick"` ise `expandServicesSelected(mergedAnswers)` çağrılır; `services_selected` dizisi 7 adet `service_*` (Evet/Hayır) alanına dönüştürülür.
- **Sonraki adım:** `getNextStep(mergedAnswers, sourceKey, last_ask_id)`.
  - **null dönerse:** Tüm kritik sorular cevaplanmış kabul edilir; `generateFinalReport` çalışır, `report_json` / `report_md` güncellenir, yanıtta `next_question: null`, `next: { should_finalize: true }` döner; istemci rapor drawer’ını açar.
  - **Adım dönerse:** Asistan mesajı (deterministik veya opsiyonel LLM) + bu adım için `next_question` / `assistant.ask` döndürülür.

---

## 3. Soru Yapısı (FlowStep)

Her adım config’te şu alanlarla tanımlı:

| Alan | Açıklama |
|------|----------|
| `id` | Adım kimliği (örn. `service_pick`, `found_apply_section`). |
| `answerKey` | Cevabın yazılacağı `answers_json` anahtarı. |
| `text` | Kullanıcıya gösterilen soru metni. |
| `choices` | Buton/dropdown seçenekleri (varsa). |
| `input` | `multiselect` veya `textarea` (sadece `blocking_issue_text` için textarea). |
| `doneRule` | “Cevaplandı” kriteri: `notEmpty`, `minLength`, `minSelected` vb. |
| `showIf` | Koşul sağlanmazsa adım atlanır (örn. `found_apply_section === "Göremedim"` ise `apply_section_location`). |
| `checklistLabel` | Kontrol listesinde görünen kısa etiket. |

**DoneRule tipleri:**

- `notEmpty`: Değer dolu string (veya anlamlı var).
- `minLength`: Metin uzunluğu ≥ value (örn. blocking_issue_text için 3).
- `minSelected`: Dizi uzunluğu veya virgülle ayrılmış seçim sayısı ≥ value (örn. services_selected / proof_docs için 1).

**ShowIf:** `{ all: [ { answerKey, equals } | { answerKey, equalsAny } | … ] }` — tüm koşullar sağlanmalı.

---

## 4. EURES Akışı (sıralı adımlar)

| Sıra | id | answerKey | Soru / içerik | showIf | Giriş tipi |
|------|-----|-----------|----------------|--------|------------|
| 1 | service_pick | services_selected | Hangi konularda yardım istiyorsun? (Birden fazla seçebilirsin) | — | multiselect (7 hizmet) |
| 2 | found_apply_section | found_apply_section | İlan sayfasında “How to apply / Apply” bölümünü görüyor musunuz? | — | buttons (Gördüm / Göremedim / Emin değilim) |
| 3 | apply_method | apply_method | Bu ilanda başvuru yöntemi hangisi? | found_apply_section ∈ [Gördüm, Emin değilim] | buttons (Form/Portal, E-posta, Şirket sitesi, Emin değilim) |
| 4 | needs_eu_login | needs_eu_login | Başvuru için EU Login / EURES hesabı istiyor mu? | apply_method ∈ [Form/Portal, Emin değilim] | buttons (Evet / Hayır / Emin değilim) |
| 5 | has_passport | has_passport | Pasaportun var mı? | — | buttons |
| 6 | is_eu_eea_citizen | is_eu_eea_citizen | AB/AEA vatandaşı mısın? | — | buttons |
| 7 | cv_ready | cv_ready | Bu ilana özel CV’niz hazır mı? (tercihen PDF) | — | buttons |
| 8 | proof_docs | proof_docs | Mesleki yeterliliğini kanıtlamak için hangileri var? (Birden fazla seçebilirsin) | — | multiselect (PROOF_DOCS) |
| 9 | language_level | language_level | Dil seviyen hangi aralıkta? | — | buttons (A0 … C1+) |
| 10 | blocking_issue | blocking_issue | Başvuruyu şu an tıkayan bir sorun var mı? | — | buttons (Yok / Var (yazacağım)) |
| 11 | blocking_issue_text | blocking_issue_text | Kısaca yaz: Seni en çok ne tıkıyor? | blocking_issue === "Var (yazacağım)" | textarea |

---

## 5. GLASSDOOR Akışı (sıralı adımlar)

| Sıra | id | answerKey | Soru / içerik | showIf | Giriş tipi |
|------|-----|-----------|----------------|--------|------------|
| 1 | service_pick | services_selected | (EURES ile aynı) | — | multiselect |
| 2 | found_apply_section | found_apply_section | İlan sayfasında “Apply / Sign in to apply” alanını gördün mü? | — | buttons |
| 3 | apply_section_location | apply_section_location | Göremediysen: Apply alanı genelde nerede oluyor? | found_apply_section === "Göremedim" | buttons (Sağ tarafta / Alt bölümde / Yok) |
| 4 | has_glassdoor_account | has_glassdoor_account | Glassdoor hesabın var mı? | — | buttons |
| 5 | redirects_to_company_site | redirects_to_company_site | Başvur butonuna basınca şirket sitesine yönlendiriyor mu? | found_apply_section ∈ [Gördüm, Emin değilim] | buttons |
| 6 | has_passport | has_passport | Pasaportun var mı? | — | buttons |
| 7 | cv_ready | cv_ready | (EURES ile aynı) | — | buttons |
| 8 | proof_docs | proof_docs | (EURES ile aynı) | — | multiselect |
| 9 | language_level | language_level | (EURES ile aynı) | — | buttons |
| 10 | blocking_issue | blocking_issue | (EURES ile aynı) | — | buttons |
| 11 | blocking_issue_text | blocking_issue_text | (EURES ile aynı) | blocking_issue === "Var (yazacağım)" | textarea |

---

## 6. Seçenek Setleri (CHOICES / PROOF_DOCS / SERVICE_CHOICES)

- **Evet/Hayır/Emin değilim:** has_passport, is_eu_eea_citizen, cv_ready, needs_eu_login, has_glassdoor_account, redirects_to_company_site.
- **Gördüm / Göremedim / Emin değilim:** found_apply_section.
- **Apply konumu (Glassdoor):** Sağ tarafta, Alt bölümde, Yok.
- **Başvuru yöntemi (EURES):** Form/Portal, E-posta, Şirket sitesi, Emin değilim.
- **Dil seviyesi:** A0, A1–A2, B1, B2, C1+.
- **Engel:** Yok, Var (yazacağım).
- **PROOF_DOCS (çoklu):** Ustalık belgesi / MYK, Kalfalık belgesi, SGK hizmet dökümü, İş sözleşmesi / görev yazısı, Referans mektubu (usta/şef/amir), Sertifika (kurs/ehliyet/operatör vb.), Portföy (fotoğraf/video), Çıraklık / mesleki eğitim belgesi, Adli sicil kaydı (temiz) / iyi hal belgesi, Sağlık raporu / işe giriş raporu, Hiçbiri.
- **SERVICE_CHOICES (çoklu):** Adım adım başvuru rehberi, Gerekli belgeler listesi, Çalışma izni ve vize süreci, Net maaş ve yaşam gider hesabı, Risk değerlendirmesi, Sana özel uygunluk analizi, 1 haftalık başvuru planı.

---

## 7. Cevap Toplama ve Yazma

### 7.1 normalizeUserMessageToAnswers(text, last_ask_id)

- **Amaç:** Kullanıcının gönderdiği metni, `last_ask_id`’ye karşılık gelen adımın `answerKey`’ine uygun bir değere çevirir.
- **Mantık:**
  - `getStepById(last_ask_id)` ile adım alınır.
  - **textarea / text:** Metin doğrudan `answerKey`’e yazılır (minLength varsa kontrol edilir).
  - **multiselect:** Metin virgül/noktalı virgül vb. ile parse edilir; `choices` ile eşleşenler `answerKey`’e dizi olarak yazılır (örn. proof_docs, services_selected).
  - **buttons:** Metin, `choices` içinde tam veya kısmi eşleşmeyle bulunur; bulunan seçenek `answerKey`’e yazılır.
  - Özel alanlar: found_apply_section, has_passport, cv_ready, apply_method, language_level, blocking_issue, apply_section_location, proof_docs vb. için regex / sabit eşleme kuralları uygulanır.
- **Çıktı:** `Record<string, unknown>` patch; bu patch `answers_json` ile birleştirilerek `mergedAnswers` oluşturulur.

### 7.2 expandServicesSelected(answers)

- **Çağrı yeri:** `last_ask_id === "service_pick"` olduğu turda, `mergedAnswers` hesaplandıktan sonra.
- **Girdi:** `answers.services_selected` (string[]).
- **Çıktı:** 7 alan: service_apply_guide, service_documents, service_work_permit_visa, service_salary_life_calc, service_risk_assessment, service_fit_analysis, service_one_week_plan — her biri seçiliyse "Evet", değilse "Hayır".

---

## 8. Onay Mesajları (getConfirmationMessage)

- Her cevap sonrası kısa tek cümle (varsayım yok): örn. “Tamam, seçtiğin konulara göre rehberi hazırlıyorum.” (service_pick), “Güzel, başvuru alanını gördün.” (found_apply_section = Gördüm), “Tamam, pasaportun var. …” (has_passport = Evet), “Tamam. Aşağıya tıkayan sorunu yaz.” (blocking_issue = Var (yazacağım)), “Tamam, sorunu not ettim.” (blocking_issue_text).
- Bu metin, asistan balonunda cevap metninin üstüne eklenebilir (route’da `confirmationMsg` ile birleştirme).

---

## 9. Asistan Mesajı Üretimi

- **Varsayılan:** `useDeterministicGuide === true` → asistan metni **sadece** `buildDeterministicGuide(job, mergedAnswers, nextStep, source)` ile üretilir; LLM çağrılmaz.
- **buildDeterministicGuide:**
  - `greeting_shown` yoksa bir kez selam + kaynak cümlesi.
  - Varsa “Şu anki durum” + seçilen hizmetler + “Şu an netleşenler” (found_apply_section, has_passport, cv_ready, language_level, apply_method vb. en fazla 3 madde).
  - Sabit “Şimdi yapman gereken” listesi (EURES_STEPS / GLASSDOOR_STEPS).
  - Tekrar “Şu an netleşenler” özeti.
- **Opsiyonel LLM:** useDeterministicGuide false ise Gemini’den `assistant_message` + `report_patch` alınır; yine de `next_question` config’ten gelir, LLM’in önerdiği soru kullanılmaz.

---

## 10. Final Aşama (Tüm Sorular Cevaplanınca)

- `getNextStep(…) === null` → akış bitti.
- **Sunucu:** `generateFinalReport(jobContent, mergedAnswers, checklistSnapshot)` çağrılır; `report_json` ve `report_md` üretilir, `job_guides` güncellenir.
- **Yanıt:** `assistant_message`: “Tüm kritik bilgiler tamamlandı. Şu an netleşen yapılacaklar aşağıda.”; `next_question: null`; `report_json` / `report_md`; `next: { should_finalize: true }`.
- **İstemci:** `next.should_finalize === true` ise rapor drawer’ı otomatik açılır (`setReportDrawerOpen(true)`); yapılacaklar / rapor orada gösterilir.

---

## 11. Kontrol Listesi (Kontrol Listesi = Akış)

- **Kaynak:** Panelde (job + guide varken) liste artık **akış tabanlı**: `getChecklistFromFlow(guide.answers_json, sourceForFlow)` (`src/data/jobGuideConfig.ts`).
- **Mantık:** Aktif flow’daki her adım (showIf’e göre filtrelenmiş) için bir madde; `done` sadece `isStepAnswered(answers, step)` true ise true. Böylece sohbette sorulmayan hiçbir madde işaretli görünmez.
- **Fallback:** Flow checklist boş veya kullanılmıyorsa eski `buildChecklist(jobForChecklist, answers)` (checklistRules) kullanılır.

---

## 12. İstemci Tarafı (Özet)

- **Bootstrap:** Sayfa yüklenince `/api/job-guide/chat` mode=bootstrap ile çağrılır; gelen `next_question` / `assistant.ask` ilk soru olarak (7’li hizmet seçimi) render edilir.
- **Gönderim:** Kullanıcı buton (tek seçim), çoklu seçim “Devam”ı veya textarea “Gönder”i ile mesaj gönderir; `message_text` olarak gider (Devam butonu `__continue__` gönderir; arayüzde kullanıcı balonunda “Devam” gösterilir).
- **Yükleme:** Yanıt beklenirken “Cevaplanıyor…” küçük/italic gösterilir; sohbet listesine kalıcı mesaj olarak eklenmez.
- **Rapor:** `next.should_finalize === true` gelince rapor drawer’ı açılır; içerik `report_json` / ReportViewer ile sunulur.

---

## 13. Özet Tablo: Veri Akışı

| Aşama | Girdi | İşlem | Çıktı |
|-------|--------|--------|--------|
| Bootstrap | mode=bootstrap, answers_json | getNextStep(answers, source) → ilk adım | Bootstrap metni + ilk soru (service_pick) |
| Chat turu | message_text, last_ask_id, answers_json | normalizeUserMessageToAnswers; service_pick ise expandServicesSelected; getNextStep(merged, source, last_ask_id) | mergedAnswers, nextStep veya null |
| Cevap yazma | rawUserText, last_ask_id, step | choice / multiselect / textarea eşlemesi | answers_json patch (answerKey → value) |
| Sonraki soru | mergedAnswers, source, last_ask_id | showIf + isStepAnswered; no-repeat (last_ask_id === next → getNextStepAfter) | next_question / assistant.ask |
| Bitiş | nextStep === null | generateFinalReport; DB güncelle | report_json, report_md, should_finalize: true |
| Kontrol listesi | guide.answers_json, source | getChecklistFromFlow | ChecklistModule[] (her adım = bir madde, done = cevaplandı mı) |

Bu rapor, sohbet arayüzünün güncel akış mantığını, soru setlerini ve yanıtlama sistemini tek referans dokümanda toplar.
