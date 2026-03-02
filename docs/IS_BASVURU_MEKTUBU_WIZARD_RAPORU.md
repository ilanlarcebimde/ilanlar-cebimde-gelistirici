# İş Başvuru Mektubu Oluştur — Wizard Yapısı ve İşleyiş Raporu

Bu rapor, **İş Başvuru Mektubu Oluştur** wizard’ının tüm adımlarını, ekrandaki yazıları, validasyon kurallarını, API akışlarını ve hata mesajlarını tek dokümanda toplar.

---

## 0. İki Ayrı Sistem (Ücretsiz vs Merkezi)

| Sistem | Sayfa / Özellik | Webhook / API | Değişiklik |
|--------|------------------|---------------|------------|
| **Ücretsiz Yurtdışı İş İlanları — Nasıl başvururum** | Premium: "Nasıl başvururum" (howto) | `POST /api/apply/howto`, `POST /api/apply/howto-step`. **N8N_HOWTO_WEBHOOK_URL**. job_posts (job_id). | **Değiştirilmedi.** |
| **Yurtdışı İş Başvuru Merkezi — İş Başvuru Mektubu Oluştur** | "İş Başvuru Mektubu Oluştur" butonu | `POST /api/cover-letter`. **N8N_LETTER_WEBHOOK_URL**. merkezi_posts (post_id) veya yok. | Bu hizmet için sadece cover-letter kullanılır. |

- **Ücretsiz panel:** HowToApplyWizardModal → howto-step / howto → n8n howto webhook. **Bu akışa dokunulmadı.**
- **Merkezi sayfa:** CoverLetterWizardModal → `POST /api/cover-letter` → n8n letter webhook.

**"İçerik bulunamadı" düzeltmesi:** Merkezi'de post_id ile kayıt bulunamazsa eskiden 404 dönüyordu. Artık post yoksa da payload job olmadan webhook'a gidiyor; kullanıcı mektubunu alıyor. İlanlı (job_id) akışta ilan yoksa 404 aynen devam ediyor.

---

## 1. Genel Bilgi

| Özellik | Değer |
|--------|--------|
| **Bileşen** | `CoverLetterWizardModal` (`src/components/apply/cover-letter/CoverLetterWizardModal.tsx`) |
| **Adım sayısı** | 6 |
| **Çıktı** | Sadece metin (TR + EN); **PDF yok** |
| **Metin kaynağı** | `src/components/apply/coverLetterWizardContent.ts` |

---

## 2. Açılış Noktaları ve Akış Türleri

Wizard üç farklı kaynaktan açılabilir:

| Kaynak | Açıklama | Abonelik | İlan bilgisi client’ta yüklenir mi? |
|--------|----------|----------|--------------------------------------|
| **Merkez (postId)** | Yurtdışı İş Başvuru Merkezi — ilan kartı veya yazı altındaki “İş Başvuru Mektubu Oluştur” butonu | Premium (haftalık 99 TL) | Hayır; Adım 6’da server post_id ile ilanı alır |
| **İlanlı (jobId)** | Yurtdışı ilanlar paneli vb. — belirli bir job ilanına özel | Premium Plus | Evet; açılışta `GET /api/apply/full-job?job_id=...` |
| **Genel (generic)** | İlan bağımsız mektup (şu an UI’da buton kaldırıldı) | Premium Plus | Hayır |

- **Merkez:** Adım 1 = Meslek/Rol + Çalışma alanı; ilan kartı gösterilmez. Adım 6’da `POST /api/merkezi/post/[id]/letter-wizard`.
- **İlanlı:** Adım 1 = İlan kartı + Mod seçimi (İlana Özel / Genel). Adım 6’da `POST /api/apply/howto-step` (job_id ile).
- **Genel:** Adım 1 = Meslek/Rol + Çalışma alanı. Adım 6’da `POST /api/apply/howto-step` (job_id yok).

---

## 3. Modal Başlık ve Progress

| Alan | Metin |
|------|--------|
| **Başlık** | İş Başvuru Mektubu Oluştur |
| **Alt başlık (koşullu)** | İlanlı: "Bu mektup seçtiğiniz ilana göre hazırlanır." — Genel: "Bu mektup verdiğiniz bilgilere göre profesyonel şekilde hazırlanır." |
| **Geri butonu (adımlar içinde)** | Geri |
| **Progress metni** | Adım {currentStep} / 6 |
| **Progress bar** | 6 kutu; dolu olanlar `currentStep`’e kadar (1–6) |

Üstte 6’lı progress bar, altında “Adım X / 6” yazısı; sağ üstte kapat (X) butonu.

---

## 4. Adım Adım Ekranlar ve Yazılar

### Adım 1

**A) Merkez ve Genel akış (Step1Generic)**  
- **Başlık:** Meslek / Rol  
- **Soru (üst metin):** Hangi meslek için başvuruyorsunuz?  
- **Alanlar:**  
  - Meslek / Rol (zorunlu) — placeholder: *Örn: Kaynakçı / İnşaat Şoförü / Tesisatçı / Depo Personeli*  
  - Çalışma alanı (opsiyonel) — placeholder: *Örn: Şantiye / Atölye / Depo / Lojistik*  
- **İpucu:** Meslek bilgisi, mektubun dilini ve vurgusunu belirler. “Usta” yazmak yerine net rol yazın.  
- **Örnek:**  
  - Meslek/Rol: İnşaat Şoförü  
  - Çalışma alanı: Şantiye ve lojistik  
  - Açıklama: “Ağır vasıta, şantiye sevkiyatı, zamanında teslim” gibi ifadeler mektubu güçlendirir.  
- **Buton:** Devam Et  
- **Devam kapalı iken:** Meslek / rol bilgisini girin.  

**B) İlanlı akış (StepJobConfirm — rapor/referans)**  
- **Başlık:** Mektup Türü  
- **Soru:** Mektup hangi üslupta oluşturulsun?  
- **Seçenekler:**  
  - İlana Özel (Önerilen) — rozet: Önerilen  
  - Genel (Hızlı)  
- **İpucu:** İlana özel mektup, pozisyon/ülke detayını daha net vurgular.  
- **Devam kapalı iken:** Bir seçim yapın  

---

### Adım 2 — Kimlik & İletişim

- **Başlık:** Kimlik & İletişim  
- **Soru:** İşverenin sizi kolayca tanıyıp dönüş yapabilmesi için bilgilerinizi girin.  
- **Alanlar:**  
  - Ad Soyad (zorunlu) — placeholder: *Örn: Buğra Keser*  
  - E-posta (zorunlu) — placeholder: *Örn: bugra@mail.com*  
  - Telefon (opsiyonel) — placeholder: *Örn: +90 5xx xxx xx xx*  
  - Bulunduğunuz şehir / ülke (opsiyonel) — placeholder: *Örn: Edirne / Türkiye*  
- **Alt metin:** English sekmesindeki metin, işverene gönderime uygundur.  
- **Örnek:** E-posta: “Günlük kullandığınız bir adres yazın; yanlış yazım başvuruyu boşa çıkarır.”  
- **Buton:** Devam Et  

---

### Adım 3 — Deneyim & Güçlü Yönler

- **Başlık:** Deneyim & Güçlü Yönler  
- **Soru:** Deneyiminizi ve sizi öne çıkaran becerilerinizi yazın.  
- **Alanlar:**  
  - Toplam deneyim (yıl) (zorunlu) — placeholder: *Örn: 6*  
  - Bu rolde deneyim (yıl) (opsiyonel) — placeholder: *Örn: 4*  
  - Son çalıştığınız firma / çalışma şekli (opsiyonel) — placeholder: *Örn: Şantiye taşeronu / Atölye / Serbest*  
  - En güçlü beceriler (chip) (en az 2 zorunlu, ideal 3–5) — placeholder: Beceri yazın ve Enter’a basın  
- **İpucu:** “Çalışkanım” gibi genel ifadeler yerine teknik ve ölçülebilir beceriler yazın.  
- **Örnek (İnşaat Şoförü için):**  
  - Ağır vasıta (C/CE)  
  - Şantiye sevkiyat planlama  
  - Güvenli sürüş & günlük kontrol  
  - Zamanında teslim / disiplin  
- **Devam kapalı iken:** En az 2 beceri ekleyin.  
- **Buton:** Devam Et  

---

### Adım 4 — Belgeler & Yasal Durum

- **Başlık:** Belgeler & Yasal Durum  
- **Soru:** Yurtdışı başvurularda en kritik konu: belgelerin ve yasal durumun netliği. Lütfen seçin.  

**4.1 Pasaport**  
- Pasaport var mı? (zorunlu): Var / Yok / Yenileniyor  
- Pasaport geçerlilik süresi (opsiyonel): 0–6 ay / 6–12 ay / 12+ ay / Bilmiyorum  
- İpucu: Birçok ülke başvuruda minimum geçerlilik ister; emin değilsen “Bilmiyorum” seç.  
- Örnek: “Pasaport Var + 12+ ay” → işveren için güçlü sinyal.  

**4.2 Vize**  
- Vize durumunuz (opsiyonel): Var / Yok / Başvuracağım  
- Vize türü (opsiyonel): Turistik / Çalışma / Diğer / Bilmiyorum  
- İpucu: Vize yoksa sorun değil; “Başvuracağım” seçimi sürecin ciddiyetini gösterir.  

**4.3 Çalışma izni**  
- Çalışma izni durumunuz (zorunlu): Var / Yok / Başvuracağım  
- Çalışma izni için destek bekliyor musunuz? (opsiyonel): Evet / Hayır  
- İpucu: İşverenin sponsorluğu gerekebilir; bu alan mektuptaki üslubu doğru kurar.  

**4.4 Sertifikalar / Belgeler**  
- Sertifikalar (chip) — öneriler: SRC, Psikoteknik, Forklift, İş Güvenliği, CE, TIR, Ustalık Belgesi  
- İpucu: Sertifika yoksa boş bırakabilirsin; varsa eklemek mektubu ciddi güçlendirir.  

**4.5 Ne zaman başlayabilirsiniz?**  
- Hemen / 1 ay içinde / 2 ay içinde / Esnek  

- **Alt metin:** “Netlik = güven.” Bu adım işverenin kararını hızlandırır.  
- **Uyarı:** Bazı başvurularda pasaport şart olabilir.  
- **Buton:** Devam Et  

---

### Adım 5 — Motivasyon

- **Başlık:** Motivasyon  
- **Soru:** Neden bu işe uygunsunuz ve işverene ne katarsınız?  
- **Karakter sayacı:** 0 / 400  
- **Ton:** Profesyonel / Çok resmî  
- **İpucu (koşullu):**  
  - **İlanlı:** Pozisyonu 1–2 cümlede geçirmeniz mektubu güçlendirir.  
  - **Genel/Merkez:** Kısa ve net: neden başvuruyorsunuz, ne katkı sunarsınız? 2–3 cümle yeter. “Düzenli çalışma, güvenlik, ekip uyumu, sorumluluk” gibi net ifadeler kullanın.  
- **Örnek (Generic — şirket adı olmadan):**  
  “Mesleğimde disiplinli ve güvenli çalışma prensibiyle ilerliyorum. Deneyimim ve becerilerimle ekibe hızlı uyum sağlayıp işi zamanında ve düzgün şekilde tamamlamayı hedefliyorum. Uzun vadeli çalışma için uygunum.”  
- **Uyarı (400 aşımı):** 400 karakter sınırı  
- **Buton:** Devam Et  

---

### Adım 6 — Üretim & Sonuç

- **Başlık:** Üretim & Sonuç  
- **Buton:** Mektubu Oluştur (tüm akışlarda tek metin; tutarlılık için)  
- **Yükleme aşamaları (sırayla):**  
  1. Bilgiler kontrol ediliyor…  
  2. Mektup hazırlanıyor…  
  3. Son düzenleme yapılıyor…  
- **Özet kontrol listesi:**  
  - Ad Soyad ✅/—  
  - E-posta ✅/—  
  - Meslek/Rol ✅/—  
  - Deneyim ✅/—  
  - En az 2 beceri ✅/—  
  - Pasaport ✅/—  
  - Çalışma izni ✅/—  
  - Motivasyon ✅/—  
- **Hata sonrası:** Tekrar Dene  

---

## 5. Sonuç Ekranı (Step 6 Sonrası)

- **Sekmeler:**  
  - **Tab 1:** Türkçe (İnceleme)  
  - **Tab 2:** English (Send)  
- **Türkçe üst not:** Bu metin sizin okumanız ve incelemeniz için oluşturulmuştur.  
- **English üst not:** Bu mektubu kopyalayın ve işverenin iletişim bilgisi üzerinden gerekli kanal aracılığıyla iletin (e-posta / başvuru portalı).  
- **Türkçe sekme alt not (opsiyonel):** İsterseniz Türkçe metinden bazı cümleleri değiştirip tekrar üretebilirsiniz.  
- **Butonlar:**  
  - Türkçe Kopyala  
  - Copy English  
  - (İlan e-postası varsa) E-posta Uygulamasında Aç  
- **Kapat:** Kapat  

---

## 6. Validasyon Kuralları (Client)

| Adım | Zorunlu / Koşul | Hata mesajı (ör.) |
|------|------------------|--------------------|
| 1 (ilanlı) | `mode` = job_specific veya generic | Bir seçim yapın |
| 1 (genel/merkez) | `role` dolu | Meslek / rol gereklidir |
| 2 | `full_name` dolu | Ad Soyad gereklidir |
| 2 | `email` dolu + geçerli format | E-posta gereklidir / Geçerli bir e-posta adresi girin |
| 3 | `total_experience_years` sayı | Toplam deneyim (yıl) gereklidir |
| 3 | `top_skills` en az 2 öğe (ideal 3–5) | En az 2 beceri ekleyin |
| 4 | `passport_status` seçili (zorunlu) | Pasaport durumu seçin |
| 4 | `passport_validity_bucket` (opsiyonel) | — |
| 4 | `work_permit_status` seçili (zorunlu) | Çalışma izni durumu seçin |
| 4 | `work_permit_support_needed` (opsiyonel) | — |
| 4 | Vize (opsiyonel) | — |
| 5 | `motivation` dolu, ≤400 karakter | Motivasyon metni gereklidir / 400 karakter sınırı |

Merkez ve Genel’de Adım 1–5 için `validateStepGeneric`, İlanlı’da Adım 1 için `validateStep(1, mode, answers)`, Adım 2–5 için `validateStep(step, mode, answers)` kullanılır.

---

## 7. API İşleyişi

### Merkez (postId)

- **İlk yükleme:** İlan çekilmez; sorular hemen gösterilir.  
- **Adım 1–5:** Sadece client’ta adım artırılır; API çağrılmaz.  
- **Adım 6:**  
  - `POST /api/merkezi/post/{postId}/letter-wizard`  
  - Body: `session_id`, `step: 6`, `approved: true`, `locale: "tr-TR"`, `derived: { mode }`, `answers`  
  - Server: Premium kontrolü, cevapları doğrular, ilanı `postId` ile DB’den alır, n8n’e POST atar, dönen JSON’u client’a iletir.  
- **Abonelik:** Premium (haftalık); `isPremiumSubscriptionActive`.  

### İlanlı (jobId)

- **İlk yükleme:** `GET /api/apply/full-job?job_id=...` ile ilan alınır; Adım 1’de ilan kartı gösterilir.  
- **Adım 1–6:** Her “Devam”/gönderimde  
  - `POST /api/apply/howto-step`  
  - Body: `intent: "cover_letter_generate"`, `job_id`, `session_id`, `step`, `approved`, `locale: "tr-TR"`, `derived: { mode }`, `answers`  
- **Adım 6:** Aynı endpoint; backend n8n’e POST atar.  
- **Abonelik:** Premium Plus.  

### Genel (generic)

- **İlk yükleme:** İlan yok; sorular hemen gösterilir.  
- **Adım 1–6:**  
  - `POST /api/apply/howto-step`  
  - Body: `intent: "cover_letter_generate"`, `session_id`, `step`, `approved`, `locale: "tr-TR"`, `answers` (job_id yok)  
- **Abonelik:** Premium Plus.  

---

## 8. Hata Mesajları (UI)

| Kod | Başlık / Davranış | Buton |
|-----|--------------------|--------|
| `premium_required` | Premium Gerekli — Bu özellik için haftalık Premium aboneliği gereklidir. Firma İletişim Bilgileri ile aynı abonelik. | Premium'a Geç (Avantajlar & Kupon) — modal kapanır, Premium popup açılır |
| `premium_plus_required` | Premium Plus Gerekli | Premium Plus'a Geç — modal kapanır |
| `webhook_not_configured` | Servis Hazır Değil — Mektup servisi yapılandırılmamış. (Dev’de: N8N_LETTER_WEBHOOK_URL eksik) | Tekrar Dene |
| `webhook_error` | Geçici Sorun — Mektup servisi geçici olarak yanıt vermiyor. | Tekrar Dene |
| `merkezi_load_failed` | İçerik yüklenemedi — İçerik şu an yüklenemedi. Lütfen sayfayı yenileyip tekrar deneyin. | Sayfayı yenile |
| `job_not_found` | İlan bulunamadı | — |
| Diğer | `error.message` | — |

---

## 9. Kullanılan Dosyalar

| Dosya | Amaç |
|-------|------|
| `src/components/apply/cover-letter/CoverLetterWizardModal.tsx` | Ana modal; adım yönlendirme, hata blokları |
| `src/components/apply/cover-letter/lib/useCoverLetterWizard.ts` | State, fetch, submitStep (merkez/ilanlı/genel) |
| `src/components/apply/cover-letter/lib/coverLetterSchema.ts` | Tipler, validasyon (validateStep / validateStepGeneric) |
| `src/components/apply/coverLetterWizardContent.ts` | Tüm sabit başlık, alan, buton, ipucu metinleri |
| `src/components/apply/cover-letter/ui/ProgressHeader.tsx` | Başlık, alt başlık, progress bar, “Adım X / 6” |
| `src/components/apply/cover-letter/steps/Step1Generic.tsx` | Adım 1 — Meslek/Rol (merkez & genel) |
| `src/components/apply/cover-letter/steps/StepJobConfirm.tsx` | Adım 1 — Mod seçimi (ilanlı) |
| `src/components/apply/cover-letter/steps/StepIdentity.tsx` | Adım 2 |
| `src/components/apply/cover-letter/steps/StepExperience.tsx` | Adım 3 |
| `src/components/apply/cover-letter/steps/StepLegalDocs.tsx` | Adım 4 |
| `src/components/apply/cover-letter/steps/StepMotivation.tsx` | Adım 5 |
| `src/components/apply/cover-letter/steps/StepResultTabs.tsx` | Sonuç ekranı (TR/EN sekmeler, kopyala, mailto) |
| `src/app/api/apply/howto-step/route.ts` | İlanlı & genel cover letter (intent=cover_letter_generate) |
| `src/app/api/merkezi/post/[id]/letter-wizard/route.ts` | Merkez Adım 6 |

---

## 10. Özet Akış Şeması

```
[İş Başvuru Mektubu Oluştur tıklandı]
         │
         ├─ Merkez (postId) ──► Modal açılır, ilan yüklenmez
         │   Adım 1: Meslek/Rol → 2: Kimlik → 3: Deneyim → 4: Belgeler → 5: Motivasyon → 6: Mektubu Oluştur
         │   Adım 6: POST /api/merkezi/post/{id}/letter-wizard → n8n → TR/EN metin
         │
         ├─ İlanlı (jobId) ──► GET full-job → ilan kartı
         │   Adım 1: Mod seçimi → 2–5 aynı → 6: Profesyonel Mektubumu Oluştur
         │   Her adım: POST /api/apply/howto-step (job_id ile)
         │
         └─ Genel (generic) ──► Modal açılır, ilan yok
             Adım 1: Meslek/Rol → 2–5 aynı → 6: Mektubu Oluştur
             Her adım: POST /api/apply/howto-step (job_id yok)
```

Bu rapor, wizard’daki tüm işleyişi ve yazıları tek referans olarak kullanmak için güncellenebilir.
