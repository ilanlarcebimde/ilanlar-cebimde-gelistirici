"use client";

import { useCallback, useState, useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import type { WizardMethod } from "./WizardTypes";
import { getAnswerBySaveKey } from "@/data/cvQuestions";
import { useAutosave } from "@/hooks/useAutosave";
import { logEvent } from "@/lib/profileSave";
import { VoiceWizard } from "./VoiceWizard";
import { ChatWizard } from "./ChatWizard";
import { FormWizard } from "./FormWizard";
import { CompletionSummary } from "./CompletionSummary";

export interface WizardState {
  profileId: string | null;
  method: WizardMethod;
  answers: Record<string, unknown>;
  country: string;
  jobArea: string;
  jobBranch: string;
  photoUrl: string | null;
  photoFile: File | null;
}

const DEFAULT_STATE: WizardState = {
  profileId: null,
  method: "form",
  answers: {},
  country: "",
  jobArea: "",
  jobBranch: "",
  photoUrl: null,
  photoFile: null,
};

function getEmailFromAnswers(answers: Record<string, unknown>): string {
  return getAnswerBySaveKey(answers, "personal.email") || "";
}

function getUserNameFromAnswers(answers: Record<string, unknown>): string {
  return getAnswerBySaveKey(answers, "personal.fullName") || "";
}

export function WizardArea({
  selectedMethod,
  onPaymentClick,
  userId,
}: {
  selectedMethod: WizardMethod | null;
  onPaymentClick: (payload: { email: string; user_name?: string; method: "form" | "voice" | "chat"; country: string; job_area: string; job_branch: string; answers: Record<string, unknown>; photo_url: string | null }) => void;
  userId?: string;
}) {
  const [state, setState] = useState<WizardState>({ ...DEFAULT_STATE, method: selectedMethod ?? "form" });
  const [completed, setCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const profileIdRef = useRef<string | null>(null);
  profileIdRef.current = state.profileId;

  useEffect(() => {
    if (!selectedMethod) return;
    setState((s) => (s.method === selectedMethod ? s : { ...DEFAULT_STATE, method: selectedMethod }));
    setCompleted(false);
    setCompleteError(null);
  }, [selectedMethod]);

  const { saveNow } = useAutosave(
    {
      profileId: state.profileId,
      method: selectedMethod,
      status: "draft",
      answers: state.answers,
      country: state.country,
      job_area: state.jobArea,
      job_branch: state.jobBranch,
      photo_url: state.photoUrl,
    },
    useCallback((id: string) => setState((s) => ({ ...s, profileId: id })), [])
  );

  const setAnswers = useCallback((answers: Record<string, unknown>) => {
    setState((s) => ({ ...s, answers }));
  }, []);
  const setCountry = useCallback((country: string) => setState((s) => ({ ...s, country })), []);
  const setJobArea = useCallback((jobArea: string) => setState((s) => ({ ...s, jobArea })), []);
  const setJobBranch = useCallback((jobBranch: string) => setState((s) => ({ ...s, jobBranch })), []);
  const setPhoto = useCallback((file: File) => {
    setState((s) => ({ ...s, photoFile: file, photoUrl: null }));
  }, []);
  const setPhotoUploaded = useCallback((file: File, url: string) => {
    setState((s) => ({ ...s, photoFile: file, photoUrl: url }));
    const pid = profileIdRef.current;
    if (pid) logEvent("photo_uploaded", pid, { photo_url: url });
  }, []);
  const clearPhoto = useCallback(() => {
    setState((s) => ({ ...s, photoFile: null, photoUrl: null }));
  }, []);

  const handleComplete = useCallback(async () => {
    setCompleteError(null);
    const email = getEmailFromAnswers(state.answers)?.trim();
    if (!email) {
      setCompleteError("Lütfen e-posta adresinizi girin.");
      return;
    }
    setSaving(true);
    try {
      // Tamamla'da güncel state'i açıkça gönder; closure ile null/boş gitmesin
      const id = await saveNow({
        profileId: state.profileId,
        method: selectedMethod ?? "form",
        status: "draft",
        answers: state.answers,
        country: state.country,
        job_area: state.jobArea,
        job_branch: state.jobBranch,
        photo_url: state.photoUrl,
      });
      if (id) setState((s) => ({ ...s, profileId: id }));
      setCompleted(true);
    } finally {
      setSaving(false);
    }
  }, [state.profileId, state.answers, state.country, state.jobArea, state.jobBranch, state.photoUrl, selectedMethod, saveNow]);

  if (!selectedMethod) {
    return (
      <section className="py-12 bg-slate-50/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center text-slate-500">
          <p>Yöntem seçmek için yukarıdaki &quot;CV Bilgilerini Nasıl Alacağız? — Yöntem seçin&quot; butonuna tıklayın.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex-1 flex flex-col min-h-0 overflow-y-auto py-4 sm:py-12 bg-slate-50/50">
      {completeError && (
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 mb-4 p-4 rounded-xl bg-red-50 text-red-700 text-sm">
          {completeError}
        </div>
      )}
      <div className="flex-1 flex flex-col min-h-0 mx-auto w-full max-w-3xl px-4 sm:px-6">
        <AnimatePresence mode="wait">
          {completed ? (
            <CompletionSummary
              key="summary"
              country={state.country}
              jobArea={state.jobArea}
              jobBranch={state.jobBranch}
              hasPhoto={!!(state.photoUrl || state.photoFile)}
              email={getEmailFromAnswers(state.answers)}
              user_name={getUserNameFromAnswers(state.answers)}
              method={state.method}
              answers={state.answers}
              photoUrl={state.photoUrl}
              onPaymentClick={onPaymentClick}
            />
          ) : state.method === "voice" ? (
            <VoiceWizard
              key="voice"
              answers={state.answers}
              country={state.country}
              jobArea={state.jobArea}
              jobBranch={state.jobBranch}
              photoUrl={state.photoUrl}
              photoFile={state.photoFile}
              onAnswersChange={setAnswers}
              onCountryChange={setCountry}
              onJobAreaChange={setJobArea}
              onJobBranchChange={setJobBranch}
              onPhotoChange={setPhoto}
              onPhotoUploaded={setPhotoUploaded}
              onPhotoClear={clearPhoto}
              onComplete={handleComplete}
              isCompleting={saving}
              userId={userId}
            />
          ) : state.method === "chat" ? (
            <ChatWizard
              key="chat"
              answers={state.answers}
              country={state.country}
              jobArea={state.jobArea}
              jobBranch={state.jobBranch}
              photoUrl={state.photoUrl}
              photoFile={state.photoFile}
              onAnswersChange={setAnswers}
              onCountryChange={setCountry}
              onJobAreaChange={setJobArea}
              onJobBranchChange={setJobBranch}
              onPhotoChange={setPhoto}
              onPhotoUploaded={setPhotoUploaded}
              onPhotoClear={clearPhoto}
              onComplete={handleComplete}
              isCompleting={saving}
              userId={userId}
            />
          ) : (
            <FormWizard
              key="form"
              answers={state.answers}
              country={state.country}
              jobArea={state.jobArea}
              jobBranch={state.jobBranch}
              photoUrl={state.photoUrl}
              photoFile={state.photoFile}
              onAnswersChange={setAnswers}
              onCountryChange={setCountry}
              onJobAreaChange={setJobArea}
              onJobBranchChange={setJobBranch}
              onPhotoChange={setPhoto}
              onPhotoUploaded={setPhotoUploaded}
              onPhotoClear={clearPhoto}
              onComplete={handleComplete}
              isCompleting={saving}
              userId={userId}
            />
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
