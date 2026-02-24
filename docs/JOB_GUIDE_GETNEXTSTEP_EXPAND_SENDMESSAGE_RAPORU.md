# getNextStep(), expandServicesSelected() ve Client sendMessage() payload raporu

Bu dokümanda Job Guide akışındaki **getNextStep()**, **expandServicesSelected()** implementasyonları ile **client tarafında sendMessage(...) payload şekli** özetlenir.

---

## 1. getNextStep()

**Dosya:** `src/data/jobGuideConfig.ts`

### İmza

```ts
function getNextStep(
  answers: Record<string, unknown>,
  source: "eures" | "glassdoor" | "default",
  lastAskId?: string | null
): FlowStep | null
```

### Davranış

- **Akış kaynağı:** `source` ile `getActiveFlowSteps(source)` çağrılır; EURES için `QUESTION_FLOW.EURES`, diğerleri için `QUESTION_FLOW.GLASSDOOR` kullanılır.
- **services_locked:** `answers.services_locked === true` ise **service_pick** adımı atlanır (bir kez geçildikten sonra tekrar dönülmez).
- **Döngü:** Akıştaki adımlar sırayla taranır:
  1. `showIf` varsa ve koşul sağlanmıyorsa adım atlanır.
  2. `step.id === "service_pick"` ve `servicesLocked` ise adım atlanır.
  3. `isStepAnswered(answers, step)` true ise adım atlanır.
  4. İlk cevaplanmamış adım `next` olarak alınır ve döngüden çıkılır.
- **No-repeat:** `lastAskId` verilmişse ve bulunan adımın `id`’si `lastAskId` ile aynıysa, bir sonraki cevaplanmamış adımı döndürmek için `getNextStepAfter(answers, source, lastAskId)` çağrılır.
- **Sonuç:** Hiç cevaplanmamış adım yoksa `null` döner (akış bitti).

### isStepAnswered

- `answers[step.answerKey]` alınır.
- Dizi ise: `length > 0` ise cevaplanmış.
- String/başka tip ise: boş değilse veya `doneRule` sağlanıyorsa cevaplanmış.
- `doneRule` tipleri: `equals`, `equalsAny`, `minLength`, `notEmpty`, `minSelected` (minSelected için dizi length veya virgülle ayrılmış string parça sayısı kullanılır).

### getNextStepAfter

- `afterStepId`’den sonra gelen ilk adımı bulur; `showIf` ve `isStepAnswered` aynı kurallarla uygulanır.

---

## 2. expandServicesSelected()

**Dosya:** `src/data/jobGuideConfig.ts`

### İmza

```ts
function expandServicesSelected(answers: Record<string, unknown>): Record<string, string>
```

### Girdi: `answers.services_selected`

- **Dizi:** `string[]` (ID veya label). Her eleman trim edilir, boşlar atılır.
- **String:** Virgül/noktalı virgül/pipe ile ayrılmış metin parse edilir, parçalar trim edilir.

### Çıktı: 7 alan (hepsi `"Evet"` | `"Hayır"`)

| Alan | ID eşleşmesi | Label eşleşmesi |
|------|----------------|------------------|
| `service_apply_guide` | `apply_guide` | "Adım adım başvuru rehberi" |
| `service_documents` | `docs_list` | "Gerekli belgeler listesi" |
| `service_work_permit_visa` | `work_permit_visa` | "Çalışma izni ve vize süreci" |
| `service_salary_life_calc` | `salary_life_calc` | "Net maaş ve yaşam gider hesabı" |
| `service_risk_assessment` | `risk_assessment` | "Risk değerlendirmesi" |
| `service_fit_analysis` | `fit_analysis` | "Sana özel uygunluk analizi" |
| `service_one_week_plan` | `one_week_plan` | "7 günlük başvuru planı" veya "1 haftalık başvuru planı" |

Her biri için set içinde hem ID hem label kontrol edilir; eşleşme varsa `"Evet"`, yoksa `"Hayır"` atanır.

### Sabitler

- **SERVICE_CHOICE_IDS:** `["apply_guide", "docs_list", "work_permit_visa", "salary_life_calc", "risk_assessment", "fit_analysis", "one_week_plan"]`
- **SERVICE_CHOICES:** Yukarıdaki ID’lere karşılık gelen Türkçe label’lar (sıra aynı).

---

## 3. Client sendMessage(...) payload şekli

**Dosya:** `src/app/premium/job-guide/[jobId]/JobGuideClient.tsx`

### Çağrı biçimleri

`sendMessage` iki şekilde çağrılır:

1. **Sadece metin (tek seçenek / serbest metin / Devam):**
   ```ts
   sendMessage(text: string)
   ```
   Örnekler: `sendMessage("Gördüm")`, `sendMessage("__continue__")`, `sendMessage(inputText)`.

2. **Yapılandırılmış cevap (answers_patch ile):**
   ```ts
   sendMessage({ message?: string; answers_patch?: Record<string, unknown> })
   ```
   Örnek: service_pick çoklu seçimde  
   `sendMessage({ message: "__answers__", answers_patch: { services_selected: ids } })`.

### API’ye giden body (POST /api/job-guide/chat)

Her iki çağrı türünde de aşağıdaki obje oluşturulur; `answers_patch` varsa eklenir:

```ts
const body = {
  jobGuideId: string,      // guide.id
  jobPostId: string,       // job.id
  mode: "chat",
  message_text: string,    // trimlenmiş metin; payload kullanıldığında "__answers__" veya payload.message
  last_ask_id: string | undefined,  // lastAskId state
  answers_json: object,    // guide.answers_json (mevcut cevaplar)
  chat_history: Array<{ role: "user"|"assistant"; text: string }>,
  answers_patch?: Record<string, unknown>  // varsa; örn. { services_selected: string[] }
};
```

### Örnek payload’lar

| Senaryo | sendMessage argümanı | body.message_text | body.answers_patch |
|--------|----------------------|-------------------|---------------------|
| Tek seçenek (örn. “Gördüm”) | `"Gördüm"` | `"Gördüm"` | yok |
| Serbest metin (input/textarea) | `"pasaportum var"` | `"pasaportum var"` | yok |
| Devam (cevapsız) | `"__continue__"` | `"__continue__"` | yok |
| Hizmet çoklu seçim (Devam) | `{ message: "__answers__", answers_patch: { services_selected: ["apply_guide","docs_list"] } }` | `"__answers__"` | `{ services_selected: ["apply_guide", "docs_list"] }` |

### service_pick’te ID üretimi

- Server’dan gelen `next_question.choice_ids` ile `next_question.choices` aynı sırada (SERVICE_CHOICE_IDS ↔ SERVICE_CHOICES).
- Kullanıcı seçtiği label’lar `inlineMultiSelected` (string[]).
- `choice_ids` varsa ve uzunluk eşleşiyorsa: her label için `choices.indexOf(label)` ile index alınır, `choice_ids[index]` ID olarak kullanılır.
- `choice_ids` yoksa veya uzunluk uyuşmuyorsa: `services_selected` olarak doğrudan label dizisi gönderilir (server hem ID hem label kabul eder).

---

## Özet tablo

| Bileşen | Konum | Özet |
|--------|--------|------|
| **getNextStep** | jobGuideConfig.ts | Kaynağa göre akış; services_locked ise service_pick atlanır; showIf + isStepAnswered ile ilk cevaplanmamış adım; lastAskId ile no-repeat. |
| **expandServicesSelected** | jobGuideConfig.ts | services_selected (dizi veya string) → 7 adet service_* "Evet"/"Hayır"; ID ve label eşleşmesi. |
| **sendMessage payload** | JobGuideClient.tsx | string veya `{ message?, answers_patch? }`; body’de `message_text` + isteğe bağlı `answers_patch`; service_pick’te `services_selected` ID veya label dizisi. |
