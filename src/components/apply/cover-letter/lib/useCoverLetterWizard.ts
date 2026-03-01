"use client";

import { useCallback, useEffect, useState } from "react";
import type { Mode, CoverLetterAnswers, CoverLetterResult, WizardError } from "./coverLetterSchema";

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

export async function postCoverLetterStep({
  job_id,
  session_id,
  step,
  approved,
  mode,
  answers,
  token,
}: {
  job_id: string;
  session_id: string;
  step: number;
  approved: boolean;
  mode: Mode;
  answers: CoverLetterAnswers;
  token: string;
}) {
  const res = await fetch("/api/apply/howto-step", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      intent: "cover_letter_generate",
      job_id,
      session_id,
      step,
      approved,
      locale: "tr-TR",
      derived: { mode },
      answers,
    }),
  });

  const data = await res.json().catch(() => ({})) as Record<string, unknown> & { type?: string; data?: CoverLetterResult; next_step?: number };
  if (!res.ok) throw { status: res.status, data };
  return data;
}

export type WizardState = {
  open: boolean;
  step: 1 | 2 | 3 | 4 | 5 | 6;
  session_id: string;
  mode: Mode;
  loading: boolean;
  error?: WizardError;
  job: JobRow | null;
  answers: CoverLetterAnswers;
  result?: CoverLetterResult;
};

export function useCoverLetterWizard(open: boolean, jobId: string, accessToken: string) {
  const [sessionId] = useState(() => randomUUID());
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [mode, setMode] = useState<Mode>("job_specific");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<WizardError | undefined>();
  const [job, setJob] = useState<JobRow | null>(null);
  const [answers, setAnswers] = useState<CoverLetterAnswers>({});
  const [result, setResult] = useState<CoverLetterResult | undefined>();

  useEffect(() => {
    if (!open || !jobId || !accessToken) return;
    setError(undefined);
    setJob(null);
    setAnswers({});
    setStep(1);
    setMode("job_specific");
    setResult(undefined);

    let cancelled = false;
    setLoading(true);
    fetch(`/api/apply/full-job?job_id=${encodeURIComponent(jobId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({})) as JobRow | { error?: string; detail?: string };
        return { res, data };
      })
      .then(({ res, data }) => {
        if (cancelled) return;
        setLoading(false);
        if (res.status === 403 && data && typeof data === "object" && "error" in data) {
          const err = data as { error?: string; detail?: string };
          setError({
            code: err.error ?? "premium_plus_required",
            message: err.detail ?? "Bu özellik Premium Plus abonelerine açıktır.",
          });
          if (typeof window !== "undefined") window.dispatchEvent(new Event("premium-subscription-invalidate"));
          return;
        }
        if (data && typeof data === "object" && "id" in data && !("error" in data)) {
          setJob(data as JobRow);
        } else {
          const err = data as { error?: string; detail?: string };
          setError({
            message: err?.error === "Not found" ? "İlan bulunamadı." : err?.detail ?? "İlan yüklenemedi.",
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
          setError({ message: "Bağlantı hatası. Tekrar deneyin." });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, jobId, accessToken]);

  const submitStep = useCallback(
    async (stepNum: 1 | 2 | 3 | 4 | 5 | 6, payloadAnswers?: CoverLetterAnswers) => {
      const merged = { ...answers, ...payloadAnswers };
      setAnswers(merged);
      setError(undefined);
      setLoading(true);
      try {
        const data = await postCoverLetterStep({
          job_id: jobId,
          session_id: sessionId,
          step: stepNum,
          approved: true,
          mode,
          answers: merged,
          token: accessToken,
        });
        if (stepNum === 6 && data?.type === "cover_letter" && data?.data) {
          setResult(data.data);
        } else if (typeof data?.next_step === "number" && stepNum < 6) {
          setStep(data.next_step as 1 | 2 | 3 | 4 | 5 | 6);
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
        if (code === "premium_plus_required" && typeof window !== "undefined") {
          window.dispatchEvent(new Event("premium-subscription-invalidate"));
        }
      } finally {
        setLoading(false);
      }
    },
    [jobId, sessionId, mode, answers, accessToken]
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
      mode,
      loading,
      error,
      job,
      answers,
      result,
    } satisfies WizardState,
    setStep: goToStep,
    setMode,
    setAnswers,
    setError,
    submitStep,
  };
}
