"use client";

import { useCallback, useState } from "react";
import { X } from "lucide-react";
import type { CoverLetterAnswers } from "../lib/coverLetterSchema";
import { COVER_LETTER_STEP_4 } from "@/components/apply/coverLetterWizardContent";
import { HintCard } from "../ui/HintCard";
import { StickyActions } from "../ui/StickyActions";

type PassportStatus = "var" | "yok" | "yenileniyor";
type VisaWorkPermitStatus = "var" | "yok" | "başvuracağım";
type Availability = "hemen" | "1ay" | "2ay";

function DocumentChips({
  documents,
  onChange,
  suggestions,
}: {
  documents: string[];
  onChange: (list: string[]) => void;
  suggestions: readonly string[];
}) {
  const [input, setInput] = useState("");
  const add = useCallback(() => {
    const t = input.trim();
    if (!t || documents.includes(t)) {
      setInput("");
      return;
    }
    onChange([...documents, t]);
    setInput("");
  }, [input, documents, onChange]);
  const addSuggestion = (s: string) => {
    if (!documents.includes(s)) onChange([...documents, s]);
  };
  const remove = (i: number) => onChange(documents.filter((_, j) => j !== i));

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="Sertifika adı"
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
        />
        <button
          type="button"
          onClick={add}
          disabled={!input.trim()}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Ekle
        </button>
      </div>
      <p className="text-xs text-slate-500">Öneriler:</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => addSuggestion(s)}
            disabled={documents.includes(s)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            + {s}
          </button>
        ))}
      </div>
      {documents.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {documents.map((d, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-800"
            >
              {d}
              <button type="button" onClick={() => remove(i)} className="rounded-full p-0.5 hover:bg-slate-200" aria-label="Kaldır">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export interface StepLegalDocsProps {
  answers: CoverLetterAnswers;
  onChange: (answers: Partial<CoverLetterAnswers>) => void;
  onNext: () => void;
  loading: boolean;
}

export function StepLegalDocs({ answers, onChange, onNext, loading }: StepLegalDocsProps) {
  const passport = answers.passport_status;
  const workPermit = answers.work_permit_status;
  const documents = answers.documents ?? [];
  const canNext = !!passport && !!workPermit;

  return (
    <div className="mt-6 space-y-6">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">{COVER_LETTER_STEP_4.passportLabel}</label>
          <select
            value={passport ?? ""}
            onChange={(e) => onChange({ passport_status: (e.target.value || undefined) as PassportStatus | undefined })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          >
            <option value="">Seçin</option>
            {COVER_LETTER_STEP_4.passportOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {passport === "yok" && (
            <p className="mt-1 text-xs text-amber-700">{COVER_LETTER_STEP_4.passportNoneWarning}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">{COVER_LETTER_STEP_4.workPermitLabel}</label>
          <select
            value={workPermit ?? ""}
            onChange={(e) => onChange({ work_permit_status: (e.target.value || undefined) as VisaWorkPermitStatus | undefined })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          >
            <option value="">Seçin</option>
            {COVER_LETTER_STEP_4.workPermitOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">{COVER_LETTER_STEP_4.visaLabel}</label>
          <select
            value={answers.visa_status ?? ""}
            onChange={(e) => onChange({ visa_status: (e.target.value || undefined) as VisaWorkPermitStatus | undefined })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          >
            <option value="">Seçin (opsiyonel)</option>
            {COVER_LETTER_STEP_4.visaOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">{COVER_LETTER_STEP_4.certificates}</label>
          <DocumentChips
            documents={documents}
            onChange={(list) => onChange({ documents: list })}
            suggestions={COVER_LETTER_STEP_4.certificateSuggestions}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">{COVER_LETTER_STEP_4.availabilityLabel}</label>
          <select
            value={answers.availability ?? ""}
            onChange={(e) => onChange({ availability: (e.target.value || undefined) as Availability | undefined })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
          >
            <option value="">Seçin (opsiyonel)</option>
            {COVER_LETTER_STEP_4.availabilityOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <HintCard>{COVER_LETTER_STEP_4.subtext}</HintCard>

      <StickyActions>
        <button
          type="button"
          onClick={onNext}
          disabled={loading || !canNext}
          title={!canNext ? "Pasaport ve çalışma izni durumu seçin" : undefined}
          className="h-12 w-full rounded-2xl bg-slate-900 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? "Gönderiliyor…" : COVER_LETTER_STEP_4.button}
        </button>
      </StickyActions>
    </div>
  );
}
