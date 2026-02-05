# ilanlar cebimde — Usta Başvuru Paketi

Yurtdışında iş arayan ustalar için tek sayfa premium landing + CV bilgi toplama ve ödeme akışı.

## Özellikler

- **Tek sayfa:** Hero, hizmet kartları, CV yöntem seçimi (Sesli / Sohbet / Form), wizard, ülkeler, meslekler, “Neyi çözüyoruz?”, footer
- **Üç wizard modu:** Sesli asistan (modal), sohbet (chat), form (accordion)
- **Ortak:** Profil fotoğrafı yükleme (Supabase Storage altyapısına uygun)
- **Ödeme akışı:** Tamamla → Ödeme Yap (e-posta zorunlu) → Giriş modalı → PayTR iframe (`/odeme`) → Başarılı/Başarısız sayfaları
- **Veri:** Supabase şeması (profiles, events, uploads), taslak kayıt ve event loglama hazır
- **Tema:** Açık, premium, yumuşak gölgeler, responsive, Türkçe

## Kurulum

```bash
npm install
cp .env.local.example .env.local
# .env.local içine Supabase ve (isteğe bağlı) PayTR / Gemini değerlerini ekleyin
npm run dev
```

Tarayıcıda: [http://localhost:3000](http://localhost:3000)

## Ortam Değişkenleri

| Değişken | Açıklama |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase proje URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `PAYTR_MERCHANT_ID` | PayTR mağaza ID (sunucu) |
| `PAYTR_MERCHANT_KEY` | PayTR mağaza key – hash için (sunucu, gizli) |
| `PAYTR_MERCHANT_SALT` | PayTR salt – hash için (sunucu, gizli) |
| `NEXT_PUBLIC_SITE_URL` | Sitenin tam adresi (callback/redirect için), örn. `https://www.ilanlarcebimde.com` veya `http://localhost:3000` |
| `PAYTR_TEST_MODE` | İsteğe bağlı; `1` ise PayTR’ye test_mode=1 gider |
| `GEMINI_API_KEY` | Google Gemini (CV metin/yapılandırma, opsiyonel) |

## PayTR

- **Token / iframe:** `POST /api/paytr/initiate` (JSON: `merchant_oid`, `email`, `amount`, isteğe bağlı `user_name`, `merchant_ok_url`, `merchant_fail_url`, `basket_description`) → yanıt: `{ success, token, iframe_url }`.
- **Bildirim:** PayTR panelinde **Bildirim URL** olarak `{NEXT_PUBLIC_SITE_URL}/api/paytr/callback` girilir (sonunda slash yok). Bu endpoint her zaman **200** ve gövde **OK** (text/plain) döner; redirect yok.
- **Sayfalar:** `/odeme` (iframe), `/odeme/basarili`, `/odeme/basarisiz`. Middleware ile `/api/paytr/callback` için redirect uygulanmaz.

## Supabase

Migration: `supabase/migrations/001_initial_schema.sql`

- **profiles:** draft/completed/paid durumunda CV verisi (method, country, job_area, job_branch, answers jsonb, photo_url)
- **events:** profile_created, answer_saved, photo_uploaded, checkout_started, payment_success, payment_fail
- **uploads:** photo/passport/document tipinde dosya URL’leri

RLS açık; kullanıcı kendi kayıtlarına erişir.

## Proje Yapısı

- `src/app/` — layout, ana sayfa, ödeme tamamlandı sayfası
- `src/components/` — Header, Hero, MethodSelection, WizardArea, CountriesSection, ProfessionsSection, NeyiCozuyoruz, Footer, AuthModal
- `src/components/wizard/` — VoiceWizard, ChatWizard, FormWizard, PhotoUpload, CompletionSummary, WizardTypes
- `src/data/` — countries, professions (meslek alanları ve dallar)
- `src/lib/` — supabase client, profileSave (draft + events)

## Sonraki Adımlar

1. Supabase Auth: Google ve e-posta ile girişi `AuthModal` ve `page.tsx` içinde bağlayın
2. PayTR: `.env.local` içinde `PAYTR_*` ve `NEXT_PUBLIC_SITE_URL` doldurulmalı; panelde bildirim URL’i `{SITE_URL}/api/paytr/callback` olarak ayarlanmalı
3. Gemini: Sesli/sohbet cevaplarını yapılandırmak için API route + Gemini çağrısı
4. Fotoğraf: Yükleme sonrası Supabase Storage’a kayıt ve `photo_url`’i profile yazma
