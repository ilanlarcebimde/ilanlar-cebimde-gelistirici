# Supabase migrations

Bu klasördeki dosyalar sırayla uygulanır. Şema özeti:

| Dosya | İçerik |
|-------|--------|
| **001_initial_schema.sql** | `profiles`, `events`, `uploads` tabloları, RLS, `set_updated_at` trigger. Gönderdiğiniz tam şema burada. |
| 002_payments_and_status.sql | `payments` tablosu, profiles `status` ve events `type` check genişletmesi |
| 003_cv_sessions.sql | CV/oturum ile ilgili değişiklikler |
| 004–006 | assistant_sessions, RLS |
| 007_payments_profile_snapshot.sql | Ödeme snapshot alanı |
| 008_events_n8n_webhook_types.sql | n8n webhook event tipleri |
| 009_profiles_is_cv_sent.sql | `profiles.is_cv_sent` kolonu |
| 010_storage_cv_photos_policies.sql | Storage: cv-photos select + insert (authenticated) |
| **011_channels_subscriptions_job_posts.sql** | Yurtdışı İş İlanları: `channels`, `channel_subscriptions`, `job_posts`, RLS, 4 ülke seed |

**Profiles/events/uploads şeması** birebir `001_initial_schema.sql` içindedir; sonraki migration’lar sadece constraint ve kolon ekler.

---

## Migration'ları nerede / nasıl uygularım?

### Yöntem 1: Supabase Dashboard (SQL Editor)

1. [Supabase Dashboard](https://supabase.com/dashboard) → projenizi seçin.
2. Sol menüden **SQL Editor** açın.
3. **New query** ile yeni sorgu.
4. Sırayla her migration dosyasını açıp içeriği kopyalayıp SQL Editor’e yapıştırın.
5. **Run** (veya Ctrl+Enter) ile çalıştırın.

Özellikle **011_channels_subscriptions_job_posts.sql** henüz uygulanmadıysa bu dosyayı açıp tüm içeriği kopyalayıp tek seferde çalıştırmanız yeterli (önceki 001–010 zaten uygulandıysa).

### Yöntem 2: Supabase CLI (terminal)

Komutları **proje kök dizininde** (ilanlar-cebimde-gelistirici) çalıştırın; `supabase` klasörü burada olmalı.

1. **Supabase CLI** — global npm desteklenmez; projede dev dependency kullanın veya Windows’ta Scoop:
   ```bash
   npm i supabase --save-dev
   ```
   Sonra komutları `npx supabase ...` ile çalıştırın. Alternatif (Windows): `scoop bucket add supabase https://github.com/supabase/scoop-bucket.git` ve `scoop install supabase`.
2. **Projeyi bağlama** (ilk kez, bir kere):
   ```bash
   npx supabase login
   npx supabase link --project-ref PROJE_REF
   ```
   `PROJE_REF`: Dashboard URL’deki ref (örn. `https://supabase.com/dashboard/project/abc123xyz` → `abc123xyz`). Scoop ile kurduysanız `npx` olmadan `supabase` yazın.
3. **Migration’ları uzaktaki veritabanına uygulama**:
   ```bash
   npx supabase db push
   ```
   Bu komut `supabase/migrations/` içindeki henüz uygulanmamış dosyaları sırayla çalıştırır.

Alternatif olarak sadece migration geçmişini görmek / kontrol etmek için:
```bash
npx supabase migration list
```

**Özet:** İsterseniz **Dashboard → SQL Editor** ile 011 dosyasının içeriğini yapıştırıp Run derseniz migration uygulanmış olur. CLI kullanacaksanız önce `npm i supabase --save-dev`, sonra proje kökünde `npx supabase link` ve `npx supabase db push` yeterli.
