"use client";

import { useFormContext } from "react-hook-form";
import type { VisaLeadFormValues } from "./schema";

export function StepPersonalInfo() {
  const { register } = useFormContext<VisaLeadFormValues>();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Kişisel bilgiler</h3>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm text-slate-700 sm:col-span-2">
          <span>Ad Soyad</span>
          <input {...register("fullName")} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" />
        </label>
        <label className="space-y-1 text-sm text-slate-700">
          <span>Telefon</span>
          <input {...register("phone")} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" />
        </label>
        <label className="space-y-1 text-sm text-slate-700">
          <span>WhatsApp Numarası</span>
          <input {...register("whatsapp")} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" />
        </label>
        <label className="space-y-1 text-sm text-slate-700 sm:col-span-2">
          <span>E-posta</span>
          <input type="email" {...register("email")} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" />
        </label>
        <label className="space-y-1 text-sm text-slate-700">
          <span>Yaş</span>
          <input type="number" {...register("age", { valueAsNumber: true })} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" />
        </label>
        <label className="space-y-1 text-sm text-slate-700">
          <span>Yaşadığınız şehir</span>
          <input {...register("city")} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" />
        </label>
        <label className="space-y-1 text-sm text-slate-700 sm:col-span-2">
          <span>Uyruk</span>
          <input {...register("nationality")} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" />
        </label>
      </div>
    </div>
  );
}
