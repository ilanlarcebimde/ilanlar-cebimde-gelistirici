/**
 * Cover Letter Wizard (6 adım) — Profesyonel UI metinleri, ipuçları, örnekler.
 * Progress: 1/6 … 6/6. İlana özel üretim, Premium Plus algısı.
 */

export type CoverLetterStepId = 1 | 2 | 3 | 4 | 5 | 6;

/** Modal genel */
export const COVER_LETTER_WIZARD_HEADING = {
  title: "İş Başvuru Mektubu Oluştur",
  subtitle: "Bu mektup seçtiğiniz ilana göre hazırlanır.",
  buttonBack: "Geri",
} as const;

/** STEP 1 — Mod Seçimi */
export const COVER_LETTER_STEP_1 = {
  title: "Mod Seçimi",
  question: "Mektup hangi şekilde oluşturulsun?",
  options: [
    { value: "job_specific" as const, label: "İlana Özel (Önerilen)", badge: "Önerilen" },
    { value: "generic" as const, label: "Genel (Hızlı)" },
  ],
  button: "Devam Et",
  hint: "İlana özel mektup geri dönüş oranını artırır.",
  disabledTooltip: "Bir seçim yapın",
} as const;

/** STEP 2 — Kimlik & İletişim */
export const COVER_LETTER_STEP_2 = {
  title: "Kimlik & İletişim",
  fields: {
    full_name: "Ad Soyad (zorunlu)",
    email: "E-posta (zorunlu)",
    phone: "Telefon (opsiyonel)",
    city_country: "Bulunduğunuz şehir / ülke (opsiyonel)",
  },
  subtext: "İngilizce versiyon işverene gönderilecektir.",
  button: "Devam Et",
} as const;

/** STEP 3 — Deneyim & Güçlü Yönler */
export const COVER_LETTER_STEP_3 = {
  title: "Deneyim & Güçlü Yönler",
  fields: {
    total_experience_years: "Toplam deneyim (yıl) (zorunlu)",
    position_experience_years: "Bu pozisyondaki deneyim (yıl)",
    last_company: "Son çalıştığınız firma",
    top_skills: "En güçlü 3 beceri",
  },
  example: "Örnek: Şantiye lojistiği, ağır vasıta kullanımı, zamanında teslim.",
  bodyHint: "Bu adım mektubun ana gövdesini oluşturur.",
  button: "Devam Et",
} as const;

/** STEP 4 — Belgeler & Yasal Durum */
export const COVER_LETTER_STEP_4 = {
  title: "Belgeler & Yasal Durum",
  passportLabel: "Pasaport durumu",
  workPermitLabel: "Çalışma izni durumu",
  visaLabel: "Vize durumu",
  passportOptions: [
    { value: "var", label: "Var" },
    { value: "yok", label: "Yok" },
    { value: "yenileniyor", label: "Yenileniyor" },
  ] as const,
  workPermitOptions: [
    { value: "var", label: "Var" },
    { value: "yok", label: "Yok" },
    { value: "başvuracağım", label: "Başvuracağım" },
  ] as const,
  visaOptions: [
    { value: "var", label: "Var" },
    { value: "yok", label: "Yok" },
    { value: "başvuracağım", label: "Başvuracağım" },
  ] as const,
  passportNoneWarning: "Bazı başvurularda pasaport şart olabilir.",
  certificates: "Sertifikalar",
  certificateSuggestions: ["SRC", "Psikoteknik", "Forklift", "İş Güvenliği", "CE", "TIR"],
  availabilityLabel: "Çalışmaya başlama süresi",
  availabilityOptions: [
    { value: "hemen", label: "Hemen" },
    { value: "1ay", label: "1 ay içinde" },
    { value: "2ay", label: "2 ay içinde" },
  ] as const,
  subtext: "Yurtdışı başvurularda yasal durum net olmalı.",
  button: "Devam Et",
} as const;

/** STEP 5 — Motivasyon */
export const COVER_LETTER_STEP_5 = {
  title: "Motivasyon",
  question: "Bu pozisyona neden başvuruyorsunuz?",
  charCount: "0 / 400",
  hint: "Şirket adı ve pozisyonu 1–2 cümlede geçirin.",
  example: "Firmanızın Dublin'deki İnşaat Şoförü pozisyonunda uzun vadeli çalışarak katkı sağlamak istiyorum.",
  toneLabel: "Ton",
  toneOptions: [
    { value: "professional", label: "Profesyonel" },
    { value: "very_formal", label: "Çok resmî" },
  ] as const,
  maxCharsMessage: "400 karakter sınırı",
  button: "Devam Et",
} as const;

/** STEP 6 — Üretim */
export const COVER_LETTER_STEP_6 = {
  title: "Üretim & Sonuç",
  button: "Profesyonel Mektubumu Oluştur",
  loadingPhases: [
    "Bilgiler kontrol ediliyor…",
    "Mektup hazırlanıyor…",
    "Son düzenleme yapılıyor…",
  ] as const,
  retryButton: "Tekrar Dene",
} as const;

export const COVER_LETTER_STEPS = [
  COVER_LETTER_STEP_1,
  COVER_LETTER_STEP_2,
  COVER_LETTER_STEP_3,
  COVER_LETTER_STEP_4,
  COVER_LETTER_STEP_5,
  COVER_LETTER_STEP_6,
] as const;

/** Son ekran (Step 6 sonrası) — iki sekmeli */
export const COVER_LETTER_RESULT_UI = {
  tabTr: "Türkçe (İnceleme)",
  tabEn: "English (Send)",
  noticeTr: "Bu metin sizin okumanız ve incelemeniz için oluşturulmuştur.",
  noticeEn:
    "Bu mektubu kopyalayın ve işverenin iletişim bilgisi üzerinden gerekli kanal aracılığıyla iletin (e-posta / başvuru portalı).",
  buttonCopyTr: "Türkçe Kopyala",
  buttonCopyEn: "Copy English",
  buttonOpenInEmail: "E-posta Uygulamasında Aç",
  buttonClose: "Kapat",
} as const;
