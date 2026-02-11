# n8n Webhook — Aşamalar ve İşlemler Raporu

## Kayıt mantığı özeti (tüm CV yöntemleri: form, sesli, sohbet)

| Aşama | profiles tablosu | Açıklama |
|--------|-------------------|----------|
| Sihirbaz tamamlanınca | **Kayıt yok** | Veri yalnızca tarayıcıda / sessionStorage'da tutulur. | `profiles`’a yazılır; ödeme beklenmez |
| PayTR ödeme başarılı | **Kayıt oluşur** (status: paid) | Callback'te profile_snapshot'tan insert + webhook |
| Kupon ile tamamlanınca | **Kayıt oluşur** (status: paid) | POST /api/profile/complete-coupon ile insert + webhook |

Yani: **profiles tablosuna kayıt yalnızca PayTR ödemesi başarılı olduğunda veya indirim kuponu ile tamamlandığında** yapılır.

---

## Özet: Webhook ne zaman tetiklenir?

**n8n webhook şu iki durumda tetiklenir:**  
1. PayTR ödemesi başarıyla tamamlandığında (callback).  
2. İndirim kuponu (örn. ADMIN549) ile sipariş tamamlandığında (`/api/profile/complete-coupon`).

Form doldurup sadece profili kaydetmek (draft) webhook’u **tetiklemez**. Bu tasarım gereğidir.

---

## 1. Webhook’un tetiklenmediği durumlar

| Aşama | Webhook tetiklenir mi? |
|--------|-------------------------|
| Kullanıcı formu doldurur | Hayır |
| “Tamamla” → profil `profiles` tablosuna kaydedilir (draft) | Hayır |
| “Paketimi Oluştur” → `/odeme` sayfasına gider | Hayır |
| PayTR iframe açılır, kullanıcı ödeme **yapmadan** kapatır | Hayır |

**Deneme amaçlı sadece form doldurduğunuzda:** Profil Supabase’e yazılır, ancak ödeme olmadığı için PayTR callback çağrılmaz ve **webhook tetiklenmez**. Bu beklenen davranıştır.

---

## 2. Webhook’un tetiklenme anı: PayTR callback

Webhook **sadece** aşağıdaki akışta tetiklenir:

1. Kullanıcı `/odeme` sayfasında PayTR iframe üzerinden ödemeyi **başarıyla** tamamlar.
2. PayTR sunucusu sizin backend’inize **POST** ile bildirim yapar:  
   `POST /api/paytr/callback`
3. Callback route’unda hash doğrulanır ve `status === "success"` ise webhook çağrılır.

Yani: **Ödeme doğrulanmadan webhook tetiklenmez.**

---

## 3. PayTR callback içindeki aşamalar (kod sırasıyla)

Dosya: `src/app/api/paytr/callback/route.ts`

| Sıra | İşlem | Açıklama |
|------|--------|----------|
| 1 | Form verisini al | `merchant_oid`, `status`, `total_amount`, `hash` (PayTR POST body) |
| 2 | Hash doğrula | `makeCallbackHash(merchant_oid, status, total_amount)` ile gelen `hash` karşılaştırılır |
| 3 | Başarı kontrolü | `hashOk && status === "success"` değilse sadece 200 OK dönülür; veritabanı ve webhook **çalışmaz** |
| 4 | Ödeme kaydını bul | `payments` tablosunda `provider_ref = merchant_oid` ve `provider = "paytr"` ile kayıt aranır; `profile_id` alınır |
| 5 | Profil güncelle | `profiles` tablosunda `id = profile_id` olan satırda `status = "paid"`, `updated_at` güncellenir |
| 6 | Ödeme kaydını güncelle | İlgili `payments` satırında `status = "success"` yapılır |
| 7 | Event yaz | `events` tablosuna `type: "payment_success"`, `profile_id`, `payload` ile kayıt eklenir |
| 8 | **n8n webhook çağrısı** | `N8N_CV_WEBHOOK_URL` tanımlı ve `profileId` varsa **GET** isteği atılır (aşağıda detay) |
| 9 | Yanıt | PayTR’ye her durumda `200` + `"OK"` dönülür (hash hatalı veya status failed olsa bile) |

---

## 4. n8n webhook çağrısı (detay)

- **Ne zaman:** Yukarıdaki callback akışında, 1–7. adımlar başarıyla yapıldıktan sonra.
- **Koşullar:**  
  - `process.env.N8N_CV_WEBHOOK_URL` dolu olmalı (Vercel/ortamda tanımlı).  
  - `profileId` bulunmuş olmalı (yani ödeme kaydı `profile_id` ile oluşturulmuş olmalı).

**İstek:**

- **Method:** GET  
- **URL:** `N8N_CV_WEBHOOK_URL` + query parametreleri  
- **Body:** Yok  

**Query parametreleri:**

| Parametre   | Değer | Açıklama |
|------------|--------|----------|
| `profile_id` | UUID | `profiles.id` |
| `payment_id` | string | PayTR `merchant_oid` |
| `status`     | `"success"` | Ödeme durumu |
| `ts`         | ISO 8601 | Çağrı zamanı |

**Örnek:**  
`GET https://.../webhook/...?profile_id=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx&payment_id=ord_123_abc&status=success&ts=2025-02-06T12:00:00.000Z`

Webhook’a CV verisi **gönderilmez**. n8n tarafında `profile_id` ile Supabase’den `profiles` satırı (answers, country, job_area, job_branch, photo_url) okunur.

---

## 4b. Kupon ile tamamlanınca (yeni akış)

Kullanıcı ödeme sayfasında geçerli kuponu (örn. ADMIN549) uyguladığında:

1. `/odeme` sayfası `sessionStorage.paytr_pending` içinden `profile_id` alır.
2. `POST /api/profile/complete-coupon` çağrılır; body: `{ profile_id }`.
3. API: profili `status = "paid"` yapar, `events`’a `payment_success` (source: coupon) yazar, n8n webhook’u GET ile tetikler (`payment_id=coupon`).
4. Ardından kullanıcı `/odeme/basarili` sayfasına yönlendirilir.

Böylece “ödeme tamamlandı” mantığı (profiles paid + webhook) hem PayTR hem kupon için aynıdır.

---

## 5. `profile_id`’nin callback’e kadar gelmesi

Webhook’un tetiklenmesi için callback’te `profileId` bulunmalı. Bu da şu zincire bağlı:

| Adım | Nerede | Ne olur |
|------|--------|---------|
| 1 | Kullanıcı “Paketimi Oluştur” tıklar | `sessionStorage`’a `paytr_pending` yazılır; içinde `profile_id` (form tamamlandığında elde edilen `profiles.id`) vardır |
| 2 | `/odeme` sayfası yüklenir | `paytr_pending` okunur; `profile_id` alınır |
| 3 | `POST /api/paytr/initiate` | Body’de `profile_id` gönderilir; `payments` tablosuna `profile_id` ile kayıt eklenir, `provider_ref = merchant_oid` |
| 4 | PayTR ödeme başarılı | PayTR `POST /api/paytr/callback` çağırır |
| 5 | Callback | `merchant_oid` ile `payments`’tan `profile_id` okunur → webhook’ta kullanılır |

**Önemli:** `/odeme`’e giderken `paytr_pending` içinde `profile_id` yoksa veya initiate’e gönderilmezse, `payments` kaydı `profile_id` olmadan oluşur; callback’te `profileId` null kalır ve **webhook çağrılmaz**.

---

## 6. Kontrol listesi — Webhook tetiklenmiyorsa

1. **Ödeme gerçekten yapıldı mı?**  
   Sadece form kaydı değil, PayTR iframe’de ödeme tamamlanmış olmalı (test/gerçek ödeme).

2. **`N8N_CV_WEBHOOK_URL` tanımlı mı?**  
   PayTR callback’in çalıştığı ortamda (Vercel vb.) bu env’in set olduğundan emin olun.

3. **`profile_id` ödeme ile eşleşiyor mu?**  
   “Paketimi Oluştur” tıklandığında `profile_id` sessionStorage’a yazılıyor mu? `/odeme` bu `profile_id`’yi `/api/paytr/initiate` body’sine ekliyor mu? Initiate’te `payments` insert’inde `profile_id` kullanılıyor (mevcut kodda kullanılıyor).

4. **PayTR callback erişilebilir mi?**  
   PayTR’nin `POST /api/paytr/callback` adresinize dışarıdan erişebildiğini (URL, firewall) doğrulayın.

5. **n8n webhook testi:**  
   n8n’de Webhook node’u “Listen” modunda mı, URL doğru mu? Tarayıcı veya Postman ile aynı GET URL’i (profile_id, payment_id, status, ts) ile deneyip tetiklenip tetiklenmediğini kontrol edin.

---

## 7. Özet tablo

| Olay | profiles satırı | Webhook tetiklenir |
|------|------------------|---------------------|
| Sihirbaz tamamla (form/sesli/sohbet) | Oluşmaz | Hayır |
| Paketimi Oluştur → /odeme | Oluşmaz (veri sessionStorage + payments.profile_snapshot) | Hayır |
| PayTR’de ödeme başarılı → callback | Oluşur (snapshot’tan insert, status: paid) | **Evet** |
| Kupon uygula (ADMIN549) → complete-coupon | Oluşur (insert, status: paid) | **Evet** |

**Sonuç:** profiles tablosuna kayıt **yalnızca** PayTR ödemesi başarılı olduğunda veya kupon ile tamamlandığında yapılır.
