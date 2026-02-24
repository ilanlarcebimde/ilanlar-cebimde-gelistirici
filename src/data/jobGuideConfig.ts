/**
 * Job Guide config — 2026-02-25
 * Önce kaynağa göre öğretici mini-rehber (bootstrap), sonra kritik sorular. LLM soru üretmez.
 * textarea sadece blocking_issue_text. screen_headings kaldırıldı; apply_section_location 3 seçenek.
 */

export const JOB_GUIDE_CONFIG_VERSION = "2026-02-25";

/** Hızlı Rehber: ilk mesajda sadece bilgi, soru yok. Drop-in lines. */
export const QUICK_GUIDE_TEMPLATES = {
  title: "Hızlı Rehber",
  EURES: {
    fullText: `Bu ilan kaynağı: EURES. Avrupa'da resmi ve güvenilir ilanların yayınlandığı ağdır.
Başvuru için: "İlana Git" → ilanda "How to apply / Apply" bölümünü bul.
Sayfa İngilizceyse: Chrome → sağ tık → Türkçeye çevir (telefonda ⋮ → Çevir).
Ben senden kritik bilgileri alacağım; her cevap sonrası yapılacaklar netleşecek.`,
  },
  GLASSDOOR: {
    fullText: `Bu ilan kaynağı: GLASSDOOR.
Başvuru genelde "Apply / Sign in to apply" alanından yapılır.
Sayfa İngilizceyse: Chrome → sağ tık → Türkçeye çevir.
Şirket sitesine yönlendirirse: aynı ilanı şirket sitesinde bulup oradan başvuracağız.`,
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

/** UI inputType mapping: buttons/select/multi/textarea — textarea sadece blocking_issue_text için. */
export type InputType = "buttons" | "select" | "multi" | "textarea";

export const uiInputMapping = {
  buttons: { component: "ChoiceButtons", selection: "single" as const, storeAs: "string" as const },
  select: { component: "Select", selection: "single" as const, storeAs: "string" as const },
  multi: { component: "MultiSelectChips", selection: "multiple" as const, storeAs: "string[]" as const },
  textarea: { component: "Textarea", selection: "freeText" as const, storeAs: "string" as const, minRows: 4 },
} as const;

/** Ortak choice set'leri (drop-in). Serbest metin sadece blocking_issue_text. */
const CHOICES = {
  yesNo: ["Evet", "Hayır"],
  yesNoMaybe: ["Evet", "Hayır", "Emin değilim"],
  foundApply: ["Gördüm", "Göremedim", "Emin değilim"],
  applyMethod: ["Form/Portal", "E-posta", "Şirket sitesi", "Emin değilim"],
  langLevel: ["A0", "A1–A2", "B1", "B2", "C1+"],
  blocking: ["Yok", "Var (yazacağım)"],
  applyLocation3: ["Sağ tarafta", "Alt bölümde", "Yok"],
  /** @deprecated use foundApply */
  seenOrNot: ["Gördüm", "Göremedim", "Emin değilim"],
  /** @deprecated use applyMethod */
  applyMethodEures: ["Form/Portal", "E-posta", "Şirket sitesi", "Emin değilim"],
  /** @deprecated use langLevel */
  language: ["A0", "A1–A2", "B1", "B2", "C1+"],
  /** @deprecated use applyLocation3 */
  applySectionLocation: ["Sağ tarafta", "Alt bölümde", "Yok"],
} as const;

/** Mesleki yeterlilik kanıtları — çoklu seçim (10+ seçenek). */
export const PROOF_DOCS = [
  "Ustalık belgesi / MYK",
  "Kalfalık belgesi",
  "SGK hizmet dökümü",
  "İş sözleşmesi / görev yazısı",
  "Referans mektubu (usta/şef/amir)",
  "Sertifika (kurs/ehliyet/operatör vb.)",
  "Portföy (fotoğraf/video)",
  "Çıraklık / mesleki eğitim belgesi",
  "Adli sicil kaydı (temiz) / iyi hal belgesi",
  "Sağlık raporu / işe giriş raporu",
  "Hiçbiri",
] as const;

/** 7 tema — Akıllı Danışman. answers_json.services_selected → expandServicesSelected ile 7× Evet/Hayır. */
export const SERVICE_CHOICES = [
  "Adım adım başvuru rehberi",
  "Gerekli belgeler listesi",
  "Çalışma izni ve vize süreci",
  "Net maaş ve yaşam gider hesabı",
  "Risk değerlendirmesi",
  "Sana özel uygunluk analizi",
  "7 günlük başvuru planı",
] as const;

/** ID'ler — client answers_patch ile gönderir; metin eşleşmesine güvenilmez. */
export const SERVICE_CHOICE_IDS = [
  "apply_guide",
  "docs_list",
  "work_permit_visa",
  "salary_life_calc",
  "risk_assessment",
  "fit_analysis",
  "one_week_plan",
] as const;

function isServiceSelected(s: Set<string>, id: string, label: string): boolean {
  return s.has(id) || s.has(label);
}

/** services_selected (string[] — ID veya label) → 7 service_* Evet/Hayır. Chat route'da last_ask_id === "service_pick" sonrası çağrılır. */
export function expandServicesSelected(answers: Record<string, unknown>): Record<string, string> {
  const raw = answers.services_selected;
  const arr = Array.isArray(raw)
    ? (raw as string[]).map((x) => (typeof x === "string" ? x.trim() : String(x))).filter(Boolean)
    : typeof raw === "string"
      ? raw.split(/[,;\n|]+/).map((s) => s.trim()).filter(Boolean)
      : [];
  const s = new Set(arr);
  const has7Gunluk =
    s.has("one_week_plan") ||
    s.has("7 günlük başvuru planı") ||
    s.has("1 haftalık başvuru planı");
  return {
    service_apply_guide: isServiceSelected(s, "apply_guide", "Adım adım başvuru rehberi") ? "Evet" : "Hayır",
    service_documents: isServiceSelected(s, "docs_list", "Gerekli belgeler listesi") ? "Evet" : "Hayır",
    service_work_permit_visa: isServiceSelected(s, "work_permit_visa", "Çalışma izni ve vize süreci") ? "Evet" : "Hayır",
    service_salary_life_calc: isServiceSelected(s, "salary_life_calc", "Net maaş ve yaşam gider hesabı") ? "Evet" : "Hayır",
    service_risk_assessment: isServiceSelected(s, "risk_assessment", "Risk değerlendirmesi") ? "Evet" : "Hayır",
    service_fit_analysis: isServiceSelected(s, "fit_analysis", "Sana özel uygunluk analizi") ? "Evet" : "Hayır",
    service_one_week_plan: has7Gunluk ? "Evet" : "Hayır",
  };
}

export const QUESTION_FLOW = {
  /** Varsayılan kaynak için GLASSDOOR akışı kullanılır. */
  COMMON: [] as FlowStep[],

  EURES: [
    {
      id: "service_pick",
      checklistLabel: "Hizmetleri seçtim",
      text: "Hangi konularda yardım istiyorsun? (Birden fazla seçebilirsin)",
      choices: [...SERVICE_CHOICES],
      input: { type: "multiselect" },
      answerKey: "services_selected",
      doneRule: { type: "minSelected", answerKey: "services_selected", value: 1 },
    },
    {
      id: "found_apply_section",
      checklistLabel: "Başvuru bölümünü buldum",
      text: "İlan sayfasında “How to apply / Apply” bölümünü görüyor musunuz?",
      choices: [...CHOICES.seenOrNot],
      answerKey: "found_apply_section",
      doneRule: { type: "notEmpty", answerKey: "found_apply_section" },
    },
    {
      id: "apply_method",
      checklistLabel: "Başvuru yöntemini netleştirdim",
      text: "Bu ilanda başvuru yöntemi hangisi?",
      choices: [...CHOICES.applyMethodEures],
      answerKey: "apply_method",
      showIf: { all: [{ answerKey: "found_apply_section", equalsAny: ["Gördüm", "Emin değilim"] }] },
      doneRule: { type: "notEmpty", answerKey: "apply_method" },
    },
    {
      id: "needs_eu_login",
      checklistLabel: "Giriş gereksinimini kontrol ettim",
      text: "Başvuru için EU Login / EURES hesabı istiyor mu?",
      choices: [...CHOICES.yesNoMaybe],
      answerKey: "needs_eu_login",
      showIf: { all: [{ answerKey: "apply_method", equalsAny: ["Form/Portal", "Emin değilim"] }] },
      doneRule: { type: "notEmpty", answerKey: "needs_eu_login" },
    },
    {
      id: "has_passport",
      checklistLabel: "Pasaport durumunu netleştirdim",
      text: "Pasaportun var mı?",
      choices: [...CHOICES.yesNoMaybe],
      answerKey: "has_passport",
      doneRule: { type: "notEmpty", answerKey: "has_passport" },
    },
    {
      id: "is_eu_eea_citizen",
      checklistLabel: "AB/AEA durumunu netleştirdim",
      text: "AB/AEA vatandaşı mısın?",
      choices: [...CHOICES.yesNoMaybe],
      answerKey: "is_eu_eea_citizen",
      doneRule: { type: "notEmpty", answerKey: "is_eu_eea_citizen" },
    },
    {
      id: "cv_ready",
      checklistLabel: "CV hazır",
      text: "Bu ilana özel CV’niz hazır mı? (tercihen PDF)",
      choices: [...CHOICES.yesNoMaybe],
      answerKey: "cv_ready",
      doneRule: { type: "notEmpty", answerKey: "cv_ready" },
    },
    {
      id: "proof_docs",
      checklistLabel: "Mesleki kanıtları seçtim",
      text: "Mesleki yeterliliğini kanıtlamak için hangileri var? (Birden fazla seçebilirsin)",
      choices: [...PROOF_DOCS],
      input: { type: "multiselect" },
      answerKey: "proof_docs",
      doneRule: { type: "minSelected", answerKey: "proof_docs", value: 1 },
    },
    {
      id: "language_level",
      checklistLabel: "Dil seviyemi belirttim",
      text: "Dil seviyen hangi aralıkta?",
      choices: [...CHOICES.language],
      answerKey: "language_level",
      doneRule: { type: "notEmpty", answerKey: "language_level" },
    },
    {
      id: "blocking_issue",
      checklistLabel: "Engel durumunu belirttim",
      text: "Başvuruyu şu an tıkayan bir sorun var mı?",
      choices: ["Yok", "Var (yazacağım)"],
      answerKey: "blocking_issue",
      doneRule: { type: "notEmpty", answerKey: "blocking_issue" },
    },
    {
      id: "blocking_issue_text",
      checklistLabel: "Engeli açıkladım",
      text: "Kısaca yaz: Seni en çok ne tıkıyor? (örn. vize / CV / giriş / dil / belge)",
      input: { type: "textarea", placeholder: "Sorunu yazın…" },
      answerKey: "blocking_issue_text",
      askOnce: true,
      showIf: { all: [{ answerKey: "blocking_issue", equals: "Var (yazacağım)" }] },
      doneRule: { type: "minLength", answerKey: "blocking_issue_text", value: 3 },
    },
  ] as FlowStep[],

  GLASSDOOR: [
    {
      id: "service_pick",
      checklistLabel: "Hizmetleri seçtim",
      text: "Hangi konularda yardım istiyorsun? (Birden fazla seçebilirsin)",
      choices: [...SERVICE_CHOICES],
      input: { type: "multiselect" },
      answerKey: "services_selected",
      doneRule: { type: "minSelected", answerKey: "services_selected", value: 1 },
    },
    {
      id: "found_apply_section",
      checklistLabel: "Apply alanını kontrol ettim",
      text: "İlan sayfasında “Apply / Sign in to apply” alanını gördün mü?",
      choices: [...CHOICES.seenOrNot],
      answerKey: "found_apply_section",
      doneRule: { type: "notEmpty", answerKey: "found_apply_section" },
    },
    {
      id: "apply_section_location",
      checklistLabel: "Apply konumu işaretlendi",
      text: "Göremediysen: Apply alanı genelde nerede oluyor?",
      choices: [...CHOICES.applyLocation3],
      answerKey: "apply_section_location",
      showIf: { all: [{ answerKey: "found_apply_section", equals: "Göremedim" }] },
      doneRule: { type: "notEmpty", answerKey: "apply_section_location" },
    },
    {
      id: "has_glassdoor_account",
      checklistLabel: "Hesap durumunu belirttim",
      text: "Glassdoor hesabın var mı?",
      choices: [...CHOICES.yesNoMaybe],
      answerKey: "has_glassdoor_account",
      doneRule: { type: "notEmpty", answerKey: "has_glassdoor_account" },
    },
    {
      id: "redirects_to_company_site",
      checklistLabel: "Yönlendirmeyi kontrol ettim",
      text: "Başvur butonuna basınca şirket sitesine yönlendiriyor mu?",
      choices: [...CHOICES.yesNoMaybe],
      answerKey: "redirects_to_company_site",
      showIf: { all: [{ answerKey: "found_apply_section", equalsAny: ["Gördüm", "Emin değilim"] }] },
      doneRule: { type: "notEmpty", answerKey: "redirects_to_company_site" },
    },
    {
      id: "has_passport",
      checklistLabel: "Pasaport durumunu netleştirdim",
      text: "Pasaportun var mı?",
      choices: [...CHOICES.yesNoMaybe],
      answerKey: "has_passport",
      doneRule: { type: "notEmpty", answerKey: "has_passport" },
    },
    {
      id: "cv_ready",
      checklistLabel: "CV hazır",
      text: "Bu ilana özel CV’niz hazır mı? (tercihen PDF)",
      choices: [...CHOICES.yesNoMaybe],
      answerKey: "cv_ready",
      doneRule: { type: "notEmpty", answerKey: "cv_ready" },
    },
    {
      id: "proof_docs",
      checklistLabel: "Mesleki kanıtları seçtim",
      text: "Mesleki yeterliliğini kanıtlamak için hangileri var? (Birden fazla seçebilirsin)",
      choices: [...PROOF_DOCS],
      input: { type: "multiselect" },
      answerKey: "proof_docs",
      doneRule: { type: "minSelected", answerKey: "proof_docs", value: 1 },
    },
    {
      id: "language_level",
      checklistLabel: "Dil seviyemi belirttim",
      text: "Dil seviyen hangi aralıkta?",
      choices: [...CHOICES.language],
      answerKey: "language_level",
      doneRule: { type: "notEmpty", answerKey: "language_level" },
    },
    {
      id: "blocking_issue",
      checklistLabel: "Engel durumunu belirttim",
      text: "Başvuruyu şu an tıkayan bir sorun var mı?",
      choices: ["Yok", "Var (yazacağım)"],
      answerKey: "blocking_issue",
      doneRule: { type: "notEmpty", answerKey: "blocking_issue" },
    },
    {
      id: "blocking_issue_text",
      checklistLabel: "Engel detayı alındı",
      text: "Kısaca yaz: Seni şu an ne durduruyor?",
      input: { type: "textarea", placeholder: "Sorunu yazın…" },
      answerKey: "blocking_issue_text",
      showIf: { all: [{ answerKey: "blocking_issue", equals: "Var (yazacağım)" }] },
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

/** Akıştaki ilk adım (service_pick). getNextStep null döndüğünde DONE dememek için fallback. */
export function getFirstStep(source: "eures" | "glassdoor" | "default"): FlowStep {
  const steps = getActiveFlowSteps(source);
  return steps[0];
}

/** İlk cevaplanmamış soru. showIf + doneRule. no-repeat: lastAskId verilirse ve dönen adım aynıysa bir sonraki cevaplanmamış adım döner. */
export function getNextStep(
  answers: Record<string, unknown>,
  source: "eures" | "glassdoor" | "default",
  lastAskId?: string | null
): FlowStep | null {
  const steps = getActiveFlowSteps(source);
  let next: FlowStep | null = null;
  for (const step of steps) {
    if (step.showIf && !isShowIfMatch(answers, step.showIf)) continue;
    if (isStepAnswered(answers, step)) continue;
    next = step;
    break;
  }
  if (!next) return null;
  if (lastAskId && next.id === lastAskId) return getNextStepAfter(answers, source, lastAskId);
  return next;
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

/**
 * Kontrol listesi: akıştaki adımlara göre.
 * currentStepId verilirse (akış devam ediyor): ✔ sadece bu sorudan ÖNCE gelen adımlar — sorulmadan tik atılmaz.
 * currentStepId null/undefined (akış bitti): ✔ = isStepAnswered(answers, step).
 */
export function getChecklistFromFlow(
  answers: Record<string, unknown>,
  source: "eures" | "glassdoor" | "default",
  currentStepId?: string | null
): Array<{ id: string; title: string; icon: string; items: Array<{ id: string; label: string; done: boolean; hint?: string }> }> {
  const steps = getActiveFlowSteps(source);
  const visibleSteps: FlowStep[] = [];
  for (const step of steps) {
    if (step.showIf && !isShowIfMatch(answers, step.showIf)) continue;
    visibleSteps.push(step);
  }
  const isBeforeFirstQuestion = currentStepId === "" || currentStepId === "__first__";
  const currentIndex = isBeforeFirstQuestion ? 0 : (currentStepId != null ? visibleSteps.findIndex((s) => s.id === currentStepId) : -1);
  const useOrderRule = isBeforeFirstQuestion || (currentStepId != null && currentIndex >= 0);

  const items: Array<{ id: string; label: string; done: boolean; hint?: string }> = [];
  for (let i = 0; i < visibleSteps.length; i++) {
    const step = visibleSteps[i];
    const done = useOrderRule
      ? i < currentIndex
      : isStepAnswered(answers, step);
    items.push({
      id: step.id,
      label: step.checklistLabel,
      done,
    });
  }
  if (items.length === 0) return [];
  return [
    {
      id: "flow",
      title: "Kontrol listesi",
      icon: "📋",
      items,
    },
  ];
}
