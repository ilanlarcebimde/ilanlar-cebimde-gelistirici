# "Nasıl Başvururum?" Butonu – Tıklama Akışı

Butona tıkladığında hangi işlemlerin, hangi sırayla gerçekleştiği.

---

## 1. Buton ve ilk tetikleme

| Adım | Nerede | Ne oluyor |
|------|--------|-----------|
| 1.1 | **FeedPostCard** (`src/components/kanal/FeedPostCard.tsx`) | Kullanıcı **"Nasıl Başvururum?"** butonuna tıklar. |
| 1.2 | Aynı bileşen | `onClick` → `handleApplyClick()` çalışır. |
| 1.3 | Aynı bileşen | Console’a `HOWTO CLICK <post.id>` yazılır. |
| 1.4 | Aynı bileşen | Varsa **parent’tan gelen** `onHowToApplyClick(post)` çağrılır; `post` o karttaki ilan (id, title, …). |

**Not:** Bu buton şu sayfalarda kullanılıyor; her birinde parent kendi `handleHowToApplyClick`’ini `onHowToApplyClick` olarak veriyor:

- `/ucretsiz-yurtdisi-is-ilanlari` → **UcretsizPanelClient**
- `/yurtdisi-is-ilanlari` → **YurtdisiPanelClient**
- `/aboneliklerim` → **ChannelsLayout** → ChannelsFeed
- `/kanal/[slug]` → **KanalFeedClient**

Akış aynı; aşağıda tek parent örneği (ör. UcretsizPanelClient) üzerinden anlatılıyor.

---

## 2. Parent’ta karar: Giriş / Abonelik / Panele git

**Dosya:** İlan listesi sayfasındaki client (örn. `src/app/ucretsiz-yurtdisi-is-ilanlari/UcretsizPanelClient.tsx`)

| Adım | Ne oluyor |
|------|-----------|
| 2.1 | `handleHowToApplyClick(post)` çağrılır. |
| 2.2 | Toast: **"Kontrol ediliyor…"** gösterilir. |
| 2.3 | **Giriş kontrolü:** `user` yoksa → **Auth modal** açılır, toast: *"Panele erişmek için giriş yapın."* → **Biter (panele gidilmez).** |
| 2.4 | **Abonelik kontrolü:** `subscriptionLoading` false ve `subscriptionActive` false ise → **Premium tanıtım modal** açılır, toast: *"Premium panele erişmek için abonelik gerekiyor."* → **Biter (panele gidilmez).** |
| 2.5 | Giriş var ve (abonelik yüklüyse veya aktifse) → Toast **"Yönlendiriliyor…"** yapılır, `router.push("/premium/job-guide/" + post.id)` çağrılır. |

Yani tek tıklamada ya modal açılıyor ya da **aynı tarayıcıda** `/premium/job-guide/<ilan-id>` sayfasına gidiliyor.

---

## 3. Premium layout (guard)

**Dosya:** `src/app/premium/layout.tsx`

URL `/premium/job-guide/[jobId]` olduğu için bu layout her zaman çalışır.

| Adım | Ne oluyor |
|------|-----------|
| 3.1 | Console’a **PREMIUM GUARD** log’u yazılır: `{ userId, subscriptionLoading, subscriptionActive, authLoading }`. |
| 3.2 | **Auth yükleniyor** veya **abonelik yükleniyor** ise → Sadece **"Kontrol ediliyor…"** ekranı gösterilir; **redirect yok.** |
| 3.3 | Yükleme bitti, **giriş yok** (`!user`) → `sessionStorage`’a `premium_redirect_reason = no_auth` yazılır → **`/giris?next=...`** sayfasına yönlendirilir. |
| 3.4 | Giriş var, **abonelik yok** (`!subscriptionActive`) → `sessionStorage`’a `premium_redirect_reason = no_subscription` yazılır → **`/ucretsiz-yurtdisi-is-ilanlari`** sayfasına yönlendirilir. |
| 3.5 | Giriş var ve abonelik aktif → Layout **children**’ı (yani panel sayfası) render eder; **panel açılır.** |

---

## 4. Panel sayfası ve JobGuideClient

**Dosyalar:**  
`src/app/premium/job-guide/[jobId]/page.tsx`  
`src/app/premium/job-guide/[jobId]/JobGuideClient.tsx`

| Adım | Ne oluyor |
|------|-----------|
| 4.1 | URL’deki `jobId` (ilan id) `params`’tan alınır. |
| 4.2 | `<JobGuideClient key={jobId} jobId={jobId} />` render edilir. `key={jobId}` sayesinde ilan değişince component baştan mount olur. |
| 4.3 | Console’a **JOB GUIDE MOUNT** `<jobId>` yazılır. |
| 4.4 | İlk anda **"Premium Başvuru Paneli"** ve **"İlan yükleniyor…"** (ve placeholder soru) gösterilir. |
| 4.5 | **Paralel istekler:**  
  - `GET /api/job-posts/<jobId>` → İlan bilgisi (başlık, konum, kaynak, snippet, …)  
  - `GET /api/job-guide?jobPostId=<jobId>` → Bu kullanıcı + bu ilan için rehber (varsa) |
| 4.6 | İlan bulunamazsa → `/premium/job-guides` listesine yönlendirilir. |
| 4.7 | Rehber **yoksa (404)** → `POST /api/job-guide` ile **draft rehber** oluşturulur (`job_guides` tablosuna yeni satır). |
| 4.8 | İlan + rehber (veya yeni oluşturulan draft) state’e yazılır, loading biter → **Tam panel UI** çizer: ilan kartı, ilerleme adımları, rapor alanı, soru–cevap (AssistantChat). |

---

## 5. Özet sıra (panele kadar)

```
[Kullanıcı] "Nasıl Başvururum?" tıklar
    → FeedPostCard: HOWTO CLICK + onHowToApplyClick(post)
    → Parent (örn. UcretsizPanelClient): "Kontrol ediliyor…" toast
    → user yok mu? → Auth modal + toast "Giriş yapın" → BİTER
    → Abonelik yok mu? → Premium modal + toast "Abonelik gerekli" → BİTER
    → Aksi halde: "Yönlendiriliyor…" + router.push("/premium/job-guide/" + post.id)

[Next.js] /premium/job-guide/[jobId] sayfası yüklenir
    → Premium layout çalışır: PREMIUM GUARD log
    → Auth/abonelik yoksa redirect (giris veya ucretsiz-yurtdisi-is-ilanlari)
    → Varsa: children render → page.tsx → JobGuideClient key={jobId} jobId={jobId}

[JobGuideClient] Mount
    → JOB GUIDE MOUNT <jobId>
    → "İlan yükleniyor…" shell
    → GET /api/job-posts/<id> + GET /api/job-guide?jobPostId=<id>
    → Rehber yoksa POST /api/job-guide (draft oluştur)
    → State dolar → İlan kartı + İlerleme + Rapor + Soru-cevap gösterilir
```

---

## 6. Hangi sayfa hangi handler’ı kullanıyor?

| Sayfa / bileşen | Handler’ın tanımlandığı yer | Feed nereden geliyor |
|------------------|-----------------------------|------------------------|
| Ücretsiz Yurtdışı İş İlanları | UcretsizPanelClient | PanelFeed (job_posts) |
| Yurtdışı İş İlanları (aboneliklerim) | YurtdisiPanelClient | PanelFeed |
| Aboneliklerim (kanallar) | ChannelsLayout | ChannelsFeed |
| Kanal sayfası `/kanal/[slug]` | KanalFeedClient | job_posts (o kanal) |

Tümünde mantık aynı: giriş yoksa auth, abonelik yoksa premium modal; ikisi de varsa `router.push("/premium/job-guide/" + post.id)`.
