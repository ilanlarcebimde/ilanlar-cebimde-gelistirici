"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import {
  COVER_LETTER_STEP_1,
  COVER_LETTER_STEP_2,
  COVER_LETTER_STEP_3,
  COVER_LETTER_STEP_4,
  COVER_LETTER_STEP_5,
  COVER_LETTER_STEP_6,
} from "@/components/apply/coverLetterWizardContent";
import { CoverLetterResultScreen, type CoverLetterResultData } from "@/components/apply/CoverLetterResultScreen";

type FullJob = Record<string, unknown> & {
  id?: string;
  title?: string | null;
  application_email?: string | null;
  contact_email?: string | null;
  [key: string]: unknown;
};

function randomUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface CoverLetterWizardModalProps {
  open: boolean;
  onClose: () => void;
  jobId: string;
  accessToken: string;
}

export function CoverLetterWizardModal({ open, onClose, jobId, accessToken }: CoverLetterWizardModalProps) {
  const [sessionId] = useState(() => randomUUID());
  const [currentStep, setCurrentStep] = useState(1);
  const [job, setJob] = useState<FullJob | null>(null);
  const [derived, setDerived] = useState<{ mode?: "job_specific" | "generic" }>({});
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [webhookError, setWebhookError] = useState<string | null>(null);
  const [stepFormData, setStepFormData] = useState<Record<string, unknown>>({});
  const [letterResult, setLetterResult] = useState<CoverLetterResultData | null>(null);

  useEffect(() => {
    if (!open || !jobId || !accessToken) return;
    setFetchError(null);
    setJob(null);
    setDerived({});
    setAnswers({});
    setStepFormData({});
    setCurrentStep(1);
    setLetterResult(null);
    setWebhookError(null);

    let cancelled = false;
    setLoading(true);
    fetch(`/api/apply/full-job?job_id=${encodeURIComponent(jobId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({})) as FullJob | { error?: string; detail?: string };
        return { res, data };
      })
      .then(({ res, data }) => {
        if (cancelled) return;
        setLoading(false);
        if (
          res.status === 403 &&
          data &&
          typeof data === "object" &&
          ((data as { error?: string }).error === "premium_required" ||
            (data as { error?: string }).error === "premium_plus_required")
        ) {
          const msg = (data as { detail?: string }).detail ?? "Bu özellik Premium Plus abonelerine açıktır.";
          setFetchError(msg);
          if (typeof window !== "undefined") window.dispatchEvent(new Event("premium-subscription-invalidate"));
          return;
        }
        if (data && typeof data === "object" && "id" in data && !("error" in data)) {
          setJob(data as FullJob);
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

  const submitStep = useCallback(
    async (step: number, payload: { derived?: Record<string, unknown>; answers: Record<string, unknown> }) => {
      setWebhookError(null);
      setLoading(true);
      try {
        const res = await fetch("/api/apply/howto-step", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({
            job_id: jobId,
            session_id: sessionId,
            step,
            approved: true,
            intent: "cover_letter_generate",
            locale: "tr-TR",
            derived: payload.derived ?? derived,
            answers: payload.answers ?? answers,
          }),
        });
        const text = await res.text();
        let parsed: Record<string, unknown>;
        try {
          parsed = text ? (JSON.parse(text) as Record<string, unknown>) : {};
        } catch {
          setWebhookError("Cevap işlenemedi.");
          setLoading(false);
          return;
        }
        if (!res.ok) {
          if (res.status === 403 && (parsed?.error === "premium_plus_required" || parsed?.error === "premium_required")) {
            setWebhookError(typeof parsed?.message === "string" ? parsed.message : (parsed?.detail as string) ?? "Premium Plus gerekli.");
            if (typeof window !== "undefined") window.dispatchEvent(new Event("premium-subscription-invalidate"));
          } else {
            setWebhookError((parsed?.detail as string) ?? (parsed?.error as string) ?? "İstek başarısız.");
          }
          setLoading(false);
          return;
        }
        if (step === 6 && parsed?.type === "cover_letter" && parsed?.data && typeof parsed.data === "object") {
          setLetterResult(parsed.data as CoverLetterResultData);
        } else if (typeof parsed?.next_step === "number" && step < 6) {
          setCurrentStep(parsed.next_step);
        }
      } catch {
        setWebhookError("Bağlantı hatası. Tekrar deneyin.");
      } finally {
        setLoading(false);
      }
    },
    [accessToken, jobId, sessionId, derived, answers]
  );

  const handleStep1 = useCallback(() => {
    const mode = stepFormData.mode as "job_specific" | "generic" | undefined;
    if (mode !== "job_specific" && mode !== "generic") return;
    setDerived((d) => ({ ...d, mode }));
    submitStep(1, { derived: { ...derived, mode }, answers });
  }, [stepFormData.mode, derived, answers, submitStep]);

  const handleStep2 = useCallback(() => {
    const full_name = (stepFormData.full_name as string)?.trim();
    const email = (stepFormData.email as string)?.trim();
    if (!full_name || !email) return;
    const merged: Record<string, unknown> = { ...answers, full_name, email };
    if (stepFormData.phone != null) merged.phone = stepFormData.phone;
    if (stepFormData.city_country != null) merged.city_country = stepFormData.city_country;
    setAnswers(merged);
    submitStep(2, { answers: merged });
  }, [stepFormData, answers, submitStep]);

  const handleStep3 = useCallback(() => {
    const total_experience_years = stepFormData.total_experience_years;
    const top_skills = Array.isArray(stepFormData.top_skills) ? stepFormData.top_skills : [];
    if (total_experience_years == null || top_skills.length < 2) return;
    const merged = { ...answers, total_experience_years, top_skills };
    setAnswers(merged);
    submitStep(3, { answers: merged });
  }, [stepFormData, answers, submitStep]);

  const handleStep4 = useCallback(() => {
    const passport_status = (stepFormData.passport_status as string)?.trim();
    const work_permit_status = (stepFormData.work_permit_status as string)?.trim();
    if (!passport_status || !work_permit_status) return;
    const merged = { ...answers, passport_status, work_permit_status };
    setAnswers(merged);
    submitStep(4, { answers: merged });
  }, [stepFormData, answers, submitStep]);

  const handleStep5 = useCallback(() => {
    const motivation = (stepFormData.motivation as string)?.trim();
    if (!motivation || motivation.length > 400) return;
    const merged = { ...answers, motivation };
    setAnswers(merged);
    submitStep(5, { answers: merged });
  }, [stepFormData, answers, submitStep]);

  const handleStep6 = useCallback(() => {
    const merged = { ...answers };
    submitStep(6, { answers: merged });
  }, [answers, submitStep]);

  if (!open) return null;

  const jobEmail = job ? ((job.application_email as string) || (job.contact_email as string) || null) : null;

  const body = (
    <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        aria-label="Kapat"
      >
        <X className="h-5 w-5" />
      </button>

      {letterResult ? (
        <CoverLetterResultScreen
          data={letterResult}
          jobEmail={jobEmail}
          onClose={onClose}
          inModal
        />
      ) : (
        <>
          <h2 className="pr-10 text-xl font-bold text-slate-900">Başvuru Mektubu Oluştur</h2>

          {loading && !job && (
            <p className="mt-4 text-sm text-slate-600">İlan yükleniyor…</p>
          )}
          {fetchError && (
            <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
              {fetchError}
            </div>
          )}
          {job && !letterResult && currentStep >= 1 && currentStep <= 6 && (
            <>
              <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <span>Adım {currentStep} / 6</span>
              </div>

              {/* Step 1 — Mod seçimi */}
              {currentStep === 1 && (
                <div className="mt-4 space-y-4">
                  <p className="font-medium text-slate-800">{COVER_LETTER_STEP_1.question}</p>
                  <p className="text-sm text-slate-600">{COVER_LETTER_STEP_1.hint}</p>
                  <p className="rounded-lg bg-slate-50 p-3 text-xs italic text-slate-600">
                    {COVER_LETTER_STEP_1.example}
                  </p>
                  <div className="flex flex-col gap-2">
                    {COVER_LETTER_STEP_1.options.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setStepFormData((p) => ({ ...p, mode: opt.value }))}
                        className={`rounded-xl border-2 px-4 py-3 text-left text-sm font-medium ${
                          stepFormData.mode === opt.value
                            ? "border-slate-800 bg-slate-50 text-slate-900"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleStep1}
                    disabled={loading || (stepFormData.mode !== "job_specific" && stepFormData.mode !== "generic")}
                    className="mt-2 h-12 w-full rounded-2xl bg-slate-900 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {loading ? "Gönderiliyor…" : "Devam"}
                  </button>
                </div>
              )}

              {/* Step 2 — Kimlik ve iletişim */}
              {currentStep === 2 && (
                <div className="mt-4 space-y-4">
                  <p className="font-medium text-slate-800">{COVER_LETTER_STEP_2.question}</p>
                  <p className="text-sm text-slate-600">{COVER_LETTER_STEP_2.hint}</p>
                  <p className="rounded-lg bg-slate-50 p-3 text-xs italic text-slate-600">
                    {COVER_LETTER_STEP_2.example}
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Ad Soyad *</label>
                      <input
                        type="text"
                        value={(stepFormData.full_name as string) ?? ""}
                        onChange={(e) => setStepFormData((p) => ({ ...p, full_name: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                        placeholder="Buğra Keser"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">E-posta *</label>
                      <input
                        type="email"
                        value={(stepFormData.email as string) ?? ""}
                        onChange={(e) => setStepFormData((p) => ({ ...p, email: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                        placeholder="bugra@mail.com"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Telefon (opsiyonel)</label>
                      <input
                        type="text"
                        value={(stepFormData.phone as string) ?? ""}
                        onChange={(e) => setStepFormData((p) => ({ ...p, phone: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                        placeholder="+90 5xx xxx xx xx"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Şehir / Ülke (opsiyonel)</label>
                      <input
                        type="text"
                        value={(stepFormData.city_country as string) ?? ""}
                        onChange={(e) => setStepFormData((p) => ({ ...p, city_country: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                        placeholder="İstanbul, Türkiye"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleStep2}
                    disabled={
                      loading ||
                      !(stepFormData.full_name as string)?.trim() ||
                      !(stepFormData.email as string)?.trim()
                    }
                    className="mt-2 h-12 w-full rounded-2xl bg-slate-900 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {loading ? "Gönderiliyor…" : "Devam"}
                  </button>
                </div>
              )}

              {/* Step 3 — Deneyim ve beceriler */}
              {currentStep === 3 && (
                <div className="mt-4 space-y-4">
                  <p className="font-medium text-slate-800">{COVER_LETTER_STEP_3.question}</p>
                  <p className="text-sm text-slate-600">{COVER_LETTER_STEP_3.hint}</p>
                  <p className="rounded-lg bg-slate-50 p-3 text-xs italic text-slate-600 whitespace-pre-wrap">
                    {COVER_LETTER_STEP_3.example}
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Toplam deneyim (yıl) *</label>
                      <input
                        type="number"
                        min={0}
                        value={(stepFormData.total_experience_years as number) ?? ""}
                        onChange={(e) =>
                          setStepFormData((p) => ({
                            ...p,
                            total_experience_years: e.target.value ? Number(e.target.value) : undefined,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                        placeholder="6"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Güçlü yönler / beceriler (en az 2, virgül veya satır ile ayırın) *
                      </label>
                      <textarea
                        value={Array.isArray(stepFormData.top_skills) ? stepFormData.top_skills.join("\n") : (stepFormData.top_skills as string) ?? ""}
                        onChange={(e) => {
                          const raw = e.target.value.trim();
                          const list = raw ? raw.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean) : [];
                          setStepFormData((p) => ({ ...p, top_skills: list }));
                        }}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                        rows={3}
                        placeholder={"Zamanında teslim\nEkip koordinasyonu\nŞantiye lojistiği"}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleStep3}
                    disabled={
                      loading ||
                      stepFormData.total_experience_years == null ||
                      !Array.isArray(stepFormData.top_skills) ||
                      stepFormData.top_skills.length < 2
                    }
                    className="mt-2 h-12 w-full rounded-2xl bg-slate-900 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {loading ? "Gönderiliyor…" : "Devam"}
                  </button>
                </div>
              )}

              {/* Step 4 — Belgeler ve yasal durum */}
              {currentStep === 4 && (
                <div className="mt-4 space-y-4">
                  <p className="font-medium text-slate-800">{COVER_LETTER_STEP_4.question}</p>
                  <p className="text-sm text-slate-600">{COVER_LETTER_STEP_4.hint}</p>
                  <p className="rounded-lg bg-slate-50 p-3 text-xs italic text-slate-600 whitespace-pre-wrap">
                    {COVER_LETTER_STEP_4.example}
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Pasaport durumu *</label>
                      <input
                        type="text"
                        value={(stepFormData.passport_status as string) ?? ""}
                        onChange={(e) => setStepFormData((p) => ({ ...p, passport_status: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                        placeholder="Geçerli pasaportum bulunmaktadır"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Çalışma izni durumu *</label>
                      <input
                        type="text"
                        value={(stepFormData.work_permit_status as string) ?? ""}
                        onChange={(e) => setStepFormData((p) => ({ ...p, work_permit_status: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                        placeholder="Çalışma izni için gerekli süreci başlatabilirim"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleStep4}
                    disabled={
                      loading ||
                      !(stepFormData.passport_status as string)?.trim() ||
                      !(stepFormData.work_permit_status as string)?.trim()
                    }
                    className="mt-2 h-12 w-full rounded-2xl bg-slate-900 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {loading ? "Gönderiliyor…" : "Devam"}
                  </button>
                </div>
              )}

              {/* Step 5 — Motivasyon */}
              {currentStep === 5 && (
                <div className="mt-4 space-y-4">
                  <p className="font-medium text-slate-800">{COVER_LETTER_STEP_5.question}</p>
                  <p className="text-sm text-slate-600">{COVER_LETTER_STEP_5.hint}</p>
                  <p className="rounded-lg bg-slate-50 p-3 text-xs italic text-slate-600 whitespace-pre-wrap">
                    {COVER_LETTER_STEP_5.example}
                  </p>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Kısa motivasyonunuz (max 400 karakter) *</label>
                    <textarea
                      value={(stepFormData.motivation as string) ?? ""}
                      onChange={(e) => setStepFormData((p) => ({ ...p, motivation: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                      rows={4}
                      maxLength={400}
                      placeholder="Firmanızın [Pozisyon] pozisyonunda…"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      {(stepFormData.motivation as string)?.length ?? 0} / 400
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleStep5}
                    disabled={
                      loading ||
                      !(stepFormData.motivation as string)?.trim() ||
                      (stepFormData.motivation as string)?.length > 400
                    }
                    className="mt-2 h-12 w-full rounded-2xl bg-slate-900 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {loading ? "Gönderiliyor…" : "Devam"}
                  </button>
                </div>
              )}

              {/* Step 6 — Üretim */}
              {currentStep === 6 && (
                <div className="mt-4 space-y-4">
                  <p className="font-medium text-slate-800">{COVER_LETTER_STEP_6.question}</p>
                  <p className="text-sm text-slate-600">{COVER_LETTER_STEP_6.hint}</p>
                  {webhookError && (
                    <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{webhookError}</div>
                  )}
                  <button
                    type="button"
                    onClick={handleStep6}
                    disabled={loading}
                    className="mt-2 h-12 w-full rounded-2xl bg-slate-900 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {loading ? "Mektup oluşturuluyor…" : "Mektubu Oluştur"}
                  </button>
                </div>
              )}

              {currentStep < 6 && (
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-4 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  İptal
                </button>
              )}
            </>
          )}
        </>
      )}
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" aria-hidden onClick={onClose} />
      {body}
    </div>,
    document.body
  );
}
