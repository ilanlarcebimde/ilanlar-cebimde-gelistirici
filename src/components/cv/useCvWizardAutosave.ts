import { useEffect } from "react";
import { cvWizardDataSchema } from "./cvWizardSchema";
import type { CvWizardData } from "./cvWizardTypes";

const DRAFT_KEY = "cv_wizard_draft_v2";

export function buildCvWizardAutosavePayload(data: CvWizardData) {
  const parsed = cvWizardDataSchema.safeParse(data);
  if (!parsed.success) {
    return null;
  }
  return {
    version: 2,
    updatedAt: new Date().toISOString(),
    data: parsed.data,
  };
}

export function useCvWizardAutosave(data: CvWizardData, enabled = true) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const payload = buildCvWizardAutosavePayload(data);
    if (!payload) return;
    try {
      window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage quota/session errors
    }
  }, [data, enabled]);
}

export function readCvWizardDraft(): CvWizardData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data?: unknown };
    const result = cvWizardDataSchema.safeParse(parsed?.data ?? {});
    return result.success ? (result.data as CvWizardData) : null;
  } catch {
    return null;
  }
}

