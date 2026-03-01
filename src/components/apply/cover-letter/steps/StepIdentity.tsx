"use client";

import { useState, useCallback } from "react";
import type { CoverLetterAnswers } from "../lib/coverLetterSchema";
import { COVER_LETTER_STEP_2 } from "@/components/apply/coverLetterWizardContent";
import { StickyActions } from "../ui/StickyActions";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function capitalizeWords(s: string): string {
  return s
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export interface StepIdentityProps {
  answers: CoverLetterAnswers;
  onChange: (answers: Partial<CoverLetterAnswers>) => void;
  onNext: () => void;
  loading: boolean;
}

export function StepIdentity({ answers, onChange, onNext, loading }: StepIdentityProps) {
  const [emailTouched, setEmailTouched] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const fullName = (answers.full_name ?? "").trim();
  const email = (answers.email ?? "").trim();
  const validEmail = email === "" || EMAIL_REGEX.test(email);
  const showEmailError = emailTouched && email.length > 0 && !validEmail;

  const handleBlurEmail = useCallback(() => {
    setEmailTouched(true);
    if (email.length > 0 && !validEmail) setFieldError("Geçerli bir e-posta adresi girin");
    else setFieldError(null);
  }, [email, validEmail]);

  const handleFullNameChange = (v: string) => {
    const capped = capitalizeWords(v);
    onChange({ full_name: capped || v });
  };

  const canNext = fullName.length > 0 && email.length > 0 && validEmail;
  const errorMessage = fieldError || (showEmailError ? "Geçerli bir e-posta adresi girin" : null);

  return (
    <div className="mt-6 space-y-6">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">{COVER_LETTER_STEP_2.fields.full_name}</label>
          <input
            type="text"
            value={answers.full_name ?? ""}
            onChange={(e) => handleFullNameChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            placeholder="Ad Soyad"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">{COVER_LETTER_STEP_2.fields.email}</label>
          <input
            type="email"
            value={answers.email ?? ""}
            onChange={(e) => onChange({ email: e.target.value })}
            onBlur={handleBlurEmail}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            placeholder="ornek@email.com"
          />
          <div className="min-h-[20px] pt-1 text-xs text-red-600">
            {errorMessage ?? "\u00A0"}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">{COVER_LETTER_STEP_2.fields.phone}</label>
          <input
            type="text"
            value={answers.phone ?? ""}
            onChange={(e) => onChange({ phone: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            placeholder="+90 5xx xxx xx xx"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">{COVER_LETTER_STEP_2.fields.city_country}</label>
          <input
            type="text"
            value={answers.city_country ?? ""}
            onChange={(e) => onChange({ city_country: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
            placeholder="İstanbul, Türkiye"
          />
        </div>
      </div>
      <p className="text-sm text-slate-500">{COVER_LETTER_STEP_2.subtext}</p>

      <StickyActions>
        <button
          type="button"
          onClick={onNext}
          disabled={loading || !canNext}
          className="h-12 w-full rounded-2xl bg-slate-900 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? "Gönderiliyor…" : COVER_LETTER_STEP_2.button}
        </button>
      </StickyActions>
    </div>
  );
}
