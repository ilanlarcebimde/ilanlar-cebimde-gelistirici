/**
 * Tek kaynaktan (cvQuestions) allowedKeys + keyHints üretir.
 * Projedeki CV_QUESTIONS yapısına uyumlu.
 */

import { CV_QUESTIONS } from "@/data/cvQuestions";

type AnyQuestion = Record<string, unknown>;

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function normalizeKey(k: string) {
  return k.trim();
}

function toArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

/**
 * Düz dizi veya kategorilere ayrılmış obje olabilir; hepsini düz listeye indirir.
 */
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

export type SaveKeyExtractionOptions = {
  voiceOnly?: boolean;
  saveKeyFieldNames?: string[];
  questionFieldNames?: string[];
  examplesFieldNames?: string[];
};

export function getAllSaveKeysFromWizardConfig(
  options: SaveKeyExtractionOptions = {}
) {
  const {
    voiceOnly = false,
    saveKeyFieldNames = ["saveKey", "key", "fieldKey"],
    questionFieldNames = ["question", "label", "prompt", "title"],
    examplesFieldNames = ["examples", "chips", "suggestions"],
  } = options;

  const flat = flattenQuestions(CV_QUESTIONS);

  const keys: string[] = [];
  const keyHints: Record<string, string> = {};

  for (const q of flat) {
    if (!q || typeof q !== "object") continue;

    if (voiceOnly && (q as { voiceEnabled?: boolean }).voiceEnabled !== true) continue;

    let saveKey = "";
    for (const f of saveKeyFieldNames) {
      const val = (q as Record<string, unknown>)[f];
      if (isNonEmptyString(val)) {
        saveKey = normalizeKey(val);
        break;
      }
    }
    if (!isNonEmptyString(saveKey)) continue;

    keys.push(saveKey);

    let questionText = "";
    for (const f of questionFieldNames) {
      const val = (q as Record<string, unknown>)[f];
      if (isNonEmptyString(val)) {
        questionText = val.trim();
        break;
      }
    }

    let examples: string[] = [];
    for (const f of examplesFieldNames) {
      const arr = toArray<string>((q as Record<string, unknown>)[f]).filter(isNonEmptyString);
      if (arr.length) {
        examples = arr.slice(0, 4);
        break;
      }
    }

    const hintParts: string[] = [];
    if (isNonEmptyString(questionText)) hintParts.push(questionText);
    if (examples.length) hintParts.push(`Örnek: ${examples.join(", ")}`);

    if (!keyHints[saveKey] && hintParts.length) {
      keyHints[saveKey] = hintParts.join(" — ");
    }
  }

  const seen = new Set<string>();
  const allowedKeys = keys.filter((k) => {
    if (!isNonEmptyString(k)) return false;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  return { allowedKeys, keyHints, totalQuestions: flat.length };
}

/** Sadece voiceEnabled alanların keys + hints */
export function getVoiceSaveKeysAndHints() {
  return getAllSaveKeysFromWizardConfig({ voiceOnly: true });
}

/** Tüm wizard alanların keys + hints */
export function getAllWizardSaveKeysAndHints() {
  return getAllSaveKeysFromWizardConfig({ voiceOnly: false });
}
