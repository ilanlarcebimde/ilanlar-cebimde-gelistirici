"use client";

import { useCallback, useState } from "react";
import { X } from "lucide-react";
import type { CoverLetterAnswers } from "../lib/coverLetterSchema";
import { COVER_LETTER_STEP_3 } from "@/components/apply/coverLetterWizardContent";
import { ExampleBlock } from "../ui/ExampleBlock";
import { HintCard } from "../ui/HintCard";
import { StickyActions } from "../ui/StickyActions";

const MAX_SKILLS = 5;
const MIN_SKILLS = 2;

function SkillsChipInput({
  skills,
  onChange,
}: {
  skills: string[];
  onChange: (list: string[]) => void;
}) {
  const [input, setInput] = useState("");
  const add = useCallback(() => {
    const raw = input.trim().split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
    for (const t of raw) {
      if (skills.length >= MAX_SKILLS) break;
      if (!skills.includes(t)) skills = [...skills, t];
    }
    onChange(skills);
    setInput("");
  }, [input, skills, onChange]);

  const remove = useCallback((i: number) => onChange(skills.filter((_, j) => j !== i)), [skills, onChange]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    }
    if (e.key === "Backspace" && !input && skills.length > 0) {
      onChange(skills.slice(0, -1));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Beceri yazıp Enter veya virgül ile ekleyin"
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
        />
        <button
          type="button"
          onClick={add}
          disabled={skills.length >= MAX_SKILLS || !input.trim()}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Ekle
        </button>
      </div>
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {skills.map((s, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-800"
            >
              {s}
              <button
                type="button"
                onClick={() => remove(i)}
                className="rounded-full p-0.5 hover:bg-slate-200"
                aria-label="Kaldır"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      <p className="text-xs text-slate-500">{skills.length} / {MAX_SKILLS}</p>
    </div>
  );
}

export interface StepExperienceProps {
  answers: CoverLetterAnswers;
  onChange: (answers: Partial<CoverLetterAnswers>) => void;
  onNext: () => void;
  loading: boolean;
}

export function StepExperience({ answers, onChange, onNext, loading }: StepExperienceProps) {
  const skills = answers.top_skills ?? [];
  const hasContent = answers.total_experience_years != null || skills.length > 0 || (answers.last_company ?? "").trim() !== "";
  const canNext =
    answers.total_experience_years != null &&
    skills.length >= MIN_SKILLS;

  return (
    <div className="mt-6 space-y-6">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">{COVER_LETTER_STEP_3.fields.total_experience_years}</label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={answers.total_experience_years ?? ""}
            onChange={(e) =>
              onChange({
                total_experience_years: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            placeholder="6"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">{COVER_LETTER_STEP_3.fields.position_experience_years}</label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={answers.relevant_experience_years ?? ""}
            onChange={(e) =>
              onChange({
                relevant_experience_years: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            placeholder="3"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">{COVER_LETTER_STEP_3.fields.last_company}</label>
          <input
            type="text"
            value={answers.last_company ?? ""}
            onChange={(e) => onChange({ last_company: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            placeholder="Son çalıştığınız firma"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">{COVER_LETTER_STEP_3.fields.top_skills}</label>
          <SkillsChipInput
            skills={skills}
            onChange={(list) => onChange({ top_skills: list })}
          />
        </div>
      </div>

      <ExampleBlock muted={hasContent}>{COVER_LETTER_STEP_3.example}</ExampleBlock>
      <HintCard variant="amber">{COVER_LETTER_STEP_3.bodyHint}</HintCard>

      <StickyActions>
        <button
          type="button"
          onClick={onNext}
          disabled={loading || !canNext}
          title={!canNext ? "Toplam deneyim ve en az 2 beceri gerekli" : undefined}
          className="h-12 w-full rounded-2xl bg-slate-900 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? "Gönderiliyor…" : COVER_LETTER_STEP_3.button}
        </button>
      </StickyActions>
    </div>
  );
}
