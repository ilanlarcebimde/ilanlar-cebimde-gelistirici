"use client";

import { useFormContext } from "react-hook-form";
import type { VisaLeadFormValues } from "./schema";

const OPTIONS = [
  { value: "work", label: "Çalışma Vizesi" },
  { value: "tourist", label: "Turistik Vize" },
  { value: "family", label: "Aile Birleşimi" },
  { value: "student", label: "Öğrenci Vizesi" },
  { value: "unsure", label: "Emin Değilim" },
] as const;

export function StepVisaType() {
  const { register, watch } = useFormContext<VisaLeadFormValues>();
  const selected = watch("visaType");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Hangi vize türü için başvurmak istiyorsunuz?</h3>
      <p className="mt-1 text-sm text-slate-600">Seçiminize göre bir sonraki adımlarda sorular otomatik uyarlanır.</p>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {OPTIONS.map((option) => (
          <label
            key={option.value}
            className={`cursor-pointer rounded-xl border px-4 py-3 text-sm transition ${
              selected === option.value ? "border-sky-400 bg-sky-50 text-sky-700" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            <input type="radio" className="sr-only" value={option.value} {...register("visaType")} />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}
