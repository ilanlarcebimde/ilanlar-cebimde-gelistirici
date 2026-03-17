"use client";

import { useFormContext } from "react-hook-form";
import type { VisaLeadFormValues } from "./schema";

interface StepReviewProps {
  uploadedFileCount: number;
}

export function StepReview({ uploadedFileCount }: StepReviewProps) {
  const { register, watch } = useFormContext<VisaLeadFormValues>();
  const values = watch();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Onay ve son kontrol</h3>
      <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-2">
        <p><span className="font-medium text-slate-500">Ad Soyad:</span> {values.fullName || "-"}</p>
        <p><span className="font-medium text-slate-500">E-posta:</span> {values.email || "-"}</p>
        <p><span className="font-medium text-slate-500">Vize Türü:</span> {values.visaType}</p>
        <p><span className="font-medium text-slate-500">Hedef Ülke:</span> {values.targetCountry || "-"}</p>
        <p><span className="font-medium text-slate-500">Zamanlama:</span> {values.applicationTimeline}</p>
        <p><span className="font-medium text-slate-500">Yüklenen Dosya:</span> {uploadedFileCount}</p>
      </div>

      <div className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" className="mt-0.5" {...register("consentDataShare")} />
          Bilgilerimin uygun danışmanlık firmalarıyla paylaşılmasını kabul ediyorum.
        </label>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" className="mt-0.5" {...register("consentContact")} />
          Benimle telefon / WhatsApp / e-posta ile iletişime geçilmesini kabul ediyorum.
        </label>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" className="mt-0.5" {...register("consentAccuracy")} />
          Girdiğim bilgilerin doğru olduğunu onaylıyorum.
        </label>
      </div>
    </div>
  );
}
