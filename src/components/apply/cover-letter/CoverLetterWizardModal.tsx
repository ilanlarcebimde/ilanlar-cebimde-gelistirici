"use client";

import { createPortal } from "react-dom";
import { useCoverLetterWizard } from "./lib/useCoverLetterWizard";
import { validateStepGeneric } from "./lib/coverLetterSchema";
import { ProgressHeader } from "./ui/ProgressHeader";
import { StickyActions } from "./ui/StickyActions";
import { Step1Generic } from "./steps/Step1Generic";
import { StepIdentity } from "./steps/StepIdentity";
import { StepExperience } from "./steps/StepExperience";
import { StepLegalDocs } from "./steps/StepLegalDocs";
import { StepMotivation } from "./steps/StepMotivation";
import { StepResultTabs } from "./steps/StepResultTabs";
import { COVER_LETTER_STEP_6, COVER_LETTER_WIZARD_HEADING } from "@/components/apply/coverLetterWizardContent";

export interface CoverLetterWizardModalProps {
  open: boolean;
  onClose: () => void;
  /** İlan (job_posts) — yurtdışı ilanlar paneli vb. */
  jobId?: string;
  /** Merkezi ilan (merkezi_posts) — yurtdışı iş başvuru merkezi feed. */
  postId?: string;
  accessToken: string;
  /** Premium Plus yoksa çağrılır (tüm akışlar Premium Plus). */
  onPremiumRequired?: () => void;
  /** Genel mektup (ilan bağımsız). */
  generic?: boolean;
}

export function CoverLetterWizardModal({ open, onClose, jobId, postId, accessToken, onPremiumRequired, generic }: CoverLetterWizardModalProps) {
  const source = generic
    ? { generic: true as const }
    : postId
      ? { postId }
      : { jobId: jobId ?? "" };
  const { state, setStep, setAnswers, setError, submitStep, hasJobOrPost } = useCoverLetterWizard(open, source, accessToken);
  const { step, loading, error, answers, result } = state;

  const subtitle = hasJobOrPost ? COVER_LETTER_WIZARD_HEADING.subtitle : COVER_LETTER_WIZARD_HEADING.subtitleGeneric;
  const jobEmail = null;

  const handleStep1Next = () => {
    const v = validateStepGeneric(1, answers);
    if (!v.ok) return;
    submitStep(1, answers);
  };
  const handleStep2Next = () => {
    const v = validateStepGeneric(2, answers);
    if (!v.ok) return;
    submitStep(2, answers);
  };
  const handleStep3Next = () => {
    const v = validateStepGeneric(3, answers);
    if (!v.ok) return;
    submitStep(3, answers);
  };
  const handleStep4Next = () => {
    const v = validateStepGeneric(4, answers);
    if (!v.ok) return;
    submitStep(4, answers);
  };
  const handleStep5Next = () => {
    const v = validateStepGeneric(5, answers);
    if (!v.ok) return;
    submitStep(5, answers);
  };
  const handleStep6Submit = () => submitStep(6, answers);

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as 1 | 2 | 3 | 4 | 5);
  };

  if (!open) return null;

  const body = (
    <div className="relative max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-xl md:max-w-[720px] md:p-8 lg:max-w-[840px] [@media(max-width:768px)]:min-h-[100svh] [@media(max-width:768px)]:rounded-none">
      {result ? (
        <StepResultTabs data={result} jobEmail={jobEmail} onClose={onClose} />
      ) : (
        <>
          <ProgressHeader currentStep={step} onClose={onClose} stepKey={step} subtitle={subtitle} />

          {error && (
            <div className="mt-6 space-y-4">
              {error.code === "premium_required" && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                  <h3 className="font-semibold text-amber-900">Premium Gerekli</h3>
                  <p className="mt-1 text-sm text-amber-800">{error.message}</p>
                  <button
                    type="button"
                    onClick={() => { onPremiumRequired?.(); onClose(); }}
                    className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Premium&apos;a Geç (Avantajlar & Kupon)
                  </button>
                </div>
              )}
              {error.code === "premium_plus_required" && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                  <h3 className="font-semibold text-amber-900">Premium Plus Gerekli</h3>
                  <p className="mt-1 text-sm text-amber-800">{error.message}</p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Premium Plus&apos;a Geç
                  </button>
                </div>
              )}
              {error.code === "webhook_not_configured" && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="font-semibold text-slate-900">Servis Hazır Değil</h3>
                  <p className="mt-1 text-sm text-slate-700">Mektup servisi yapılandırılmamış.</p>
                  {process.env.NODE_ENV === "development" && (
                    <p className="mt-2 text-xs text-slate-500">N8N_LETTER_WEBHOOK_URL eksik</p>
                  )}
                  <button
                    type="button"
                    onClick={() => { setError(undefined); if (step === 6) handleStep6Submit(); }}
                    className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    {COVER_LETTER_STEP_6.retryButton}
                  </button>
                </div>
              )}
              {error.code === "webhook_error" && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="font-semibold text-slate-900">Geçici Sorun</h3>
                  <p className="mt-1 text-sm text-slate-700">Mektup servisi geçici olarak yanıt vermiyor.</p>
                  <button
                    type="button"
                    onClick={() => { setError(undefined); if (step === 6) handleStep6Submit(); }}
                    className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    {COVER_LETTER_STEP_6.retryButton}
                  </button>
                </div>
              )}
              {(error.code === "job_not_found" || error.code === "post_not_found") && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="font-semibold text-slate-900">İçerik bulunamadı</h3>
                  <p className="mt-1 text-sm text-slate-700">{error.message}</p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    Kapat
                  </button>
                </div>
              )}
              {!["premium_required", "premium_plus_required", "webhook_not_configured", "webhook_error", "job_not_found", "post_not_found"].includes(error.code ?? "") && error.message && (
                <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                  {error.message}
                </div>
              )}
            </div>
          )}

          {!result && !error?.code && (
            <div className="min-h-[52vh] transition-opacity duration-200">
              {step === 1 && (
                <Step1Generic
                  answers={answers}
                  onChange={(a) => setAnswers({ ...answers, ...a })}
                  onNext={handleStep1Next}
                  loading={loading}
                />
              )}
              {step === 2 && (
                <StepIdentity
                  answers={answers}
                  onChange={(a) => setAnswers({ ...answers, ...a })}
                  onNext={handleStep2Next}
                  onBack={handleBack}
                  loading={loading}
                />
              )}
              {step === 3 && (
                <StepExperience
                  answers={answers}
                  onChange={(a) => setAnswers({ ...answers, ...a })}
                  onNext={handleStep3Next}
                  onBack={handleBack}
                  loading={loading}
                />
              )}
              {step === 4 && (
                <StepLegalDocs
                  answers={answers}
                  onChange={(a) => setAnswers({ ...answers, ...a })}
                  onNext={handleStep4Next}
                  onBack={handleBack}
                  loading={loading}
                />
              )}
              {step === 5 && (
                <StepMotivation
                  answers={answers}
                  hasJobOrPost={hasJobOrPost}
                  onChange={(a) => setAnswers({ ...answers, ...a })}
                  onNext={handleStep5Next}
                  onBack={handleBack}
                  loading={loading}
                />
              )}
              {step === 6 && (
                <div className="mt-6 space-y-6">
                  {loading ? (
                    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-6">
                      {COVER_LETTER_STEP_6.loadingPhases.map((phase, i) => (
                        <p key={i} className="text-sm font-medium text-slate-700">
                          {phase}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Özet kontrol listesi</p>
                        <ul className="space-y-1 text-sm text-slate-700">
                          <li>{COVER_LETTER_STEP_6.summaryLabels.full_name}: {(answers.full_name as string)?.trim() ? "✅" : "—"}</li>
                          <li>{COVER_LETTER_STEP_6.summaryLabels.email}: {(answers.email as string)?.trim() ? "✅" : "—"}</li>
                          <li>{COVER_LETTER_STEP_6.summaryLabels.role}: {(answers.role as string)?.trim() ? "✅" : "—"}</li>
                          <li>{COVER_LETTER_STEP_6.summaryLabels.experience}: {answers.total_experience_years != null ? "✅" : "—"}</li>
                          <li>{COVER_LETTER_STEP_6.summaryLabels.skills}: {(answers.top_skills as string[])?.length >= 2 ? "✅" : "—"}</li>
                          <li>{COVER_LETTER_STEP_6.summaryLabels.passport}: {answers.passport_status ? "✅" : "—"}</li>
                          <li>{COVER_LETTER_STEP_6.summaryLabels.work_permit}: {answers.work_permit_status ? "✅" : "—"}</li>
                          <li>{COVER_LETTER_STEP_6.summaryLabels.motivation}: {(answers.motivation as string)?.trim() ? "✅" : "—"}</li>
                        </ul>
                      </div>
                      <StickyActions>
                        <div className="flex w-full gap-3">
                          <button
                            type="button"
                            onClick={handleBack}
                            disabled={loading}
                            className="h-14 flex-1 rounded-2xl border-2 border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          >
                            {COVER_LETTER_WIZARD_HEADING.buttonBack}
                          </button>
                          <button
                            type="button"
                            onClick={handleStep6Submit}
                            disabled={loading}
                            className="h-14 flex-1 rounded-2xl bg-slate-900 text-base font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                          >
                            {COVER_LETTER_STEP_6.buttonGeneric}
                          </button>
                        </div>
                      </StickyActions>
                      <button
                        type="button"
                        onClick={onClose}
                        className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                      >
                        İptal
                      </button>
                    </>
                  )}
                </div>
              )}

              {step < 6 && !loading && (
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-6 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  İptal
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-slate-200/70" aria-hidden onClick={onClose} />
      {body}
    </div>,
    document.body
  );
}
