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

**Profiles/events/uploads şeması** birebir `001_initial_schema.sql` içindedir; sonraki migration’lar sadece constraint ve kolon ekler.
