# Web Push Bildirimleri Kurulum Rehberi

## 1. VAPID Keys Oluşturma

Web push bildirimleri için VAPID (Voluntary Application Server Identification) anahtarları gereklidir.

### Node.js ile VAPID Keys Oluşturma

```bash
npm install -g web-push
web-push generate-vapid-keys
```

Çıktı:
```
Public Key: <PUBLIC_KEY>
Private Key: <PRIVATE_KEY>
```

### Vercel Environment Variables

`.env.local` ve Vercel dashboard'da şu değişkenleri ekleyin:

```env
VAPID_PUBLIC_KEY=<PUBLIC_KEY>
VAPID_PRIVATE_KEY=<PRIVATE_KEY>
VAPID_SUBJECT=mailto:admin@ilanlarcebimde.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<PUBLIC_KEY>
CRON_SECRET=<rastgele-güvenli-string>
```

**ÖNEMLİ:** `NEXT_PUBLIC_VAPID_PUBLIC_KEY` client-side'da kullanılacak, bu yüzden public olabilir. Diğerleri kesinlikle secret olmalı.

## 2. Service Worker Kaydı

Service Worker otomatik olarak `/sw.js` dosyasından kaydedilir. `src/lib/push.ts` içindeki `registerServiceWorker()` fonksiyonu bunu yapar.

## 3. n8n Webhook Entegrasyonu

Günlük yayın bittiğinde n8n'den şu endpoint'e POST isteği gönderin:

```
POST https://your-domain.com/api/push/notify-daily
Headers:
  Content-Type: application/json
  x-cron-secret: <CRON_SECRET>
Body:
{
  "channelSlug": "katar",
  "date": "2026-02-19",
  "countNew": 12,
  "topTitle": "Senior Software Engineer"
}
```

## 4. Kullanıcı Akışı

1. Kullanıcı Header'daki "Bildirimleri Aç" butonuna tıklar
2. Tarayıcı bildirim izni ister
3. İzin verilirse Service Worker kaydedilir ve push subscription oluşturulur
4. Subscription Supabase'e kaydedilir
5. Kullanıcının abone olduğu kanallar için `push_prefs` otomatik oluşturulur (enabled=true)

## 5. Kanal Bazlı Bildirim Kontrolü

Sidebar'da her kanalın yanında 🔔 ikonu görünür (hover'da). Bu toggle ile kanal bazlı bildirim açılıp kapatılabilir.

## 6. Bildirim İçeriği

Push bildirimi şu formatta gönderilir:

```json
{
  "title": "Katar: Bugünkü ilanlar yayında",
  "body": "12 yeni ilan eklendi. En yenisi: Senior Software Engineer",
  "url": "/aboneliklerim?kanal=katar&day=2026-02-19",
  "channelSlug": "katar"
}
```

## 7. Expired Endpoint Temizliği

410/404 hatası alan endpoint'ler otomatik olarak `is_active=false` yapılır ve `push_delivery_log` tablosuna kaydedilir.

## 8. Güvenlik

- `notify-daily` endpoint'i `x-cron-secret` header'ı ile korunur
- Sadece n8n bu secret'ı bilir
- RLS politikaları kullanıcıların sadece kendi subscription'larını görmesini sağlar

## 9. Test

1. Local'de test için VAPID keys oluşturun
2. `.env.local` dosyasına ekleyin
3. `npm run dev` ile çalıştırın
4. Tarayıcıda bildirim izni verin
5. `curl` ile test edin:

```bash
curl -X POST http://localhost:3000/api/push/notify-daily \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: <CRON_SECRET>" \
  -d '{"channelSlug":"katar","countNew":5}'
```
