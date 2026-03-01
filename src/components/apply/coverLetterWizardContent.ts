/**
 * Cover Letter Wizard (6 adım) — UI metinleri, ipuçları ve örnekler.
 * Her adım: soru/başlık, ipucu, örnek, gereken alanlar.
 */

export type CoverLetterStepId = 1 | 2 | 3 | 4 | 5 | 6;

export const COVER_LETTER_STEP_1 = {
  title: "Mod seçimi",
  question: "Mektup hangi şekilde oluşturulsun?",
  options: [
    { value: "job_specific" as const, label: "İlana Özel (Önerilen)" },
    { value: "generic" as const, label: "Genel (Hızlı)" },
  ],
  hint: "İlana özel mektup, işverenin aradığı şartları doğrudan yakalar.",
  example: "İlana Özel: şirket + pozisyon + 2 şart (ehliyet, sertifika) içeren metin.",
  requiredFields: ["derived.mode"],
};

export const COVER_LETTER_STEP_2 = {
  title: "Kimlik ve iletişim",
  question: "Adınız ve e-posta adresiniz",
  hint: "İngilizce mektup işverene gönderileceği için e-posta doğru olmalı.",
  example: "Buğra Keser / bugra@mail.com / +90 5xx…",
  requiredFields: ["answers.full_name", "answers.email"],
  optionalFields: ["answers.phone", "answers.city_country"],
};

export const COVER_LETTER_STEP_3 = {
  title: "Deneyim ve güçlü yönler",
  question: "Deneyim süreniz ve en güçlü 2–5 beceri",
  hint: "Genel cümle yerine somut deneyim yaz: saha, araç, ekip, tempo.",
  example:
    "Kariyerimde 6 yıldır şantiye taşımacılığı ve saha lojistiğinde çalıştım. Zamanında teslim ve ekip koordinasyonu güçlü yönlerimdir.",
  requiredFields: ["answers.total_experience_years", "answers.top_skills (min 2, max 5)"],
};

export const COVER_LETTER_STEP_4 = {
  title: "Belgeler ve yasal durum",
  question: "Pasaport ve çalışma izni durumunuz",
  hint: "Yurtdışı başvurularında pasaport/izin bilgisi mutlaka net olmalı.",
  example:
    "Geçerli pasaportum bulunmaktadır. Çalışma izni için gerekli süreci başlatabilirim.",
  requiredFields: ["answers.passport_status", "answers.work_permit_status"],
  optionalFields: ["answers.documents", "answers.availability"],
};

export const COVER_LETTER_STEP_5 = {
  title: "Motivasyon (kısa ve net)",
  question: "Pozisyona kısa motivasyonunuz (en fazla 400 karakter)",
  hint: "Şirket adı + pozisyon + katkı cümlesi: 1–2 cümle.",
  example:
    "Firmanızın İnşaat Şoförü pozisyonunda güvenli ve düzenli çalışma disiplinimle şantiye operasyonlarına katkı sağlamak istiyorum.",
  requiredFields: ["answers.motivation (≤ 400 karakter)"],
};

export const COVER_LETTER_STEP_6 = {
  title: "Üretim ve sonuç",
  question: "Mektup oluşturuluyor",
  hint: "n8n ile TR ve EN metinler üretilir; son ekranda kopyalayıp kullanabilirsiniz.",
};

export const COVER_LETTER_STEPS = [
  COVER_LETTER_STEP_1,
  COVER_LETTER_STEP_2,
  COVER_LETTER_STEP_3,
  COVER_LETTER_STEP_4,
  COVER_LETTER_STEP_5,
  COVER_LETTER_STEP_6,
] as const;

/** Son ekran (Step 6 sonrası) — iki sekmeli ekran metinleri */
export const COVER_LETTER_RESULT_UI = {
  tabTr: "Türkçe (İnceleme)",
  tabEn: "English (Send)",
  noticeTr: "Bu metin sizin okumanız ve incelemeniz için oluşturulmuştur.",
  noticeEn:
    "Bu mektubu kopyalayın ve işverenin iletişim bilgisi üzerinden gerekli kanal aracılığıyla iletin (e-posta / başvuru portalı).",
  buttonCopyTr: "Türkçe Kopyala",
  buttonCopyEn: "Copy English",
  buttonPdfDownload: "PDF İndir",
  buttonOpenInEmail: "E-posta Uygulamasında Aç",
  buttonClose: "Kapat",
} as const;
