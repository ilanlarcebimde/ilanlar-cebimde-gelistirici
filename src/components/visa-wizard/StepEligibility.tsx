"use client";

import { useFormContext } from "react-hook-form";
import type { VisaLeadFormValues } from "./schema";

export function StepEligibility() {
  const { register } = useFormContext<VisaLeadFormValues>();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Uygunluk ve operasyon filtresi</h3>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm text-slate-700 sm:col-span-2">
          <span>Pasaportunuz var mı?</span>
          <input {...register("passportStatus")} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" />
        </label>
        <label className="space-y-1 text-sm text-slate-700 sm:col-span-2">
          <span>Pasaport geçerlilik süresi</span>
          <input {...register("passportValidity")} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" />
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" {...register("previousRefusal")} />
          Daha önce vize reddi aldım
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" {...register("budgetReady")} />
          Başvuru ücretlerini karşılayabilirim
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
          <input type="checkbox" {...register("canFollowProcess")} />
          Evrak sürecini aktif takip edebilirim
        </label>
        <label className="space-y-1 text-sm text-slate-700 sm:col-span-2">
          <span>Ulaşım için en uygun kanal</span>
          <select {...register("preferredContactChannel")} className="w-full rounded-xl border border-slate-300 px-3 py-2.5">
            <option value="whatsapp">WhatsApp</option>
            <option value="phone">Telefon</option>
            <option value="email">E-posta</option>
          </select>
        </label>
      </div>
    </div>
  );
}
