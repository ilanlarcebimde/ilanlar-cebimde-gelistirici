"use client";

import { useCallback, useEffect, useState } from "react";
import type { CoverLetterAnswers, CoverLetterResult, WizardError } from "./coverLetterSchema";

export type JobRow = Record<string, unknown> & {
  id?: string;
  title?: string | null;
  source_name?: string | null;
  location_text?: string | null;
  country?: string | null;
  application_email?: string | null;
  contact_email?: string | null;
};

function randomUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Tek endpoint: POST /api/cover-letter
 * job_id varsa ilanlı, post_id varsa merkez, hiçbiri yoksa generic.
 * Step 1–5 client-only; sadece final submission (Step 6) bu API'yi çağırır.
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
  const body: Record<string, unknown> = {
    session_id,
    locale: "tr-TR",
    answers,
  };
  if (job_id) body.job_id = job_id;
  if (post_id) body.post_id = post_id;

  const res = await fetch("/api/cover-letter", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({})) as Record<string, unknown> & { type?: string; data?: CoverLetterResult };
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

export function useCoverLetterWizard(open: boolean, source: UseCoverLetterWizardSource, accessToken: string) {
  const jobId = "jobId" in source ? source.jobId : undefined;
  const postId = "postId" in source ? source.postId : undefined;
  const isGeneric = "generic" in source && source.generic === true;

  const [sessionId] = useState(() => randomUUID());
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<WizardError | undefined>();
  const [job, setJob] = useState<JobRow | null>(null);
  const [answers, setAnswers] = useState<CoverLetterAnswers>({});
  const [result, setResult] = useState<CoverLetterResult | undefined>();

  // Tek wizard: ilan/client fetch yok. Step 1–5 tamamen client state; sadece Step 6 API.
  useEffect(() => {
    if (!open || !accessToken) return;
    setError(undefined);
    setAnswers({});
    setStep(1);
    setResult(undefined);
    setJob(null);
    setLoading(false);
  }, [open, accessToken]);

  const submitStep = useCallback(
    async (stepNum: 1 | 2 | 3 | 4 | 5 | 6, payloadAnswers?: CoverLetterAnswers) => {
      const merged = { ...answers, ...payloadAnswers };
      setAnswers(merged);
      setError(undefined);

      if (stepNum < 6) {
        setStep((stepNum + 1) as 1 | 2 | 3 | 4 | 5 | 6);
        return;
      }

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
        }
      } catch (err: unknown) {
        const cast = err as { status?: number; data?: { error?: string; detail?: string; message?: string } };
        const code = cast?.data?.error ?? (cast?.status === 403 ? "premium_plus_required" : cast?.status === 503 ? "webhook_not_configured" : "webhook_error");
        const message =
          typeof cast?.data?.message === "string"
            ? cast.data.message
            : typeof cast?.data?.detail === "string"
              ? cast.data.detail
              : cast?.status === 502 || cast?.status === 503
                ? "Mektup servisi geçici olarak yanıt vermiyor. Lütfen tekrar deneyin."
                : "İstek başarısız.";
        setError({ code, message });
        if ((code === "premium_plus_required" || code === "premium_required") && typeof window !== "undefined") {
          window.dispatchEvent(new Event("premium-subscription-invalidate"));
        }
      } finally {
        setLoading(false);
      }
    },
    [jobId, postId, sessionId, answers, accessToken]
  );

  const goToStep = useCallback((s: 1 | 2 | 3 | 4 | 5 | 6) => {
    setStep(s);
    setError(undefined);
  }, []);

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
  };
}
