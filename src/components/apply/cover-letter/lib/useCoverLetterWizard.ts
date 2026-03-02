"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CoverLetterAnswers, CoverLetterResult, WizardError } from "./coverLetterSchema";
import { buildCoverLetterStep6Payload } from "@/lib/coverLetterWebhookContract";

export type JobRow = Record<string, unknown> & {
  id?: string;
  title?: string | null;
  source_name?: string | null;
  location_text?: string | null;
  country?: string | null;
  application_email?: string | null;
  contact_email?: string | null;
};

const DRAFT_KEY_PREFIX = "cover_letter_draft:v1:";
const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 gün

export type CoverLetterDraft = {
  currentStep: 1 | 2 | 3 | 4 | 5 | 6;
  session_id: string;
  answers: CoverLetterAnswers;
  updatedAt: number;
};

function getDraftScopeKey(jobId?: string, postId?: string, isGeneric?: boolean): string {
  if (jobId) return `job:${jobId}`;
  if (postId) return `post:${postId}`;
  return "generic";
}

function getDraftStorageKey(scopeKey: string, userId?: string): string {
  if (userId) return `${DRAFT_KEY_PREFIX}${userId}:${scopeKey}`;
  return `${DRAFT_KEY_PREFIX}${scopeKey}`;
}

function randomUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function readDraft(key: string): CoverLetterDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const draft = JSON.parse(raw) as CoverLetterDraft;
    if (!draft?.session_id || !draft?.answers || typeof draft.currentStep !== "number") return null;
    if (draft.updatedAt && Date.now() - draft.updatedAt > DRAFT_MAX_AGE_MS) return null;
    if (draft.currentStep < 1 || draft.currentStep > 6) return null;
    return draft;
  } catch {
    return null;
  }
}

function writeDraft(key: string, draft: CoverLetterDraft): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify({ ...draft, updatedAt: Date.now() }));
  } catch {
    // quota / private mode
  }
}

function clearDraftStorage(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * Tek endpoint: POST /api/cover-letter (backend n8n webhook'a POST eder).
 * Step 6 payload buildCoverLetterStep6Payload ile üretilir; debug logları eklenir.
 */
export async function postCoverLetterFinal({
  job_id,
  post_id,
  session_id,
  answers,
  token,
}: {
  job_id?: string;
  post_id?: string;
  session_id: string;
  answers: CoverLetterAnswers;
  token: string;
}) {
  const endpoint = "/api/cover-letter";
  const body: Record<string, unknown> = {
    session_id,
    locale: "tr-TR",
    answers,
  };
  if (job_id) body.job_id = job_id;
  if (post_id) body.post_id = post_id;

  const payload = buildCoverLetterStep6Payload({
    session_id,
    answers,
    locale: "tr-TR",
    job: undefined,
    derived: {},
  });

  if (process.env.NODE_ENV === "development" || typeof window !== "undefined") {
    console.log("[CoverLetter] Step 6 POST", {
      endpoint,
      intent: payload.intent,
      step: payload.step,
      session_id: payload.session_id,
      answersKeys: Object.keys(payload.answers ?? {}).length,
      top_skills_length: Array.isArray(payload.answers?.top_skills) ? payload.answers.top_skills.length : 0,
    });
  }

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[CoverLetter] Network error", msg);
    throw { status: 0, data: { error: "network_error", message: "Servise bağlanılamadı." } };
  }

  const text = await res.text();
  console.log("[UI] /api/cover-letter response", { status: res.status, textPreview: text.slice(0, 200) });
  const data = (() => {
    try {
      return JSON.parse(text) as Record<string, unknown> & { type?: string; data?: CoverLetterResult };
    } catch {
      return {};
    }
  })();

  if (process.env.NODE_ENV === "development" || typeof window !== "undefined") {
    console.log("[CoverLetter] Step 6 response", {
      status: res.status,
      bodyPreview: text.slice(0, 200),
    });
  }

  if (!res.ok) throw { status: res.status, data };
  return data;
}

export type WizardState = {
  open: boolean;
  step: 1 | 2 | 3 | 4 | 5 | 6;
  session_id: string;
  loading: boolean;
  error?: WizardError;
  job: JobRow | null;
  answers: CoverLetterAnswers;
  result?: CoverLetterResult;
};

export type UseCoverLetterWizardSource =
  | { jobId: string; postId?: never; generic?: never }
  | { jobId?: never; postId: string; generic?: never }
  | { jobId?: never; postId?: never; generic: true };

export function useCoverLetterWizard(
  open: boolean,
  source: UseCoverLetterWizardSource,
  accessToken: string,
  options?: { userId?: string }
) {
  const jobId = "jobId" in source ? source.jobId : undefined;
  const postId = "postId" in source ? source.postId : undefined;
  const isGeneric = "generic" in source && source.generic === true;
  const scopeKey = getDraftScopeKey(jobId, postId, isGeneric);
  const draftKey = getDraftStorageKey(scopeKey, options?.userId);
  const loadedFromDraft = useRef(false);

  const [sessionId, setSessionId] = useState(() => randomUUID());
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<WizardError | undefined>();
  const [job, setJob] = useState<JobRow | null>(null);
  const [answers, setAnswers] = useState<CoverLetterAnswers>({});
  const [result, setResult] = useState<CoverLetterResult | undefined>();

  const clearDraft = useCallback(() => {
    clearDraftStorage(draftKey);
    loadedFromDraft.current = false;
  }, [draftKey]);

  // Modal açıldığında: draft varsa yükle, yoksa sıfırla.
  useEffect(() => {
    if (!open || !accessToken) return;
    setError(undefined);
    setResult(undefined);
    setJob(null);
    setLoading(false);
    const draft = readDraft(draftKey);
    if (draft) {
      loadedFromDraft.current = true;
      setStep(draft.currentStep);
      setSessionId(draft.session_id);
      setAnswers(draft.answers ?? {});
    } else {
      loadedFromDraft.current = false;
      setStep(1);
      setAnswers({});
      setSessionId(randomUUID());
    }
  }, [open, accessToken, draftKey]);

  // Taslağı her adım/cevap değişiminde localStorage'a yaz.
  useEffect(() => {
    if (!open) return;
    writeDraft(draftKey, {
      currentStep: step,
      session_id: sessionId,
      answers,
      updatedAt: Date.now(),
    });
  }, [open, draftKey, step, sessionId, answers]);

  const submitStep = useCallback(
    async (stepNum: 1 | 2 | 3 | 4 | 5 | 6, payloadAnswers?: CoverLetterAnswers) => {
      const merged = { ...answers, ...payloadAnswers };
      setAnswers(merged);
      setError(undefined);

      if (stepNum < 6) {
        setStep((stepNum + 1) as 1 | 2 | 3 | 4 | 5 | 6);
        return;
      }

      console.log("[UI] cover-letter submit fired", {
        step: 6,
        session_id: sessionId,
        hasAnswers: !!Object.keys(merged).length,
        answersKeys: Object.keys(merged || {}),
        ts: Date.now(),
      });

      console.log("[UI] POST /api/cover-letter", {
        session_id: sessionId,
        locale: "tr-TR",
        job_id: !!jobId,
        post_id: !!postId,
        skillsLen: Array.isArray(merged.top_skills) ? merged.top_skills.length : 0,
        motivationLen: typeof merged.motivation === "string" ? merged.motivation.length : 0,
      });

      setLoading(true);
      try {
        const data = await postCoverLetterFinal({
          job_id: jobId,
          post_id: postId,
          session_id: sessionId,
          answers: merged,
          token: accessToken,
        });
        if (data?.type === "cover_letter" && data?.data) {
          setResult(data.data);
          clearDraft();
        }
      } catch (err: unknown) {
        const cast = err as { status?: number; data?: { error?: string; detail?: string; message?: string; webhook_status?: number } };
        const code =
          cast?.data?.error ??
          (cast?.status === 0 ? "network_error" : cast?.status === 403 ? "premium_plus_required" : cast?.status === 503 ? "webhook_not_configured" : "webhook_error");
        const detailStr = typeof cast?.data?.detail === "string" ? cast.data.detail : "";
        const messageStr = typeof cast?.data?.message === "string" ? cast.data.message : "";
        const message =
          detailStr ||
          messageStr ||
          (code === "network_error"
            ? "Servise bağlanılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin."
            : cast?.status === 502 || cast?.status === 503
              ? "Mektup servisi geçici olarak yanıt vermiyor. Lütfen tekrar deneyin."
              : "İstek başarısız.");
        setError({ code, message });
        if ((code === "premium_plus_required" || code === "premium_required") && typeof window !== "undefined") {
          window.dispatchEvent(new Event("premium-subscription-invalidate"));
        }
      } finally {
        setLoading(false);
      }
    },
    [jobId, postId, sessionId, answers, accessToken, clearDraft]
  );

  const goToStep = useCallback((s: 1 | 2 | 3 | 4 | 5 | 6) => {
    setStep(s);
    setError(undefined);
  }, []);

  const hasDraft =
    step > 1 ||
    Object.keys(answers).some((k) => {
      const v = answers[k as keyof CoverLetterAnswers];
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === "string") return v.trim().length > 0;
      return v != null;
    });

  return {
    state: {
      open,
      step,
      session_id: sessionId,
      loading,
      error,
      job,
      answers,
      result,
    } satisfies WizardState,
    setStep: goToStep,
    setAnswers,
    setError,
    submitStep,
    hasJobOrPost: !!(jobId || postId),
    clearDraft,
    hasDraft,
  };
}
