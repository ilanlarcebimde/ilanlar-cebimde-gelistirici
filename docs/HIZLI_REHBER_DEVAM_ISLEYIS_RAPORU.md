# Hızlı Rehber + Bootstrap Mesajı + “Devam” İşleyiş Raporu

**Tarih:** 2026-02  
**Kapsam:** İlk açılışta görünen “Hızlı Rehber” kutusu, “Merhaba efendim…” metni, “Şimdi 1 kritik soruya geçiyorum.” ve “Devam” butonunun veri kaynakları ile akış mantığı.

---

## 1. Ekrandaki Görünüm (Özet)

Kullanıcı Başvuru Paneli sayfasını açtığında sırayla şunları görür:

1. **Hızlı Rehber** (açılır/kapanır kutu)  
   - Başlık: “Hızlı Rehber” / “Gizle”  
   - İçerik: Kaynağa göre kısa metin (örn. “Bu ilan kaynağı: GLASSDOOR. Başvuru genelde…”).

2. **Asistan balonu**  
   - “Merhaba efendim. Bu ilan kaynağı: GLASSDOOR.”  
   - “**Hızlı Rehber** sol panelde; kaynağa göre başvuru adımları orada.”  
   - “**GLASSDOOR’da başvuru nasıl yapılır:**”  
   - 4 maddelik adım listesi (✅ 1. … ✅ 2. … vb.)  
   - “Şimdi 1 kritik soruya geçiyorum.”

3. **İlk soru alanı**  
   - Metin: “Hangi konularda yardım istiyorsun? (Birden fazla seçebilirsin)”  
   - 7 seçenek (çoklu seçim chip’leri)  
   - **Devam** butonu (seçim yapıldıktan sonra tıklanır).

Bu rapor, bu üç parçanın nereden geldiğini ve nasıl bir araya geldiğini açıklar.

---

## 2. Hızlı Rehber Metni (Sol paneldeki kutu)

### 2.1 Kaynak

- **Dosya:** `src/data/jobGuideConfig.ts`
- **Sabit:** `QUICK_GUIDE_TEMPLATES`
  - `EURES.fullText`: EURES için 4–5 satırlık metin (kaynak, “İlana Git”, çeviri, “kritik bilgileri alacağım”).
  - `GLASSDOOR.fullText`: Glassdoor için metin (kaynak, “Apply / Sign in to apply”, çeviri, şirket sitesine yönlendirme).

Örnek (GLASSDOOR):

```text
Bu ilan kaynağı: GLASSDOOR.
Başvuru genelde "Apply / Sign in to apply" alanından yapılır.
Sayfa İngilizceyse: Chrome → sağ tık → Türkçeye çevir.
Şirket sitesine yönlendirirse: aynı ilanı şirket sitesinde bulup oradan başvuracağız.
```

### 2.2 API’de üretilmesi

- **Dosya:** `src/app/api/job-guide/chat/route.ts`
- **Fonksiyon:** `getQuickGuideText(source: SourceKind): string`
  - `source === "glassdoor"` → `QUICK_GUIDE_TEMPLATES.GLASSDOOR.fullText`
  - `source === "eures"` → `QUICK_GUIDE_TEMPLATES.EURES.fullText`
  - Varsayılan → Glassdoor metni.
- **Kullanım:** Her ilgili yanıtta `quick_guide_text` alanı bu metinle doldurulur (bootstrap, `__continue__` ve normal chat yanıtları).

### 2.3 İstemcide gösterilmesi

- **Dosya:** `src/app/premium/job-guide/[jobId]/JobGuideClient.tsx`
- **State:** `quickGuideText` (string | null), `quickGuideCollapsed` (boolean).
- **Güncelleme:** API yanıtında `d.quick_guide_text` varsa `setQuickGuideText(d.quick_guide_text)`.
- **UI:** Sohbet alanının üstünde bir kutu:
  - Başlık satırında “Hızlı Rehber” ve “Gizle”/“Göster” (toggle).
  - Açıkken `quickGuideText` içeriği `whitespace-pre-wrap` ile gösterilir.
- **Not:** Artık tek kolon ortada olduğu için metinde geçen “sol panelde” ifadesi, bu kutunun kendisini (sohbetin hemen üstündeki alanı) kasteder.

---

## 3. “Merhaba efendim” + “Şimdi 1 kritik soruya geçiyorum” (Bootstrap mesajı)

### 3.1 Kaynak

- **Dosya:** `src/lib/job-guide/deterministicGuide.ts`
- **Fonksiyon:** `getBootstrapMessage(source: JobSource): string`
- **Parametre:** `source` = `"eures"` | `"glassdoor"` | `"default"` (ilanın kaynağına göre).

### 3.2 Üretilen metin (satır satır)

1. `"Merhaba efendim. Bu ilan kaynağı: " + kaynak + "."`  
   → Örn: “Merhaba efendim. Bu ilan kaynağı: GLASSDOOR.”
2. Boş satır.
3. `"**Hızlı Rehber** sol panelde; kaynağa göre başvuru adımları orada."`
4. Boş satır.
5. `"**" + kaynak + "'da başvuru nasıl yapılır:**"`  
   → Örn: “**GLASSDOOR’da başvuru nasıl yapılır:**”
6. `EURES_STEPS` veya `GLASSDOOR_STEPS` (deterministicGuide.ts içinde sabit) her satırı “✅ ” ile öne eklenir.
   - GLASSDOOR örneği:
     - 1. Glassdoor’da **profil oluştur** veya giriş yap.
     - 2. **Jobs** sekmesinden ilanı aç.
     - 3. **Easy Apply** varsa oradan; yoksa **Company site** ile şirket sitesine git.
     - 4. Formu doldurup **Submit** et.
7. Boş satır.
8. `"Şimdi 1 kritik soruya geçiyorum."`

Yani asistan balonundaki tüm “Merhaba efendim” + kaynak + “Hızlı Rehber sol panelde” + “X’da başvuru nasıl yapılır” + 4 madde + “Şimdi 1 kritik soruya geçiyorum.” metni tek bir string olarak `getBootstrapMessage` çıktısından gelir.

### 3.3 API’de ne zaman kullanılır?

- **Dosya:** `src/app/api/job-guide/chat/route.ts`
- **Bootstrap:** `isBootstrap === true` (ilk yüklemede `mode === "bootstrap"` veya boş/`__start__` mesaj).
  - `bootstrapMessage = getBootstrapMessage(sourceKey)` alınır.
  - Yanıtta `assistant_message` ve `assistant.message_md` bu metinle set edilir.
  - Aynı yanıtta ilk soru da döner (aşağıda).
- **İsteğe bağlı “Devam” ile başlangıç:** `isContinueStart === true` (mesaj boş veya `__continue__` ve henüz cevap yok).
  - Yine `getBootstrapMessage(sourceKey)` kullanılır; aynı metin tekrar gönderilir, ilk soru yine eklenir.

---

## 4. İlk soru ve “Devam” butonu

### 4.1 İlk sorunun belirlenmesi

- **Config:** `src/data/jobGuideConfig.ts` → `QUESTION_FLOW.GLASSDOOR` / `QUESTION_FLOW.EURES`.
- İlk adım her iki akışta da **service_pick**:
  - `id: "service_pick"`
  - `text: "Hangi konularda yardım istiyorsun? (Birden fazla seçebilirsin)"`
  - `choices: SERVICE_CHOICES` (7 tema: “Adım adım başvuru rehberi”, “Gerekli belgeler listesi”, …)
  - `input: { type: "multiselect" }`
  - `answerKey: "services_selected"`
  - `doneRule: { type: "minSelected", value: 1 }`

### 4.2 API’de ilk sorunun dönmesi

- **Bootstrap (ve isContinueStart) sırasında:**
  - `firstStep = getNextStep(mergedAnswers, sourceKey)` → henüz cevap yokken ilk adım = `service_pick`.
  - `firstQuestion = getQuestionTextAndChoices(firstStep)` → `getStepDisplay(step)` ile `text`, `choices`, `input` alınır.
  - Yanıt içinde:
    - `next_question: { id, text, choices, input }`
    - `assistant.ask: { id, question, type, choices, input }`
  - İstemci bu yapıyı `nextQuestion` state’ine yazar ve aynı mesaj balonunun altında soruyu + seçenekleri gösterir.

### 4.3 İstemcide “Devam” butonu

- **Dosya:** `src/app/premium/job-guide/[jobId]/JobGuideClient.tsx`
- **Çoklu seçim (service_pick) için:**
  - Soru alanında 7 tema chip olarak listelenir (`m.next_question.choices`).
  - Kullanıcı bir veya birden fazla seçer → `inlineMultiSelected` state’i güncellenir.
  - **“Devam” butonu:** `onClick` ile `sendMessage(inlineMultiSelected.join(", "))` çağrılır; yani seçilen tema(lar) virgülle birleştirilip sunucuya gönderilir. Bu durumda “Devam” = “Seçimleri gönder”.
  - Buton, `inlineMultiSelected.length === 0` ise devre dışıdır.
- **Tek seçenek / genel “Devam” (sticky alt input):**
  - Bazı sorularda `next_question` var ama ekstra serbest metin gerekmez; kullanıcı sadece “Devam”a basar.
  - Bu durumda `sendMessage("__continue__")` kullanılır.
  - UI’da kullanıcı mesajı olarak `"__continue__"` gelirse metin “Devam” olarak gösterilir (`m.text === "__continue__" ? "Devam" : m.text`).

Özet: İlk ekrandaki “Devam”, çoklu seçimde “seçilen hizmetleri gönder” anlamındadır; metin olarak sunucuya giden şey seçimlerin virgülle ayrılmış hâlidir, `__continue__` değil.

---

## 5. Veri Akışı (Sıralı)

```
1. Kullanıcı Başvuru Paneli sayfasını açar
   → JobGuideClient useEffect: /api/job-guide/chat POST (mode: "bootstrap" veya boş message)

2. API (chat/route.ts)
   → sourceKey = getSourceKind(jobPost.source_name)  // "eures" | "glassdoor"
   → quickGuideText = getQuickGuideText(sourceKey)   // QUICK_GUIDE_TEMPLATES
   → bootstrapMessage = getBootstrapMessage(sourceKey)  // deterministicGuide.getBootstrapMessage
   → firstStep = getNextStep(mergedAnswers, sourceKey)  // service_pick
   → firstQuestion = getQuestionTextAndChoices(firstStep)

3. Yanıt
   assistant_message / assistant.message_md = bootstrapMessage
   quick_guide_text = quickGuideText
   next_question / assistant.ask = { id: "service_pick", text: "...", choices: [7 tema], input: { type: "multiselect" } }
   answers_json = { ..., greeting_shown: true }

4. İstemci
   setMessages([{ role: "assistant", text: bootstrapMessage, next_question: ... }])
   setQuickGuideText(quick_guide_text)
   setNextQuestion(next_question)
   → UI: Hızlı Rehber kutusu (quickGuideText) + asistan balonu (bootstrapMessage) + 7 chip + Devam butonu

5. Kullanıcı 1+ tema seçip “Devam”a tıklar
   → sendMessage("Seçilen1, Seçilen2, ...")
   → Normal chat turu; sonraki adım getNextStep ile (örn. found_apply_section) döner.
```

---

## 6. Dosya Referansları

| Bileşen | Dosya | Fonksiyon / sabit |
|--------|--------|--------------------|
| Hızlı Rehber metinleri | `src/data/jobGuideConfig.ts` | `QUICK_GUIDE_TEMPLATES.EURES.fullText`, `GLASSDOOR.fullText` |
| Hızlı Rehber API’de seçimi | `src/app/api/job-guide/chat/route.ts` | `getQuickGuideText(source)` |
| Bootstrap metni | `src/lib/job-guide/deterministicGuide.ts` | `getBootstrapMessage(source)`, `EURES_STEPS`, `GLASSDOOR_STEPS` |
| İlk soru (service_pick) | `src/data/jobGuideConfig.ts` | `QUESTION_FLOW.EURES[0]` / `QUESTION_FLOW.GLASSDOOR[0]` |
| İlk sorunun API’de verilmesi | `src/app/api/job-guide/chat/route.ts` | `getNextStep(…)`, `getQuestionTextAndChoices(firstStep)` (→ `getStepDisplay`) |
| Hızlı Rehber + mesaj + Devam UI | `src/app/premium/job-guide/[jobId]/JobGuideClient.tsx` | `quickGuideText`, `quickGuideCollapsed`, mesaj + `next_question` render, multiselect + “Devam” onClick |

---

## 7. Kısa Özet

- **Hızlı Rehber kutusu:** Config’teki `QUICK_GUIDE_TEMPLATES` (kaynağa göre) → API `quick_guide_text` → client’ta üstte açılır/kapanır kutu.
- **“Merhaba efendim” … “Şimdi 1 kritik soruya geçiyorum.”:** Tamamı `deterministicGuide.getBootstrapMessage(source)` çıktısı; bootstrap (ve gerekirse `__continue__`) yanıtında `assistant_message` / `message_md` olarak dönüyor.
- **İlk soru:** Config’teki ilk adım `service_pick`; API `getNextStep` + `getQuestionTextAndChoices` ile `next_question` / `assistant.ask` olarak gönderiliyor.
- **“Devam”:** İlk ekranda çoklu seçimde “seçilenleri gönder” (virgülle ayrılmış string); diğer bazı adımlarda ise `__continue__` gönderilir ve UI’da “Devam” yazısı gösterilir.
