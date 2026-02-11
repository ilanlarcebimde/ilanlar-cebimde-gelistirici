"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { COUNTRIES } from "@/data/countries";

const PACKAGE_ITEMS = [
  "Türkçe CV (uluslararası standartlara uygun)",
  "İngilizce CV (uluslararası standartlara uygun)",
  "Gelişmiş profil fotoğrafı düzenleme (CV ve yurtdışı başvurusu uyumlu)",
];

const BONUS_ITEMS = [
  "Tercih edilen ülke + mesleğe göre 1 haftalık iş ilanları taraması ve ilan bülteni",
  "Kişiselleştirilmiş iş başvuru mektubu (şansınızı artırmayı hedefler)",
];

const PRICE = 549;

export interface PaymentPayload {
  email: string;
  user_name?: string;
  profile_id?: string;
}

export function CompletionSummary({
  country,
  jobBranch,
  jobArea,
  hasPhoto,
  email,
  user_name,
  profile_id,
  onPaymentClick,
}: {
  country: string;
  jobBranch: string;
  jobArea: string;
  hasPhoto: boolean;
  email: string;
  user_name?: string;
  profile_id?: string | null;
  onPaymentClick: (payload: PaymentPayload) => void;
}) {
  const countryName = COUNTRIES.find((c) => c.id === country)?.name ?? country;

  const handlePay = () => {
    onPaymentClick({
      email: email?.trim() || "",
      user_name: user_name?.trim() || undefined,
      profile_id: profile_id ?? undefined,
    });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-soft"
    >
      <h2 className="text-xl font-bold text-slate-900 mb-6">Özet</h2>
      <div className="space-y-4 mb-8">
        <p className="text-slate-600">
          <span className="font-medium text-slate-800">Ülke:</span> {countryName || "—"}
        </p>
        <p className="text-slate-600">
          <span className="font-medium text-slate-800">Meslek:</span> {jobArea} / {jobBranch || "—"}
        </p>
        <p className="text-slate-600">
          <span className="font-medium text-slate-800">Profil fotoğrafı:</span>{" "}
          {hasPhoto ? "Yüklendi" : "Yok"}
        </p>
      </div>

      <div className="rounded-xl bg-slate-50 p-6 mb-6">
        <h3 className="font-semibold text-slate-900 mb-4">Usta Başvuru Paketi — {PRICE} TL</h3>
        <ul className="space-y-2 mb-4">
          {PACKAGE_ITEMS.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
              <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
        <p className="text-sm font-medium text-slate-600 mb-2">Pakete dahil ücretsiz bonuslar:</p>
        <ul className="space-y-2">
          {BONUS_ITEMS.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
              <Check className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={handlePay}
        className="w-full rounded-xl bg-slate-800 py-4 text-lg font-semibold text-white shadow-soft hover:bg-slate-700 transition-colors hover:opacity-95"
      >
        Paketimi Oluştur
      </button>
      <p className="mt-3 text-sm text-slate-500 text-center">
        Ödeme ekranına yönlendirileceksiniz.
      </p>
    </motion.section>
  );
}
