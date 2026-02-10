# Cursor'a yapıştırılacak master prompt (tek parça)

Aşağıdaki tüm metni kopyalayıp Cursor chat'e yapıştırabilirsin. Aynı kurallar `.cursor/rules/profiles-and-n8n-webhook.mdc` içinde de kayıtlı (her oturumda uygulanır).

---

```
CURSOR AI MASTER PROMPT — profiles tablosu SABİT, ödeme sonrası n8n webhook tetiklemesi

NON-NEGOTIABLE (TABLOYU BOZMA)
- Supabase `profiles` tablosunun kolonları, tipleri ve yapısı KESİNLİKLE değiştirilmeyecek.
- Yeni kolon ekleme, kolon adı değiştirme, tip değiştirme, json yapısını dönüştürme YASAK.
- `answers` alanı jsonb olarak aynen kalacak; içeriği dönüştürme / yeniden şema tasarlama yapma.
- `photo_url` alanı string url olarak kalacak.
- `is_cv_sent` alanı bool; n8n tarafından yönetiliyor. Bu alana uygulama tarafından mantık ekleme / değiştirme yapma.

profiles (mevcut şema örneği, referans):
- id (uuid)  ✅ primary id
- status (text) ör: draft/paid
- method (text) ör: form
- user_id (uuid, auth.users.id FK)
- created_at (timestamptz)
- updated_at (timestamptz)
- country (text)
- job_area (text)
- job_branch (text)
- answers (jsonb)
- photo_url (text)
- is_cv_sent (bool)

AMAÇ
- Kullanıcı CV sihirbazını tamamlayıp ödeme yaptıktan sonra (PayTR callback success doğrulandıktan sonra),
- n8n production webhook'u tetikle.
- n8n yalnızca profile_id (profiles.id UUID) ile `profiles` satırını okur ve otomasyonu yürütür.
- Uygulama n8n'nin CV üretimi / email / is_cv_sent gibi işlerine karışmaz.

N8N WEBHOOK (MEVCUT, DEĞİŞTİRME)
- Production URL (GET):
https://s02c0alq.rcld.app/webhook/3a77a8ff-c51b-4a03-98a4-931df0b22c0e
- Method: GET
- Auth: None
- Respond: Immediately
- Body yok; query param kullan

Webhook query param sözleşmesi (minimum):
- profile_id = profiles.id (UUID)  (ZORUNLU)
- payment_id = merchant_oid        (opsiyonel ama önerilir)
- status = success                (opsiyonel ama önerilir)
- ts = ISO timestamp              (opsiyonel ama önerilir)

Örnek çağrı:
GET .../webhook/<path>?profile_id=<UUID>&payment_id=<OID>&status=success&ts=<ISO>

UYGULAMA AKIŞI (Next.js App Router)
1) CV wizard tamamlandığında:
- profiles tablosuna kayıt zaten yazılıyor (answers, country, job_area, job_branch, photo_url, user_id, status='draft', method='form').
- Bu kayıt ID'si (profiles.id UUID) frontend tarafında sessionStorage içine kaydedilir: paytr_pending.profile_id

2) /api/paytr/initiate:
- profile_id request ile gönderilir (sadece ilişkilendirme amaçlı).
- payments tablosu üzerinden provider_ref (merchant_oid) ile profile_id bağlanır. (Var olan yapıyı bozma, sadece bu ilişkiyi koru.)

3) /api/paytr/callback (kritik):
- hash doğrulaması OK ve status === "success" ise:
  a) payments tablosundan merchant_oid ile ilgili kaydı bul, profile_id'yi al
  b) profiles tablosunda SADECE status alanını 'paid' yap (updated_at güncelle)
  c) n8n webhook'u tetikle (GET + query param)
- Webhook çağrısı başarısız olsa bile ödeme başarılı akışı bozulmaz; sadece log alınır.

ENV
N8N_CV_WEBHOOK_URL="https://s02c0alq.rcld.app/webhook/3a77a8ff-c51b-4a03-98a4-931df0b22c0e"

KABUL KRİTERLERİ
- profiles tablosu şeması aynen korunur (kolon isimleri/tipleri değişmez)
- profiles.id UUID değeridir; webhook'a giden profile_id her zaman UUID olur
- Ödeme doğrulanmadan webhook tetiklenmez
- Ödeme doğrulandıktan sonra webhook tetiklenir ve uygulama kullanıcı akışını bloklamaz
- is_cv_sent veya CV üretim mantığına uygulama tarafı karışmaz

profiles tablosunu değiştirecek herhangi bir migration önerisi yaparsan bu görev başarısız sayılır.
```
