"use client";

import { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { STEP_TITLES, VISA_DEFAULT_VALUES, VISA_DRAFT_STORAGE_KEY, VISA_WIZARD_STEPS } from "./defaults";
import { visaLeadSchema, type VisaLeadFormValues } from "./schema";
import type { LeadSubmitResponse, VisaWizardFileState, VisaWizardStep } from "./types";
import { WizardProgress } from "./WizardProgress";
import { StepVisaType } from "./StepVisaType";
import { StepTargetInfo } from "./StepTargetInfo";
import { StepPersonalInfo } from "./StepPersonalInfo";
import { StepDynamicQuestions } from "./StepDynamicQuestions";
import { StepEligibility } from "./StepEligibility";
import { StepFileUpload } from "./StepFileUpload";
import { StepReview } from "./StepReview";

const INITIAL_FILES: VisaWizardFileState = {
  passportOrId: null,
  cv: null,
  diploma: null,
  refusalLetter: null,
  invitationOrOffer: null,
  extras: [],
};

function getFileCount(files: VisaWizardFileState) {
  return [files.passportOrId, files.cv, files.diploma, files.refusalLetter, files.invitationOrOffer].filter(Boolean).length + files.extras.length;
}

function getVisaTypeLabel(visaType: VisaLeadFormValues["visaType"]) {
  const map: Record<VisaLeadFormValues["visaType"], string> = {
    work: "Çalışma Vizesi",
    tourist: "Turistik Vize",
    family: "Aile Birleşimi",
    student: "Öğrenci Vizesi",
    unsure: "Emin Değilim",
  };
  return map[visaType];
}

function getContactChannelLabel(channel: VisaLeadFormValues["preferredContactChannel"]) {
  const map: Record<VisaLeadFormValues["preferredContactChannel"], string> = {
    whatsapp: "WhatsApp",
    phone: "Telefon",
    email: "E-posta",
  };
  return map[channel];
}

function getStatusCard(leadStatus: LeadSubmitResponse["leadStatus"]) {
  if (leadStatus === "hot") {
    return {
      title: "🔥 Öncelikli İnceleme",
      description:
        "Başvurunuz güçlü eşleşme olarak değerlendirildi ve danışman ataması için öncelikli sıraya alındı.",
      tone: "border-emerald-200 bg-emerald-50 text-emerald-800",
      level: "Öncelikli",
    };
  }

  if (leadStatus === "warm") {
    return {
      title: "🟡 İnceleme Sürecinde",
      description:
        "Başvurunuz alınmıştır. Belgeleriniz incelendikten sonra uygun danışmanlık ekibine yönlendirilecektir.",
      tone: "border-amber-200 bg-amber-50 text-amber-800",
      level: "Güçlü",
    };
  }

  return {
    title: "ℹ️ Ek Değerlendirme Gerekebilir",
    description:
      "Başvurunuz alınmıştır. Gerekli görülmesi halinde sizden ek bilgi veya belge istenebilir.",
    tone: "border-sky-200 bg-sky-50 text-sky-800",
    level: "İnceleme",
  };
}

function getStepFields(step: VisaWizardStep, values: VisaLeadFormValues): Array<keyof VisaLeadFormValues> {
  if (step === "visaType") return ["visaType"];
  if (step === "target") return ["targetCountry", "applicationGoal", "applicationTimeline"];
  if (step === "personal") return ["fullName", "phone", "email", "city", "nationality"];
  if (step === "eligibility") return ["passportStatus", "preferredContactChannel"];
  if (step === "support") return ["supportNeed", "consultantNoteForCall"];
  if (step === "consent") return ["consentDataShare", "consentContact", "consentAccuracy"];

  if (step === "dynamic") {
    if (values.visaType === "work") return ["profession", "experienceYears", "languageLevel"];
    if (values.visaType === "tourist") return ["travelDuration"];
    if (values.visaType === "family") return ["familyRelation", "spouseCountry"];
    if (values.visaType === "student") return ["schoolProgram", "educationBudget"];
    return ["unsureReason"];
  }

  return [];
}

export function VisaWizard() {
  const [step, setStep] = useState<VisaWizardStep>("visaType");
  const [files, setFiles] = useState<VisaWizardFileState>(INITIAL_FILES);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    lead: LeadSubmitResponse;
    summary: Pick<VisaLeadFormValues, "visaType" | "targetCountry" | "preferredContactChannel">;
    fileCount: number;
  } | null>(null);

  const methods = useForm<VisaLeadFormValues>({
    defaultValues: VISA_DEFAULT_VALUES,
    mode: "onTouched",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(VISA_DRAFT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<VisaLeadFormValues>;
      methods.reset({ ...VISA_DEFAULT_VALUES, ...parsed });
    } catch {
      // ignore
    }
  }, [methods]);

  useEffect(() => {
    const sub = methods.watch((value) => {
      if (typeof window === "undefined") return;
      try {
        window.localStorage.setItem(VISA_DRAFT_STORAGE_KEY, JSON.stringify(value));
      } catch {
        // ignore
      }
    });
    return () => sub.unsubscribe();
  }, [methods]);

  const stepIndex = VISA_WIZARD_STEPS.indexOf(step);
  const isLast = stepIndex === VISA_WIZARD_STEPS.length - 1;
  const fileCount = useMemo(() => getFileCount(files), [files]);

  const nextStep = async () => {
    setApiError(null);
    const currentValues = methods.getValues();
    const fields = getStepFields(step, currentValues);
    const valid = fields.length ? await methods.trigger(fields) : true;
    if (!valid) return;

    if (step === "files" && fileCount < 1) {
      setFileError("En az 1 dosya yüklemeniz gerekiyor.");
      return;
    }
    setFileError(null);

    if (stepIndex < VISA_WIZARD_STEPS.length - 1) {
      setStep(VISA_WIZARD_STEPS[stepIndex + 1]);
    }
  };

  const prevStep = () => {
    setApiError(null);
    setFileError(null);
    if (stepIndex > 0) setStep(VISA_WIZARD_STEPS[stepIndex - 1]);
  };

  const onSubmit = methods.handleSubmit(async (values) => {
    setApiError(null);
    if (fileCount < 1) {
      setStep("files");
      setFileError("En az 1 dosya yüklemeniz gerekiyor.");
      return;
    }

    const parsed = visaLeadSchema.safeParse(values);
    if (!parsed.success) {
      setApiError("Lütfen zorunlu alanları kontrol edin.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("payload", JSON.stringify(parsed.data));

      if (files.passportOrId) formData.append("passportOrId", files.passportOrId);
      if (files.cv) formData.append("cv", files.cv);
      if (files.diploma) formData.append("diploma", files.diploma);
      if (files.refusalLetter) formData.append("refusalLetter", files.refusalLetter);
      if (files.invitationOrOffer) formData.append("invitationOrOffer", files.invitationOrOffer);
      files.extras.forEach((file) => formData.append("extras", file));

      const res = await fetch("/api/visa-leads/submit", { method: "POST", body: formData });
      if (!res.ok) {
        setApiError("Başvuru gönderilirken bir hata oluştu. Lütfen tekrar deneyin.");
        setSubmitting(false);
        return;
      }

      const json = (await res.json()) as LeadSubmitResponse;
      setSuccess({
        lead: json,
        summary: {
          visaType: parsed.data.visaType,
          targetCountry: parsed.data.targetCountry,
          preferredContactChannel: parsed.data.preferredContactChannel,
        },
        fileCount,
      });
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(VISA_DRAFT_STORAGE_KEY);
      }
    } catch {
      setApiError("Bağlantı hatası oluştu. Lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  });

  if (success) {
    const statusCard = getStatusCard(success.lead.leadStatus);
    return (
      <div className="mx-auto max-w-4xl space-y-4 rounded-2xl border border-emerald-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h3 className="text-2xl font-semibold text-slate-900">✅ Başvurunuz Başarıyla Alındı</h3>
          <p className="mt-3 text-sm text-slate-600">
            Bilgileriniz ve yüklediğiniz belgeler ön değerlendirmeye alınmıştır. Uygunluk durumunuza göre danışmanlık ekibi
            sizinle iletişime geçecektir.
          </p>
        </div>

        <div className={`rounded-xl border px-4 py-3 ${statusCard.tone}`}>
          <p className="text-sm font-semibold">{statusCard.title}</p>
          <p className="mt-1 text-sm">{statusCard.description}</p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <p className="text-xs text-slate-500">Başvuru Türü</p>
            <p className="font-medium">{getVisaTypeLabel(success.summary.visaType)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <p className="text-xs text-slate-500">Hedef Ülke</p>
            <p className="font-medium">{success.summary.targetCountry}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <p className="text-xs text-slate-500">Yüklenen Belge</p>
            <p className="font-medium">{success.fileCount}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <p className="text-xs text-slate-500">Dönüş Kanalı</p>
            <p className="font-medium">{getContactChannelLabel(success.summary.preferredContactChannel)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <p className="text-xs text-slate-500">Tahmini Dönüş</p>
            <p className="font-medium">24 Saat</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Şimdi Ne Olacak?</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Bilgileriniz ve dosyalarınız kontrol edilir.</li>
            <li>Uygunluk durumunuza göre danışmanlık eşleşmesi yapılır.</li>
            <li>Seçtiğiniz iletişim kanalı üzerinden size ulaşılır.</li>
          </ol>
          <p className="mt-3 text-xs text-slate-500">
            WhatsApp ve telefonunuzu ulaşılabilir durumda tutmanız önerilir.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          Uygunluk Düzeyi: <span className="font-semibold">{statusCard.level}</span>
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className="mx-auto max-w-5xl space-y-5">
        <WizardProgress step={step} />

        {step === "visaType" && <StepVisaType />}
        {step === "target" && <StepTargetInfo />}
        {step === "personal" && <StepPersonalInfo />}
        {step === "dynamic" && <StepDynamicQuestions />}
        {step === "eligibility" && <StepEligibility />}
        {step === "files" && <StepFileUpload files={files} onChange={setFiles} error={fileError} />}
        {step === "support" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Açık uçlu değerlendirme</h3>
            <div className="mt-4 space-y-4">
              <label className="block space-y-1 text-sm text-slate-700">
                <span>Bu süreçte en çok hangi konuda destek istiyorsunuz?</span>
                <textarea {...methods.register("supportNeed")} rows={4} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" />
              </label>
              <label className="block space-y-1 text-sm text-slate-700">
                <span>Danışman sizi aradığında özellikle hangi durumu bilsin?</span>
                <textarea {...methods.register("consultantNoteForCall")} rows={4} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" />
              </label>
            </div>
          </div>
        )}
        {step === "consent" && <StepReview uploadedFileCount={fileCount} />}

        {apiError && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{apiError}</p>}

        <div className="sticky bottom-3 z-10 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
          <button
            type="button"
            onClick={prevStep}
            disabled={stepIndex === 0 || submitting}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Geri
          </button>

          {isLast ? (
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Başvuruyu Gönder
            </button>
          ) : (
            <button
              type="button"
              onClick={nextStep}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
            >
              Devam Et
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}
