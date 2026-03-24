"use client";

import { X } from "lucide-react";
import { COVER_LETTER_WIZARD_HEADING } from "@/components/apply/coverLetterWizardContent";

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

export interface ProgressHeaderProps {
  currentStep: WizardStep;
  onClose: () => void;
  /** Fade effect when step changes */
  stepKey?: number;
  /** Dinamik alt başlık: job/post varsa ilana göre, yoksa verdiğiniz bilgilere göre */
  subtitle?: string;
  /** Sayfa içi gömülü sihirbazda kapatma gizlenebilir */
  hideCloseButton?: boolean;
}

export function ProgressHeader({ currentStep, onClose, stepKey = 0, subtitle, hideCloseButton }: ProgressHeaderProps) {
  const subtext = subtitle ?? COVER_LETTER_WIZARD_HEADING.subtitle;
  return (
    <header className="relative">
      {!hideCloseButton ? (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-0 top-0 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Kapat"
        >
          <X className="h-5 w-5" />
        </button>
      ) : null}
      <h2
        key={stepKey}
        className={`${hideCloseButton ? "" : "pr-10"} text-xl font-bold tracking-tight text-slate-900 transition-opacity duration-200 md:text-2xl`}
      >
        {COVER_LETTER_WIZARD_HEADING.title}
      </h2>
      {subtext ? <p className="mt-1 text-sm text-slate-500">{subtext}</p> : null}

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
        Adım {currentStep} / 6
      </p>
    </header>
  );
}
