"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";

/** Full job record from DB (job_posts row). */
export type FullJob = Record<string, unknown> & {
  id?: string;
  title?: string | null;
  source_name?: string | null;
  source_url?: string | null;
  location_text?: string | null;
  [key: string]: unknown;
};

export type Derived = {
  source_key: string;
  country: string | null;
  country_code: string | null;
};

const COUNTRY_TO_CODE: Record<string, string> = {
  ireland: "IE",
  germany: "DE",
  netherlands: "NL",
  france: "FR",
  spain: "ES",
  italy: "IT",
  portugal: "PT",
  belgium: "BE",
  austria: "AT",
  sweden: "SE",
  denmark: "DK",
  norway: "NO",
  switzerland: "CH",
  "united kingdom": "GB",
  uk: "GB",
  "united states": "US",
  usa: "US",
  america: "US",
  canada: "CA",
  australia: "AU",
};

function deriveSourceKey(sourceName: string | null | undefined): string {
  const s = (sourceName ?? "").toLowerCase().trim();
  if (s.includes("eures")) return "EURES";
  if (s.includes("linkedin")) return "LINKEDIN";
  if (s.includes("indeed")) return "INDEED";
  if (s.includes("glassdoor")) return "GLASSDOOR";
  if (s.includes("kariyer") || s.includes("career") || s.includes("company")) return "COMPANY_CAREER";
  return "OTHER";
}

function deriveCountryAndCode(job: FullJob): { country: string | null; country_code: string | null } {
  const rawCountry = (job.country as string)?.trim();
  if (rawCountry) {
    const key = rawCountry.toLowerCase();
    const code = COUNTRY_TO_CODE[key] ?? null;
    return { country: rawCountry, country_code: code };
  }
  const locationText = (job.location_text as string)?.trim() ?? "";
  const part = locationText.split(":")[0]?.trim() ?? "";
  if (!part) return { country: null, country_code: null };
  const key = part.toLowerCase();
  const code = COUNTRY_TO_CODE[key] ?? null;
  return { country: part, country_code: code };
}

function getStep1Question(sourceKey: string, sourceName: string | null | undefined): string {
  const name = (sourceName ?? "").trim() || "Bu kaynak";
  switch (sourceKey) {
    case "EURES":
      return "EURES üzerinden bu ilana nasıl başvurulur? Sizin için EURES başvuru kılavuzu hazırlamamı ister misiniz?";
    case "LINKEDIN":
      return "LinkedIn üzerinden bu ilana nasıl başvurulur? Adım adım kılavuz hazırlamamı ister misiniz?";
    case "INDEED":
      return "Indeed üzerinden bu ilana nasıl başvurulur? Adım adım kılavuz hazırlamamı ister misiniz?";
    case "COMPANY_CAREER":
      return "Şirketin kariyer sayfası üzerinden başvuru nasıl yapılır? Kılavuz hazırlamamı ister misiniz?";
    default:
      return `${name} kaynağında başvuru nasıl yapılır? Kılavuz hazırlamamı ister misiniz?`;
  }
}

function getStepQuestion(step: number, country: string | null): string {
  const c = country ?? "ilgili ülke";
  switch (step) {
    case 2:
      return `Bu ilan ${c} için yayınlanmış görünüyor. ${c} için gerekli resmi belgeler ve başvurulacak kurumları hazırlamamı onaylıyor musunuz?`;
    case 3:
      return `${c} için vize ve oturum süreçlerini adım adım açıklamamı ister misiniz?`;
    case 4:
      return `${c} için 2026 güncel net maaş varsayımlarını ve olası net kazancı hesaplamamı ister misiniz?`;
    case 5:
      return `${c} için yaşam gideri ve net birikim hesabı çıkarmamı ister misiniz?`;
    case 6:
      return `${c} vize başvurusu için kritik Niyet Mektubu (Dilekçe) taslağı hazırlamamı ister misiniz?`;
    case 7:
      return `${c} için 30 günlük başvuru planı hazırlamamı ister misiniz?`;
    default:
      return "";
  }
}

function randomUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function renderStepResult(value: unknown): React.ReactNode {
  if (value == null) return null;
  if (Array.isArray(value)) {
    return (
      <ul className="list-disc list-inside space-y-1 text-slate-600">
        {value.map((item, i) => (
          <li key={i}>{typeof item === "string" ? item : JSON.stringify(item)}</li>
        ))}
      </ul>
    );
  }
  if (typeof value === "object") {
    return (
      <pre className="overflow-x-auto rounded-lg bg-slate-50 p-3 text-sm text-slate-700 whitespace-pre-wrap">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }
  return <p className="text-slate-600">{String(value)}</p>;
}

export function HowToApplyWizardModal({
  open,
  onClose,
  jobId,
  accessToken,
  jobSourceUrl,
}: {
  open: boolean;
  onClose: () => void;
  jobId: string;
  accessToken: string;
  jobSourceUrl?: string | null;
}) {
  const [sessionId] = useState(() => randomUUID());
  const [currentStep, setCurrentStep] = useState(1);
  const [job, setJob] = useState<FullJob | null>(null);
  const [derived, setDerived] = useState<Derived | null>(null);
  const [loading, setLoading] = useState(false);
  const [stepResult, setStepResult] = useState<Record<string, unknown> | null>(null);
  const [approved, setApproved] = useState<"yes" | "no" | null>(null);
  const [canContinue, setCanContinue] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [webhookError, setWebhookError] = useState<string | null>(null);

  // Fetch full job when modal opens with jobId
  useEffect(() => {
    if (!open || !jobId || !accessToken) return;
    setFetchError(null);
    setJob(null);
    setDerived(null);
    setCurrentStep(1);
    setStepResult(null);
    setApproved(null);
    setCanContinue(false);
    setWebhookError(null);

    let cancelled = false;
    setLoading(true);
    fetch(`/api/apply/full-job?job_id=${encodeURIComponent(jobId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json().catch(() => ({})))
      .then((data: FullJob | { error?: string; detail?: string }) => {
        if (cancelled) return;
        setLoading(false);
        if (data && typeof data === "object" && "id" in data && !("error" in data)) {
          const fullJob = data as FullJob;
          setJob(fullJob);
          const sourceKey = deriveSourceKey(fullJob.source_name as string);
          const { country, country_code } = deriveCountryAndCode(fullJob);
          setDerived({ source_key: sourceKey, country, country_code });
        } else {
          const err = data as { error?: string; detail?: string };
          setFetchError(err?.error === "Not found" ? "İlan bulunamadı." : err?.detail ?? "İlan yüklenemedi.");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
          setFetchError("Bağlantı hatası. Tekrar deneyin.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, jobId, accessToken]);

  const questionText =
    currentStep === 1 && derived
      ? getStep1Question(derived.source_key, job?.source_name as string)
      : getStepQuestion(currentStep, derived?.country ?? null);

  const handleEvet = useCallback(async () => {
    if (!job || !derived || !accessToken) return;
    setApproved("yes");
    setWebhookError(null);
    setStepResult(null);
    setCanContinue(false);
    setLoading(true);
    try {
      const res = await fetch("/api/apply/howto-step", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          job_id: jobId,
          session_id: sessionId,
          step: currentStep,
          approved: true,
          derived: {
            source_key: derived.source_key,
            country: derived.country,
            country_code: derived.country_code,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = data as { error?: string; detail?: string };
        setWebhookError(err?.detail ? String(err.detail).slice(0, 150) : "Rehber alınamadı. Tekrar deneyin.");
        setLoading(false);
        return;
      }
      setStepResult(typeof data === "object" && data !== null ? (data as Record<string, unknown>) : { content: data });
      setCanContinue(true);
    } catch {
      setWebhookError("Bağlantı hatası. Tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, [job, derived, accessToken, jobId, sessionId, currentStep]);

  const handleHayir = useCallback(() => {
    setApproved("no");
    setStepResult(null);
    setCanContinue(false);
  }, []);

  const handleDevam = useCallback(() => {
    setStepResult(null);
    setCanContinue(false);
    setApproved(null);
    setWebhookError(null);
    if (currentStep < 7) setCurrentStep((s) => s + 1);
  }, [currentStep]);

  if (!open) return null;

  const ctaUrl = (stepResult?.cta as { url?: string })?.url ?? jobSourceUrl ?? null;
  const ctaLabel = (stepResult?.cta as { label?: string })?.label ?? "İlana Git";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden onClick={onClose} />
      <div
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-xl"
        role="dialog"
        aria-modal
        aria-labelledby="wizard-title"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6">
          <h2 id="wizard-title" className="text-lg font-bold text-slate-900">
            Nasıl Başvururum? — Adım {currentStep}/7
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {loading && !job && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
              <p className="mt-3 text-sm text-slate-600">İlan yükleniyor…</p>
            </div>
          )}

          {fetchError && !job && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {fetchError}
            </div>
          )}

          {job && derived && !fetchError && (
            <>
              {approved === "no" && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
                  Akış durduruldu. İstediğiniz zaman tekrar başlayabilirsiniz.
                </p>
              )}

              {approved !== "no" && (
                <>
                  {!stepResult ? (
                    <>
                      <p className="text-base text-slate-700">{questionText}</p>
                      <div className="mt-6 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={handleEvet}
                          disabled={loading}
                          className="min-h-[44px] rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                        >
                          {loading ? "Gönderiliyor…" : "Evet"}
                        </button>
                        <button
                          type="button"
                          onClick={handleHayir}
                          disabled={loading}
                          className="min-h-[44px] rounded-xl border-2 border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          Hayır
                        </button>
                      </div>
                      {webhookError && (
                        <p className="mt-3 text-sm text-red-600">
                          {webhookError}
                          <button
                            type="button"
                            onClick={handleEvet}
                            className="ml-2 font-medium underline"
                          >
                            Tekrar dene
                          </button>
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {Object.entries(stepResult).filter(([k]) => k !== "cta").map(([key, value]) => (
                          <div key={key}>
                            <h3 className="text-sm font-bold capitalize text-slate-800">
                              {key.replace(/_/g, " ")}
                            </h3>
                            <div className="mt-1">{renderStepResult(value)}</div>
                          </div>
                        ))}
                      </div>
                      {canContinue && (
                        <div className="mt-6 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={handleDevam}
                            className="min-h-[44px] rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
                          >
                            Devam
                          </button>
                          {ctaUrl && (
                            <a
                              href={ctaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex min-h-[44px] items-center rounded-xl border-2 border-brand-600 px-6 py-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-50"
                            >
                              {ctaLabel}
                            </a>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-200 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
