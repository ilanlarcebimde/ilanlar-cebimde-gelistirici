/**
 * Job Guide config — 2026-02-24+v2
 * Deterministic flow: showIf koşulu tutmuyorsa atla; answerKey doluysa asla tekrar gösterme; ilk cevaplanmamış soruyu göster.
 * Rule: answerKey doluysa asla tekrar gösterme. showIf koşulu tutmuyorsa atla. İlk cevaplanmamış soruyu göster.
 */

export const JOB_GUIDE_CONFIG_VERSION = "2026-02-24+v3";

/** Hızlı Rehber: ilk mesajda sadece bilgi, soru yok. "Yapılacaklar" (rapor kelimesi yok). */
export const QUICK_GUIDE_TEMPLATES = {
  title: "Hızlı Rehber",
  EURES: {
    fullText: `Merhaba efendim. Bu iş ilanının kaynağı EURES'tir. EURES, Avrupa'da kamu destekli ve en güvenilir iş ilanlarının toplandığı resmi ağdır. Başvuruyu hızlıca tamamlamak için şu sırayı izleyin:

✅ 1) İlan sayfasını açın: "İlana Git" → ilanı EURES'te açın.
✅ 2) Başvuru bölümünü bulun: ilanda "How to apply / Apply" kısmını bulun (başvuru yöntemi burada yazar).
✅ 3) Dil desteği: sayfa İngilizceyse Chrome'da sağ tık → Türkçeye çevir (telefon: ⋮ → Çevir).
✅ 4) Giriş gerekiyorsa: bazı ilanlar EU Login / EURES hesabı isteyebilir.
✅ 5) Başvuru yöntemine göre ilerleyin: "Apply" butonu → form/portal üzerinden; "E-posta ile başvuru" → istenen belgeleri maille göndererek; "Şirket sitesi" → şirketin kariyer sayfasına yönlenerek.

Şimdi ben senden sadece gerekli bilgileri tek tek alacağım; her cevap sonrası "Yapılacaklar" listen netleşecek.`,
  },
  GLASSDOOR: {
    fullText: `Merhaba efendim. Bu iş ilanının kaynağı Glassdoor'dur. Başvuru çoğu ilanda "Apply / Sign in to apply" alanından yapılır.

✅ 1) İlanı açın: "İlana Git" → ilan sayfasını açın.
✅ 2) Dil desteği: Chrome → sağ tık → Türkçeye çevir.
✅ 3) Başvuru alanı: "Apply / Sign in to apply" görürseniz başvuru buradan yürür.
✅ 4) Şirket sitesine atarsa: aynı ilanı şirketin kariyer sayfasında bulup oradan başvuracağız.

Şimdi ben senden sadece gerekli bilgileri tek tek alacağım; her cevap sonrası "Yapılacaklar" listen netleşecek.`,
  },
} as const;

export type DoneRule =
  | { type: "equals"; answerKey: string; value: string }
  | { type: "equalsAny"; answerKey: string; values: string[] }
  | { type: "minLength"; answerKey: string; value: number }
  | { type: "notEmpty"; answerKey: string }
  | { type: "minSelected"; answerKey: string; value: number };

export type ShowIfCondition =
  | { answerKey: string; equals: string }
  | { answerKey: string; equalsAny: string[] }
  | { answerKey: string; isEmpty: true }
  | { answerKey: string; includes: string };

export type FlowInput =
  | { type: "text"; placeholder: string }
  | { type: "textarea"; placeholder: string }
  | { type: "multiselect" };

export type FlowStep = {
  id: string;
  checklistLabel: string;
  text: string;
  choices?: string[];
  input?: FlowInput;
  answerKey: string;
  askOnce?: boolean;
  showIf?: { all: ShowIfCondition[] };
  doneRule: DoneRule;
};

/** Seçenek setleri: Evet/Hayır/Emin değilim; Gördüm/Göremedim/Emin değilim; belgeler; dil. */
const CHOICES = {
  yesNoMaybe: ["Evet", "Hayır", "Emin değilim"],
  applySection: ["Gördüm", "Göremedim", "Emin değilim"],
  applyMethod: ["Form/Portal", "E-posta", "Şirket sitesi", "Emin değilim"],
  docProof: [
    "Ustalık belgesi / MYK",
    "Kalfalık belgesi",
    "SGK hizmet dökümü",
    "Sertifika",
    "Referans mektubu",
    "Portföy (foto/video)",
    "Hiçbiri",
  ],
  languageLevel: ["A0", "A1–A2", "B1", "B2", "C1+"],
} as const;

export const QUESTION_FLOW = {
  /** Varsayılan kaynak için GLASSDOOR akışı kullanılır. */
  COMMON: [] as FlowStep[],

  EURES: [
    {
      id: "found_apply_section",
      checklistLabel: "Başvuru bölümü görüldü",
      text: "İlan sayfasında “How to apply / Apply” bölümünü görüyor musunuz?",
      choices: [...CHOICES.applySection],
      answerKey: "found_apply_section",
      doneRule: { type: "notEmpty", answerKey: "found_apply_section" },
    },
    {
      id: "apply_method",
      checklistLabel: "Başvuru yöntemi netleşti",
      text: "İlanda başvuru yöntemi hangisi olarak yazıyor?",
      choices: [...CHOICES.applyMethod],
      answerKey: "apply_method",
      showIf: { all: [{ answerKey: "found_apply_section", equalsAny: ["Gördüm", "Emin değilim"] }] },
      doneRule: { type: "notEmpty", answerKey: "apply_method" },
    },
    {
      id: "has_eu_login",
      checklistLabel: "Giriş gerekliliği kontrol edildi",
      text: "Başvuru için EU Login / EURES hesabı istiyor mu? (İlanda yazıyorsa)",
      choices: [...CHOICES.yesNoMaybe],
      answerKey: "needs_eu_login",
      showIf: { all: [{ answerKey: "apply_method", equalsAny: ["Form/Portal", "Emin değilim"] }] },
      doneRule: { type: "notEmpty", answerKey: "needs_eu_login" },
    },
    {
      id: "passport_status",
      checklistLabel: "Pasaport durumu alındı",
      text: "Geçerli bir pasaportunuz var mı?",
      choices: [...CHOICES.yesNoMaybe],
      answerKey: "has_passport",
      doneRule: { type: "notEmpty", answerKey: "has_passport" },
    },
    {
      id: "citizenship_eu",
      checklistLabel: "Çalışma izni uygunluğu için vatandaşlık alındı",
      text: "AB / AEA vatandaşı mısınız?",
      choices: [...CHOICES.yesNoMaybe],
      answerKey: "is_eu_eea_citizen",
      doneRule: { type: "notEmpty", answerKey: "is_eu_eea_citizen" },
    },
    {
      id: "cv_ready",
      checklistLabel: "CV durumu alındı",
      text: "Bu ilana özel CV’niz hazır mı? (tercihen PDF)",
      choices: [...CHOICES.yesNoMaybe],
      answerKey: "cv_ready",
      doneRule: { type: "notEmpty", answerKey: "cv_ready" },
    },
    {
      id: "proof_docs",
      checklistLabel: "Mesleki kanıtlar toplandı",
      text: "Mesleğinizi kanıtlamak için elinizde hangileri var? (Birden çok seçebilirsiniz)",
      choices: [...CHOICES.docProof],
      input: { type: "multiselect" },
      answerKey: "proof_docs",
      doneRule: { type: "minSelected", answerKey: "proof_docs", value: 1 },
    },
    {
      id: "language_level",
      checklistLabel: "Dil seviyesi alındı",
      text: "İş dili için seviyeniz nedir?",
      choices: [...CHOICES.languageLevel],
      answerKey: "language_level",
      doneRule: { type: "notEmpty", answerKey: "language_level" },
    },
    {
      id: "blocking_issue",
      checklistLabel: "Engel durumu alındı",
      text: "Başvuruyu şu an tıkayan bir sorun var mı?",
      choices: ["Yok", "Var (yazacağım)"],
      answerKey: "blocking_issue",
      doneRule: { type: "notEmpty", answerKey: "blocking_issue" },
    },
    {
      id: "blocking_issue_text",
      checklistLabel: "Engel detayı alındı",
      text: "Lütfen tıkayan sorunu 1–2 cümleyle yazın (örn: vize, hesap açılmıyor, belge eksik…).",
      input: { type: "textarea", placeholder: "Sorunu yazın…" },
      answerKey: "blocking_issue_text",
      askOnce: true,
      showIf: {
        all: [
          { answerKey: "blocking_issue", equals: "Var (yazacağım)" },
          { answerKey: "blocking_issue_text", isEmpty: true },
        ],
      },
      doneRule: { type: "minLength", answerKey: "blocking_issue_text", value: 3 },
    },
  ] as FlowStep[],

  GLASSDOOR: [
    {
      id: "found_apply_section",
      checklistLabel: "Başvuru alanı görüldü",
      text: "İlan sayfasında “Apply / Sign in to apply” alanını görüyor musunuz?",
      choices: [...CHOICES.applySection],
      answerKey: "found_apply_section",
      doneRule: { type: "notEmpty", answerKey: "found_apply_section" },
    },
    {
      id: "screen_headings",
      checklistLabel: "Apply alanı konumu alındı",
      text: "Apply butonunu göremediniz. Başvuru alanı sizin ekranınızda nerede görünüyor?",
      choices: ["Sağ tarafta", "Alt bölümde", "Yok"],
      answerKey: "screen_headings",
      askOnce: true,
      showIf: {
        all: [
          { answerKey: "found_apply_section", equals: "Göremedim" },
          { answerKey: "screen_headings", isEmpty: true },
        ],
      },
      doneRule: { type: "notEmpty", answerKey: "screen_headings" },
    },
    {
      id: "has_platform_account",
      checklistLabel: "Hesap durumu alındı",
      text: "Bu platformda hesabınız var mı / giriş yapabiliyor musunuz?",
      choices: [...CHOICES.yesNoMaybe],
      answerKey: "has_glassdoor_account",
      doneRule: { type: "notEmpty", answerKey: "has_glassdoor_account" },
    },
    {
      id: "apply_method",
      checklistLabel: "Yönlendirme durumu alındı",
      text: "Başvuru sizi şirketin sitesine mi yönlendiriyor?",
      choices: [...CHOICES.yesNoMaybe],
      answerKey: "redirects_to_company_site",
      doneRule: { type: "notEmpty", answerKey: "redirects_to_company_site" },
    },
    {
      id: "passport_status",
      checklistLabel: "Pasaport durumu alındı",
      text: "Geçerli bir pasaportunuz var mı?",
      choices: [...CHOICES.yesNoMaybe],
      answerKey: "has_passport",
      doneRule: { type: "notEmpty", answerKey: "has_passport" },
    },
    {
      id: "cv_ready",
      checklistLabel: "CV durumu alındı",
      text: "Bu ilana özel CV’niz hazır mı? (tercihen PDF)",
      choices: [...CHOICES.yesNoMaybe],
      answerKey: "cv_ready",
      doneRule: { type: "notEmpty", answerKey: "cv_ready" },
    },
    {
      id: "proof_docs",
      checklistLabel: "Mesleki kanıtlar toplandı",
      text: "Mesleğinizi kanıtlamak için elinizde hangileri var? (Birden çok seçebilirsiniz)",
      choices: [...CHOICES.docProof],
      input: { type: "multiselect" },
      answerKey: "proof_docs",
      doneRule: { type: "minSelected", answerKey: "proof_docs", value: 1 },
    },
    {
      id: "language_level",
      checklistLabel: "Dil seviyesi alındı",
      text: "İş dili için seviyeniz nedir?",
      choices: [...CHOICES.languageLevel],
      answerKey: "language_level",
      doneRule: { type: "notEmpty", answerKey: "language_level" },
    },
    {
      id: "blocking_issue",
      checklistLabel: "Engel durumu alındı",
      text: "Başvuruyu şu an tıkayan bir sorun var mı?",
      choices: ["Yok", "Var (yazacağım)"],
      answerKey: "blocking_issue",
      doneRule: { type: "notEmpty", answerKey: "blocking_issue" },
    },
    {
      id: "blocking_issue_text",
      checklistLabel: "Engel detayı alındı",
      text: "Lütfen tıkayan sorunu 1–2 cümleyle yazın (örn: vize, hesap açılmıyor, belge eksik…).",
      input: { type: "textarea", placeholder: "Sorunu yazın…" },
      answerKey: "blocking_issue_text",
      askOnce: true,
      showIf: {
        all: [
          { answerKey: "blocking_issue", equals: "Var (yazacağım)" },
          { answerKey: "blocking_issue_text", isEmpty: true },
        ],
      },
      doneRule: { type: "minLength", answerKey: "blocking_issue_text", value: 3 },
    },
  ] as FlowStep[],
};

export const FLOW_ENGINE_RULES = {
  selectionStrategy: "first_unanswered_in_composed_order",
  composeOrder: ["SOURCE_SPECIFIC_FIRST", "COMMON"],
  askOnceBehavior: "do_not_repeat_if_answer_present",
  showIfBehavior: "only_when_conditions_match",
};

function getAnswer(answers: Record<string, unknown>, answerKey: string): unknown {
  return answers[answerKey];
}

function isDoneRuleSatisfied(answers: Record<string, unknown>, rule: DoneRule): boolean {
  const v = getAnswer(answers, rule.answerKey);
  const str = v !== undefined && v !== null ? String(v).trim() : "";
  switch (rule.type) {
    case "equals":
      return str === rule.value;
    case "equalsAny":
      return rule.values.includes(str);
    case "minLength":
      return str.length >= rule.value;
    case "notEmpty":
      return str.length > 0;
    case "minSelected":
      if (Array.isArray(v)) return v.length >= rule.value;
      if (typeof v === "string") {
        const parts = v.split(",").map((s) => s.trim()).filter(Boolean);
        return parts.length >= rule.value;
      }
      return false;
    default:
      return false;
  }
}

function isShowIfMatch(answers: Record<string, unknown>, showIf: { all: ShowIfCondition[] }): boolean {
  for (const cond of showIf.all) {
    if ("equals" in cond && !("equalsAny" in cond)) {
      const v = getAnswer(answers, cond.answerKey);
      const str = v !== undefined && v !== null ? String(v).trim() : "";
      if (str !== cond.equals) return false;
    } else if ("equalsAny" in cond && Array.isArray(cond.equalsAny)) {
      const v = getAnswer(answers, cond.answerKey);
      const str = v !== undefined && v !== null ? String(v).trim() : "";
      if (!(cond.equalsAny as string[]).includes(str)) return false;
    } else if ("includes" in cond) {
      const v = getAnswer(answers, cond.answerKey);
      if (Array.isArray(v)) {
        if (!v.map(String).includes(cond.includes)) return false;
      } else {
        const str = v !== undefined && v !== null ? String(v).trim() : "";
        if (!str.includes(cond.includes)) return false;
      }
    } else {
      const v = getAnswer(answers, cond.answerKey);
      const isEmpty = v === undefined || v === null || String(v).trim() === "";
      if (!isEmpty) return false;
    }
  }
  return true;
}

function isStepAnswered(answers: Record<string, unknown>, step: FlowStep): boolean {
  const v = getAnswer(answers, step.answerKey);
  if (Array.isArray(v)) {
    if (v.length > 0) return true;
  } else if (v !== undefined && v !== null && String(v).trim() !== "") {
    return true;
  }
  return isDoneRuleSatisfied(answers, step.doneRule);
}

/** Aktif flow: EURES veya GLASSDOOR; default = GLASSDOOR. showIf koşulu olanlar sadece koşul tutuyorsa dahil. */
function getActiveFlowSteps(source: "eures" | "glassdoor" | "default"): FlowStep[] {
  if (source === "eures") return QUESTION_FLOW.EURES;
  return QUESTION_FLOW.GLASSDOOR; // glassdoor | default
}

/** İlk cevaplanmamış soru. showIf koşulu olan adımlar koşul tutmuyorsa atlanır. answerKey doluysa asla tekrar gösterilmez. */
export function getNextStep(
  answers: Record<string, unknown>,
  source: "eures" | "glassdoor" | "default"
): FlowStep | null {
  const steps = getActiveFlowSteps(source);
  for (const step of steps) {
    if (step.showIf && !isShowIfMatch(answers, step.showIf)) continue;
    if (isStepAnswered(answers, step)) continue;
    return step;
  }
  return null;
}

/** No-repeat: last_ask_id ile aynı soru dönmesin diye, ondan sonraki ilk cevaplanmamış adımı döndürür. */
export function getNextStepAfter(
  answers: Record<string, unknown>,
  source: "eures" | "glassdoor" | "default",
  afterStepId: string
): FlowStep | null {
  const steps = getActiveFlowSteps(source);
  let found = false;
  for (const step of steps) {
    if (step.id === afterStepId) {
      found = true;
      continue;
    }
    if (!found) continue;
    if (step.showIf && !isShowIfMatch(answers, step.showIf)) continue;
    if (isStepAnswered(answers, step)) continue;
    return step;
  }
  return null;
}

/** Adım için gösterilecek metin + choices veya input. */
export function getStepDisplay(step: FlowStep): {
  text: string;
  choices?: string[];
  input?: FlowInput;
} {
  return { text: step.text, choices: step.choices ?? [], input: step.input };
}

/** İlerleme: soru tamamlama oranı. Aktif flow'daki adımlardan (showIf dahil edilmiş) kaçı cevaplandı. */
export function getProgressFromConfig(
  answers: Record<string, unknown>,
  source: "eures" | "glassdoor" | "default"
): { total: number; done: number; pct: number } {
  const steps = getActiveFlowSteps(source);
  let total = 0;
  let done = 0;
  for (const step of steps) {
    if (step.showIf && !isShowIfMatch(answers, step.showIf)) continue;
    total++;
    if (isStepAnswered(answers, step)) done++;
  }
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, pct };
}

export function getStepById(id: string): FlowStep | undefined {
  for (const step of [...QUESTION_FLOW.EURES, ...QUESTION_FLOW.GLASSDOOR]) {
    if (step.id === id) return step;
  }
  return undefined;
}
