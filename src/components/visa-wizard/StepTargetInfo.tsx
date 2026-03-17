"use client";

import { useFormContext } from "react-hook-form";
import type { VisaLeadFormValues } from "./schema";

export function StepTargetInfo() {
  const { register } = useFormContext<VisaLeadFormValues>();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Temel hedef bilgileri</h3>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm text-slate-700 sm:col-span-2">
          <span>Hedef ülke</span>
          <input {...register("targetCountry")} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" />
        </label>
        <label className="space-y-1 text-sm text-slate-700 sm:col-span-2">
          <span>Başvuru amacı</span>
          <textarea {...register("applicationGoal")} rows={3} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" />
        </label>
        <label className="space-y-1 text-sm text-slate-700 sm:col-span-2">
          <span>Ne kadar sürede başvurmak istiyorsunuz?</span>
          <select {...register("applicationTimeline")} className="w-full rounded-xl border border-slate-300 px-3 py-2.5">
            <option value="immediately">Hemen</option>
            <option value="within_1_month">1 ay içinde</option>
            <option value="within_3_months">3 ay içinde</option>
            <option value="info_only">Sadece bilgi almak istiyorum</option>
          </select>
        </label>
      </div>
    </div>
  );
}
