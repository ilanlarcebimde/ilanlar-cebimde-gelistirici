# n8n Webhook — İşlem Raporu

Bu dokümanda uygulamanın n8n webhook’u **ne zaman**, **nereden** ve **nasıl** tetiklediği raporlanmaktadır.

---

## 1. Webhook nedir ve nerede tanımlı?

- **Amaç:** Ödeme veya kupon ile sipariş tamamlandığında n8n’e haber vermek. n8n bu sayede ilgili profili Supabase’den okuyup CV üretimi, e-posta, bülten vb. işlemleri yapabilir.
- **Ortam değişkeni:** `N8N_CV_WEBHOOK_URL` (örn. `https://xxx.rcld.app/webhook/xxx`)
- **Tetikleyen taraf:** Next.js API route’ları (sunucu). Tarayıcı webhook’u **doğrudan** çağırmaz.

---

## 2. Webhook tetiklenme noktaları

Webhook **yalnızca iki yerde** tetiklenir:

| # | Tetikleyen olay | Dosya | Ne zaman |
|---|-----------------|--------|----------|
| 1 | PayTR ödemesi başarılı | `src/app/api/paytr/callback/route.ts` | PayTR sunucusu `POST /api/paytr/callback` ile bildirim yaptığında, hash ve status doğrulandıktan sonra |
| 2 | Kupon ile tamamlama (ADMIN549) | `src/app/api/profile/complete-coupon/route.ts` | Kullanıcı ödeme sayfasında kuponu uygulayıp API çağrıldığında, profil `profiles`’a yazıldıktan sonra |

---

## 3. Yapılan işlemler (adım adım)

### 3.1 PayTR callback’te webhook işlemi

**Dosya:** `src/app/api/paytr/callback/route.ts`

**Sıra:**

1. PayTR’den gelen `merchant_oid`, `status`, `hash` alınır ve hash doğrulanır.
2. `status === "success"` ise `payments` tablosunda `provider_ref = merchant_oid` ile kayıt aranır.
3. Kayıtta `profile_snapshot` varsa bu veriden `profiles` tablosuna yeni satır eklenir (`status: "paid"`); yoksa mevcut `profile_id` ile profil güncellenir.
4. `payments` ve `events` güncellenir / yazılır.
5. **Webhook çağrısı:**
   - `N8N_CV_WEBHOOK_URL` env’i okunur.
   - `profileId` (yeni veya mevcut profil id) yoksa webhook **çağrılmaz**.
   - Varsa aşağıdaki GET isteği atılır (try/catch; hata olsa bile PayTR’ye 200 OK dönülür).

**Kod (webhook kısmı):**

```ts
const webhookUrl = process.env.N8N_CV_WEBHOOK_URL;
if (webhookUrl && profileId) {
  try {
    const url = new URL(webhookUrl.trim());
    url.searchParams.set("profile_id", profileId);
    url.searchParams.set("payment_id", merchant_oid);
    url.searchParams.set("status", "success");
    url.searchParams.set("ts", new Date().toISOString());
    await fetch(url.toString(), { method: "GET" });
  } catch (err) {
    console.error("[PayTR callback] n8n webhook failed", err);
  }
}
```

---

### 3.2 Kupon (complete-coupon) ile webhook işlemi

**Dosya:** `src/app/api/profile/complete-coupon/route.ts`

**Sıra:**

1. İstek body’sinden profil verisi alınır (method, country, job_area, job_branch, answers, photo_url).
2. `profiles` tablosuna yeni satır eklenir (`status: "paid"`).
3. `events` tablosuna `payment_success` (source: coupon) yazılır.
4. **Webhook çağrısı:**
   - `N8N_CV_WEBHOOK_URL` env’i okunur.
   - Tanımlıysa aşağıdaki GET isteği atılır.

**Kod (webhook kısmı):**

```ts
const webhookUrl = process.env.N8N_CV_WEBHOOK_URL;
if (webhookUrl) {
  try {
    const url = new URL(webhookUrl.trim());
    url.searchParams.set("profile_id", profileId);
    url.searchParams.set("payment_id", "coupon");
    url.searchParams.set("status", "success");
    url.searchParams.set("ts", new Date().toISOString());
    await fetch(url.toString(), { method: "GET" });
  } catch (err) {
    console.error("[complete-coupon] n8n webhook failed", err);
  }
}
```

---

## 4. Webhook isteği formatı

Her iki tetikleyicide de aynı format kullanılır:

| Özellik | Değer |
|---------|--------|
| **HTTP metodu** | GET |
| **URL** | `N8N_CV_WEBHOOK_URL` (query parametreleri eklenir) |
| **Body** | Yok |

**Query parametreleri:**

| Parametre | PayTR callback’te | Kupon (complete-coupon) |
|-----------|--------------------|-------------------------|
| `profile_id` | Oluşturulan/güncellenen `profiles.id` (UUID) | Yeni eklenen `profiles.id` (UUID) |
| `payment_id` | PayTR `merchant_oid` (örn. `ord_123_abc`) | `"coupon"` |
| `status` | `"success"` | `"success"` |
| `ts` | Çağrı anının ISO 8601 zamanı | Çağrı anının ISO 8601 zamanı |

**Örnek URL (PayTR):**  
`https://xxx/webhook/yyy?profile_id=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee&payment_id=ord_1739_xyz&status=success&ts=2025-02-06T14:30:00.000Z`

**Örnek URL (Kupon):**  
`https://xxx/webhook/yyy?profile_id=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee&payment_id=coupon&status=success&ts=2025-02-06T14:30:00.000Z`

---

## 5. n8n tarafında yapılacaklar

1. Webhook node’unda **GET** isteğini dinleyin.
2. Query’den `profile_id` (UUID) alın.
3. Supabase’de `profiles` tablosunda `id = profile_id` satırını okuyun (`answers`, `country`, `job_area`, `job_branch`, `photo_url`).
4. CV üretimi, e-posta, bülten vb. işlemleri bu veriyle yapın.
5. İstenirse `profiles.is_cv_sent` veya `profiles.status` alanını n8n tarafından güncelleyin (uygulama bu alanlara yazmaz).

**Not:** CV verisi webhook isteğinin body’sinde **gönderilmez**; tüm veri Supabase `profiles` tablosundan okunur.

---

## 6. Özet tablo

| Tetikleyici | Dosya | profile_id kaynağı | payment_id |
|-------------|--------|--------------------|------------|
| PayTR ödeme başarılı | `api/paytr/callback/route.ts` | profile_snapshot’tan oluşturulan veya mevcut kayıt | PayTR merchant_oid |
| Kupon (ADMIN549) | `api/profile/complete-coupon/route.ts` | Yeni eklenen profil satırı | `"coupon"` |

Her iki durumda da webhook **GET** ile çağrılır; `profile_id`, `payment_id`, `status`, `ts` query parametreleriyle iletilir.
