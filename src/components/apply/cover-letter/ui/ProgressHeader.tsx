"use client";

import { X } from "lucide-react";
import { COVER_LETTER_WIZARD_HEADING } from "@/components/apply/coverLetterWizardContent";

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

export interface ProgressHeaderProps {
  currentStep: WizardStep;
  onClose: () => void;
  /** Fade effect when step changes */
  stepKey?: number;
}

export function ProgressHeader({ currentStep, onClose, stepKey = 0 }: ProgressHeaderProps) {
  return (
    <header className="relative">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-0 top-0 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        aria-label="Kapat"
      >
        <X className="h-5 w-5" />
      </button>
      <h2
        key={stepKey}
        className="pr-10 text-xl font-bold tracking-tight text-slate-900 transition-opacity duration-200 md:text-2xl"
      >
        {COVER_LETTER_WIZARD_HEADING.title}
      </h2>
      <p className="mt-1 text-sm text-slate-500">{COVER_LETTER_WIZARD_HEADING.subtitle}</p>

      <div className="mt-6 flex items-center gap-1">
        {([1, 2, 3, 4, 5, 6] as const).map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              s <= currentStep ? "bg-slate-800" : "bg-slate-200"
            }`}
          />
        ))}
      </div>
      <p className="mt-2 text-xs font-medium text-slate-500">
        {currentStep} / 6
      </p>
    </header>
  );
}
