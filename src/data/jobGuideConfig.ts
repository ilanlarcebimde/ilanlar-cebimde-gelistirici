/**
 * Job Guide config — 2026-02-24+extras
 * blocking_issue = "Var (yazacağım)" → blocking_issue_text (free-text)
 * found_apply_section = "Göremedim" → visible_headings_text (once)
 * Rule: answerKey doluysa asla tekrar gösterme. showIf koşulu tutmuyorsa atla. İlk cevaplanmamış soruyu göster.
 */

export const JOB_GUIDE_CONFIG_VERSION = "2026-02-24+extras";

export type DoneRule =
  | { type: "equals"; answerKey: string; value: string }
  | { type: "equalsAny"; answerKey: string; values: string[] }
  | { type: "minLength"; answerKey: string; value: number };

export type ShowIfCondition =
  | { answerKey: string; equals: string }
  | { answerKey: string; isEmpty: true };

export type FlowStep = {
  id: string;
  checklistLabel: string;
  text: string;
  choices?: string[];
  input?: { type: "textarea"; placeholder: string };
  answerKey: string;
  askOnce?: boolean;
  showIf?: { all: ShowIfCondition[] };
  doneRule: DoneRule;
};

export const QUESTION_FLOW = {
  COMMON: [
    {
      id: "opened_source_page",
      checklistLabel: "Kaynak sayfayı açtım",
      text: "\"İlana Git\" butonuna tıklayıp kaynak sayfayı açabildin mi?",
      choices: ["Açtım", "Açamadım"],
      answerKey: "opened_source_page",
      doneRule: { type: "equals", answerKey: "opened_source_page", value: "Açtım" },
    },
    {
      id: "found_apply_section",
      checklistLabel: "Başvuru alanını buldum",
      text: "Sayfada başvuru alanını (\"Apply / How to apply / Apply Now\") gördün mü?",
      choices: ["Gördüm", "Göremedim", "Emin değilim"],
      answerKey: "found_apply_section",
      doneRule: { type: "equalsAny", answerKey: "found_apply_section", values: ["Gördüm", "Göremedim", "Emin değilim"] },
    },
    {
      id: "visible_headings_text",
      checklistLabel: "Ekrandaki başlıkları yazdım",
      text: "Tamam. Şu an ekranda hangi başlıkları/sekme adlarını görüyorsun? (Örn: Company / Reviews / Salaries / Jobs / Apply…)",
      input: { type: "textarea", placeholder: "Gördüğün başlıkları alt alta yazabilirsin…" },
      answerKey: "visible_headings_text",
      askOnce: true,
      showIf: {
        all: [
          { answerKey: "found_apply_section", equals: "Göremedim" },
          { answerKey: "visible_headings_text", isEmpty: true },
        ],
      },
      doneRule: { type: "minLength", answerKey: "visible_headings_text", value: 3 },
    },
    {
      id: "passport_status",
      checklistLabel: "Pasaport durumum net",
      text: "Pasaport durumun nedir?",
      choices: ["Var", "Başvurdum", "Yok"],
      answerKey: "passport_status",
      doneRule: { type: "equalsAny", answerKey: "passport_status", values: ["Var", "Başvurdum", "Yok"] },
    },
    {
      id: "cv_status",
      checklistLabel: "CV durumum net",
      text: "CV durumun nedir?",
      choices: ["PDF hazır", "Hazır ama PDF değil", "Hazır değil"],
      answerKey: "cv_status",
      doneRule: { type: "equalsAny", answerKey: "cv_status", values: ["PDF hazır", "Hazır ama PDF değil", "Hazır değil"] },
    },
    {
      id: "english_level",
      checklistLabel: "Dil seviyem net",
      text: "İngilizce seviyen hangisine daha yakın?",
      choices: ["A1–A2", "B1", "B2+", "Emin değilim"],
      answerKey: "english_level",
      doneRule: { type: "equalsAny", answerKey: "english_level", values: ["A1–A2", "B1", "B2+", "Emin değilim"] },
    },
    {
      id: "trade_certificate",
      checklistLabel: "Mesleki yeterlilik/ustalık belgesi durumu net",
      text: "Mesleki yeterlilik / ustalık belgen var mı?",
      choices: ["Var", "Yok", "Emin değilim"],
      answerKey: "trade_certificate",
      doneRule: { type: "equalsAny", answerKey: "trade_certificate", values: ["Var", "Yok", "Emin değilim"] },
    },
    {
      id: "blocking_issue",
      checklistLabel: "Engel durumu net",
      text: "Başvuruyu şu an tıkayan bir sorun var mı?",
      choices: ["Yok", "Var (yazacağım)"],
      answerKey: "blocking_issue",
      doneRule: { type: "equalsAny", answerKey: "blocking_issue", values: ["Yok", "Var (yazacağım)"] },
    },
    {
      id: "blocking_issue_text",
      checklistLabel: "Engeli yazdım",
      text: "Kısa ve net yaz: Seni tıkayan sorun ne? (Örn: buton görünmüyor / giriş olmuyor / hata kodu / CV yüklenmiyor)",
      input: { type: "textarea", placeholder: "Sorunu yaz…" },
      answerKey: "blocking_issue_text",
      askOnce: true,
      showIf: {
        all: [
          { answerKey: "blocking_issue", equals: "Var (yazacağım)" },
          { answerKey: "blocking_issue_text", isEmpty: true },
        ],
      },
      doneRule: { type: "minLength", answerKey: "blocking_issue_text", value: 5 },
    },
  ] as FlowStep[],

  GLASSDOOR: [
    {
      id: "glassdoor_account",
      checklistLabel: "Glassdoor hesabım var / giriş yaptım",
      text: "Glassdoor hesabın var mı / giriş yapabildin mi?",
      choices: ["Var / Giriş yaptım", "Yok", "Emin değilim"],
      answerKey: "glassdoor_account",
      doneRule: { type: "equalsAny", answerKey: "glassdoor_account", values: ["Var / Giriş yaptım", "Yok", "Emin değilim"] },
    },
    {
      id: "saw_signin_to_apply",
      checklistLabel: "\"Sign in to apply / Apply\" alanını gördüm",
      text: "İlan sayfasında \"Sign in to apply\" veya \"Apply\" alanını gördün mü?",
      choices: ["Gördüm", "Göremedim", "Emin değilim"],
      answerKey: "saw_signin_to_apply",
      doneRule: { type: "equals", answerKey: "saw_signin_to_apply", value: "Gördüm" },
    },
  ] as FlowStep[],

  EURES: [
    {
      id: "eu_login",
      checklistLabel: "EU Login / EURES girişim var",
      text: "EU Login / EURES hesabın var mı?",
      choices: ["Var / Giriş yaptım", "Yok", "Emin değilim"],
      answerKey: "eu_login",
      doneRule: { type: "equalsAny", answerKey: "eu_login", values: ["Var / Giriş yaptım", "Yok", "Emin değilim"] },
    },
    {
      id: "how_to_apply_method",
      checklistLabel: "Başvuru yöntemi belli",
      text: "\"How to apply / Apply\" bölümünde başvuru nasıl isteniyor?",
      choices: ["Portal/Form", "E-posta", "Şirket sitesi", "Göremedim"],
      answerKey: "how_to_apply_method",
      doneRule: { type: "equalsAny", answerKey: "how_to_apply_method", values: ["Portal/Form", "E-posta", "Şirket sitesi", "Göremedim"] },
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
    default:
      return false;
  }
}

function isShowIfMatch(answers: Record<string, unknown>, showIf: { all: ShowIfCondition[] }): boolean {
  for (const cond of showIf.all) {
    if ("equals" in cond) {
      const v = getAnswer(answers, cond.answerKey);
      const str = v !== undefined && v !== null ? String(v).trim() : "";
      if (str !== cond.equals) return false;
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
  if (v !== undefined && v !== null && String(v).trim() !== "") return true;
  return isDoneRuleSatisfied(answers, step.doneRule);
}

/** Aktif flow: SOURCE_SPECIFIC_FIRST + COMMON. showIf koşulu olanlar sadece koşul tutuyorsa dahil. */
function getActiveFlowSteps(source: "eures" | "glassdoor" | "default"): FlowStep[] {
  const sourceSteps = source === "glassdoor" ? QUESTION_FLOW.GLASSDOOR : source === "eures" ? QUESTION_FLOW.EURES : [];
  const common = QUESTION_FLOW.COMMON;
  return [...sourceSteps, ...common];
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

/** Adım için gösterilecek metin + choices veya input. */
export function getStepDisplay(step: FlowStep): {
  text: string;
  choices?: string[];
  input?: { type: "textarea"; placeholder: string };
} {
  if (step.input) return { text: step.text, input: step.input };
  return { text: step.text, choices: step.choices ?? [] };
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
  for (const step of [...QUESTION_FLOW.COMMON, ...QUESTION_FLOW.GLASSDOOR, ...QUESTION_FLOW.EURES]) {
    if (step.id === id) return step;
  }
  return undefined;
}
