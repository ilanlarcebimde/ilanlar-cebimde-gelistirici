# Cursor AI – Soru-Cevap Özeti (Kopyala-Yapıştır Cevaplar)

Lütfen cevaplar madde madde verildi, ilgili dosya yolları ve RLS policy SQL’leri aynen kopyalandı.

---

## A) Route & SEO / Redirect Durumu

**1. /yurtdisi-is-ilanlari → /ucretsiz-yurtdisi-is-ilanlari için 301 redirect yaptın mı? Nerede?**

Evet. **Middleware** ile yapıldı.

- **Dosya:** `src/middleware.ts`
- Eski path `/yurtdisi-is-ilanlari` isteği gelince `NextResponse.redirect(url, 301)` ile query string korunarak `/ucretsiz-yurtdisi-is-ilanlari` adresine yönlendiriliyor.
- `config.matcher`: `["/api/paytr/callback", "/yurtdisi-is-ilanlari"]`

**2. Yeni sayfada canonical ve OG meta’da .../ucretsiz-yurtdisi-is-ilanlari geçiyor mu? Hangi dosya?**

Evet.

- **Dosya:** `src/app/ucretsiz-yurtdisi-is-ilanlari/page.tsx`
- `CANONICAL = "https://www.ilanlarcebimde.com/ucretsiz-yurtdisi-is-ilanlari"`
- `metadata`: `alternates: { canonical: CANONICAL }`, `openGraph: { url: CANONICAL, title, description, siteName }`, `twitter: { card, title, description }`

---

## B) Feed’in “Anlık” Görünmesi (Cache / Rendering)

**1. Feed sayfası dynamic mi? (force-dynamic / fetch cache: 'no-store'?)**

Feed sayfası için **route seviyesinde** `dynamic = 'force-dynamic'` veya `fetch cache: 'no-store'` **yok**. Sayfa server’da sadece layout + client component render ediyor; veri **client-side** çekiliyor.

**2. Feed verisi client-side mı, server-side mı?**

**Client-side.** Supabase client ile tarayıcıdan çekiliyor.

- **Dosya:** `src/components/kanallar/PanelFeed.tsx`
- `supabase.from("job_posts").select(...).eq("status", "published")...` doğrudan component içinde (useCallback/useEffect) çağrılıyor.
- Server route / getServerSideProps / Server Component fetch **yok**.

**3. “Upload edince anında görünür” – sayfa yenilemeden otomatik güncelleniyor mu?**

**Hayır.** `job_posts` için Supabase Realtime **kullanılmıyor**. Yeni ilan eklenince feed’in güncellenmesi için kullanıcının **sayfayı yenilemesi** (refresh) gerekiyor. Realtime sadece `channel_subscriptions` için var (header/sidebar senkronu).

---

## C) Supabase Tabloları ve Şema

**1. Oluşturulan tablolar (migration’lardan):**

- **001_initial_schema.sql:** (temel şema – projede adı geçenler)
- **002_payments_and_status.sql:** payments, profiles ile ilgili
- **003_cv_sessions.sql, 004–006 assistant_sessions:** cv_sessions, assistant_sessions
- **007:** payments / profile_snapshot
- **008:** events (n8n webhook tipleri)
- **009:** profiles (is_cv_sent)
- **010:** storage (cv_photos policies)
- **011_channels_subscriptions_job_posts.sql:** `channels`, `channel_subscriptions`, `job_posts`
- **012_job_posts_public_read.sql:** job_posts RLS (sonra 014 ile değiştirildi)
- **013_add_brand_color_to_channels.sql:** channels.brand_color
- **014_job_posts_mod_b_subscribed_only.sql:** job_posts sadece abone olunan kanallar (sonra 018 ile public yapıldı)
- **015_channel_stats.sql:** `channel_stats`
- **016_push_tables.sql:** `push_subscriptions`, `push_prefs`, `push_delivery_log`
- **017_channels_improvements.sql:** channels (brand_color default, flag_emoji), job_posts (source_url unique)
- **018_job_posts_public_select.sql:** job_posts public SELECT
- **019_realtime_channel_subscriptions.sql:** realtime publication’a channel_subscriptions eklendi

**Özet tablo listesi:**  
`channels`, `channel_subscriptions`, `job_posts`, `channel_stats`, `push_subscriptions`, `push_prefs`, `push_delivery_log`, `profiles`, `payments`, `events`, `assistant_sessions`, `cv_sessions` vb. (diğerleri 001–010’da).

**2. job_posts tablosu alanları (011 + 017):**

- `id` (uuid, PK)
- `channel_id` (uuid, FK channels)
- `title` (text, not null)
- `position_text` (text)
- `location_text` (text)
- `source_name` (text)
- `source_url` (text)
- `snippet` (text)
- `image_url` (text)
- `published_at` (timestamptz, not null, default now())
- `status` (text, not null, check: 'published' | 'expired')
- `created_at` (timestamptz, not null, default now())

**Yok:** `title_tr`, `snippet_tr`, `sector_tr`, `location_tr`, `country_code`, `slug`, `rendered_html`. (Bunlar şu an şemada yok.)

**3. source_url unique / upsert:**

- **011:** `create unique index idx_job_posts_source_url on public.job_posts(source_url) where source_url is not null;`
- **017:** `alter table public.job_posts add constraint job_posts_source_url_unique unique (source_url);`
- Upsert: Kod tabanında `job_posts` için insert/upsert **yok**; n8n veya başka bir servis `service_role` ile yazacaksa conflict target `source_url` (veya unique index) kullanılabilir.

---

## D) RLS ve Public Feed

**1. job_posts RLS açık mı? Public kullanıcı status='published' görebiliyor mu?**

Evet. RLS açık ve sadece `status = 'published'` olanlar herkese açık.

**Policy (aynen):**

- **Dosya:** `supabase/migrations/018_job_posts_public_select.sql`

```sql
-- Public feed: published job_posts herkes tarafından okunabilir
drop policy if exists "job_posts_select_subscribed" on public.job_posts;

create policy "job_posts_select_public"
  on public.job_posts for select using (status = 'published');
```

**2. channels public mi? channel_subscriptions sadece user-own mi?**

- **channels:** Public. Policy: `channels_select_public` – `using (true)` (011).
- **channel_subscriptions:** Sadece kendi kayıtları: `channel_subscriptions_select_own` (select), `channel_subscriptions_insert_own` (insert), `channel_subscriptions_delete_own` (delete); hepsi `auth.uid() = user_id`.

**3. Public feed “Tümü” query’si:**

Kodda bire bir SQL yok; Supabase client kullanılıyor. Mantıksal karşılığı:

- `status = 'published'`
- İsteğe bağlı: `channel_id = ?` (chip ile tek kanal)
- İsteğe bağlı: `title.ilike.%q% or position_text.ilike.%q% or location_text.ilike.%q% or snippet.ilike.%q%` (arama)
- `order by published_at desc`
- `limit PAGE_SIZE` (15)
- Cursor: `published_at < cursor` ile “load more”

Aynen SQL ile yazılmış hali (tek kanal ve arama yok):

```sql
select id, channel_id, title, position_text, location_text, source_name, source_url, snippet, published_at
from job_posts
where status = 'published'
order by published_at desc
limit 15;
```

---

## E) Sidebar (Aboneliklerim / Keşfet) Senkronizasyonu

**1. Header butonları state kuralı – nerede hesaplanıyor?**

Global store/context yok. **Header** içinde iki hook kullanılıyor:

- **Dosya:** `src/components/Header.tsx`
- `useAuth()` → `user`, `loading` (Supabase auth state)
- `useSubscriptionCount(user?.id)` → abonelik sayısı

Mantık:

- `!user` → "Abone Ol" + "Giriş Yap"
- `user && subscriptionCount === 0` → "Abone Ol" + "Hesabım"
- `user && subscriptionCount > 0` → "Aboneliklerim" (badge ile) + "Hesabım"

**2. Abone olunca sidebar ve chip anında güncelleniyor mu? Nasıl?**

Evet. **Supabase Realtime** ile:

- **Dosya:** `src/hooks/useSubscriptionCount.ts`  
  - `postgres_changes` on `channel_subscriptions`, filter `user_id=eq.<userId>` → sayı yeniden çekiliyor, header güncellenir.
- **Dosya:** `src/components/kanallar/ChannelsSidebar.tsx`  
  - Aynı tabloya aynı şekilde `postgres_changes` subscribe; event’te `loadData()` çağrılıyor, Aboneliklerim/Keşfet listesi yenilenir.

Optimistic UI veya ayrı bir refetch timer yok; tek kaynak Realtime.

---

## F) Arama + Chip Filtre

**1. Arama hangi alanlarda?**

- **Dosya:** `src/components/kanallar/PanelFeed.tsx`
- `title`, `position_text`, `location_text`, `snippet` – hepsi `ilike` ile `%safe%` pattern.

**2. Chip filtre (Tümü + kanal) URL ile mi?**

Evet. URL query parametreleri kullanılıyor.

- **Dosya:** `src/app/ucretsiz-yurtdisi-is-ilanlari/UcretsizPanelClient.tsx`
- `?c=<slug>` → seçili kanal (yoksa “Tümü”)
- `?q=<aramametni>` → arama
- `useSearchParams()` ile okunuyor; chip tıklanınca `router.push(\`${BASE_PATH}?${params}\`)` ile güncelleniyor.

---

## G) Realtime – Yeni ilan geldi banner

**job_posts için Supabase Realtime (insert dinleme) var mı?**

**Hayır.** `job_posts` tablosu için Realtime subscription **yok**. Sadece `channel_subscriptions` için var (header/sidebar senkronu).

- Channel adı: `subscription-count-sync` (useSubscriptionCount), `sidebar-subscriptions-sync` (ChannelsSidebar)
- Event: `postgres_changes`, table: `channel_subscriptions`, filter: `user_id=eq.<userId>`

“Anlık” yeni ilan = şu an **sadece sayfa yenilenince** (refresh) görünüyor. Yeni ilan geldi banner’ı veya feed’i sayfa yenilemeden güncellemek için `job_posts` üzerinde Realtime (ve gerekirse publication) eklenmesi gerekir.

---

## H) n8n / AI Agent / HTML üretimi

**1. n8n pipeline job_posts insert – endpoint mi, yoksa direkt Supabase service_role mi?**

Kod tabanında n8n’e özel **job_posts insert API route** yok. İlan ekleme tasarımı: **n8n’in doğrudan Supabase’e (service_role)** yazması veya ileride eklenecek bir API ile yazmasına uygun. Şu an client tarafında insert yok; RLS ile sadece SELECT public.

**2. AI agent çıktısı için JSON schema tanımlı mı? Örnek output?**

Kodda **job_posts** veya ilan üretimi için ayrı bir AI agent JSON schema / örnek output **yok**.

**3. rendered_html üreten kod / XSS sanitize?**

- **rendered_html:** Şemada ve kodda **yok**.
- HTML/XSS: Sadece PayTR merchant_oid için `sanitizeMerchantOid` var (`src/lib/paytr.ts`). İlan içeriği için HTML üretimi veya sanitize (DOMPurify vb.) **yok**.

---

## I) Eksikler / Yapılacaklar

**1. Şu an çalışmayan veya TODO kalan noktalar:**

- **job_posts Realtime:** Yeni ilan eklenince sayfa yenilemeden feed güncellenmiyor; “yeni ilan geldi” banner’ı yok.
- **Feed sayfa cache:** Route’ta `dynamic` / `revalidate` tanımlı değil; veri zaten client’ta olduğu için etkisi sınırlı, ama “her zaman taze” garantisi server tarafında yok.
- **rendered_html / title_tr / sector_tr vb.:** Şemada ve uygulamada yok; ileride çeviri veya zengin içerik eklenirse eklenebilir.
- **n8n insert akışı:** Net bir API veya dokümante edilmiş “n8n → Supabase job_posts” akışı kodda yok; service_role ile insert varsayılıyor.

**2. Bu sprintte “ilk içeriği ekleyip canlı görmek” için minimal adımlar:**

- Migration’ların (özellikle 018, 019) production’da uygulandığından emin ol.
- n8n (veya manuel) ile en az bir `job_posts` kaydı insert et (status='published', channel_id mevcut bir kanala ait).
- Tarayıcıda `/ucretsiz-yurtdisi-is-ilanlari` açıp “Tümü” feed’inde ilanın göründüğünü kontrol et.
- İsteğe bağlı: Yeni ilanı sayfa yenilemeden göstermek için `job_posts` üzerinde Realtime + (gerekirse) “Yeni ilanlar var” banner’ı eklenebilir.

---

*Bu dosya Cursor AI tarafından oluşturuldu; sorular madde madde, dosya yolları ve RLS SQL’leri aynen verildi.*
