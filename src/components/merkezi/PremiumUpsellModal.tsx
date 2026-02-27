"use client";

interface PremiumUpsellModalProps {
  open: boolean;
  onClose: () => void;
  onCta: () => void;
}

const ADVANTAGES = [
  "Hızlı şekilde kendinizi ifade edin",
  "Çalışma deneyiminizi gönderin",
  "Pasaport / vize durumunuzu iletin",
  "Zaman kazanın",
  "Konaklama ve maaş beklentilerinizi iletin",
];

export function PremiumUpsellModal({ open, onClose, onCta }: PremiumUpsellModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        aria-hidden
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="premium-modal-title"
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 id="premium-modal-title" className="text-xl font-bold text-slate-900">
          Premium ile Hemen Başvur
        </h2>
        <ul className="mt-4 space-y-2 text-slate-700">
          {ADVANTAGES.map((item, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="text-sky-500" aria-hidden>✓</span>
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-900">
          <p className="font-medium">Uyarı</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-amber-800">
            <li>İşe alım için sizden kimse para istemez; para isteyenlere dikkat edin.</li>
            <li>Hiçbir platform iş garantisi vermez.</li>
            <li>Vize/pasaport işlemleri için resmi makamlara başvurun.</li>
          </ul>
        </div>
        <p className="mt-4 font-semibold text-slate-900">Haftalık Premium: 99 TL</p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onCta}
            className="flex-1 rounded-xl bg-slate-800 py-3 text-sm font-medium text-white hover:bg-slate-700"
          >
            Premium&apos;u Aç (99 TL/hafta)
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Şimdilik Vazgeç
          </button>
        </div>
      </div>
    </div>
  );
}
