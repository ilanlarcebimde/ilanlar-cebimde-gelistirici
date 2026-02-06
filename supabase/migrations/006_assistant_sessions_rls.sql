-- assistant_sessions: kullanıcı sadece kendi kayıtlarını görsün
alter table public.assistant_sessions enable row level security;

-- Giriş yapmış kullanıcı kendi user_id'si ile eşleşen satırları okuyabilsin (user_id text, auth.uid() uuid)
create policy "Users can view own assistant_sessions"
  on public.assistant_sessions for select
  using (user_id is not null and user_id = auth.uid()::text);

-- Insert/update sadece API (service_role) ile yapılıyor; anon/authenticated için select yeterli.
