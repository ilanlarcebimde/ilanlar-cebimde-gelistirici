# İşletme Analiz / Premium İşleme Paneli – Teknik Audit

Her madde: **✅/❌ + kısa açıklama + dosya yolu + (gerekiyorsa) kod parçası**.

---

## 1) Routing / Page mevcut mu?

- **✅** `/premium/job-guide/[jobId]` route’u App Router’da **var**.
- **Dosya yolu:** `src/app/premium/job-guide/[jobId]/page.tsx`
- **Elle `/premium/job-guide/test` açınca:** 404 değil; middleware bu path’e dokunmuyor. Auth yoksa **layout** `router.replace("/giris?next=...")` yapıyor. Abonelik yoksa layout `router.replace("/ucretsiz-yurtdisi-is-ilanlari")` yapıyor. Yani **redirect** görürsün (boş ekran değil, “Yükleniyor…” sonrası redirect).

**Kod (layout):**  
`src/app/premium/layout.tsx`  
- Satır 24–26: `if (!user) router.replace("/giris?next=" + ...)`  
- Satır 36–37, 41: `if (!active) router.replace("/ucretsiz-yurtdisi-is-ilanlari")`

---

## 2) Client / Server bileşen uyumu

- **✅** `[jobId]/page.tsx` **"use client"** (dosyanın ilk satırı).
- **✅** `useRouter`, `useEffect`, `useState` kullanıyor; hepsi client’ta, "use client" ile uyumlu.
- Server component yok; tüm hook’lar aynı sayfada.

**Dosya:** `src/app/premium/job-guide/[jobId]/page.tsx`  
```ts
"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
```

---

## 3) Middleware / Redirect kontrolü

- **✅** `middleware.ts` **var**: `src/middleware.ts`
- **❌** `/premium/job-guide/*` için **hiçbir kural yok**. Matcher sadece:  
  `["/api/paytr/callback", "/yurtdisi-is-ilanlari"]`
- **Sonuç:** Network’te bu sayfa için **307/308 middleware’den gelmez**. Redirect’ler **client-side** (layout içinde `router.replace`). Yani 307/308 görürsen Next.js client navigation’dan gelir, middleware’den değil.

**Kod:** `src/middleware.ts`  
```ts
export const config = {
  matcher: ["/api/paytr/callback", "/yurtdisi-is-ilanlari"],
};
```

---

## 4) Subscription kontrol kaynağı

- **Kaynak:** **`premium_subscriptions`** (öncelik) + fallback **`profiles.status === 'paid'`**.  
  **profiles.subscription_active** kullanılmıyor.
- **Kod:** `src/hooks/useSubscriptionActive.ts`  
  - Önce: `premium_subscriptions` üzerinde `user_id`, `ends_at > now()`  
  - Yoksa: `profiles` üzerinde `user_id`, `status = 'paid'`
- **✅** Ödeme başarılı sonrası alan güncelleniyor:  
  - PayTR callback: `src/app/api/paytr/callback/route.ts` → `premium_subscriptions` insert  
  - Kupon: `src/app/api/profile/complete-coupon/route.ts` ve `src/app/api/premium/apply-coupon/route.ts` → `premium_subscriptions` insert  
- **router.refresh():** `src/app/odeme/basarili/page.tsx` içinde `useEffect`’te `router.refresh()` var.  
  **Not:** `useSubscriptionActive` client-side Supabase sorgusu yapıyor; `router.refresh()` server component’leri yeniler, client hook’u yeniden mount’ta tekrar çalışır (sayfa değişince). Ödeme sonrası aynı sayfada kalıyorsa refresh yeterli olmayabilir; panele gidince layout yeniden mount olur ve hook tekrar çalışır, o zaman güncel veri gelir.

---

## 5) UI Render / Modal mı Panel mi?

- **✅** “Nasıl Başvururum?” tıklanınca **route push** yapılıyor; modal değil.  
  `router.push("/premium/job-guide/" + post.id)` (veya `setTimeout` içinde).
- **Tıklamada çalışan fonksiyon:**  
  1) `FeedPostCard` → `handleApplyClick` → `onHowToApplyClick(post)`  
  2) Parent’ta (örn. `UcretsizPanelClient`) `handleHowToApplyClick` → auth/subscription kontrolü → `router.push(...)`  
- **Console kanıtı:**  
  - `src/components/kanal/FeedPostCard.tsx` satır 60: `console.log("[FeedPostCard] applyGuide clicked", post.id)`  
  - Parent’larda (örn. UcretsizPanelClient satır ~68): `console.log("[UcretsizPanel] opening panel", target)`  
- **URL:** `router.push` sonrası URL değişmeli (client-side navigation). Değişmiyorsa layout’taki redirect (auth/subscription) hemen tetikleniyor olabilir.

**İlgili dosyalar:**  
- `src/components/kanal/FeedPostCard.tsx` (handleApplyClick, onHowToApplyClick)  
- `src/app/ucretsiz-yurtdisi-is-ilanlari/UcretsizPanelClient.tsx` (handleHowToApplyClick, router.push)

---

## 6) Hata yakalama / görünmez crash

- **Tıklama sonrası:** FeedPostCard ve parent’larda **try/catch** var; hata `console.error` + opsiyonel toast. Console’da stack trace görmek için bu log’lara bakılmalı.
- **❌** Projede **React Error Boundary** veya **error-boundary** **yok** (grep sonucu).
- **❌** **Sentry** veya benzeri production log entegrasyonu **yok**. Sessiz crash’ler production’da takip edilmiyor.

**Öneri:** En azından `app/premium/job-guide/[jobId]/page.tsx` veya layout için error boundary eklenmeli; hata olursa “Bir şeyler yanlış gitti” + log.

---

## 7) Data fetch (job_posts) ve RLS

- **✅** Premium sayfa açılınca job_posts **okunuyor:**  
  `fetch(\`/api/job-posts/${guideJobId}\`)` → `src/app/api/job-posts/[id]/route.ts`
- **✅** Bu API **getSupabaseAdmin()** kullanıyor; **RLS bypass**. Server’da `job_posts` public SELECT (migration 018): `status = 'published'` olanlar herkese açık. API tarafında ek auth kontrolü yok; yani **permission denied** bu endpoint’ten gelmez.
- **401/403:** `/api/job-posts/[id]` auth istemiyor; 404 sadece id yoksa veya status !== 'published' ise.

**Dosyalar:**  
- `src/app/premium/job-guide/[jobId]/page.tsx` (fetch `/api/job-posts/${guideJobId}`)  
- `src/app/api/job-posts/[id]/route.ts` (getSupabaseAdmin, RLS yok)  
- `supabase/migrations/018_job_posts_public_select.sql` (job_posts SELECT public)

---

## 8) Z-index / overlay (modal için)

- **✅** Bu akışta **modal kullanılmıyor**; tam sayfa **route** (`/premium/job-guide/[jobId]`). Z-index/portal/overflow bu panel için geçerli değil.
- “Nasıl Başvururum?” → **Panel sayfası** açılıyor; modal değil.  
  Modal sadece abonelik yokken **PremiumIntroModal** için kullanılıyor (farklı akış).

---

## 9) “İşletme Analiz” panelinin kayıt yapısı

- **✅** **job_guides** ve **job_guide_events** tabloları **024_job_guides.sql** ile oluşturulmuş.
- **✅** RLS: `job_guides` için "Users can manage own job_guides" (auth.uid() = user_id); `job_guide_events` için select/insert kendi guide’larına. API’ler **getSupabaseForUser(token)** ile kullanıcıya özel client kullanıyor; insert/update kendi user_id ile, RLS engeline takılmaz.
- **“Raporu Kaydet”:** Sayfada `handleSaveReport` → `PATCH /api/job-guide` (status: "completed"). “Raporu Güncelle” → `POST /api/job-guide/update` (Gemini + job_guides/job_guide_events güncelleme). Endpoint’ler mevcut ve auth’lı.

**Dosyalar:**  
- `supabase/migrations/024_job_guides.sql`  
- `src/app/api/job-guide/route.ts` (GET/POST/PATCH)  
- `src/app/api/job-guide/update/route.ts` (POST, Gemini)

---

## 10) Endpoint’ler çalışıyor mu?

- **✅** **/api/job-guide/update** (aslında **/api/job-guide/update** route’u) **var:**  
  `src/app/api/job-guide/update/route.ts`
- **Request (POST):**  
  `{ jobGuideId: string, jobPostId: string, answers_json?: Record<string, unknown> }`  
  Headers: `Authorization: Bearer <token>`
- **Response (200):**  
  `{ report_json, report_md, progress_step, next_questions }`  
  Hata: 401, 404, 500 (error/detail).
- **✅** **Gemini** çağrısı **var** (`callGemini`); `maxDuration = 60`, timeout ayrıca belirtilmemiş (fetch default).
- **UI:** Hata durumunda `setToast("Güncelleme başarısız. Tekrar deneyin.")` (handleUpdateReport catch); endpoint hata verirse kullanıcı toast ile görüyor.

**Dosya:** `src/app/api/job-guide/update/route.ts`

---

## 11) En kritik: “İşleme sayfası gelmedi”nin tek cümle kök nedeni

- **En olası tek sebep:** **Layout’ta abonelik kontrolü: abonelik yok veya henüz yüklenmedi sayılıp kullanıcı `/ucretsiz-yurtdisi-is-ilanlari`’e yönlendiriliyor.**  
  Yani **route var, sayfa var**, ama **layout children’ı hiç render etmeden redirect** oluyor.
- **Kanıt:**  
  1) **Dosya:** `src/app/premium/layout.tsx` satır 53–54:  
     `if (authLoading || !user || subscriptionLoading || !subscriptionActive) { return (Yükleniyor…); }`  
     Abonelik false veya loading bitmeden false ise children render edilmez; effect’te de redirect tetiklenir.  
  2) **Mantık:** Feed’de “abonelik aktif” diye panele gidiyorsun; layout mount’ta `useSubscriptionActive` yeniden çalışıyor. İlk frame’de `loading: true` veya geç gelen veri nedeniyle `active: false` kalırsa ya sürekli “Yükleniyor” ya da 1.2 sn sonra refetch ve yine false ise redirect.  
  3) **Ek olasılık:** GET `/api/job-guide?jobPostId=...` **yoksa 404 dönmüyordu** (data null iken 200 + null). Sayfa 404 bekleyip guide oluşturmak için POST atıyor; 200 + null gelince POST atılmıyordu, panel “boş guide” ile açılıyordu. Bu da **davranış hatası** (ilk açılışta guide oluşmama). **Düzeltme:** GET’te `if (!data) return 404` eklendi.

**Özet:**  
- **Ana sebep:** Layout’ta **subscription** (veya auth) yüzünden **redirect**; panel sayfası hiç render edilmiyor.  
- **İkincil:** İlk panele girişte guide’ın oluşması için GET’in “yoksa 404” dönmesi gerekiyordu; bu düzeltildi.

---

# Hızlı Fix Planı (3 adım)

1. **Route’u ayağa kaldırma**  
   - Route zaten var. Elle `/premium/job-guide/<gerçek-job-posts-uuid>` açıp auth + abonelik ile dene.  
   - Eğer hep redirect oluyorsa: **subscription** tarafını kontrol et (premium_subscriptions’da ilgili user için `ends_at > now()` kaydı var mı; client’ta useSubscriptionActive doğru user id ile mi çalışıyor).  
   - Gerekirse layout’ta redirect öncesi `console.log(user?.id, subscriptionActive, subscriptionLoading)` ekle; production’da log’ları izle.

2. **Redirect/guard düzeltme**  
   - Layout’ta: Abonelik **loading** iken redirect yapma; sadece `!subscriptionLoading && !subscriptionActive` iken refetch + redirect.  
   - Refetch sonrası hâlâ false ise redirect (zaten var).  
   - Ödeme/kupon sonrası `premium_subscriptions` insert’inin gerçekten yapıldığını (DB + log) doğrula.  
   - İsteğe bağlı: Layout’ta “Abonelik kontrol ediliyor” gibi kısa bir açıklama metni ile loading süresini netleştir.

3. **Data fetch + RLS + UI finalize**  
   - **GET /api/job-guide:** Rehber yoksa **404** dön (yapıldı).  
   - job_posts zaten public SELECT; RLS/403 riski yok.  
   - UI: Hata durumunda toast zaten var; isteğe bağlı error boundary ekle (premium layout veya job-guide page) ve production’da Sentry (veya başka bir log) ekle ki sessiz crash’ler görünsün.

Bu üç adım: route’un gerçekten “açılması”, redirect’in doğru koşula bağlanması ve data/API/UI’ın tutarlı çalışması.

---

## Uygulanan kesin düzeltme (layout guard + hook + ödeme sayfası)

1. **src/app/premium/layout.tsx**
   - Redirect **sadece** `useEffect` içinde ve **loading bittikten sonra**: `if (authLoading || subscriptionLoading) return;` sonrası `!user` → giris, `!subscriptionActive` → ucretsiz.
   - Render’da redirect koşulu yok; sadece `authLoading || subscriptionLoading` → Loading UI, `!user` / `!subscriptionActive` → Loading UI (redirect effect’te).
   - Debug: `console.log("[PremiumLayout]", { userId, subscriptionLoading, subscriptionActive, authLoading })`.

2. **src/hooks/useSubscriptionActive.ts**
   - Aktiflik **yalnızca** `premium_subscriptions` (ends_at > now()); `profiles.status === 'paid'` fallback kaldırıldı.
   - Sorgu hata verirse `console.error` ile loglanıyor; sessiz false yok.
   - `premium-subscription-invalidate` event’i dinleniyor; ödeme sayfası dispatch edince tüm hook instance’ları refetch yapıyor.

3. **src/app/odeme/basarili/page.tsx**
   - `router.refresh()` + `window.dispatchEvent(new Event("premium-subscription-invalidate"))` ile client hook’lar yeniden fetch ediyor.
   - Kısa gecikmeyle `refetch()` + “Premium paketiniz aktif” mesajı ve “İlanlara Git” linki.
