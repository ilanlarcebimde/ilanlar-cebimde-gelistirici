"use client";

import type { Mode } from "../lib/coverLetterSchema";
import { COVER_LETTER_STEP_1 } from "@/components/apply/coverLetterWizardContent";
import { HintCard } from "../ui/HintCard";
import { StickyActions } from "../ui/StickyActions";

export interface StepJobConfirmProps {
  companyName: string;
  position: string;
  location: string;
  mode: Mode | undefined;
  onModeChange: (mode: Mode) => void;
  onNext: () => void;
  loading: boolean;
}

export function StepJobConfirm({
  companyName,
  position,
  location,
  mode,
  onModeChange,
  onNext,
  loading,
}: StepJobConfirmProps) {
  const canNext = mode === "job_specific" || mode === "generic";
  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Şirket</p>
        <p className="mt-1 text-lg font-semibold text-slate-900">{companyName}</p>
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">Pozisyon</p>
        <p className="mt-1 text-lg font-semibold text-slate-900">{position}</p>
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">Ülke / Şehir</p>
        <p className="mt-1 text-slate-800">{location}</p>
      </div>

      <p className="text-lg font-medium text-slate-800">{COVER_LETTER_STEP_1.question}</p>

      <div className="flex flex-col gap-2">
        {COVER_LETTER_STEP_1.options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onModeChange(opt.value)}
            className={`relative rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-colors ${
              mode === opt.value
                ? "border-slate-800 bg-slate-50 text-slate-900"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            {opt.label}
            {"badge" in opt && opt.badge && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-slate-800 px-2 py-0.5 text-xs font-medium text-white">
                {opt.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <HintCard>{COVER_LETTER_STEP_1.hint}</HintCard>

      <StickyActions>
        <button
          type="button"
          onClick={onNext}
          disabled={loading || !canNext}
          title={!canNext ? COVER_LETTER_STEP_1.disabledTooltip : undefined}
          className="h-12 w-full rounded-2xl bg-slate-900 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? "Gönderiliyor…" : COVER_LETTER_STEP_1.button}
        </button>
      </StickyActions>
    </div>
  );
}
