"use client";

import { STEP_TITLES, VISA_WIZARD_STEPS } from "./defaults";
import type { VisaWizardStep } from "./types";

interface WizardProgressProps {
  step: VisaWizardStep;
}

export function WizardProgress({ step }: WizardProgressProps) {
  const stepIndex = VISA_WIZARD_STEPS.indexOf(step);
  const progress = ((stepIndex + 1) / VISA_WIZARD_STEPS.length) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Akıllı Başvuru Sihirbazı</p>
          <h2 className="text-lg font-semibold text-slate-900">
            Adım {stepIndex + 1} / {VISA_WIZARD_STEPS.length} - {STEP_TITLES[step]}
          </h2>
        </div>
        <span className="text-xs text-slate-500">%{Math.round(progress)} tamamlandı</span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {VISA_WIZARD_STEPS.map((item, index) => (
          <span
            key={item}
            className={`rounded-full border px-2 py-0.5 text-[11px] ${
              index === stepIndex
                ? "border-sky-300 bg-sky-50 text-sky-700"
                : index < stepIndex
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-500"
            }`}
          >
            {index + 1}
          </span>
        ))}
      </div>
    </div>
  );
}
