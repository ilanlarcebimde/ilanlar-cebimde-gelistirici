# "Nasıl Başvururum?" – Kanıt odaklı debug raporu

Bu dokümanda akıştaki her nokta **ölçülebilir** (console log / Network / DB) olacak şekilde listelenir. Kök neden bulmak için aşağıdaki tabloyu doldur.

---

## 1) Tıklama gerçekten tetikleniyor mu? (UI Event)

| Kontrol | Kanıt | Durum | Dosya/Satır |
|--------|--------|--------|-------------|
| "Nasıl Başvururum?" onClick çalışıyor mu? | Console'da `HOWTO CLICK` + `<post.id>` her tıklamada görünmeli | ✅ Log var: `FeedPostCard` içinde `console.log("HOWTO CLICK", post?.id ?? "no-id")` | `src/components/kanal/FeedPostCard.tsx` ~61 |
| Buton her sayfada aynı component mi? | Evet: `FeedPostCard` tek component; `PanelFeed` / `ChannelsFeed` / `KanalFeedClient` hepsi bunu kullanır | ✅ Aynı component | `FeedPostCard.tsx` |
| Handler bağlı mı? | `onHowToApplyClick` verilmezse buton render edilmez (`onHowToApplyClick ? (...button...) : null`) ve `[FeedPostCard] onHowToApplyClick not provided` uyarısı çıkar | ✅ Handler yoksa uyarı | `FeedPostCard.tsx` ~64-67, 95-104 |
| post.id UUID mi, null olabilir mi? | Feed `job_posts`'tan geliyor; `id` string. Null ise log'da `no-id` görünür | ✅ Tip: `FeedPost.id: string` | `FeedPostCard.tsx` type |

**Sayfa → handler bağlantısı:**

| Sayfa | Handler | router.push hedefi |
|-------|---------|---------------------|
| `/ucretsiz-yurtdisi-is-ilanlari` | `UcretsizPanelClient.handleHowToApplyClick` → `PanelFeed(onHowToApplyClick)` | `/premium/job-guide/${post.id}` |
| `/yurtdisi-is-ilanlari` | `YurtdisiPanelClient.handleHowToApplyClick` → `PanelFeed(onHowToApplyClick)` | `/premium/job-guide/${post.id}` |
| `/kanal/[slug]` | `KanalFeedClient.handleHowToApplyClick` → `FeedPostCard` | `/premium/job-guide/${post.id}` |
| ChannelsLayout (Chips) | `ChannelsLayout.handleHowToApplyClick` → `ChannelsFeed` → `FeedPostCard` | `/premium/job-guide/${post.id}` |

---

## 2) router.push gerçekten çalışıyor mu? (Navigation)

| Kontrol | Kanıt | Fix önerisi |
|--------|--------|--------------|
| Tıklayınca URL `/premium/job-guide/<jobId>` oluyor mu? | Tarayıcı adres çubuğu veya Network'te ilgili doc isteği. Handler'da `console.log("[UcretsizPanel] opening panel", target)` vb. | URL değişmiyorsa: handler'da `subscriptionActive === false` ise `router.push` hiç çağrılmıyor; önce premium modal açılıyor |
| push çağrılıyor ama URL değişmiyor mu? | Buton `type="button"` (form submit yok). `event.preventDefault()` yok, gerek de yok | Form içindeyse form'a `onSubmit` e.preventDefault() ekle |
| URL değişiyor ama ~200ms sonra eski sayfaya dönüyor mu? | Bu **premium layout redirect**. Console'da `[PremiumLayout] redirect: no_subscription` veya `no_auth` görünür | Aşağıdaki “Premium layout” ve “useSubscriptionActive” maddelerine bak |

---

## 3) Premium layout neden redirect ediyor? (Guard)

| Kontrol | Kanıt | Fix önerisi |
|--------|--------|--------------|
| Redirect koşulları | `!user` → giriş sayfası, `!subscriptionActive` → `/ucretsiz-yurtdisi-is-ilanlari` | - |
| Log var mı? | Console: `[PremiumLayout] { userId, authLoading, subscriptionLoading, subscriptionActive }` ve redirect anında `[PremiumLayout] redirect: no_auth` veya `no_subscription` | Log yoksa eklendi: `src/app/premium/layout.tsx` |
| sessionStorage yazılıyor mu? | Redirect öncesi `sessionStorage.setItem("premium_redirect_reason", "no_auth" | "no_subscription")`. Geri atıldıktan sonra `sessionStorage.getItem("premium_redirect_reason")` ile okuyup toast gösteriliyor | UcretsizPanelClient'ta `no_subscription` ise modal açılıyor |

**Layout sırası:** Önce `authLoading || subscriptionLoading` ise redirect yok (Loading UI). Bittikten sonra `!user` → no_auth, yoksa `!subscriptionActive` → no_subscription.

---

## 4) useSubscriptionActive doğru kaynağa mı bakıyor?

| Kontrol | Kanıt | Fix önerisi |
|--------|--------|--------------|
| Sorgu | `premium_subscriptions` tablosu, `user_id = userId`, `ends_at > now()` (client'ta `new Date().toISOString()`), `limit(1)` | - |
| Timezone | Supabase `timestamptz`; `now()` sunucu saati. Client `new Date().toISOString()` UTC. Türkiye UTC+3 ise karşılaştırma tutarlı olmalı | ends_at geçmişe set edilmişse (örn. yanlış hesaplama) hook false döner; callback/kupon insert'te ends_at'i kontrol et |
| RLS / token | Client Supabase = auth token ile istek. Policy: `auth.uid() = user_id` ile SELECT. Token'daki user ile DB'deki user_id aynı olmalı | 401/403 ise RLS veya token süresi; getSession/getUser kontrolü |
| PayTR callback insert | Callback'te `premium_subscriptions.insert({ user_id: userId, ... })`. userId, `payments` satırından; ödeme başlatırken `user_id` gönderilmeli | Initiate'ta body'de `user_id` var; callback'te payment'tan alınıyor |

**Console:** Her sorgu sonrası `SUBSCRIPTION RESULT { userId, rowCount, error, active }` log'u var.

---

## 5) Invalidate event + refetch

| Kontrol | Kanıt | Fix önerisi |
|--------|--------|--------------|
| Event nerede dinleniyor? | `useSubscriptionActive` içinde: `window.addEventListener("premium-subscription-invalidate", onInvalidate)` | - |
| Event nerede tetikleniyor? | Odeme başarı sayfası mount, kupon başarı (modal + odeme sayfası): `window.dispatchEvent(new Event("premium-subscription-invalidate"))` | - |
| Refetch tetikleniyor mu? | Listener'da `if (userId) void refetch()`. Network'te `premium_subscriptions` için yeni istek atılmalı | Refetch gitmiyorsa userId o an null olabilir (layout'ta hook henüz user almamış olabilir) |
| 500ms bekleme | Kupon/ödeme sonrası redirect öncesi 500ms bekleniyor; refetch tamamlanmadan redirect olabilir | İstersen redirect'i refetch bitene kadar erteleyebilirsin (await refetch() sonra redirect) |

---

## 6) DB kanıtı: premium_subscriptions

Kullanıcının `auth.user.id` değerini console'dan al (örn. `[PremiumLayout]` log'undaki `userId`). Sonra:

```sql
SELECT user_id, created_at, ends_at
FROM premium_subscriptions
WHERE user_id = '<AUTH_USER_ID>'
ORDER BY created_at DESC
LIMIT 5;
```

Console'da `[SUBSCRIPTION RESULT]` log'unda `row.ends_at` ne geliyor? (null mı, gelecek tarih mi?) — ends_at geçmişse hook false döner.

| Bulgu | Anlamı |
|-------|--------|
| Kayıt yok | Insert yapılmıyor veya yanlış user_id (PayTR callback / kupon API user_id'yi doğru alıyor mu?) |
| ends_at geçmiş | Abonelik süresi bitmiş veya insert'te ends_at yanlış (örn. 7 gün eklenmemiş) |
| Kayıt var, ends_at gelecekte | Hook neden false dönüyor? RLS, token, veya userId uyuşmazlığı |

---

## 7) Doğru route: job-guide vs job-guides

| Kontrol | Kanıt |
|--------|--------|
| Tek ilan paneli | Tıklayınca hedef **`/premium/job-guide/<jobId>`** (tekil). `jobId = post.id` (job_posts.id). |
| Liste sayfası | `/premium/job-guides` (çoğul) sadece “başvuru paneli” listesi; ilan kartından giderken kullanılmaz. |
| post.id | Feed'deki `post` = job_posts satırı; `post.id` = job_posts.id (UUID). Yanlış alan kullanılmıyor. |

---

## 8) job_posts 404

| Kontrol | Kanıt | Fix |
|--------|--------|-----|
| GET /api/job-posts/[id] 404 | Panel açılıyor ama içerik boş; Network'te job-posts isteği 404 | job_posts'ta o id ile satır var mı, `status = 'published'` mi kontrol et |
| post.id ile DB uyumu | Feed `job_posts` (published) ile dolduruluyor; `post.id` = `job_posts.id` | Farklı kaynaktan gelen post kullanılıyorsa id eşleşmesini kontrol et |

---

## 9) API 401 (token)

| Kontrol | Kanıt |
|--------|--------|
| /api/job-guide, /api/job-guide/update | İsteklerde `Authorization: Bearer <token>` gidiyor mu? (getSession / getSupabaseForUser) |
| Server token | getSupabaseForUser(token) ile kullanıcı scope'lu client; RLS auth.uid() ile eşleşmeli |

---

## 10) Özet tablo (Cursor çıktısı)

Aşağıyı test sonrası doldur:

| Soru | Cevap | Kanıt |
|------|--------|--------|
| Tıklama log'u geliyor mu? | Evet / Hayır | Console'da `HOWTO CLICK` + id |
| URL `/premium/job-guide/<id>` oluyor mu? | Evet / Hayır | Adres çubuğu veya handler log'u |
| [PremiumLayout] log'unda subscriptionActive ne? | true / false | Console `[PremiumLayout]` |
| DB'de premium_subscriptions kaydı var mı? | Var / Yok | SQL sonucu |

**En sık 3 kök neden:**

1. **premium_subscriptions kaydı yok veya ends_at geçmiş** → Hook false, layout redirect (no_subscription).
2. **Tıklama / push hiç olmuyor** → O sayfada handler bağlı değil veya subscriptionActive false olduğu için handler panele gitmeden modal açıyor.
3. **Push oluyor, URL değişiyor, hemen geri atılıyor** → Layout subscriptionActive false (invalidate/refetch yetişmiyor veya timezone/ends_at).

---

## Hızlı 3 soru (tek hamle fix için)

Test sonrası şunları yanıtla:

1. **Tıklayınca URL değişiyor mu?** (evet/hayır)  
2. **[PremiumLayout] log'unda subscriptionActive ne?** (true/false)  
3. **premium_subscriptions’da bu user için kayıt var mı?** (var/yok)  

Bu 3 cevapla kesin fix yönü netleşir.
