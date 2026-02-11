-- n8n webhook izleme için yeni event tipleri
alter table public.events drop constraint if exists events_type_check;
alter table public.events add constraint events_type_check
  check (type in (
    'profile_created','answer_saved','photo_uploaded','method_selected',
    'checkout_started','payment_success','payment_fail',
    'n8n_webhook_failed','n8n_webhook_skipped_invalid_profile','n8n_webhook_skipped_missing_env'
  ));
