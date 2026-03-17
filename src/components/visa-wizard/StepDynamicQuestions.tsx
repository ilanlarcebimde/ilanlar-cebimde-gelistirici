"use client";

import { useFormContext } from "react-hook-form";
import type { VisaLeadFormValues } from "./schema";

function Toggle({ label, field }: { label: string; field: keyof VisaLeadFormValues }) {
  const { register } = useFormContext<VisaLeadFormValues>();
  return (
    <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
      <input type="checkbox" {...register(field)} />
      {label}
    </label>
  );
}

export function StepDynamicQuestions() {
  const { register, watch } = useFormContext<VisaLeadFormValues>();
  const visaType = watch("visaType");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Vize türüne özel sorular</h3>
      <div className="mt-4 grid grid-cols-1 gap-4">
        {visaType === "work" && (
          <>
            <input {...register("profession")} placeholder="Mesleğiniz" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
            <input type="number" {...register("experienceYears", { valueAsNumber: true })} placeholder="Deneyim yılınız" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
            <input {...register("languageLevel")} placeholder="Yabancı dil seviyeniz" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
            <div className="flex flex-wrap gap-2">
              <Toggle label="Daha önce yurtdışında çalıştım" field="abroadExperience" />
              <Toggle label="Elimde CV var" field="hasCv" />
              <Toggle label="İş teklifi var" field="hasJobOffer" />
            </div>
          </>
        )}

        {visaType === "tourist" && (
          <>
            <input {...register("travelDuration")} placeholder="Seyahat süresi" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
            <div className="flex flex-wrap gap-2">
              <Toggle label="Daha önce vize aldım" field="abroadExperience" />
              <Toggle label="Davet mektubu var" field="hasInvitation" />
              <Toggle label="Konaklama planım hazır" field="hasAccommodationPlan" />
            </div>
          </>
        )}

        {visaType === "family" && (
          <>
            <input {...register("familyRelation")} placeholder="Aile birleşimi yapılacak kişi kim?" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
            <input {...register("spouseCountry")} placeholder="Hangi ülkede yaşıyor?" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
            <input {...register("spouseResidencyStatus")} placeholder="Karşı tarafın oturum durumu" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
            <div className="flex flex-wrap gap-2">
              <Toggle label="Resmi evlilik / resmi bağ var" field="officialMarriage" />
            </div>
          </>
        )}

        {visaType === "student" && (
          <>
            <input {...register("schoolProgram")} placeholder="Hangi okul / program?" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
            <input {...register("languageLevel")} placeholder="Dil seviyeniz" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
            <input {...register("educationBudget")} placeholder="Eğitim bütçesi" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
            <div className="flex flex-wrap gap-2">
              <Toggle label="Kabul mektubu var" field="schoolAcceptance" />
            </div>
          </>
        )}

        {visaType === "unsure" && (
          <>
            <textarea {...register("unsureReason")} placeholder="Neden yurtdışına gitmek istiyorsunuz?" rows={4} className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
            <input {...register("applicationGoal")} placeholder="Hedefiniz iş / eğitim / aile / gezi mi?" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" />
          </>
        )}
      </div>
    </div>
  );
}
