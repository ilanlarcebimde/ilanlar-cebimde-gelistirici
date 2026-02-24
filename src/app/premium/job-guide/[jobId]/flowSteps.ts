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

export const FLOW_STEPS: FlowStepDef[] = [
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
