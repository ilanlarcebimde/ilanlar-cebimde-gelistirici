# Kontrol Paneli — Tasarım ve Yönetim Stratejisi / Uygulama Raporu

## Genel Bakış

Bu rapor, **İlanlar Cebimde** ürünündeki kullanıcı kontrol panelinin (“Hesabım” / `/panel`) **tasarım stratejisi**, **yönetim stratejisi** ve **uygulama stratejisi**ni özetler. Panel, giriş yapmış kullanıcıların başvuru profilleri, ödeme geçmişi ve asistan oturumlarını tek yerden görmesini sağlar.

---

## 1. Tasarım Stratejisi

### 1.1 Amaç ve Kapsam

- **Amaç:** Kullanıcının kendi verilerini (profil/başvuru, ödeme, oturum) görüntülemesi; güven ve şeffaflık hissi; ileride indirme / yeniden başvuru gibi aksiyonlara zemin hazırlamak.
- **Kapsam:** Sadece **kullanıcı tarafı** (B2C). Admin / operatör paneli bu raporun dışındadır.

### 1.2 Bilgi Mimarisi

Panel üç ana bloktan oluşur (aşağıdan yukarıya öncelik sırasıyla):

| Blok | İçerik | Veri Kaynağı | Kullanıcı İhtiyacı |
|------|--------|--------------|--------------------|
| **Profil / Başvurular** | status, method, country, job_area, job_branch, created_at | `profiles` (RLS: `user_id`) | “Başvurularım nerede, hangi aşamada?” |
| **Ödeme Geçmişi** | status, amount, currency, created_at | `payments` (RLS: `user_id`) | “Ödediklerim ve işlem durumu” |
| **Sesli Asistan Oturumları** | completed, session_id (kısaltılmış), updated_at | `assistant_sessions` (user_id) | “Sesli/sohbet oturumlarım” |

- **Sıralama:** Tüm listeler **tarihe göre azalan** (en yeni üstte).
- **Boş durumlar:** Her blokta “Henüz kayıtlı … yok” / açıklayıcı metin ile boş state tasarımı yapılmıştır.

### 1.3 Görsel ve UX İlkeleri

- **Layout:** Tek sayfa, dikey stack; `max-w-4xl` ile okunaklı genişlik.
- **Header:** Sticky; logo + “İlanlar Cebimde”, sağda e-posta (truncate) + “Çıkış” butonu.
- **Kartlar:** Her blok `rounded-2xl`, ince border (`border-slate-200`), yumuşak gölge; tutarlı padding (`p-6`).
- **Tipografi:** Başlıklar `text-lg` / `text-2xl`, semibold; gövde metni `text-sm`, renk hiyerarşisi (slate-800 / slate-500 / slate-400).
- **Durum renkleri:** Ödeme/session için başarı = yeşil (`text-emerald-600`), başarısız = kırmızı (`text-red-600`), diğer = nötr.
- **Mobil:** Padding ve truncate ile taşma önlenir; tek sütun yapı korunur.

### 1.4 Erişim ve Akış

- **Giriş şartı:** Panel sayfası `useAuth()` ile korunur; `user` yoksa “Giriş yaparak hesabınızı görüntüleyebilirsiniz” + “Ana sayfaya dön” gösterilir.
- **Giriş noktaları:** Ana sayfa Header’da “Hesabım” linki (`/panel`); auth callback ve hash handler varsayılan yönlendirme olarak `/panel` kullanır.
- **Çıkış:** Header’daki “Çıkış” ile `supabase.auth.signOut()`; ardından kullanıcı girişsiz state’e döner.

### 1.5 Erişilebilirlik ve Tutarlılık

- Sayfa başlığı “Hesabım” ile içerik uyumlu.
- Liste öğeleri metin tabanlı; ileride link/buton eklendiğinde klavye ve ekran okuyucu uyumlu tutulmalı.
- Ana sayfa ile aynı logo ve marka adı kullanılarak bütünlük sağlanır.

---

## 2. Yönetim Stratejisi

### 2.1 Veri Kaynakları ve Sorumluluklar

| Veri | Tablo / Kaynak | Okuma | Yazma | Not |
|------|----------------|-------|-------|-----|
| Profiller | `profiles` | Client (anon key, RLS) | Client (insert/update) | user_id = auth.uid() |
| Ödemeler | `payments` | Client (anon key, RLS) | Sadece server (service_role) | PayTR callback ile güncellenir |
| Asistan oturumları | `assistant_sessions` | Client (RLS) | Session API + client | user_id oturumla ilişkilendirilir |

- **RLS:** Tüm tablolarda kullanıcı sadece kendi satırlarını görür/günceller (policies ile).
- **Ödeme yazma:** Sadece server tarafı (PayTR callback, token oluşturma); client asla payment insert/update yapmaz.

### 2.2 Roller ve Yetkilendirme

- **Kullanıcı (giriş yapmış):** Kendi profilleri, ödemeleri, oturumları; sadece okuma + profil/event tarafında yazma (wizard üzerinden).
- **Kullanıcı (misafir):** Panel sayfasına erişemez; yönlendirme veya “Giriş yap” mesajı.
- **Sistem (server):** PayTR callback ile `payments` ve ilgili `profiles.status` güncellemesi; gerekirse n8n / webhook ile arka plan işleri.

### 2.3 Güvenlik İlkeleri

- **Kimlik:** Supabase Auth (Google + e-posta); JWT ve session yönetimi Supabase’e bırakılır.
- **RLS:** Tüm panel verisi RLS ile kullanıcıya göre filtrelenir; client tarafında ek rol kontrolü gerekmez.
- **Hassas alanlar:** Ödeme tutarı ve durum bilgisi kullanıcıya aittir; panel sadece kendi kayıtlarını listeler.
- **Çıkış:** signOut ile token temizlenir; sayfa yenilense bile panel korumalı kalır (useAuth + redirect).

### 2.4 Operasyonel Yönetim

- **Profil durumları:** draft → completed → checkout_started → paid / failed → processing → delivered (migration’larla uyumlu).
- **Ödeme durumları:** started, success, fail — kullanıcıya “Başarılı / Başarısız / İşlemde” olarak gösterilir.
- **Oturumlar:** `completed` bayrağı ile “Tamamlandı / Devam ediyor” ayrımı; session_id kısaltılarak gösterilir (gizlilik / UX).

### 2.5 İzleme ve İyileştirme

- **Events:** `events` tablosu (profile_created, answer_saved, checkout_started, payment_success/fail vb.) operasyonel analiz ve hata takibi için kullanılabilir.
- **n8n / webhook:** Raporlarda geçen bildirim URL’leri ve event tipleri, arka planda iş akışı ve bildirim yönetimi için merkezi nokta oluşturur; panel doğrudan webhook’a bağlı değildir, veri Supabase üzerinden gelir.

---

## 3. Uygulama Stratejisi

### 3.1 Mevcut Teknik Yapı

- **Rota:** `src/app/panel/page.tsx` — tek sayfa, client component.
- **Auth:** `useAuth()` (Supabase session); loading ve “user yok” state’leri ayrı ayrı ele alınır.
- **Veri çekme:** `useEffect` içinde `user` varken üç paralel sorgu:
  - `profiles`: id, status, method, country, job_area, job_branch, created_at; `user_id` eşleşmesi, `created_at desc`.
  - `payments`: id, status, amount, currency, created_at; `user_id` eşleşmesi, `created_at desc`.
  - `assistant_sessions`: session_id, completed, updated_at; `user_id` eşleşmesi, `updated_at desc`.
- **Normalizasyon:** `normalizeProfileRow()` ile profil satırları tutarlı formata getirilir.
- **State:** Yerel `useState` (profiles, payments, sessions, loading); sunucu state kütüphanesi yok.

### 3.2 Teknik Kararlar ve Kısıtlar

| Konu | Karar | Not |
|------|--------|-----|
| SSR | Yok; tam client-side fetch | İlk yüklemede “Veriler yükleniyor…”; ileride getServerSideProps veya Server Component ile iyileştirilebilir |
| Cache / refetch | Yok | Her panel açılışında yeniden çekilir; gerektiğinde SWR/React Query eklenebilir |
| Hata yönetimi | Minimal | Sorgu hatalarında state güncellenmeyebilir; kullanıcıya hata mesajı gösterimi eklenebilir |
| Tip güvenliği | ProfileRow, PaymentRow, SessionRow | Supabase yanıtları bu tiplerle kullanılır |

### 3.3 Geliştirme Yol Haritası (Öneriler)

1. **Kısa vade**
   - **Hata durumu:** Sorgu fail olduğunda “Veriler yüklenirken bir hata oluştu” + yeniden dene butonu.
   - **Loading:** Skeleton veya kart bazlı loading state ile daha iyi UX.
   - **Profil detay:** Satıra tıklanınca detay sayfası veya drawer (answers, photo_url önizleme).

2. **Orta vade**
   - **İndirme / teslimat:** `status === 'delivered'` için “CV’yi indir” veya “Dosyaları görüntüle” linki (Storage signed URL veya API).
   - **Filtreleme / sıralama:** Tarih aralığı, durum filtresi (opsiyonel).
   - **Ödeme detayı:** provider_ref veya fiş no gösterimi (gerekirse maskeleyerek).

3. **Uzun vade**
   - **Admin paneli:** Ayrı rota ve rol (örn. `profiles` / `payments` tam listesi, durum toplu güncelleme); RLS dışında service_role veya admin rolü.
   - **Bildirim tercihleri:** E-posta/SMS tercih sayfası ve backend ile entegrasyon.
   - **Panel layout:** Ortak layout (`/panel/layout.tsx`) ile alt sayfalar (/panel/orders, /panel/settings vb.).

### 3.4 Test ve Kabul Kriterleri

- Giriş yapmamış kullanıcı `/panel`’e gidince “Giriş yap” mesajı ve ana sayfa linki görür.
- Giriş yapmış kullanıcı kendi profillerini, ödemelerini ve oturumlarını görür; başka kullanıcı verisi asla gelmez (RLS).
- Çıkış sonrası panel tekrar korumalı davranır.
- Mobilde layout taşmaz; e-posta truncate ile okunaklı kalır.

---

## 4. Özet Tablo

| Alan | Strateji Özeti |
|------|----------------|
| **Tasarım** | Tek sayfa, üç blok (Profil, Ödeme, Oturum); kart tabanlı UI; giriş zorunlu; mobil uyumlu. |
| **Yönetim** | Veri Supabase + RLS; ödeme yalnızca server; roller kullanıcı/sistem; güvenlik Auth + RLS. |
| **Uygulama** | Client component, paralel Supabase sorguları; hata/loading iyileştirmeye açık; ileride detay, indirme, admin ayrılabilir. |

Bu doküman, kontrol panelinin tasarım ve yönetim stratejisini tek referans noktasında toplamak ve uygulama kararlarını netleştirmek amacıyla hazırlanmıştır. Güncellemeler proje ilerledikçe bu rapora işlenebilir.
