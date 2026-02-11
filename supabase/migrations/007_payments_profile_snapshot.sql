-- Ödeme başarılı olmadan önce profil oluşturulmasın diye:
-- PayTR initiate'te profile_snapshot saklanır; callback'te bu snapshot'tan profile insert edilir.
alter table public.payments
  add column if not exists profile_snapshot jsonb;

comment on column public.payments.profile_snapshot is 'PayTR callback sonrası profile oluşturmak için kullanılır; ödeme öncesi CV verisi.';
