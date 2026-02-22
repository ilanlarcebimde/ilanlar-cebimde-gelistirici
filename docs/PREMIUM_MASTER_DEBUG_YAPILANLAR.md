# Premium Job Guide – Master Debug Uygulaması

Bu dokümanda Cursor Master Debug Prompt kapsamında yapılan denetim ve düzeltmeler özetlenir.

---

## 1. Buton → Route akışı

- **FeedPostCard:** `onClick` → `handleApplyClick` → `console.log("HOWTO CLICK", post.id)` + `onHowToApplyClick(post)`.
- **post.id:** Feed verisi `job_posts` tablosundan geldiği için `post.id` = `job_posts.id` (FeedPost tipine yorum eklendi).
- **router.push:** Parent’ta `router.push("/premium/job-guide/" + post.id)` kullanılıyor; doğru.

---

## 2. Parent gate + APPLY FLOW logu

**Dosyalar:** UcretsizPanelClient, YurtdisiPanelClient, ChannelsLayout, KanalFeedClient.

- Her birinde `handleHowToApplyClick` başında:
  ```js
  console.log("APPLY FLOW", {
    user: !!user,
    subscriptionLoading,
    subscriptionActive,
    postId: post.id,
  });
  ```
- Davranış: `!user` → auth modal; `!subscriptionLoading && !subscriptionActive` → premium modal; aksi halde `router.push`. Sessiz kalma yok; toast ile bilgilendirme var.

---

## 3. Premium layout guard

**Dosya:** `src/app/premium/layout.tsx`

- Sıra: `authLoading || subscriptionLoading` → sadece Loading UI (redirect yok).
- `!user` → redirect `/giris?next=...`.
- `!subscriptionActive` → redirect `/ucretsiz-yurtdisi-is-ilanlari`.
- `console.log("PREMIUM GUARD", { userId, subscriptionLoading, subscriptionActive, authLoading })` mevcut.

---

## 4. Subscription – SUBSCRIPTION RESULT logu

**Hook:** `src/hooks/useSubscriptionActive.ts`

- Kaynak: Sadece `premium_subscriptions` (ends_at > now()).
- Hata: Sorgu hatasında `console.error` + `false` dönülüyor; sessiz false yok.
- Her sorgu sonrası:
  ```js
  console.log("SUBSCRIPTION RESULT", {
    userId,
    rowCount: premium?.length ?? 0,
    error: error?.message ?? null,
    active: !error && (premium?.length ?? 0) > 0,
  });
  ```

---

## 5. Job guide page + JOB GUIDE MOUNT

- **page.tsx:** `params`’tan `jobId` alınıyor; `return <JobGuideClient key={jobId} jobId={jobId} />`.
- **jobId değişince** component remount oluyor (state sıfırlanıyor).
- **JobGuideClient** mount’ta: `console.log("JOB GUIDE MOUNT", jobId)`.

---

## 6. JobGuideClient içerik + ilk render

- **Header:** "Premium Başvuru Paneli" (LoadingShell ve ana UI’da).
- **LoadingShell:** "İlan yükleniyor…" + "Soru 1: Pasaportun var mı?" placeholder.
- **job null:** `loading || !job` iken LoadingShell; UI çökmüyor.

---

## 7. API akışı + log + sessiz hata kaldırma

**JobGuideClient içinde:**

- `GET /api/job-posts/<id>` → `console.log("API job-posts GET", jobId)` ve `("API job-posts result", jobId, status)`.
- 404/error → `console.warn` + `/premium/job-guides`’e yönlendirme.
- `GET /api/job-guide?jobPostId=` → `console.log("API job-guide GET result", ...)`.
- 404 → `POST /api/job-guide` (draft) → `console.log("API job-guide POST (draft create)"`, "API job-guide POST result").
- **POST başarısız:** `console.error("API job-guide POST failed", ...)` + loading false; sessiz return kaldırıldı.
- **Rapor güncelleme:** `console.log("API job-guide/update POST", ...)` ve `("API job-guide/update result", status, error)`.

**Backend:** GET /api/job-guide rehber yokken 404 dönüyor (draft oluşturma akışı tetikleniyor).

---

## 8. Canlı checklist – ilk 6 soru

**AssistantChat:** `INITIAL_QUESTIONS` (6 soru) tanımlı.  
Rehberden `nextQuestions` boş ve mesaj yokken artık **tüm 6 soru** gösteriliyor (önceden 2 idi).

- Pasaportun var mı?
- Hangi meslekte çalışıyorsun?
- Kaç yıl deneyimin var?
- Dil seviyen?
- Bu ülkeye gidebilir misin?
- CV hazır mı?

---

## 9. Gemini analiz yapısı

**Dosya:** `src/app/api/job-guide/update/route.ts`

- **report_json** içine **score (0–100)** eklendi (uygunluk skoru).
- Prompt’ta: `"score": 0-100` ve açıklama metni.
- **report_md** üretiminde score varsa "Uygunluk Skoru: X/100" bölümü ekleniyor.
- Mevcut alanlar: summary, top_actions, rehber, belgeler, vize_izin, maas_yasam, risk, sana_ozel, plan_30_gun; hepsi DB’ye ve UI’a (ReportViewer) yansıyor.

---

## 10. Kabul kriterleri (kontrol listesi)

| Kriter | Durum |
|--------|--------|
| Abone kullanıcı panele girebiliyor | Layout guard + subscription tek kaynak; log’larla doğrulanabilir. |
| Farklı ilanlara tıklayınca içerik değişiyor | `key={jobId}` ile JobGuideClient remount. |
| Checklist canlı çalışıyor | İlk 6 soru gösteriliyor; cevaplar answers_json + Gemini ile güncelleniyor. |
| Gemini analiz üretip kaydediyor | POST /api/job-guide/update → Gemini → job_guides + job_guide_events. |
| Panel geçmiş raporları saklıyor | job_guides.report_json / report_md + job_guide_events. |
| Sessiz failure yok | API hatalarında console.error/warn + toast. |
| Console’da akış logları | HOWTO CLICK, APPLY FLOW, PREMIUM GUARD, SUBSCRIPTION RESULT, JOB GUIDE MOUNT, API job-posts/ job-guide/ job-guide/update. |

---

## Console’da göreceğin log sırası (başarılı akış)

1. `HOWTO CLICK` &lt;post.id&gt;
2. `APPLY FLOW` { user: true, subscriptionLoading, subscriptionActive, postId }
3. `SUBSCRIPTION RESULT` (layout’taki hook)
4. `PREMIUM GUARD` { userId, subscriptionLoading, subscriptionActive, authLoading }
5. `JOB GUIDE MOUNT` &lt;jobId&gt;
6. `API job-posts GET` / `API job-posts result`
7. `API job-guide GET result` (404 ise)
8. `API job-guide POST (draft create)` / `API job-guide POST result`
9. Rapor güncellemede: `API job-guide/update POST` / `API job-guide/update result`

Bu sıra bozulduğu veya bir log eksik kaldığı yerde akış kırılıyor demektir.
