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

| Değişken | Açıklama | Nerede |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase proje URL | Client + Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Client + Server |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (RLS bypass) | **Sadece server** |
| `PAYTR_MERCHANT_ID` | PayTR mağaza ID | **Sadece server** |
| `PAYTR_MERCHANT_KEY` | PayTR key (hash) | **Sadece server**, gizli |
| `PAYTR_MERCHANT_SALT` | PayTR salt (hash) | **Sadece server**, gizli |
| `NEXT_PUBLIC_SITE_URL` / `SITE_URL` | Sitenin tam adresi | Server (callback) |
| `PAYTR_TEST_MODE` | `1` = test modu | Server |
| `ELEVENLABS_API_KEY` | ElevenLabs TTS | **Sadece server** (`/api/tts`) |
| `ELEVENLABS_VOICE_ID` | İsteğe bağlı ses ID | Server |
| `GEMINI_API_KEY` | Gemini (opsiyonel) | Server |

## PayTR

- **Token / iframe:** `POST /api/paytr/initiate` (JSON: `merchant_oid`, `email`, `amount`, isteğe bağlı `user_name`, `merchant_ok_url`, `merchant_fail_url`, `basket_description`) → yanıt: `{ success, token, iframe_url }`.
- **Bildirim:** PayTR panelinde **Bildirim URL** olarak `{NEXT_PUBLIC_SITE_URL}/api/paytr/callback` girilir (sonunda slash yok). Bu endpoint her zaman **200** ve gövde **OK** (text/plain) döner; redirect yok.
- **Sayfalar:** `/odeme` (iframe), `/odeme/basarili`, `/odeme/basarisiz`. Middleware ile `/api/paytr/callback` için redirect uygulanmaz.

## Supabase

Migration’lar: `supabase/migrations/001_initial_schema.sql`, `002_payments_and_status.sql`

- **profiles:** status (draft, completed, checkout_started, paid, failed, processing, delivered), method, country, job_area, job_branch, answers jsonb, photo_url
- **events:** profile_created, answer_saved, photo_uploaded, method_selected, checkout_started, payment_success, payment_fail
- **uploads:** photo/passport/document tipinde; Storage path: `{user_id}/{profile_id}/photo.jpg` – signed URL kullanın, bucket public yapmayın
- **payments:** PayTR ödeme kayıtları (profile_id, user_id, provider, status: started/success/fail, amount, currency, provider_ref)

RLS açık; kullanıcı kendi kayıtlarına erişir. Ödeme insert/update sadece server (service_role) ile.

### Google giriş (OAuth)

**Canlı sitede (ilanlarcebimde.com) giriş sonrası localhost’a gidiyorsa:** Supabase hâlâ localhost’u kullanıyordur. Aşağıdakileri yapın:

1. **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. **Site URL:** Canlı site için `https://ilanlarcebimde.com` yapın (yerel test için tekrar `http://localhost:3000` kullanabilirsiniz).
3. **Redirect URLs** listesine **ikisini de** ekleyin (her satıra bir tane):
   - `http://localhost:3000/auth/callback`
   - `https://ilanlarcebimde.com/auth/callback`
4. **Save** ile kaydedin.

Bundan sonra ilanlarcebimde.com’da “Google ile giriş” yapınca yönlendirme canlı siteye döner.

- Yerel testte **`npm run dev` çalışır durumda olmalı**; aksi halde “Bağlantı reddedildi” alırsınız.
- Token’lar bazen hash ile ana sayfaya düşer (`/#access_token=...`). Uygulama bunu okuyup oturumu kurar ve panele yönlendirir.

## Proje Yapısı

- `src/app/` — layout, ana sayfa, ödeme tamamlandı sayfası
- `src/components/` — Header, Hero, MethodSelection, WizardArea, CountriesSection, ProfessionsSection, NeyiCozuyoruz, Footer, AuthModal
- `src/components/wizard/` — VoiceWizard, ChatWizard, FormWizard, PhotoUpload, CompletionSummary, WizardTypes
- `src/data/` — countries, professions (meslek alanları ve dallar)
- `src/lib/` — supabase client, profileSave (draft + events), paytr, stt (Web Speech API + transcribeAudio abstraction)
- `src/store/` — Zustand profileDraft store
- `src/hooks/` — useProfileDraft, useAutosave, useVoiceAssistant
- `src/app/api/tts/` — ElevenLabs TTS (POST text → audio/mpeg)

## Sonraki Adımlar

1. Supabase Auth: Google ve e-posta ile girişi `AuthModal` ve `page.tsx` içinde bağlayın
2. PayTR: `.env.local` içinde `PAYTR_*` ve `NEXT_PUBLIC_SITE_URL` doldurulmalı; panelde bildirim URL’i `{SITE_URL}/api/paytr/callback` olarak ayarlanmalı
3. Gemini: Sesli/sohbet cevaplarını yapılandırmak için API route + Gemini çağrısı
4. Fotoğraf: Yükleme sonrası Supabase Storage’a kayıt ve `photo_url`’i profile yazma
