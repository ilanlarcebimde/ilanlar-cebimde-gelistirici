# Form ile CV Doldurma - İşleyiş Raporu

## Genel Bakış

Form Wizard, kullanıcıların CV bilgilerini adım adım doldurmasını sağlayan bir bileşendir. Sorular, seçenekler, öneriler ve seçim önerileri ile kullanıcıya rehberlik eder.

---

## 1. Soru Yapısı ve Veri Modeli

### 1.1 CVQuestion Interface

Her soru (`CVQuestion`) şu özelliklere sahiptir:

```typescript
{
  id: string;                    // Benzersiz soru kimliği
  step: number;                   // Soru sırası (1-26)
  question: string;               // Soru metni
  type: "text" | "multiline" | "select";
  required: boolean;              // Zorunlu mu?
  voiceEnabled: boolean;          // Sesli asistan için aktif mi?
  chatEnabled: boolean;           // Sohbet için aktif mi?
  formEnabled: boolean;           // Form için aktif mi?
  examples: string[];            // Örnek cevaplar / ipuçları (max 4 gösterilir)
  options?: string[];            // Select soruları için seçenek listesi
  saveKey: string;                // Kayıt anahtarı (örn: "personal.fullName")
  hint?: string;                  // Genel ipucu
  formRequired?: boolean;        // Form için özel zorunluluk
  formHint?: string;             // Form için özel ipucu
}
```

### 1.2 Soru Filtreleme

`getQuestionsFor(mode)` fonksiyonu ile mod bazlı filtreleme yapılır:
- `mode === "form"` → `formEnabled === true` olanlar
- `mode === "voice"` → `voiceEnabled === true` olanlar
- `mode === "chat"` → `chatEnabled === true` olanlar

**Toplam soru sayısı:** 26 soru (fotoğraf hariç)

---

## 2. Soru Gösterimi ve UI Mantığı

### 2.1 Adım Yönetimi

- **State:** `step` (0-indexed, QUESTIONS array'i üzerinden)
- **İlerleme:** `step + 1 / QUESTIONS.length` gösterilir
- **Progress bar:** Animasyonlu, `(step + 1) / QUESTIONS.length * 100%`

### 2.2 Fazlar (Phases)

Form Wizard 3 fazdan oluşur:

1. **`"questions"`** - Ana sorular (26 soru)
2. **`"countryJob"`** - Ülke ve meslek seçimi
3. **`"photo"`** - Fotoğraf yükleme

**Geçiş mantığı:**
- Sorular bittiğinde → `countryJob`
- `countryJob` tamamlandığında → `photo`
- `photo` tamamlandığında → `onComplete()`

### 2.3 Focus Mode (Mobil Klavye)

**Koşul:** `isMobile && (inputFocused || viewportSmall)`

**Davranış:**
- Mini soru çubuğu gösterilir (başlık + "Soru X/25")
- Ana soru kartı kompakt hale gelir (`p-3` yerine `p-4`)
- Başlık ve ipucu gizlenir (sadece kısa ipucu gösterilir)
- Input alanı odakta kalır

**Viewport algılama:**
- `visualViewport.height < 0.6 * window.innerHeight` → Focus mode aktif

---

## 3. Soru Tipleri ve Input Render Mantığı

### 3.1 Text Input (`type === "text"`)

**Kullanım:** Tek satır metin girişi

**Özellikler:**
- `placeholder`: `currentQ.examples[0]` (varsa)
- Email adımı için `type="email"` + validasyon
- `min-h-[44px]` (touch-friendly)

**Özel durumlar:**
- **Email:** `isValidEmail()` kontrolü, `formRequired` kontrolü

### 3.2 Multiline Textarea (`type === "multiline"`)

**Kullanım:** Çok satırlı metin (örn: iş deneyimi, sertifikalar, ek not)

**Özellikler:**
- `rows`: Focus mode'da 3, normalde 6
- `min-h`: Focus mode'da 100px, normalde 140px
- `resize-y` (dikey yeniden boyutlandırma)

### 3.3 Select Dropdown (`type === "select"`)

**Kullanım:** Seçenek listesi (örn: eğitim seviyesi, deneyim yılı)

**Özellikler:**
- İlk seçenek: `"Seçin"` (placeholder)
- `dedupeOptions()` ile tekrarlar temizlenir
- `options` array'inden render edilir

**Özel select soruları:**
- **Meslek (`job_title`):** Arama kutusu + dropdown + "Diğer" için ek input
- **Eğitim (`education`):** Seviye + opsiyonel okul/bölüm/yıl alanları
- **Diller (`languages`):** "Evet/Hayır" → Dil listesi eklenir
- **Ehliyet (`driving_license`):** Çoklu seçim (checkbox'lar)
- **Maaş (`salary_note`):** Seçime göre dinamik alanlar açılır

---

## 4. Öneriler (Suggestions) Sistemi

### 4.1 Examples Array

Her soruda `examples: string[]` tanımlıdır. Bu örnekler:

**Kullanım amaçları:**
1. **İpucu olarak gösterilir** (çoğu soruda)
2. **Chip olarak tıklanabilir** (sadece "Ek not" sorunda metne eklenir)
3. **Placeholder olarak kullanılır** (`examples[0]`)

### 4.2 Öneriler Butonu

**Gösterim koşulu:** `currentQ.examples?.length > 0`

**Davranış:**
- Varsayılan: **Kapalı** (`suggestionsOpen = false`)
- "Öneriler ▶" butonu ile açılır/kapanır
- Açıldığında: İlk 4 örnek chip olarak gösterilir
- Chip tıklama: **Sadece "Ek not" sorunda** metne eklenir, diğerlerinde sadece ipucu

**Kod:**
```typescript
{(currentQ.examples?.length ?? 0) > 0 && (
  <button onClick={() => setSuggestionsOpen((o) => !o)}>
    Öneriler {suggestionsOpen ? "▼" : "▶"}
  </button>
)}
```

### 4.3 Chip Gösterimi

**Stil:** `rounded-full border border-slate-300 bg-white px-3 py-1.5`

**Özel durumlar:**
- **Ek not (`final_note`):** Chip tıklanınca metne eklenir (`value + "\n" + ex`)
- **Diğer sorular:** Chip sadece görsel ipucu, tıklama input'a yazmaz

---

## 5. Seçenekler (Options) ve Select Mantığı

### 5.1 Select Options

**Kaynak:** `currentQ.options` array'i

**İşleme:**
- `dedupeOptions()` ile tekrarlar temizlenir
- Boş ve `"Seçin"` değerleri filtrelenir
- Dropdown'a render edilir

### 5.2 Özel Select Soruları

#### 5.2.1 Meslek Seçimi (`job_title`)

**Yapı:**
1. **Arama kutusu:** `professionSearch` state'i ile filtreleme
2. **Dropdown:** `FORM_PROFESSION_LIST` (24 meslek + "Diğer")
3. **"Diğer" seçilirse:** Ek input (`work.titleOther`)

**Meslek listesi:** `FORM_PROFESSION_LIST` (cvQuestions.ts'de tanımlı)

#### 5.2.2 İş Deneyimi (`work_summary`)

**Yapı:** Dinamik liste (array of objects)

**Her deneyim:**
- İş yeri adı
- Pozisyon/Görev
- Süre (dropdown: "0–6 ay", "6–12 ay", "1–3 yıl", vb.)
- Görev maddeleri (textarea, her satıra bir madde)

**Özel özellik:**
- **"Önerilen görevler" butonu:** Meslek başlığına göre görev önerileri gösterir
- `getTasksForProfessionTitle()` ile meslek kütüphanesinden öneriler alınır
- Checkbox'larla seçilebilir, textarea'ya eklenir

**Kod:**
```typescript
{suggestedTasksForIndex === idx && (
  <div>
    {getTasksForProfessionTitle(jobTitle).tasks.map((t) => (
      <label>
        <input type="checkbox" />
        {t}
      </label>
    ))}
  </div>
)}
```

#### 5.2.3 Eğitim (`education`)

**Yapı:**
1. **Seviye dropdown:** `EDUCATION_LEVELS` (İlkokul → Lisans)
2. **Okul adı** (opsiyonel)
3. **Bölüm/Alan** (opsiyonel)
4. **Mezuniyet yılı** (opsiyonel)

**Kayıt:** `education.primary` (seviye), `education.schoolName`, `education.department`, `education.graduationYear`

#### 5.2.4 Diller (`languages`)

**Yapı:**
1. **İlk soru:** "Yabancı dil biliyor musunuz?" → "Evet/Hayır"
2. **"Evet" seçilirse:** Dinamik dil listesi eklenir

**Her dil:**
- Dil dropdown: `COMMON_LANGUAGES` (Almanca, İngilizce, vb.)
- Seviye dropdown: `LANGUAGE_LEVELS` (Başlangıç, Orta, İyi, Çok iyi)

**Kayıt:** `languages` (string: "Evet"/"Hayır"), `languagesList` (array: `{lang, level}[]`)

#### 5.2.5 Ehliyet (`driving_license`)

**Yapı:** Çoklu seçim (checkbox'lar)

**Seçenekler:** `DRIVING_OPTIONS` = ["Yok", "A", "B", "C", "CE", "D", "Diğer"]

**Özel durum:** "Diğer" seçilirse ek input (`mobility.drivingLicenseOther`)

**Kayıt:** `mobility.drivingLicense` (array: `string[]`)

#### 5.2.6 Sertifikalar (`certificates`)

**Yapı:** Dinamik liste (array of objects)

**Her sertifika:**
- Sertifika adı
- Yıl (opsiyonel)
- Kurum (opsiyonel)

**Özel özellik:**
- **"Örnekler" butonu:** `CERT_EXAMPLES` gösterilir
- Chip tıklanınca listeye eklenir

**Örnekler:** ["MYK Mesleki Yeterlilik", "Ustalık belgesi", "Hijyen belgesi", "İSG eğitimi", "Forklift belgesi"]

#### 5.2.7 Maaş (`salary_note`)

**Yapı:** Dinamik alanlar

**Seçenekler:**
- "Yazmak istemiyorum"
- "Görüşmede konuşmak istiyorum"
- "Net maaş yazmak istiyorum" → Tutar + Para birimi
- "Maaş aralığı yazmak istiyorum" → Min + Max + Para birimi

**Para birimleri:** `CURRENCIES` = ["TRY", "EUR", "USD", "GBP"]

**Kayıt:** `work.salaryNote`, `work.salaryAmount`, `work.salaryMin`, `work.salaryMax`, `work.salaryCurrency`

---

## 6. Validasyon ve Zorunluluk Kontrolü

### 6.1 Required Kontrolü

**Kaynak:** `currentQ.formRequired ?? currentQ.required`

**Kontrol:** `canNext()` fonksiyonu

```typescript
const canNext = () => {
  if (phase === "questions" && currentQ) {
    if (isFormRequired && !value.trim()) return false;
    if (isEmailStep && isFormRequired && value.trim()) {
      return isValidEmail(value);
    }
    if (isFormRequired) return value.trim().length > 0;
  }
  if (phase === "countryJob") return country && jobArea;
  return true;
};
```

### 6.2 Email Validasyonu

**Regex:** `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

**Kontrol:** `isValidEmail()` fonksiyonu

**Davranış:**
- Email adımı için `type="email"` kullanılır
- `formRequired === true` ise geçerli email zorunlu
- "İleri" butonu disabled olur geçersiz email'de

### 6.3 Country/JobArea Validasyonu

**Koşul:** `country && jobArea` (ikisi de dolu olmalı)

**Not:** `jobBranch` artık zorunlu değil (UI'dan kaldırıldı)

---

## 7. Veri Kaydetme Mantığı

### 7.1 Nested Path Sistemi

**saveKey formatı:** `"personal.fullName"`, `"work.title"`, `"mobility.drivingLicense"`

**Fonksiyonlar:**
- `setAnswerBySaveKey(answers, saveKey, value)` → String değer yazar
- `setAnswerBySaveKeyValue(answers, saveKey, value)` → Herhangi bir değer yazar (array, object, string)
- `getAnswerBySaveKey(answers, saveKey)` → String okur
- `getAnswerBySaveKeyValue(answers, saveKey)` → Herhangi bir değer okur

**Örnek:**
```typescript
// "personal.fullName" → answers.personal.fullName = "Ahmet Yılmaz"
setAnswerBySaveKey(answers, "personal.fullName", "Ahmet Yılmaz");

// "work.experiences" → answers.work.experiences = [{company: "...", ...}]
setAnswerBySaveKeyValue(answers, "work.experiences", experiencesArray);
```

### 7.2 Özel Kayıt Mantıkları

#### 7.2.1 İş Deneyimi
- `work.experiences`: Array of `{company, position, duration, tasks}`
- `work.titleOther`: "Diğer" meslek için özel meslek adı

#### 7.2.2 Diller
- `languages`: "Evet" veya "Hayır" (string)
- `languagesList`: `[{lang: "Almanca", level: "İyi"}, ...]` (array)

#### 7.2.3 Ehliyet
- `mobility.drivingLicense`: `["B", "C"]` (array)
- `mobility.drivingLicenseOther`: "Diğer" için açıklama (string)

#### 7.2.4 Sertifikalar
- `certificates.list`: `[{name: "...", year: "2020", org: "..."}]` (array)

---

## 8. UI/UX Özellikleri

### 8.1 Animasyonlar

**Sorular arası geçiş:**
- `AnimatePresence` + `motion.div`
- `initial={{ opacity: 0, x: 6 }}`
- `animate={{ opacity: 1, x: 0 }}`
- `exit={{ opacity: 0, x: -6 }}`

**Progress bar:**
- `motion.div` ile animasyonlu genişleme
- `transition={{ duration: 0.25 }}`

### 8.2 Responsive Tasarım

**Mobil (< 640px):**
- Focus mode aktif
- Butonlar tam genişlik (`w-full`)
- "Devam Et" / "Önceki Soru" etiketleri

**Desktop (≥ 640px):**
- Normal mod
- Butonlar otomatik genişlik (`w-auto`)
- "İleri" / "Geri" etiketleri

### 8.3 Sticky Footer

**Konum:** `sticky bottom-0`

**İçerik:**
- Microcopy: "Bilgileriniz güvenle işlenir. Eksik alanlar sorun olmaz."
- "İleri" butonu (primary, disabled durumda gri)
- "Geri" butonu (secondary, ilk soruda disabled)

**Padding:** `paddingBottom: calc(0.5rem + env(safe-area-inset-bottom))` (iOS safe area)

---

## 9. Özel Soru Mantıkları

### 9.1 Meslek Seçimi (`job_title`)

**Arama:** `professionSearch` state'i ile `FORM_PROFESSION_LIST` filtrelenir

**"Diğer" seçimi:**
- `work.title` = "Diğer"
- `work.titleOther` input'u görünür
- Kullanıcı özel meslek adı yazar

### 9.2 İş Deneyimi (`work_summary`)

**Dinamik liste:**
- `+ Deneyim ekle` butonu ile yeni deneyim eklenir
- Her deneyim kartı: İş yeri, pozisyon, süre, görevler

**Görev önerileri:**
- `suggestedTasksForIndex` state'i ile hangi deneyim için öneriler açık tutulur
- `getTasksForProfessionTitle(jobTitle)` ile meslek kütüphanesinden öneriler alınır
- Checkbox'larla seçilir, textarea'ya eklenir

### 9.3 Eğitim (`education`)

**Seviye seçimi zorunlu değil**, ancak seçilirse:
- Okul adı, bölüm, mezuniyet yılı opsiyonel alanlar olarak eklenir

### 9.4 Diller (`languages`)

**İki aşamalı:**
1. "Evet/Hayır" seçimi
2. "Evet" ise dinamik dil listesi

**Dil ekleme:** `+ Dil ekle` butonu ile yeni dil eklenir

### 9.5 Ehliyet (`driving_license`)

**Çoklu seçim:** Checkbox'lar ile birden fazla sınıf seçilebilir

**"Diğer" seçimi:** Ek input görünür

### 9.6 Sertifikalar (`certificates`)

**Dinamik liste:** `+ Sertifika ekle` ile yeni sertifika eklenir

**Örnekler:** "Örnekler" butonu ile `CERT_EXAMPLES` gösterilir, chip tıklanınca listeye eklenir

### 9.7 Maaş (`salary_note`)

**Dinamik alanlar:**
- "Net maaş" → Tutar + Para birimi
- "Maaş aralığı" → Min + Max + Para birimi

### 9.8 Ek Not (`final_note`)

**Özel davranış:** Öneriler chip'leri tıklanınca metne eklenir (`value + "\n" + ex`)

---

## 10. Ülke ve Meslek Seçimi (countryJob Phase)

### 10.1 Ülke Seçimi

**Yapı:**
- Arama kutusu: `countrySearch` state'i
- Dropdown: `COUNTRIES` filtrelenir
- Format: `{flag} {name}` (örn: "🇩🇪 Almanya")

**Kayıt:** `country` (string: country ID)

### 10.2 Meslek Alanı Seçimi

**Yapı:**
- Arama kutusu: `jobAreaSearch` state'i
- Dropdown: `PROFESSION_AREAS` filtrelenir

**Kayıt:** `jobArea` (string: area ID)

**Not:** `jobBranch` artık UI'da yok, sadece backend'de kullanılabilir.

---

## 11. Fotoğraf Yükleme (photo Phase)

**Bileşen:** `PhotoUpload`

**Özellikler:**
- Drag & drop
- Dosya seçimi
- Önizleme
- Temizleme

**Kayıt:** `photoUrl` (string | null), `photoFile` (File | null)

---

## 12. Buton Etiketleri ve Durumlar

### 12.1 "İleri" Butonu

**Etiketler:**
- Son soru değilse: Mobil "Devam Et" / Desktop "İleri"
- Son soru: "Devam et"
- countryJob fazı: "Devam et — Fotoğraf"
- photo fazı: "Tamamla"
- Kayıt sırasında: "Kaydediliyor…"

**Disabled durumları:**
- Zorunlu alan boşsa
- Email geçersizse
- countryJob'da country veya jobArea boşsa
- `isCompleting === true`

### 12.2 "Geri" Butonu

**Etiketler:**
- Mobil: "Önceki Soru"
- Desktop: "Geri"

**Disabled durumları:**
- İlk soruda (`step === 0`)

---

## 13. Özet: Veri Akışı

```
1. Kullanıcı input'a yazar / seçer
   ↓
2. setValue() / setExperiences() / vb. çağrılır
   ↓
3. setAnswerBySaveKey() ile answers güncellenir
   ↓
4. onAnswersChange(answers) parent'a iletilir
   ↓
5. Parent state güncellenir
   ↓
6. FormWizard re-render olur, yeni değerler gösterilir
   ↓
7. "İleri" tıklanınca canNext() kontrol edilir
   ↓
8. Geçerliyse step++ veya phase değişir
   ↓
9. Son adımda onComplete() çağrılır
```

---

## 14. Önemli Notlar

1. **Öneriler sadece ipucu:** Çoğu soruda öneriler chip'leri tıklanınca input'a yazılmaz, sadece görsel ipucu olarak gösterilir.

2. **"Ek not" özel:** Sadece `final_note` sorunda öneriler metne eklenir.

3. **Focus mode:** Mobilde klavye açıldığında UI kompakt hale gelir, kullanıcı deneyimi optimize edilir.

4. **Nested path:** Tüm kayıtlar `saveKey` ile nested path kullanır (örn: `"personal.fullName"` → `answers.personal.fullName`).

5. **Dinamik listeler:** İş deneyimi, diller, sertifikalar dinamik listelerdir, kullanıcı istediği kadar ekleyebilir.

6. **Meslek kütüphanesi:** İş deneyimi görev önerileri `professionLibrary.ts`'den gelir, meslek başlığına göre filtrelenir.

7. **Validasyon:** Email için regex kontrolü, zorunlu alanlar için trim kontrolü yapılır.

8. **Responsive:** Mobil ve desktop için farklı UI/UX uygulanır.

---

## 15. İlgili Dosyalar

- `src/components/wizard/FormWizard.tsx` - Ana bileşen
- `src/data/cvQuestions.ts` - Soru tanımları
- `src/data/professionLibrary.ts` - Meslek görev önerileri
- `src/data/countries.ts` - Ülke listesi
- `src/data/professions.ts` - Meslek alanları listesi
- `src/lib/assistant/fieldRules.ts` - Field rules (Gemini için)

---

**Rapor Tarihi:** 2026-02-06  
**Versiyon:** 1.0
