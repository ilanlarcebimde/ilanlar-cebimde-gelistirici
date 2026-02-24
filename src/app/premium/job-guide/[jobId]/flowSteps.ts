/** Minimal soru akışı: ilan bilgisi alındıktan sonra kullanıcıya gösterilecek adımlar. */
export type StepType = "multiselect" | "choice" | "text";

export type FlowStepDef = {
  id: string;
  question: string;
  type: StepType;
  options?: { value: string; label: string }[];
  answerKey: string;
  placeholder?: string;
};

/** Kaynak rehberinden hemen sonra sorulur: Türkçe çeviri rehberi anlatılsın mı? */
export const WANT_TRANSLATION_QUESTION = "Çoğu yurtdışı iş ilanı yabancı dildedir. Size Türkçe'ye nasıl çevireceğinizi anlatmamı ister misiniz?";

/** Bölge belgelerinden sonra, ilan ülkesine göre sorulur. */
export const WANT_PASSPORT_VISA_QUESTION = "Size pasaport ve vize işlemlerini anlatmamı ister misiniz?";

/** Pasaport/vize sonrası, ilan ülkesine göre sorulur. */
export const WANT_SALARY_LIFE_QUESTION = "Size ortalama \"maaş ve yaşam gider hesabı\"nı anlatmamı ister misiniz?";

export const FLOW_STEPS: FlowStepDef[] = [
  {
    id: "want_translation",
    answerKey: "want_translation",
    question: WANT_TRANSLATION_QUESTION,
    type: "choice",
    options: [
      { value: "Evet", label: "Evet" },
      { value: "Hayır", label: "Hayır" },
    ],
  },
  {
    id: "want_passport_visa",
    answerKey: "want_passport_visa",
    question: WANT_PASSPORT_VISA_QUESTION,
    type: "choice",
    options: [
      { value: "Evet", label: "Evet" },
      { value: "Hayır", label: "Hayır" },
    ],
  },
  {
    id: "want_salary_life",
    answerKey: "want_salary_life",
    question: WANT_SALARY_LIFE_QUESTION,
    type: "choice",
    options: [
      { value: "Evet", label: "Evet" },
      { value: "Hayır", label: "Hayır" },
    ],
  },
  {
    id: "services",
    answerKey: "services_selected",
    question: "Hangi hizmetleri kullanmak istiyorsunuz?",
    type: "multiselect",
    options: [
      { value: "apply_guide", label: "Adım adım başvuru rehberi" },
      { value: "docs_list", label: "Gerekli belgeler listesi" },
      { value: "salary_life_calc", label: "Maaş ve yaşam gider hesabı" },
      { value: "risk_assessment", label: "Risk değerlendirmesi" },
      { value: "one_week_plan", label: "1 haftalık başvuru planı" },
    ],
  },
  {
    id: "channel",
    answerKey: "apply_channel",
    question: "Başvuruyu hangi kanaldan yapacaksınız?",
    type: "choice",
    options: [
      { value: "eures", label: "EURES" },
      { value: "glassdoor", label: "Glassdoor / diğer portallar" },
      { value: "other", label: "Diğer (doğrudan işveren)" },
    ],
  },
  {
    id: "cv_ready",
    answerKey: "cv_ready",
    question: "CV'niz hazır mı? (PDF olarak)",
    type: "choice",
    options: [
      { value: "Evet", label: "Evet" },
      { value: "Hayır", label: "Hayır" },
      { value: "Emin değilim", label: "Emin değilim" },
    ],
  },
];
