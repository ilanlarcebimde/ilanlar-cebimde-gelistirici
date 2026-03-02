/**
 * Cover Letter Wizard (6 adım) — Revize soru metinleri, ipuçları, örnekler.
 * Alt başlık koşullu; Adım 4 pasaport/vize/çalışma izni detaylı.
 */

export type CoverLetterStepId = 1 | 2 | 3 | 4 | 5 | 6;

/** Modal genel — alt başlık kaldırıldı (boş) */
export const COVER_LETTER_WIZARD_HEADING = {
  title: "İş Başvuru Mektubu Oluştur",
  subtitle: "",
  subtitleGeneric: "",
  buttonBack: "Geri",
} as const;

/** STEP 1 — Meslek / Rol (Merkez & Genel — Step1Generic) */
export const COVER_LETTER_STEP_1_GENERIC = {
  title: "Meslek / Rol",
  question: "Hangi meslek için başvuruyorsunuz?",
  questionSub: "(İlanla birebir uyumlu rol yazmanız mektubun etkisini artırır.)",
  roleLabel: "Meslek / Rol (zorunlu)",
  rolePlaceholder: "Örn: İnşaat Şoförü (C/CE) / TIG Kaynakçı / Endüstriyel Tesisatçı / Forklift Operatörü",
  roleHint: "• Genel ifadeler (\"Usta\", \"İşçi\") yerine net teknik rol yazın.\n• Ehliyet veya uzmanlık varsa parantez içinde ekleyin.",
  workAreaLabel: "Çalışma alanı (opsiyonel)",
  workAreaPlaceholder: "Örn: Şantiye – Endüstriyel saha – Lojistik depo – Atölye üretim hattı",
  workAreaHint: "Çalışma ortamını belirtmek işverenin sizi doğru konumlandırmasını sağlar.",
  button: "Devam Et",
  disabledTooltip: "Meslek / rol bilgisini girin.",
} as const;

/** STEP 1 — Mektup Türü (İlanlı — StepJobConfirm, rapor/referans için) */
export const COVER_LETTER_STEP_1 = {
  title: "Mektup Türü",
  question: "Mektup hangi üslupta oluşturulsun?",
  options: [
    { value: "job_specific" as const, label: "İlana Özel (Önerilen)", badge: "Önerilen" },
    { value: "generic" as const, label: "Genel (Hızlı)" },
  ],
  button: "Devam Et",
  hint: "İlana özel mektup, pozisyon/ülke detayını daha net vurgular.",
  disabledTooltip: "Bir seçim yapın",
} as const;

/** STEP 2 — Kimlik & İletişim */
export const COVER_LETTER_STEP_2 = {
  title: "Kimlik & İletişim",
  question: "İşverenin sizi kolayca tanıyıp dönüş yapabilmesi için bilgilerinizi girin.",
  fields: {
    full_name: "Ad Soyad (zorunlu)",
    email: "E-posta (zorunlu)",
    phone: "Telefon (opsiyonel)",
    city_country: "Bulunduğunuz şehir / ülke (opsiyonel)",
  },
  placeholders: {
    full_name: "Örn: Arslan İbrahimoğlu",
    email: "Örn: örnek@gmail.com",
    phone: "Örn: +90 5xx xxx xx xx",
    city_country: "Örn: İstanbul / Türkiye",
  },
  subtext: "English sekmesindeki metin, işverene gönderime uygundur.",
  example: "Günlük kullandığınız bir adres yazın; yanlış yazım başvuruyu boşa çıkarır.",
  button: "Devam Et",
} as const;

/** STEP 3 — Deneyim & Beceriler */
export const COVER_LETTER_STEP_3 = {
  title: "Deneyim & Güçlü Yönler",
  question: "Deneyiminizi ve sizi öne çıkaran teknik becerilerinizi yazın.",
  fields: {
    total_experience_years: "Toplam deneyim (yıl)",
    position_experience_years: "Bu rolde deneyim (yıl)",
    last_company: "Son çalıştığınız firmalar / çalışma şekliniz",
    top_skills: "En güçlü beceriler (ideal 3–5, en az 2 zorunlu)",
  },
  placeholders: {
    total_experience_years: "Örn: 6",
    position_experience_years: "Örn: 4",
    last_company: "Örn: X İnşaat A.Ş. – Şantiye saha / Taşeron firma / Serbest çalışma / Yurt dışı proje",
    top_skills: "Virgül ile ayırın veya Enter ile tam ifadeyi ekleyin",
  },
  hints: {
    total_experience_years: "Toplam sektörel deneyiminizi yazın (örneğin 6).",
    position_experience_years: "Başvurduğunuz pozisyondaki aktif çalışma süresi.",
    last_company: "• Firma adı + sektör + çalışma modeli yazabilirsiniz.\n• Yurt dışı deneyimi varsa özellikle belirtin.",
    top_skills: "• Genel ifadeler yerine teknik ve ölçülebilir beceri yazın.\n• Sertifika veya lisans varsa beceriye ekleyin.\n• En az 2 teknik beceri zorunludur.",
  },
  skillsExample: "Ağır vasıta (C/CE) · Şantiye sevkiyat planlama · TIG kaynak (argon) · Endüstriyel tesis montajı · Güvenli sürüş & günlük kontrol",
  button: "Devam Et",
  disabledTooltip: "En az 2 beceri ekleyin.",
} as const;

/** STEP 4 — Belgeler & Yasal Durum (revize: geçerlilik, vize türü, izin desteği) */
export const COVER_LETTER_STEP_4 = {
  title: "Belgeler & Yasal Durum",
  question: "Yurtdışı başvurularda en kritik konu: belgelerin ve yasal durumun netliği.",
  passportLabel: "Pasaport var mı? (zorunlu)",
  passportOptions: [
    { value: "var", label: "Var" },
    { value: "yok", label: "Yok" },
    { value: "yenileniyor", label: "Yenileniyor" },
  ] as const,
  passportValidityLabel: "Pasaport geçerlilik süresi (opsiyonel)",
  passportValidityOptions: [
    { value: "0-6ay", label: "0–6 ay" },
    { value: "6-12ay", label: "6–12 ay" },
    { value: "12+ay", label: "12+ ay" },
    { value: "bilmiyorum", label: "Bilmiyorum" },
  ] as const,
  passportValidityHint: "Birçok ülke başvuruda minimum geçerlilik ister; emin değilsen \"Bilmiyorum\" seç.",
  passportExample: "Pasaport Var + 12+ ay → işveren için güçlü sinyal.",
  visaLabel: "Vize durumunuz (opsiyonel)",
  visaOptions: [
    { value: "var", label: "Var" },
    { value: "yok", label: "Yok" },
    { value: "başvuracağım", label: "Başvuracağım" },
  ] as const,
  visaTypeLabel: "Vize türü (opsiyonel)",
  visaTypeOptions: [
    { value: "turistik", label: "Turistik" },
    { value: "calisma", label: "Çalışma" },
    { value: "diger", label: "Diğer" },
    { value: "bilmiyorum", label: "Bilmiyorum" },
  ] as const,
  visaHint: "Vize yoksa sorun değil; \"Başvuracağım\" seçimi sürecin ciddiyetini gösterir.",
  workPermitLabel: "Çalışma izni durumunuz (zorunlu)",
  workPermitOptions: [
    { value: "var", label: "Var" },
    { value: "yok", label: "Yok" },
    { value: "başvuracağım", label: "Başvuracağım" },
  ] as const,
  workPermitSupportLabel: "Çalışma izni için destek bekliyor musunuz? (opsiyonel)",
  workPermitSupportOptions: [
    { value: "evet", label: "Evet" },
    { value: "hayir", label: "Hayır" },
  ] as const,
  workPermitSupportHint: "İşverenin sponsorluğu gerekebilir; bu alan mektuptaki üslubu doğru kurar.",
  certificates: "Sertifikalar / Belgeler",
  certificatePlaceholder: "Sertifika adı",
  certificateSuggestions: [
    "SRC (1–2–3–4)",
    "Psikoteknik",
    "Forklift Operatör Belgesi",
    "İş Güvenliği Eğitimi",
    "CE Sertifikası",
    "TIR / C / CE Ehliyet",
    "Ustalık Belgesi",
    "MYK Belgesi",
    "ISO Sertifikalı Eğitim",
    "Vinç Operatör Belgesi",
    "Kaynak Sertifikası (TIG/MIG/MAG)",
    "Elektrik Yetki Belgesi",
    "İlk Yardım Sertifikası",
  ],
  certificatesHint: "• Sertifikalar güven ve maaş seviyesini doğrudan etkiler.\n• Belgeniz varsa mutlaka ekleyin.\n• Yoksa boş bırakabilirsiniz.",
  availabilityLabel: "Ne zaman başlayabilirsiniz?",
  availabilityOptions: [
    { value: "hemen", label: "Hemen" },
    { value: "1ay", label: "1 ay içinde" },
    { value: "2ay", label: "2 ay içinde" },
    { value: "esnek", label: "Esnek" },
  ] as const,
  subtext: "Netlik = güven. Bu adım işverenin kararını hızlandırır.",
  passportNoneWarning: "Bazı başvurularda pasaport şart olabilir.",
  button: "Devam Et",
} as const;

/** STEP 5 — Motivasyon & Talepler */
export const COVER_LETTER_STEP_5 = {
  title: "Motivasyon",
  question: "Neden bu işe uygunsunuz ve işverene ne katarsınız?",
  questionSub: "(Ayrıca maaş, konaklama ve yasal durum beklentinizi net belirtin.)",
  guidance: "2–4 cümle yazın. Aşağıdaki unsurlardan en az birini eklemeniz önerilir:\n• Maaş beklentisi\n• Konaklama talebi\n• Pasaport / vize durumu\n• Çalışma izni süreci\n• Başlangıç tarihi",
  charCount: "0 / 400",
  hint: "Pozisyonu 1–2 cümlede geçirmeniz mektubu güçlendirir.",
  hintGeneric: "Kısa ve net: neden başvuruyorsunuz, ne katkı sunarsınız? 2–3 cümle yeter.",
  example: "Mesleğimde disiplinli, güvenli ve planlı çalışma prensibiyle ilerliyorum. Deneyimim ve teknik becerilerim sayesinde projelere hızlı uyum sağlayarak işi zamanında ve eksiksiz tamamlamayı hedefliyorum. Geçerli pasaportum bulunmaktadır ve çalışma izni sürecine hazırım. Konaklama imkânı sunulan uzun vadeli bir pozisyonda görev almak istiyorum.",
  placeholder: "Neden bu işe uygunsunuz ve ne katkı sunarsınız? 2–4 cümle yazın.",
  toneLabel: "Ton",
  toneOptions: [
    { value: "professional", label: "Profesyonel" },
    { value: "very_formal", label: "Çok resmî" },
  ] as const,
  maxCharsMessage: "400 karakter sınırı",
  button: "Devam Et",
} as const;

/** STEP 6 — Üretim & Sonuç */
export const COVER_LETTER_STEP_6 = {
  title: "Üretim & Sonuç",
  button: "Mektubu Oluştur",
  buttonGeneric: "Mektubu Oluştur",
  summaryLabels: {
    full_name: "Ad Soyad",
    email: "E-posta",
    role: "Meslek/Rol",
    experience: "Deneyim",
    skills: "En az 2 beceri",
    passport: "Pasaport",
    work_permit: "Çalışma izni",
    motivation: "Motivasyon",
  },
  loadingMessage: "İş Başvuru Mektubunuz oluşturuluyor",
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
  /** Türkçe sekme altı opsiyonel not */
  noticeTrFooter: "İsterseniz Türkçe metinden bazı cümleleri değiştirip tekrar üretebilirsiniz.",
  buttonCopyTr: "Türkçe Kopyala",
  buttonCopyEn: "Copy English",
  buttonOpenInEmail: "E-posta Uygulamasında Aç",
  buttonClose: "Kapat",
} as const;
