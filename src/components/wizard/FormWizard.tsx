"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { COUNTRIES } from "@/data/countries";
import { PROFESSION_AREAS } from "@/data/professions";
import {
  getQuestionsFor,
  setAnswerBySaveKey,
  getAnswerBySaveKey,
} from "@/data/cvQuestions";
import { PhotoUpload } from "./PhotoUpload";

const QUESTIONS = getQuestionsFor("form");

type Phase = "questions" | "countryJob" | "photo";

export function FormWizard({
  answers,
  country,
  jobArea,
  jobBranch,
  photoUrl,
  photoFile,
  onAnswersChange,
  onCountryChange,
  onJobAreaChange,
  onJobBranchChange,
  onPhotoChange,
  onPhotoUploaded,
  onPhotoClear,
  onComplete,
  userId,
}: {
  answers: Record<string, unknown>;
  country: string;
  jobArea: string;
  jobBranch: string;
  photoUrl: string | null;
  photoFile: File | null;
  onAnswersChange: (a: Record<string, unknown>) => void;
  onCountryChange: (c: string) => void;
  onJobAreaChange: (a: string) => void;
  onJobBranchChange: (b: string) => void;
  onPhotoChange: (f: File) => void;
  onPhotoUploaded?: (file: File, url: string) => void;
  onPhotoClear: () => void;
  userId?: string;
  onComplete: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("questions");
  const [step, setStep] = useState(0);

  const currentQ = QUESTIONS[step];
  const value = currentQ ? getAnswerBySaveKey(answers, currentQ.saveKey) : "";

  const setValue = (v: string) => {
    if (!currentQ) return;
    onAnswersChange(setAnswerBySaveKey(answers, currentQ.saveKey, v));
  };

  const goNext = () => {
    if (phase === "questions") {
      if (step < QUESTIONS.length - 1) setStep((s) => s + 1);
      else setPhase("countryJob");
    } else if (phase === "countryJob") {
      setPhase("photo");
    } else {
      onComplete();
    }
  };

  const goBack = () => {
    if (phase === "photo") setPhase("countryJob");
    else if (phase === "countryJob") setPhase("questions"), setStep(QUESTIONS.length - 1);
    else if (step > 0) setStep((s) => s - 1);
  };

  const canNext = () => {
    if (phase === "questions" && currentQ?.required) {
      return value.trim().length > 0;
    }
    if (phase === "countryJob") return country && jobBranch;
    return true;
  };

  return (
    <div className="space-y-6">
      {/* Progress: Soru X / 26 */}
      {phase === "questions" && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Soru {step + 1} / {QUESTIONS.length}</span>
          <div className="h-2 flex-1 max-w-[200px] ml-4 rounded-full bg-slate-200 overflow-hidden">
            <motion.div
              className="h-full bg-slate-700 rounded-full"
              initial={false}
              animate={{ width: `${QUESTIONS.length > 0 ? ((step + 1) / QUESTIONS.length) * 100 : 0}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase === "questions" && currentQ && (
          <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft"
          >
            <label className="block text-lg font-medium text-slate-900 mb-4">
              {currentQ.question}
            </label>
            {currentQ.hint && (
              <p className="text-sm text-slate-500 mb-3">{currentQ.hint}</p>
            )}
            {currentQ.type === "multiline" ? (
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={currentQ.examples[0] || "Yanıtınızı yazın..."}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 placeholder:text-slate-400 min-h-[100px]"
                rows={4}
              />
            ) : (
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={currentQ.examples[0] || ""}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 placeholder:text-slate-400"
              />
            )}
            {currentQ.examples.length > 0 && currentQ.type !== "multiline" && (
              <div className="flex flex-wrap gap-2 mt-3">
                {currentQ.examples.map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => setValue(ex)}
                    className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {phase === "countryJob" && (
          <motion.div
            key="countryJob"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft"
          >
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Hedef ülke ve meslek</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ülke</label>
                <select
                  value={country}
                  onChange={(e) => onCountryChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
                >
                  <option value="">Seçin</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Meslek alanı</label>
                <select
                  value={jobArea}
                  onChange={(e) => {
                    onJobAreaChange(e.target.value);
                    onJobBranchChange("");
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
                >
                  <option value="">Seçin</option>
                  {PROFESSION_AREAS.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              {jobArea && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Meslek dalı</label>
                  <select
                    value={jobBranch}
                    onChange={(e) => onJobBranchChange(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
                  >
                    <option value="">Seçin</option>
                    {PROFESSION_AREAS.find((a) => a.id === jobArea)?.branches.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    )) ?? []}
                  </select>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {phase === "photo" && (
          <motion.div
            key="photo"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <p className="text-slate-600">
              Son olarak, CV’niz için profesyonel bir fotoğraf yüklemek ister misiniz?
            </p>
            <PhotoUpload
              photoUrl={photoUrl}
              photoFile={photoFile}
              onPhotoChange={onPhotoChange}
              onPhotoUploaded={onPhotoUploaded}
              onClear={onPhotoClear}
              userId={userId}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between gap-4">
        <button
          type="button"
          onClick={goBack}
          disabled={(phase === "questions" && step === 0)}
          className="rounded-xl border border-slate-300 px-6 py-3 text-slate-700 font-medium disabled:opacity-50"
        >
          Geri
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={phase === "questions" && currentQ?.required ? !value?.trim() : phase === "countryJob" ? !country || !jobBranch : false}
          className="rounded-xl bg-slate-800 px-6 py-3 text-white font-medium disabled:opacity-50"
        >
          {phase === "questions" && step < QUESTIONS.length - 1
            ? "İleri"
            : phase === "questions"
            ? "Devam et"
            : phase === "countryJob"
            ? "Devam et — Fotoğraf"
            : "Tamamla"}
        </button>
      </div>
    </div>
  );
}
