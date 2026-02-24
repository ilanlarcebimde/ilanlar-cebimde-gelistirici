# Başvuru Paneli — Prompt Stratejisi ve İlerleme Senkronizasyonu (v2 / sade)

Bu dokümanda **Nasıl Başvururum?** panelinin prompt stratejisi, ilerleme yüzdesi senkronizasyonu ve sadeleştirme düzenlemeleri tanımlanmıştır.

**Hedef:** Kullanıcı hiçbir şey bilmese bile 2–3 mesajda doğru platform adımlarını öğrenmeli; sorular az ve net; gereksiz alanlar kalkmalı; plan en sonda verilmeli.

**Örnek bağlam:** Başvuru Paneli · Boya Ustası · GLASSDOOR · Doha · %17 ilerleme (1/6 madde)

---

## 0. Yeni yaklaşım (kısa özet)

- Panel açılır açılmaz **kaynağa göre Hızlı Rehber** (EURES / Glassdoor).
- **Her tur:** Kısa bilgilendirme (3–6 madde) + **tek kritik soru** (choices ile).
- **Checklist minimal:** Platform/Hesap (1) + Başvuru Adımı (3) + CV (2) = **6 madde**. İlerleme = tamamlanan kritik adım oranı.
- **1 Haftalık Plan:** Sadece ilerleme %80+ ve kritik sorular bittiyse, en sonda ayrı bölüm olarak üretilir.

---

## 1. Panel bağlamı (UI üst alanı)

| Öğe | Kaynak | Açıklama |
|-----|--------|----------|
| **Başlık** | Sabit | "← Başvuru Paneli" + ilan başlığı |
| **Kaynak** | `job.source_name` | GLASSDOOR, EURES |
| **Konum** | `job.location_text` | Doha / Ireland : Dublin |
| **İlerleme** | `progressPercent` | %0–100 (checklist done/total) |
| **Hızlı Özet** | Kaynak + nextQuestion | 2 satır: kaynak rehberi + "Şu an: [ilk eksik adım]" + sonraki soru |

---

## 2. İlerleme yüzdesi — mantık (günlük değil)

### 2.1 Formül (değişmez)

`pct = total === 0 ? 0 : Math.round((done / total) * 100)`

**Kaynak:** `src/lib/checklistRules.ts` → `buildChecklist` → `calcProgress`.

### 2.2 Checklist minimal modüller (toplam 6 madde)

| Modül | Madde sayısı | Done koşulu (answers) |
|-------|---------------|------------------------|
| **Platform / Hesap** | 1 | `has_glassdoor_account` (Glassdoor) veya `has_eu_login` (EURES) = "var" |
| **Başvuru Adımı** | 3 | `source_apply_opened`, `source_apply_found`, `source_apply_started` = "var" |
| **CV** | 2 | `cv` = "var" (hazır), `cv_uploaded` = "var" (yükledim) |

Ustalık belgesi, pasaport, maaş, risk vb. **checklist’te yok**; rapor/akışta isteğe bağlı sorulabilir, ilerlemeyi şişirmez.

### 2.3 Senkronizasyon (aynı kalır)

- **Client:** `progressPercent = checklistSnapshot?.percent ?? progress.pct`
- **Server (chat route):** `mergedAnswers` ile `buildChecklist` → `calcProgress` → yanıtta `checklist_snapshot` döner.
- **UI:** `setChecklistSnapshot(d.checklist_snapshot)` (bootstrap veya chat 200).

---

## 3. Bilgilendirme + soru stratejisi (sade)

### 3.1 Kural

- **assistant_message:** 3–6 madde; link yok; gerekirse "YouTube'da şunu arat: [ifade]"; kısa cümleler.
- **next_question:** Tek soru; `id` (sıra için) + `text` + `choices`: "Var" | "Yok" | "Emin değilim" veya "Gördüm" | "Görmedim" | "Emin değilim".

### 3.2 Hızlı Özet

- "Bugün bitirmen gereken…" **kaldırıldı.**
- Yerine: **"Şu an: [ilk eksik adım]"** (örn. "İlana gittim / sayfayı açtım") + sonraki soru.

---

## 4. Bootstrap (ilk mesaj) — deterministik + net rehber

**Dosya:** `src/app/api/job-guide/chat/route.ts` (isBootstrap bloğu)

### 4.1 EURES (3–5 madde)

- Merhaba! Bu ilan EURES üzerinden geliyor.
- "İlana Git" ile EURES sayfasını aç.
- Sayfa İngilizceyse: Chrome → sağ tık → Türkçeye çevir.
- "How to apply" / "Apply" bölümünü bul.
- Başvuru için çoğu ilanda EU Login ile giriş istenir.

**next_question:** "EURES'te EU Login hesabın var mı?" → `has_eu_login`, choices: Var / Yok / Emin değilim.

### 4.2 Glassdoor (3–5 madde)

- Merhaba! Bu ilan Glassdoor üzerinden geliyor.
- "İlana Git" ile ilan sayfasını aç.
- Chrome → sağ tık → Türkçeye çevir.
- "Apply" / "Sign in to apply" alanını görürsen başvuru buradan yapılır.
- Giriş istenirse hesap açıp devam edeceğiz.

**next_question:** "Glassdoor hesabın var mı?" → `has_glassdoor_account`.

### 4.3 Diğer kaynak

- Bu ilan {kaynak} kaynağından geliyor.
- İlana Git ile sayfayı aç. Başvuru / Apply bölümünü bul. Gerekirse Türkçeye çevir.

**next_question:** "Bu platformda hesabın var mı?" → `has_platform_account`.

---

## 5. Chat (Gemini) — sade şema + soru sırası

**Dosya:** `src/app/api/job-guide/chat/route.ts`

### 5.1 System prompt (özet)

- Rol: Yurtdışı iş başvuru asistanı; 3–6 madde; kısa cümleler.
- **next_question ZORUNLU:** Her yanıtta `id` + `text` + `choices`. **Soru sırasına uy.**
- **answers_patch:** Cevaba göre ilgili alanı doldur (var/yok).
- **Soru sırası (Glassdoor):** `has_glassdoor_account` → `source_apply_opened` → `source_apply_found` → `source_apply_started` → `cv` → `cv_uploaded`. İsteğe bağlı en sonda: `has_trade_certificate`.
- **Soru sırası (EURES):** `has_eu_login` → `source_apply_opened` → `source_apply_found` → `source_apply_started` → `cv` → `cv_uploaded`. İsteğe bağlı: `has_trade_certificate`.
- **İlerleme %80+ ve kritik sorular bittiyse:** `final_summary` + `weekly_plan` dönebilir. **weekly_plan sadece o durumda** (1 haftalık plan, gün bazlı görevler).

### 5.2 JSON şeması (yeni)

```json
{
  "assistant_message": "string (Türkçe, 3-6 madde)",
  "next_question": { "id": "ask_id_string", "text": "Soru metni", "choices": ["Var", "Yok", "Emin değilim"] },
  "answers_patch": {},
  "final_summary": { "title": "string", "bullets": ["string"] },
  "weekly_plan": { "days": [ { "day": 1, "tasks": ["string"] } ] }
}
```

`final_summary` ve `weekly_plan` sadece ilerleme tamamlanmak üzereyken doldurulur.

### 5.3 Cevap eşlemesi (normalizeUserMessageToAnswers)

- **last_ask_id** ile "Var"/"Yok"/"Gördüm"/"Görmedim" doğru alana yazılır: `has_eu_login`, `has_glassdoor_account`, `source_apply_opened`, `source_apply_found`, `source_apply_started`, `cv_ready` (→ cv), `cv_uploaded`, `has_trade_certificate`.
- Serbest metin: "ilan sayfasına geldim" → `source_apply_opened`, "Apply bölümünü gördüm" → `source_apply_found`, "başvuruyu başlattım" → `source_apply_started`, "CV hazır" → `cv` vb.

---

## 6. UI davranışı

- **Sol (Kontrol Listesi):** 3 kart: Platform/Hesap, Başvuru Adımı, CV; her kartta 1–3 madde.
- **Orta (chat):** İlk mesaj bootstrap; altında tek soru (quick replies); input her zaman görünür (sticky footer).
- **"Yanıtlanıyor…":** 12 sn sonra fallback: "Yanıt gecikti. Tekrar deneyelim." + aynı soruyu tekrar göster; `finally` ile loading garanti kapanır.

---

## 7. Final (tamamlandı) çıktısı

Kritik adımlar tamamlanınca (ilerleme %80+):

- Sistem: "İşlemler şimdilik tamamlandı. Raporu açarak görebilirsin." benzeri mesaj verebilir.
- `final_summary` + `weekly_plan` döner.
- **weekly_plan örneği:** Gün 1: hesap/oturum + ilan sayfası; Gün 2: CV düzenleme; Gün 3: başvuru gönderme; Gün 4–7: benzer ilanlara 3–5 başvuru + yanıt takibi.

---

## 8. Düzenleme rehberi (hızlı referans)

| Hedef | Dosya / yer |
|-------|-------------|
| İlerleme formülü, 3 modül (Platform, Başvuru, CV), 6 madde | `src/lib/checklistRules.ts` — `buildChecklist`, `calcProgress`, `answersFromJson`, `source_apply_found` |
| Bootstrap metinleri (3–6 madde) | `src/app/api/job-guide/chat/route.ts` — isBootstrap (EURES/Glassdoor/diğer) |
| Chat system + user prompt, soru sırası, weekly_plan sadece final | `src/app/api/job-guide/chat/route.ts` — `system`, `userPrompt` |
| Cevap metni → answers (source_apply_found, cv_ready, last_ask_id) | `src/app/api/job-guide/chat/route.ts` — `normalizeUserMessageToAnswers` |
| İlerleme gösterimi, Hızlı Özet ("Şu an:") | `JobGuideClient.tsx` — `progressPercent`, "Hızlı Özet", `missingLabels` |
| 12 sn timeout fallback | `JobGuideClient.tsx` — `fallback12sId`, `chatFallback12sRef` |

---

## 9. İlişkili dokümanlar

- **Gemini API kullanımı:** `docs/GEMINI_API_RAPORU.md`
- **Nasıl Başvururum akışı:** `docs/NASIL_BASVURURUM_AKIS.md`
- **Debug:** `docs/NASIL_BASVURURUM_DEBUG.md`

Bu dosya, panel prompt stratejisi (v2 / sade) ve **%ilerleme senkronizasyonu** ile ilgili düzenlemeler için tek referans noktasıdır.
