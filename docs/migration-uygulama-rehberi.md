# Migration Uygulama Rehberi

## Uygulanması Gereken Migration'lar

Şu migration'ları Supabase'e uygulamanız gerekiyor:

1. **013_add_brand_color_to_channels.sql** - Kanal renk sistemi
2. **014_job_posts_mod_b_subscribed_only.sql** - RLS MOD B (sadece abone olunan kanalların postları)
3. **015_channel_stats.sql** - Kanal istatistikleri tablosu
4. **016_push_tables.sql** - Web push tabloları
5. **017_channels_improvements.sql** - Channels tablosu iyileştirmeleri

## Yöntem 1: Supabase Dashboard (Önerilen - Kolay)

### Adımlar:

1. **Supabase Dashboard'a giriş yapın**
   - https://supabase.com/dashboard
   - Projenizi seçin

2. **SQL Editor'ı açın**
   - Sol menüden **SQL Editor** → **New query**

3. **Migration'ları sırayla uygulayın**

   Her migration dosyasının içeriğini kopyalayıp SQL Editor'a yapıştırın ve **RUN** butonuna tıklayın.

   **Sıra:**
   - Önce `013_add_brand_color_to_channels.sql`
   - Sonra `014_job_posts_mod_b_subscribed_only.sql`
   - Sonra `015_channel_stats.sql`
   - Sonra `016_push_tables.sql`
   - Son olarak `017_channels_improvements.sql`

4. **Hata kontrolü**
   - Her migration sonrası "Success" mesajı görmelisiniz
   - Eğer "already exists" hatası alırsanız, o migration zaten uygulanmış demektir, devam edebilirsiniz

## Yöntem 2: Supabase CLI (Gelişmiş)

### Kurulum:

```bash
npm install -g supabase
```

### Link ve Push:

```bash
# Projeyi Supabase'e bağla
npx supabase link --project-ref <your-project-ref>

# Migration'ları uygula
npx supabase db push
```

**Not:** Eğer daha önce `npx supabase migration repair` kullandıysanız, migration'lar otomatik olarak uygulanmayabilir. Bu durumda Dashboard yöntemini kullanın.

## Migration İçerikleri Özeti

### 013: Brand Color
- `channels` tablosuna `brand_color` kolonu ekler
- Mevcut kanallara renk atar

### 014: RLS MOD B
- `job_posts` için "sadece abone olunan kanalların postları görülebilir" politikası

### 015: Channel Stats
- `channel_stats` tablosu oluşturur
- 24h/7d sayıları için

### 016: Push Tables
- `push_subscriptions` tablosu
- `push_prefs` tablosu
- `push_delivery_log` tablosu
- Tüm RLS politikaları

### 017: Channels Improvements
- `brand_color` default değeri ve not null
- `flag_emoji` not null
- `job_posts.source_url` unique constraint

## Kontrol

Migration'ları uyguladıktan sonra Supabase Dashboard'da:

1. **Table Editor** → Tabloları kontrol edin:
   - `channel_stats` var mı?
   - `push_subscriptions` var mı?
   - `push_prefs` var mı?
   - `push_delivery_log` var mı?

2. **SQL Editor** → Şu sorguyu çalıştırın:
   ```sql
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_name = 'channels'
   ORDER BY ordinal_position;
   ```
   - `brand_color` kolonu görünmeli ve `not null` olmalı

## Sorun Giderme

### "column already exists" hatası
- Migration zaten uygulanmış, devam edebilirsiniz

### "policy already exists" hatası
- Policy zaten var, migration'ın geri kalanını çalıştırın veya o satırı atlayın

### "table already exists" hatası
- Tablo zaten var, migration'ın geri kalanını çalıştırın

### Foreign key hatası
- Önce `013` ve `014` migration'larını uyguladığınızdan emin olun
- `channels` tablosunun var olduğundan emin olun
