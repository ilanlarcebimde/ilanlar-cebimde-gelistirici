/**
 * Job Guide config — 2026-02-24+v2
 * Deterministic flow: showIf koşulu tutmuyorsa atla; answerKey doluysa asla tekrar gösterme; ilk cevaplanmamış soruyu göster.
 * Rule: answerKey doluysa asla tekrar gösterme. showIf koşulu tutmuyorsa atla. İlk cevaplanmamış soruyu göster.
 */

export const JOB_GUIDE_CONFIG_VERSION = "2026-02-24+v2";

export const QUICK_GUIDE_TEMPLATES = {
  GLASSDOOR: {
    title: "Hızlı Rehber",
    bullets: [
      "**Bu ilan kaynağı: GLASSDOOR.** Başvuru genelde “Apply / Sign in to apply” alanından yapılır.",
      "Sayfa İngilizceyse: **Chrome → sağ tık → Türkçeye çevir** (telefon: ⋮ → Çevir).",
      "Başvuru şirket sitesine yönlenirse: **aynı pozisyonu şirketin kariyer sayfasında** bulup oradan devam edeceğiz.",
      "Ben senden gerekli bilgileri alacağım, her cevap sonrası **Rapor** otomatik güncellenecek.",
    ],
  },
  EURES: {
    title: "Hızlı Rehber",
    bullets: [
      "**Bu ilan kaynağı: EURES.** Başvuru adımı genelde ilandaki “How to apply / Apply” bölümünden ilerler.",
      "Sayfa İngilizceyse: **Chrome → sağ tık → Türkçeye çevir** (telefon: ⋮ → Çevir).",
      "Bazı ilanlarda giriş gerekebilir: **EU Login / EURES hesabı** istenebilir.",
      "Ben senden gerekli bilgileri alacağım, her cevap sonrası **Rapor** otomatik güncellenecek.",
    ],
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

export const QUESTION_FLOW = {
  COMMON: [
    {
      id: "opened_source_page",
      checklistLabel: "Kaynak sayfayı açtım",
      text: "✅ Kaynak sayfayı açabildin mi? (“İlana Git” ile)",
      choices: ["Açtım", "Açamadım"],
      answerKey: "opened_source_page",
      doneRule: { type: "equals", answerKey: "opened_source_page", value: "Açtım" },
    },
    {
      id: "found_apply_section",
      checklistLabel: "Başvuru alanını buldum",
      text: "🔎 Başvuru alanını gördün mü? (Apply / How to apply / Apply Now / Sign in to apply)",
      choices: ["Gördüm", "Göremedim"],
      answerKey: "found_apply_section",
      doneRule: { type: "equals", answerKey: "found_apply_section", value: "Gördüm" },
    },
    {
      id: "visible_headings_text",
      checklistLabel: "Ekran başlıklarını yazdım",
      text: "🧭 Tamam. Şu an ekranda hangi sekmeleri/başlıkları görüyorsun? (Örn: Company / Reviews / Salaries / Jobs / Apply…)",
      input: { type: "textarea", placeholder: "Gördüklerini yaz…" },
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
      id: "apply_method",
      checklistLabel: "Başvuru yöntemi belli",
      text: "📝 Başvuru hangi şekilde ilerliyor?",
      choices: ["Platform içi form", "Şirket sitesine yönlendirdi", "E-posta ile başvuru", "Henüz anlayamadım"],
      answerKey: "apply_method",
      doneRule: { type: "notEmpty", answerKey: "apply_method" },
    },
    {
      id: "passport_status",
      checklistLabel: "Pasaport durumu net",
      text: "🛂 Pasaport durumun nedir?",
      choices: ["Var", "Başvurdum", "Yok"],
      answerKey: "passport_status",
      doneRule: { type: "notEmpty", answerKey: "passport_status" },
    },
    {
      id: "passport_followup_if_applied",
      checklistLabel: "Pasaport süre bilgisi var",
      text: "⏱️ Pasaport için yaklaşık kaç gün/hafta içinde çıkacak? (Bilmiyorsan ‘Emin değilim’ yazabilirsin.)",
      input: { type: "text", placeholder: "Örn: 2 hafta / 10 gün / Emin değilim" },
      answerKey: "passport_eta",
      showIf: { all: [{ answerKey: "passport_status", equals: "Başvurdum" }] },
      doneRule: { type: "minLength", answerKey: "passport_eta", value: 2 },
    },
    {
      id: "cv_status",
      checklistLabel: "CV durumu net",
      text: "📄 CV durumun nedir?",
      choices: ["PDF hazır", "Hazır ama PDF değil", "Hazır değil"],
      answerKey: "cv_status",
      doneRule: { type: "notEmpty", answerKey: "cv_status" },
    },
    {
      id: "cv_offer_if_missing",
      checklistLabel: "CV destek seçimi yapıldı",
      text: "💡 CV’n hazır değilse biz 1 gün içinde hazırlayıp teslim edebiliriz. İstersen şimdi yönlendireyim.",
      choices: ["Evet yönlendir", "Şimdilik hayır"],
      answerKey: "cv_offer_if_missing",
      askOnce: true,
      showIf: {
        all: [
          { answerKey: "cv_status", equals: "Hazır değil" },
          { answerKey: "cv_offer_if_missing", isEmpty: true },
        ],
      },
      doneRule: { type: "notEmpty", answerKey: "cv_offer_if_missing" },
    },
    {
      id: "qualification_proof_bundle",
      checklistLabel: "Nitelik kanıtları seçildi",
      text: "🏅 Bu iş için elinde hangi kanıtlar var? (Birden fazla seçebilirsin.)",
      choices: [
        "Ustalık belgesi / MYK",
        "Kalfalık belgesi",
        "SGK/iş geçmişi kayıtlı",
        "Sertifika (kurs/eğitim)",
        "Referans (usta/işveren)",
        "Portföy (fotoğraf/video)",
        "Hiçbiri",
      ],
      input: { type: "multiselect" },
      answerKey: "qualification_proof_bundle",
      doneRule: { type: "minSelected", answerKey: "qualification_proof_bundle", value: 1 },
    },
    {
      id: "qualification_missing_followup",
      checklistLabel: "Belgesiz alternatif plan yazıldı",
      text: "🧩 Tamam. Elinde belge yoksa bile başvuru yapılabilir. Hangi alternatifi hazırlayalım? (Kısa yaz)",
      input: { type: "textarea", placeholder: "Örn: Usta referansı alacağım / Portföy çıkaracağım / SGK dökümü alacağım" },
      answerKey: "qualification_plan_text",
      showIf: {
        all: [
          { answerKey: "qualification_proof_bundle", includes: "Hiçbiri" },
          { answerKey: "qualification_plan_text", isEmpty: true },
        ],
      },
      doneRule: { type: "minLength", answerKey: "qualification_plan_text", value: 5 },
    },
    {
      id: "language_level",
      checklistLabel: "Dil seviyesi net",
      text: "🗣️ Dil seviyen hangisine yakın?",
      choices: ["A1–A2", "B1", "B2+", "Emin değilim"],
      answerKey: "language_level",
      doneRule: { type: "notEmpty", answerKey: "language_level" },
    },
    {
      id: "visa_need_clarity",
      checklistLabel: "İş teklifi durumu net",
      text: "🌍 Bu ülke için vize/çalışma izni sürecini anlatalım: Şu an elinde iş teklifi (offer) var mı?",
      choices: ["Var", "Yok", "Emin değilim"],
      answerKey: "has_job_offer",
      doneRule: { type: "notEmpty", answerKey: "has_job_offer" },
    },
    {
      id: "blocking_issue",
      checklistLabel: "Engel durumu net",
      text: "🚧 Şu an başvuruyu tıkayan bir sorun var mı?",
      choices: ["Yok", "Var (yazacağım)"],
      answerKey: "blocking_issue",
      doneRule: { type: "notEmpty", answerKey: "blocking_issue" },
    },
    {
      id: "blocking_issue_text",
      checklistLabel: "Engel yazıldı",
      text: "✍️ Kısa yaz: Seni tıkayan sorun ne? (Örn: Apply butonu yok / giriş olmuyor / CV yüklenmiyor / vize)",
      input: { type: "textarea", placeholder: "Sorunu yaz…" },
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
    {
      id: "finalize_and_week_plan",
      checklistLabel: "Haftalık zaman planı alındı",
      text: "✅ Tamam. Son olarak 1 haftalık planı üretmem için: Bu hafta günde kaç saat ayırabilirsin?",
      choices: ["0–1 saat", "1–2 saat", "2+ saat"],
      answerKey: "weekly_time_budget",
      doneRule: { type: "notEmpty", answerKey: "weekly_time_budget" },
    },
  ] as FlowStep[],

  GLASSDOOR: [] as FlowStep[],
  EURES: [] as FlowStep[],
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
    if ("equals" in cond) {
      const v = getAnswer(answers, cond.answerKey);
      const str = v !== undefined && v !== null ? String(v).trim() : "";
      if (str !== cond.equals) return false;
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
  for (const step of [...QUESTION_FLOW.COMMON, ...QUESTION_FLOW.GLASSDOOR, ...QUESTION_FLOW.EURES]) {
    if (step.id === id) return step;
  }
  return undefined;
}
