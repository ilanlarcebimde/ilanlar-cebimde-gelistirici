"use client";

import { useCallback, useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import type { WizardMethod } from "./WizardTypes";
import { getAnswerBySaveKey } from "@/data/cvQuestions";
import { VoiceWizard } from "./VoiceWizard";
import { ChatWizard } from "./ChatWizard";
import { FormWizard } from "./FormWizard";
import { CompletionSummary } from "./CompletionSummary";

export interface WizardState {
  method: WizardMethod;
  answers: Record<string, unknown>;
  country: string;
  jobArea: string;
  jobBranch: string;
  photoUrl: string | null;
  photoFile: File | null;
}

const DEFAULT_STATE: WizardState = {
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
}: {
  selectedMethod: WizardMethod | null;
  onPaymentClick: (payload: { email: string; user_name?: string }) => void;
}) {
  const [state, setState] = useState<WizardState>({ ...DEFAULT_STATE, method: selectedMethod ?? "form" });
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!selectedMethod) return;
    setState((s) => (s.method === selectedMethod ? s : { ...DEFAULT_STATE, method: selectedMethod }));
    setCompleted(false);
  }, [selectedMethod]);

  const setAnswers = useCallback((answers: Record<string, unknown>) => {
    setState((s) => ({ ...s, answers }));
  }, []);
  const setCountry = useCallback((country: string) => setState((s) => ({ ...s, country })), []);
  const setJobArea = useCallback((jobArea: string) => setState((s) => ({ ...s, jobArea })), []);
  const setJobBranch = useCallback((jobBranch: string) => setState((s) => ({ ...s, jobBranch })), []);
  const setPhoto = useCallback((file: File) => {
    setState((s) => ({ ...s, photoFile: file, photoUrl: null }));
  }, []);
  const clearPhoto = useCallback(() => {
    setState((s) => ({ ...s, photoFile: null, photoUrl: null }));
  }, []);

  const handleComplete = useCallback(() => setCompleted(true), []);

  if (!selectedMethod) {
    return (
      <section className="py-12 bg-slate-50/50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center text-slate-500">
          <p>Yukarıdan bir yöntem seçin: Sesli Asistan, Sohbet veya Form.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 bg-slate-50/50">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
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
              onPhotoClear={clearPhoto}
              onComplete={handleComplete}
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
              onPhotoClear={clearPhoto}
              onComplete={handleComplete}
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
              onPhotoClear={clearPhoto}
              onComplete={handleComplete}
            />
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
