# İlanlar Cebimde Premium – Başvuru Paneli: İşleyiş ve Tasarım Raporu

Ekip dokümanı. Panelin amacı, mimarisi, kullanıcı akışı, teknik altyapı ve tasarım stratejisi.

---

## 1. Panelin amacı

**Premium Başvuru Paneli’nin amacı:** Kullanıcının sadece ilan görmesini değil, o ilana **sistemli ve bilinçli** şekilde başvurmasını sağlamak.

Bu panel:

| Değil | Olmalı |
|--------|--------|
| Statik rehber | Canlı, kişisel başvuru asistanı |
| Sadece bilgi sayfası | Etkileşimli yol haritası |
| Genel metin | İlana özel, cevap odaklı rehber |

---

## 2. Hedef kitleye göre tasarım felsefesi

**Hedef kitle:**

- Lise mezunu, usta / teknik personel  
- Yurtdışına gitmek isteyen, süreçleri bilmeyen  
- Karmaşık arayüz istemeyen  

**Tasarım ilkeleri:**

- Basit, madde madde, adım adım  
- Görsel olarak temiz  
- Uzun paragraf yok; karar odaklı  

---

## 3. Genel panel mimarisi

Panel **3 ana bloktan** oluşur.

### A) İlan bağlamı (Job context block)

**Amaç:** Kullanıcı hangi ilana baktığını unutmasın.

- İlan başlığı  
- Ülke / şehir  
- Kaynak  
- Yayın tarihi  
- “İlana Git” butonu  

Bu bölüm sabit kalmalı (sticky header olabilir).

**Kod:** `src/components/premium/JobSummaryCard.tsx`

---

### B) İlerleme ve checklist paneli

Premium hissini veren ana bölüm.

**İlerleme adımları (7 adım):**

1. Profil bilgisi  
2. Pasaport durumu  
3. CV hazırlığı  
4. Belgeler  
5. Vize süreci  
6. Risk analizi  
7. Son kontrol  

Her adım: **Beklemede / Tamamlandı / Eksik** olarak gösterilmeli.

**Canlı checklist (cevaplara göre):**

- Pasaport: ✅ / ❌  
- CV: ✅ / ❌  
- Dil / Sponsor / Sertifika: ⚠  

Bu alan kullanıcı cevap verdikçe güncellenmeli.

**Kod:** `src/components/premium/ProgressStepper.tsx` — `job_guides.progress_step` (1–7) ve Gemini çıktısına göre doldurulur.

---

### C) Soru–cevap asistanı (Gemini entegrasyonu)

Panelin kalbi: kullanıcı cevap verir, sistem rapor üretir.

- İlk sorular (profil, pasaport, deneyim, dil, CV, engel vb.)  
- Kullanıcı cevap verir → `answers_json` güncellenir  
- **Raporu Güncelle** → `POST /api/job-guide/update` → Gemini analiz → `report_json` / `report_md` güncellenir  

**Kod:**  
- Chat UI: `src/components/premium/AssistantChat.tsx`  
- Rapor görüntüleme: `src/components/premium/ReportViewer.tsx`  
- API: `src/app/api/job-guide/update/route.ts` (Gemini + DB güncelleme)

---

## 4. Rapor yapısı

Rapor şık, düzenli ve (isteğe göre) sekmeli olmalı.

| Bölüm | İçerik |
|--------|--------|
| **Bu İlan İçin Başvuru Rehberi** | Genel başlık |
| **Öncelikli 3 Aksiyon** | En önemli kısım; net maddeler |
| **Bu İşe Nasıl Başvurulur?** | Platform, CV dili, sponsor, referans |
| **Gerekli Belgeler** | Pasaport, CV, sertifika, sabıka kaydı vb. (checkbox hissi) |
| **Çalışma İzni ve Vize** | Kim başvurur, süre, risk noktaları |
| **Maaş ve Yaşam** | Brüt/net, kira, gıda, kalan (tablo) |
| **Risk Değerlendirmesi** | Dil, fiziksel, sponsor, dolandırıcılık riski |
| **Sana Uygunluk Analizi** | Uyum %, eksikler, güçlü yönler |
| **30 Günlük Yol Haritası** | Haftalık aksiyonlar |

**Teknik:** `report_json` alanları (Gemini prompt’ta tanımlı): `summary`, `top_actions`, `rehber`, `belgeler`, `vize_izin`, `maas_yasam`, `risk`, `sana_ozel`, `plan_30_gun`.  
`src/app/api/job-guide/update/route.ts` içindeki system prompt ve `report_md` üretimi bu yapıyı kullanır.

---

## 5. Panelin “canlı” görünmesi

Premium algı için:

- **“Son güncelleme: X dk önce”** — `lastReportUpdate` → `formatRelativeTime` (sayfa header’da)  
- Progress bar / adım göstergesi animasyonu  
- **“Rapor güncelleniyor…”** — `reportUpdating` ile loading  
- **“Rapor güncellendi ✅”** toast  
- Chat’te cevap sonrası kısa sistem mesajı  

**Kod:** `src/app/premium/job-guide/[jobId]/page.tsx` — `lastReportUpdate`, `reportUpdating`, toast state ve `formatRelativeTime`.

---

## 6. Teknik mimari

### Veritabanı

**`job_guides`** (migration: `supabase/migrations/024_job_guides.sql`)

| Alan | Açıklama |
|------|----------|
| id | UUID, PK |
| user_id | auth.users(id) |
| job_post_id | job_posts(id) |
| status | draft / in_progress / completed |
| progress_step | 1–7 |
| answers_json | Soru–cevap anahtarları |
| report_json | Gemini çıktısı (JSON) |
| report_md | Markdown rapor |
| created_at, updated_at | Zaman damgası |

**`job_guide_events`**

| Alan | Açıklama |
|------|----------|
| job_guide_id | job_guides(id) |
| type | question / answer / system / report_update |
| content | Metin veya JSON |
| created_at | Zaman damgası |

RLS: Kullanıcı sadece kendi `job_guides` ve ilgili `job_guide_events` kayıtlarına erişir.

### API akışı

1. Sayfa açılır → `params.jobId` → `guideJobId`  
2. `GET /api/job-posts/{id}` → ilan bilgisi  
3. `GET /api/job-guide?jobPostId=...` → varsa guide, yoksa 404  
4. 404 ise `POST /api/job-guide` → draft guide oluşturulur  
5. Kullanıcı cevap verir → PATCH `/api/job-guide` (answers_json)  
6. **Raporu Güncelle** → `POST /api/job-guide/update` → Gemini analiz → DB güncellenir → UI güncellenir  

**Dosyalar:**

- Sayfa: `src/app/premium/job-guide/[jobId]/page.tsx`  
- API: `src/app/api/job-guide/route.ts` (GET/POST/PATCH), `src/app/api/job-guide/update/route.ts` (POST, Gemini)  
- İlan: `src/app/api/job-posts/[id]/route.ts`  

---

## 7. Aynı sayfa / yanlış ilan görünmesi

**Muhtemel nedenler:**

- `jobId` değişince state sıfırlanmıyor  
- Route aynı kaldığı için component remount olmuyor  
- Eski `job` / `guide` ekranda kalıyor  

**Uygulanan çözüm:**

- `guideJobId` değiştiği anda ilgili effect içinde state sıfırlanıyor:  
  `setJob(null); setGuide(null); setLoading(true); setNextQuestions([]); setChatMessages([]); setActiveTab("report");`  
- Böylece farklı ilana geçildiğinde önce loading, sonra yeni ilan/guide verisi gösterilir.

**Alternatif (ileride):** İçeriği tek bir client component’e taşıyıp `<JobGuideClient key={jobId} jobId={jobId} />` kullanmak; `jobId` değişince React component’i yeniden mount eder.

**Kod:** `src/app/premium/job-guide/[jobId]/page.tsx` — `useEffect(..., [guideJobId, ...])` başında state reset.

---

## 8. UX hatalarından kaçınma

| Yapma | Yap |
|--------|-----|
| Uzun paragraf | Kısa, net cümleler |
| Her satırda emoji | Sadece gerekli yerlerde |
| Teknik terim | Günlük dil |
| 10+ soru | Odaklı, az soru |
| Kullanıcıyı yormak | Adım adım, karar odaklı |

---

## 9. Premium hissini oluşturan öğeler

1. İlerleme göstergesi (7 adım)  
2. Uygunluk / skor (rapor içinde)  
3. Maaş hesaplama tablosu (report_json.maas_yasam)  
4. 30 günlük plan (report_json.plan_30_gun)  
5. Kaydedilmiş rapor geçmişi (job_guides + job_guide_events)  

---

## 10. Panelin stratejik etkisi

- İlan listesini **danışmanlık platformu**na dönüştürür  
- Kullanıcıyı platforma bağlar  
- Tek aboneliği somut faydayla destekler  
- CV ve süreç paketlerine lead üretir  

---

## 11. Gelişmiş sürüm (ileri aşama)

- Sponsorlu ilan filtre motoru  
- Ülke karşılaştırma  
- Belge yükleme ve AI kontrol  
- Otomatik başvuru mail taslağı  
- Başvuru takibi (CRM mantığı)  

---

## Özet

**Premium Başvuru Paneli:** Statik rehber değil; **canlı, kişisel ve yönlendiren** bir sistem olmalı.

Kullanıcı:

- Ne yapacağını bilmeli  
- Eksiklerini görmeli  
- Riskleri anlamalı  
- Net bir yol haritası almalı  

---

## Dosya referansları (özet)

| Ne | Dosya / konum |
|----|----------------|
| Panel sayfası | `src/app/premium/job-guide/[jobId]/page.tsx` |
| Premium layout (guard) | `src/app/premium/layout.tsx` |
| İlan kartı | `src/components/premium/JobSummaryCard.tsx` |
| İlerleme adımları | `src/components/premium/ProgressStepper.tsx` |
| Rapor görüntüleyici | `src/components/premium/ReportViewer.tsx` |
| Soru–cevap chat | `src/components/premium/AssistantChat.tsx` |
| job_guide API | `src/app/api/job-guide/route.ts` |
| Rapor güncelleme (Gemini) | `src/app/api/job-guide/update/route.ts` |
| job_posts (ilan) API | `src/app/api/job-posts/[id]/route.ts` |
| Veritabanı şeması | `supabase/migrations/024_job_guides.sql` |
