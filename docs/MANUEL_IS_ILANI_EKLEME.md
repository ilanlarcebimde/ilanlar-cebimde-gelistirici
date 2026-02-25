# Supabase’te Kanala Manuel İş İlanı Yükleme

İş ilanını **Supabase Dashboard** üzerinden elle eklemek için aşağıdaki adımları izleyin. Web sitesinde ekstra sayfa yok; her şey Supabase’te yapılır.

---

## Yöntem: SQL Editor ile yükleme

### 1. Supabase’e girin

1. [supabase.com](https://supabase.com) → giriş yapın.
2. Projenizi seçin.
3. Sol menüden **SQL Editor**’e tıklayın.
4. **New query** ile yeni bir sorgu penceresi açın.

---

### 2. Kanal ID’sini (channel_id) bulun

Hangi kanala ilan ekleyecekseniz (Kıbrıs, İrlanda, Katar vb.) o kanalın **id** değerine ihtiyacınız var.

SQL Editor’e şunu yapıştırıp **Run** (veya Ctrl+Enter) deyin:

```sql
SELECT id, slug, name FROM public.channels WHERE is_active = true ORDER BY name;
```

Tabloda çıkan sonuçtan ilgili kanalın **id** sütunundaki UUID’yi kopyalayın (örn. Kıbrıs satırındaki `id`). Bunu aşağıdaki INSERT’te `<CHANNEL_ID>` yerine yapıştıracaksınız.

---

### 3. İlan eklemek için INSERT çalıştırın

Aynı SQL Editor’de (veya yeni bir sorguda) aşağıdaki şablonu kullanın. **Sadece** şunları kendi bilgilerinizle değiştirin:

- `<CHANNEL_ID>` → Az önce kopyaladığınız kanal UUID’si (tırnak içinde kalacak).
- `'İlan başlığı'` → Gerçek ilan başlığı.
- Diğer alanları isteğe bağlı doldurun; kullanmayacaksanız `NULL` yazabilirsiniz.

**Şablon:**

```sql
INSERT INTO public.job_posts (
  channel_id,
  title,
  position_text,
  location_text,
  source_name,
  source_url,
  snippet,
  published_at,
  status
) VALUES (
  '<CHANNEL_ID>',
  'İlan başlığı',
  'Pozisyon (opsiyonel)',
  'Şehir, Ülke (opsiyonel)',
  'LinkedIn / EURES / vb. (opsiyonel)',
  'https://... ilan linki (opsiyonel, ama varsa benzersiz olmalı)',
  'Kısa özet (opsiyonel)',
  now(),   -- yayın tarihi: şimdi (belirli tarih için: '2025-02-24 10:00:00+03' yazın)
  'published'
);
```

**Örnek (Kıbrıs kanalına tek ilan):**

```sql
INSERT INTO public.job_posts (
  channel_id,
  title,
  position_text,
  location_text,
  source_name,
  source_url,
  snippet,
  published_at,
  status
) VALUES (
  'buraya-kibris-kanal-uuid-yapistirin',
  'Senior Yazılım Geliştirici',
  'Yazılım Geliştirici',
  'Lefkoşa, Kıbrıs',
  'LinkedIn',
  'https://www.linkedin.com/jobs/view/123456',
  'Deneyimli yazılım geliştirici aranıyor.',
  now(),   -- veya '2025-02-24 14:30:00+03' gibi sabit tarih
  'published'
);
```

- **Tarih (`published_at`):** `now()` = ilanı “şu an” yayında göstermek. Belirli bir gün/saat için `'2025-02-24 10:00:00+03'` gibi timestamp yazabilirsiniz. Feed sıralaması bu tarihe göre yapılır.
- **Zorunlu:** Sadece `channel_id`, `title`, `status` (genelde `'published'`).
- **source_url:** Aynı link iki kez kullanılamaz (benzersiz). Boş bırakmak için `NULL` yazın.

Sorguyu düzenledikten sonra **Run** ile çalıştırın. İlan, seçtiğiniz kanalda sitede listelenir.

---

## Alternatif: Table Editor ile yükleme

1. Supabase Dashboard → sol menüden **Table Editor**.
2. **job_posts** tablosunu seçin.
3. **Insert row** (veya **Add row**) ile yeni satır ekleyin.
4. En azından **channel_id**, **title**, **status** alanlarını doldurun (channel_id için 2. adımdaki sorgudan aldığınız UUID’yi kullanın).
5. Kaydedin.

RLS nedeniyle “insert yetkiniz yok” hatası alırsanız aynı işlemi **SQL Editor** ile yukarıdaki INSERT’i çalıştırarak yapın.

---

## Özet

| Nerede | Ne yapıyorsunuz |
|--------|------------------|
| **Supabase → SQL Editor** | Kanal listesini alıyorsunuz (`SELECT ... FROM channels`). |
| **Supabase → SQL Editor** | İlan ekliyorsunuz (`INSERT INTO job_posts ...`). |
| **Supabase → Table Editor** | İsterseniz tek satır ekleyerek de ilan girebilirsiniz. |

Web sitesinde ekstra bir “ilan yükleme” sayfası yok; yükleme tamamen Supabase (SQL Editor veya Table Editor) üzerinden yapılır.
