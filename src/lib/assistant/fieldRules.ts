/**
 * allowedKeys + keyHints + fieldRules (inputType, validation, semantic) tek kaynaktan.
 * Gemini'ye alan tipi / validasyon / normalize kuralları verir.
 */

import { CV_QUESTIONS } from "@/data/cvQuestions";

type AnyQuestion = Record<string, unknown>;

export type FieldRule = {
  key: string;
  label?: string;
  inputType: "text" | "textarea" | "number" | "date" | "select";
  examples?: string[];
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  semantic?: {
    kind?:
      | "fullName"
      | "phone"
      | "email"
      | "city"
      | "country"
      | "roleTitle"
      | "company"
      | "years"
      | "date"
      | "url"
      | "freeText";
    normalizeHint?: string;
  };
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function toArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function flattenQuestions(input: unknown): AnyQuestion[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.filter(Boolean) as AnyQuestion[];
  if (typeof input === "object") {
    const vals = Object.values(input);
    const out: AnyQuestion[] = [];
    for (const v of vals) {
      if (Array.isArray(v)) out.push(...(v as AnyQuestion[]));
      else if (typeof v === "object" && v) out.push(...flattenQuestions(v));
    }
    return out;
  }
  return [];
}

function guessSemanticFromKey(key: string): FieldRule["semantic"] {
  const k = key.toLowerCase();

  if (k.includes("fullname") || k.includes("full_name") || k.includes("adsoyad") || k === "name") {
    return { kind: "fullName", normalizeHint: "Sadece ad ve soyad. Şirket/ünvan ekleme." };
  }
  if (k.includes("phone") || k.includes("telefon") || k.includes("gsm") || k.includes("mobile")) {
    return { kind: "phone", normalizeHint: "Telefon numarası. Mümkünse ülke kodu ile (+90...). Harf kullanma." };
  }
  if (k.includes("mail") || k.includes("email") || k.includes("e_posta")) {
    return { kind: "email", normalizeHint: "Geçerli e-posta formatı. Boşluk/ek metin ekleme." };
  }
  if (k.includes("city") || k.includes("sehir") || k.includes("il_") || k === "il") {
    return { kind: "city", normalizeHint: "Sadece şehir adı yaz. İlçe/mahalle ekleme." };
  }
  if (k.includes("country") || k.includes("ulke")) {
    return { kind: "country", normalizeHint: "Sadece ülke adı." };
  }
  if (k.includes("role") || k.includes("title") || k.includes("unvan") || k.includes("pozisyon")) {
    return { kind: "roleTitle", normalizeHint: "Sadece ünvan. Şirket adı yazma." };
  }
  if (k.includes("company") || k.includes("sirket") || k.includes("firma")) {
    return { kind: "company", normalizeHint: "Sadece şirket/firma adı." };
  }
  if (k.includes("year") || k.includes("years") || k.includes("yil") || k.includes("duration") || k.includes("sure")) {
    return { kind: "years", normalizeHint: "Süreyi sayı olarak yaz. Örn: 2, 3.5" };
  }
  if (k.includes("date") || k.includes("tarih") || k.includes("birth")) {
    return { kind: "date", normalizeHint: "Tarih formatı YYYY-AA-GG tercih edilir." };
  }
  if (k.includes("url") || k.includes("link") || k.includes("website") || k.includes("linkedin") || k.includes("github")) {
    return { kind: "url", normalizeHint: "Geçerli bağlantı (https://...) yaz." };
  }
  return { kind: "freeText", normalizeHint: "Kısa, net, gereksiz detay yok." };
}

/** type "multiline" -> textarea; semantic years/date -> number/date */
function resolveInputType(
  q: AnyQuestion,
  saveKey: string,
  semantic: FieldRule["semantic"]
): FieldRule["inputType"] {
  const t = (q as { type?: string }).type;
  if (t === "multiline") return "textarea";
  if (t === "select") return "select";
  if (t === "text") {
    if (semantic?.kind === "years") return "number";
    if (semantic?.kind === "date") return "date";
    return "text";
  }
  if (semantic?.kind === "years") return "number";
  if (semantic?.kind === "date") return "date";
  return "text";
}

export type FieldRulesExtractionOptions = {
  voiceOnly?: boolean;
  chatOnly?: boolean;
  saveKeyFieldNames?: string[];
  questionFieldNames?: string[];
  examplesFieldNames?: string[];
  inputTypeFieldNames?: string[];
  requiredFieldNames?: string[];
  minLenFieldNames?: string[];
  maxLenFieldNames?: string[];
  patternFieldNames?: string[];
};

export function getFieldRulesFromWizardConfig(options: FieldRulesExtractionOptions = {}) {
  const {
    voiceOnly = false,
    chatOnly = false,
    saveKeyFieldNames = ["saveKey", "key", "fieldKey"],
    questionFieldNames = ["question", "label", "prompt", "title"],
    examplesFieldNames = ["examples", "chips", "suggestions"],
    requiredFieldNames = ["required", "isRequired"],
    minLenFieldNames = ["minLength", "minLen"],
    maxLenFieldNames = ["maxLength", "maxLen"],
    patternFieldNames = ["pattern", "regex"],
  } = options;

  const flat = flattenQuestions(CV_QUESTIONS);

  const rulesMap: Record<string, FieldRule> = {};
  const allowedKeys: string[] = [];
  const keyHints: Record<string, string> = {};

  const { chatOnly = false } = options;
  for (const q of flat) {
    if (!q || typeof q !== "object") continue;
    if (voiceOnly && (q as { voiceEnabled?: boolean }).voiceEnabled !== true) continue;
    if (chatOnly && (q as { chatEnabled?: boolean }).chatEnabled !== true) continue;

    let saveKey = "";
    for (const f of saveKeyFieldNames) {
      const val = (q as Record<string, unknown>)[f];
      if (isNonEmptyString(val)) {
        saveKey = val.trim();
        break;
      }
    }
    if (!isNonEmptyString(saveKey)) continue;

    let label = "";
    for (const f of questionFieldNames) {
      const val = (q as Record<string, unknown>)[f];
      if (isNonEmptyString(val)) {
        label = val.trim();
        break;
      }
    }

    let examples: string[] = [];
    for (const f of examplesFieldNames) {
      const arr = toArray<string>((q as Record<string, unknown>)[f]).filter(isNonEmptyString);
      if (arr.length) {
        examples = arr.slice(0, 8);
        break;
      }
    }

    const semantic = guessSemanticFromKey(saveKey);
    const inputType = resolveInputType(q, saveKey, semantic);

    const validation: FieldRule["validation"] = {};
    for (const f of requiredFieldNames) {
      const val = (q as Record<string, unknown>)[f];
      if (typeof val === "boolean") validation.required = val;
    }
    for (const f of minLenFieldNames) {
      const val = (q as Record<string, unknown>)[f];
      if (Number.isFinite(val)) validation.minLength = Number(val);
    }
    for (const f of maxLenFieldNames) {
      const val = (q as Record<string, unknown>)[f];
      if (Number.isFinite(val)) validation.maxLength = Number(val);
    }
    for (const f of patternFieldNames) {
      const val = (q as Record<string, unknown>)[f];
      if (isNonEmptyString(val)) validation.pattern = val.trim();
    }

    const rule: FieldRule = {
      key: saveKey,
      label: label || undefined,
      inputType,
      examples: examples.length ? examples : undefined,
      validation: Object.keys(validation).length ? validation : undefined,
      semantic,
    };

    if (!rulesMap[saveKey]) {
      rulesMap[saveKey] = rule;
      allowedKeys.push(saveKey);

      const hintParts: string[] = [];
      if (label) hintParts.push(label);
      if (semantic?.normalizeHint) hintParts.push(semantic.normalizeHint);
      if (examples.length) hintParts.push(`Örnek: ${examples.slice(0, 4).join(", ")}`);
      if (hintParts.length) keyHints[saveKey] = hintParts.join(" — ");
    }
  }

  return { allowedKeys, keyHints, fieldRules: rulesMap, totalQuestions: flat.length };
}

export function getVoiceFieldRulesBundle() {
  return getFieldRulesFromWizardConfig({ voiceOnly: true });
}

export function getChatFieldRulesBundle() {
  return getFieldRulesFromWizardConfig({ chatOnly: true });
}

export function getAllFieldRulesBundle() {
  return getFieldRulesFromWizardConfig({ voiceOnly: false, chatOnly: false });
}
