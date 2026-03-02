"use client";

import { useState, useRef, useEffect } from "react";
import type { CoverLetterAnswers } from "../lib/coverLetterSchema";
import { COVER_LETTER_STEP_5, COVER_LETTER_WIZARD_HEADING } from "@/components/apply/coverLetterWizardContent";
import { ExampleBlock } from "../ui/ExampleBlock";
import { HintCard } from "../ui/HintCard";
import { StickyActions } from "../ui/StickyActions";

const MAX_CHARS = 400;
const WARN_ABOVE = 360;

export interface StepMotivationProps {
  answers: CoverLetterAnswers;
  onChange: (answers: Partial<CoverLetterAnswers>) => void;
  onNext: () => void;
  onBack?: () => void;
  loading: boolean;
  /** İlan/job/post varsa şirket adı ipucu; yoksa generic ipucu gösterilir */
  hasJobOrPost?: boolean;
}

export function StepMotivation({ answers, onChange, onNext, onBack, loading, hasJobOrPost = false }: StepMotivationProps) {
  const motivation = (answers.motivation ?? "").trim();
  const len = (answers.motivation ?? "").length;
  const [showMaxMessage, setShowMaxMessage] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (len > MAX_CHARS) setShowMaxMessage(true);
    else setShowMaxMessage(false);
  }, [len]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 256)}px`;
  }, [answers.motivation]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    if (v.length <= MAX_CHARS) onChange({ motivation: v });
    else onChange({ motivation: v.slice(0, MAX_CHARS) });
  };

  const canNext = motivation.length > 0 && len <= MAX_CHARS;
  const isOver = len > MAX_CHARS;
  const isWarn = len >= WARN_ABOVE && len <= MAX_CHARS;

  const minRows = 3;
  const maxRows = 8;

  return (
    <div className="mt-6 space-y-6">
      <div>
        <label className="mb-1 block text-lg font-medium text-slate-800">{COVER_LETTER_STEP_5.question}</label>
        {COVER_LETTER_STEP_5.questionSub ? (
          <p className="mb-2 text-sm text-slate-600">{COVER_LETTER_STEP_5.questionSub}</p>
        ) : null}
        <textarea
          ref={textareaRef}
          value={answers.motivation ?? ""}
          onChange={handleInput}
          rows={minRows}
          className="min-h-[120px] w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm leading-relaxed md:min-h-[140px]"
          maxLength={MAX_CHARS + 1}
          placeholder={COVER_LETTER_STEP_5.placeholder}
          style={{ minHeight: "7.5rem", maxHeight: "16rem" }}
        />
        <div className="mt-1 flex items-center gap-2">
          <span className={`text-xs ${isOver ? "text-red-600" : isWarn ? "text-amber-600" : "text-slate-500"}`}>
            {len} / {MAX_CHARS}
          </span>
          {isWarn && len <= MAX_CHARS && (
            <span className="text-amber-600" title="400 karaktere yaklaşıyorsunuz">⚠</span>
          )}
        </div>
        <div className="min-h-[20px] pt-1 text-xs text-red-600">
          {showMaxMessage && isOver ? COVER_LETTER_STEP_5.maxCharsMessage : "\u00A0"}
        </div>
      </div>
      <HintCard>
        <span className="whitespace-pre-line">{COVER_LETTER_STEP_5.guidance}</span>
      </HintCard>
      <HintCard variant="amber">{hasJobOrPost ? COVER_LETTER_STEP_5.hint : COVER_LETTER_STEP_5.hintGeneric}</HintCard>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">{COVER_LETTER_STEP_5.toneLabel}</label>
        <div className="flex gap-2">
          {COVER_LETTER_STEP_5.toneOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ tone: opt.value })}
              className={`rounded-xl border-2 px-4 py-2.5 text-sm font-medium ${
                answers.tone === opt.value
                  ? "border-slate-800 bg-slate-50 text-slate-900"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <ExampleBlock muted={motivation.length > 0}>{COVER_LETTER_STEP_5.example}</ExampleBlock>

      <StickyActions>
        <div className="flex w-full gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              disabled={loading}
              className="h-12 flex-1 rounded-2xl border-2 border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {COVER_LETTER_WIZARD_HEADING.buttonBack}
            </button>
          )}
          <button
            type="button"
            onClick={onNext}
            disabled={loading || !canNext}
            title={isOver ? COVER_LETTER_STEP_5.maxCharsMessage : !canNext ? "Motivasyon metni girin (max 400 karakter)" : undefined}
            className="h-12 flex-1 rounded-2xl bg-slate-900 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Gönderiliyor…" : COVER_LETTER_STEP_5.button}
          </button>
        </div>
        {!canNext && !loading && (
          <p className="text-center text-xs text-slate-500">
            {isOver ? COVER_LETTER_STEP_5.maxCharsMessage : "Motivasyon metni girin (en fazla 400 karakter)"}
          </p>
        )}
      </StickyActions>
    </div>
  );
}
