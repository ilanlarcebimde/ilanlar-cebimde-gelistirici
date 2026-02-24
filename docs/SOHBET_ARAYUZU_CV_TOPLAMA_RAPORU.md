# Sohbet Arayüzü ile CV Toplama İşleyiş Mantığı — Rapor

Bu dokümanda Başvuru Paneli sohbet arayüzünün nasıl çalıştığı ve **CV durumu toplama / CV Paketi yönlendirmesi** mantığı adım adım açıklanmaktadır.

---

## 1. Sohbet arayüzü genel akışı

### 1.1 Kimlik ve veri kaynağı

| Öğe | Açıklama |
|-----|----------|
| **Sayfa** | `src/app/premium/job-guide/[jobId]/JobGuideClient.tsx` |
| **API** | `POST /api/job-guide/chat` (`src/app/api/job-guide/chat/route.ts`) |
| **Config** | `src/data/jobGuideConfig.ts` — soru metinleri, seçenekler, akış sırası |

### 1.2 Mesaj döngüsü

1. **Bootstrap:** İlk yüklemede `mode: "bootstrap"` veya boş mesajla API çağrılır → Hızlı Rehber metni + ilk soru (veya “Devam” butonu) döner.
2. **Kullanıcı cevaplar:** Buton (Evet/Hayır/…) veya serbest metin (sadece `blocking_issue_text` adımında) gönderilir.
3. **API:** Kullanıcı metnini `normalizeUserMessageToAnswers()` ile ilgili `answerKey` değerine yazar, `getNextStep(answers, source, last_ask_id)` ile bir sonraki soruyu config’ten seçer, Gemini’den rehber metni alır, gerekirse CV CTA ekler.
4. **İstemci:** Gelen `assistant_message` / `message_md` sohbet balonunda gösterilir; `next_question` bir sonraki soru butonları/textarea olarak render edilir. `answers_json` ve `state_patch` ile yerel state güncellenir.

### 1.3 Mesaj gösterimi ve CV butonu

- Asistan mesajı `m.text` ile gösterilir.
- **CV linki:** Metin satırlarından biri tam olarak `https://www.ilanlarcebimde.com/yurtdisi-cv-paketi` ise bu satır, `renderMessageWithCvButton()` ile **“CV Paketi'ne Git”** butonuna dönüştürülür (tıklanınca aynı URL açılır).
- Diğer satırlar normal metin olarak kalır; böylece “CV hazır değilse … link … İndirim kodu: CV79” metninde link kısmı buton olur.

---

## 2. CV toplama: config ve soru

### 2.1 Soru konumu ve metni

CV durumu **tek bir soru** ile toplanır; hem EURES hem GLASSDOOR akışında vardır.

| Akış | Adım id | answerKey | Soru metni (config) |
|------|---------|-----------|----------------------|
| EURES | `cv_ready` | `cv_ready` | "CV'n hazır mı? (PDF olarak)" |
| GLASSDOOR | `cv_ready` | `cv_ready` | "CV'n hazır mı? (PDF olarak)" |

**Seçenekler:** Evet, Hayır, Emin değilim (config: `CHOICES.yesNoMaybe`).

- Kullanıcı bu soruyu gördüğünde yanıtı (buton veya metin) `normalizeUserMessageToAnswers()` ile `answers_json.cv_ready` alanına yazılır ("Evet" / "Hayır" / "Emin değilim").

### 2.2 Eski alan: cv_status

- API tarafında **normalization** ve **CV CTA koşulları** hem `cv_ready` hem `cv_status` ile çalışacak şekilde yazılmıştır (geriye dönük uyum).
- Yeni akışta tek yetkili alan **`cv_ready`**; `cv_status` eski/alternatif kabul edilir.

---

## 3. CV Paketi yönlendirmesi (CTA) mantığı

### 3.1 Ne zaman CTA eklenir?

Sunucu aşağıdaki **üç koşul** birlikte sağlanırsa asistan mesajına CV CTA’yı ekler ve `promo_cv_shown` bayrağını işaretler:

| Koşul | Açıklama |
|-------|----------|
| **CV eksik** | `cv_ready === "Hayır"` veya `cv_status === "Hazır değil"` veya `cv_status === "Yok"` |
| **Promo henüz gösterilmedi** | `answers_json.promo_cv_shown !== true` |
| **Doğru adımda** | Kullanıcı tam olarak `cv_ready` veya `cv_status` veya `cv_offer_if_missing` sorusuna cevap vermiş olmalı: `last_ask_id` bu id’lerden biri |

Kod (route.ts):

```ts
const cvMissing = mergedAnswers.cv_ready === "Hayır" || mergedAnswers.cv_status === "Hazır değil" || mergedAnswers.cv_status === "Yok";
const promoAlreadyShown = mergedAnswers.promo_cv_shown === true;
const shouldInjectCvCta =
  cvMissing && !promoAlreadyShown && (last_ask_id === "cv_ready" || last_ask_id === "cv_status" || last_ask_id === "cv_offer_if_missing");
```

### 3.2 CTA eklendiğinde yapılanlar

1. **Mesaj:** Asistan yanıtının sonuna şu blok eklenir:
   - "CV hazır değilse buradan 24 saat içinde hazırlatabilirsin."
   - Satır: `https://www.ilanlarcebimde.com/yurtdisi-cv-paketi`
   - "İndirim kodu: CV79"

2. **State:** `mergedAnswers.promo_cv_shown = true` yapılır; bu değer response’taki `answers_json` ile istemciye gider.

3. **state_patch:** `answers_patch: { promo_cv_shown: true }` dönülür (istemci ek olarak bu patch’i kullanabilir).

4. **flags:** `should_offer_cv_package: true` (veya Gemini’nin döndüğü değer) response’ta iletilir.

Sonuç: **CV CTA aynı rehber oturumunda yalnızca bir kez** gösterilir; kullanıcı “Hayır” dedikten sonra tekrar “Hayır” cevaplasa bile CTA tekrarlanmaz.

---

## 4. “CV hazır değil” yanıtında ek rehber

Kullanıcı **cv_ready** (veya cv_status) sorusuna “Hayır” / “Hazır değil” dediğinde, asistan cevabında “şu noktalara dikkat edin” deyip liste vermemişse sunucu **sabit bir CV rehber listesi** ekler:

- Özgeçmişi tek sayfa, net, hedef dilde/İngilizce tutma
- İlandaki anahtar kelime ve becerileri CV’ye ekleme
- Deneyimi tarih ve iş tanımıyla yazma; referans ekleme
- Son hali PDF kaydedip başvuruda yükleme

Bu metin, asistan mesajının sonuna eklenir; ardından (gerekirse) yukarıdaki CV CTA bloku da eklenir.

---

## 5. Veri akışı özeti

```
[Config]
  cv_ready sorusu (Evet/Hayır/Emin değilim) → answerKey: cv_ready

[Kullanıcı] "Hayır" / "Evet" / "Emin değilim" (veya metin eşleşmesi)
     ↓
[API] normalizeUserMessageToAnswers() → patch.cv_ready = "Hayır" | "Evet" | "Emin değilim"
     ↓
[API] mergedAnswers = { ...answers_json, ...patch }
     ↓
[API] cvMissing && !promo_cv_shown && last_ask_id === "cv_ready"
     → assistantMessage += CTA metni + link + "İndirim kodu: CV79"
     → mergedAnswers.promo_cv_shown = true
     ↓
[API] Response: assistant_message, answers_json (promo_cv_shown: true dahil), state_patch.answers_patch, flags.should_offer_cv_package
     ↓
[İstemci] Mesajı gösterir; URL satırı "CV Paketi'ne Git" butonu olur. answers_json ile guide/answers güncellenir → bir sonraki turda promo_cv_shown true olduğu için CTA tekrar eklenmez.
```

---

## 6. Özet tablo

| Konu | Açıklama |
|------|----------|
| **CV sorusu** | Tek soru: "CV'n hazır mı? (PDF olarak)" — Evet/Hayır/Emin değilim; `answerKey`: `cv_ready` |
| **CV cevabının saklanması** | `answers_json.cv_ready` (ve gerekiyorsa `cv_status` normalization’da) |
| **CTA tetikleyici** | `cv_ready === "Hayır"` (veya cv_status "Hazır değil"/"Yok") + `promo_cv_shown !== true` + son cevap `cv_ready`/`cv_status`/`cv_offer_if_missing` adımına ait |
| **CTA içeriği** | Kısa metin + link (yurtdisi-cv-paketi) + "İndirim kodu: CV79" |
| **Tekrarsızlık** | `promo_cv_shown = true` ile aynı oturumda CTA yalnızca bir kez eklenir |
| **UI’da link** | Asistan mesajında tam URL satırı "CV Paketi'ne Git" butonuna dönüştürülür |

Bu rapor, sohbet arayüzü ile CV toplama ve CV Paketi yönlendirme işleyişini tek referans dokümanda toplar.
