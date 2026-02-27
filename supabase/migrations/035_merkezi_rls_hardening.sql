-- Merkez RLS sertleştirme: beğeni ve mektup insert kuralları.

-- merkezi_post_likes: insert sadece authenticated ve user_id kendi olmalı
drop policy if exists "merkezi_post_likes_insert_authenticated" on public.merkezi_post_likes;
create policy "merkezi_post_likes_insert_authenticated"
  on public.merkezi_post_likes for insert
  with check (auth.uid() is not null and auth.uid() = user_id);

-- merkezi_generated_letters: insert sadece authenticated ve user_id kendi olmalı
drop policy if exists "merkezi_generated_letters_insert_authenticated" on public.merkezi_generated_letters;
create policy "merkezi_generated_letters_insert_authenticated"
  on public.merkezi_generated_letters for insert
  with check (auth.uid() is not null and auth.uid() = user_id);

