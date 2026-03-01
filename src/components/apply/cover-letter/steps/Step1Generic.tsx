"use client";

import type { CoverLetterAnswers } from "../lib/coverLetterSchema";
import { COVER_LETTER_STEP_1_GENERIC } from "@/components/apply/coverLetterWizardContent";
import { HintCard } from "../ui/HintCard";
import { ExampleBlock } from "../ui/ExampleBlock";
import { StickyActions } from "../ui/StickyActions";

export interface Step1GenericProps {
  answers: CoverLetterAnswers;
  onChange: (answers: Partial<CoverLetterAnswers>) => void;
  onNext: () => void;
  onBack?: () => void;
  loading: boolean;
}

export function Step1Generic({ answers, onChange, onNext, loading }: Step1GenericProps) {
  const role = (answers.role ?? "").trim();
  const canNext = role.length > 0;

  return (
    <div className="mt-6 space-y-6">
      <p className="text-sm text-slate-600">{COVER_LETTER_STEP_1_GENERIC.question}</p>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {COVER_LETTER_STEP_1_GENERIC.roleLabel}
          </label>
          <input
            type="text"
            value={answers.role ?? ""}
            onChange={(e) => onChange({ role: e.target.value })}
            placeholder={COVER_LETTER_STEP_1_GENERIC.rolePlaceholder}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {COVER_LETTER_STEP_1_GENERIC.workAreaLabel}
          </label>
          <input
            type="text"
            value={answers.work_area ?? ""}
            onChange={(e) => onChange({ work_area: e.target.value })}
            placeholder={COVER_LETTER_STEP_1_GENERIC.workAreaPlaceholder}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          />
        </div>
      </div>

      <ExampleBlock muted={!!role}>{COVER_LETTER_STEP_1_GENERIC.example}</ExampleBlock>
      <HintCard>{COVER_LETTER_STEP_1_GENERIC.hint}</HintCard>

      <StickyActions>
        <button
          type="button"
          onClick={onNext}
          disabled={loading || !canNext}
          title={!canNext ? COVER_LETTER_STEP_1_GENERIC.disabledTooltip : undefined}
          className="h-12 w-full rounded-2xl bg-slate-900 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? "Gönderiliyor…" : COVER_LETTER_STEP_1_GENERIC.button}
        </button>
        {!canNext && !loading && (
          <p className="text-center text-xs text-slate-500">{COVER_LETTER_STEP_1_GENERIC.disabledTooltip}</p>
        )}
      </StickyActions>
    </div>
  );
}
