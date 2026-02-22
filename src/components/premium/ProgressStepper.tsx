"use client";

const STEPS = [
  { key: 1, label: "Profil bilgisi", icon: "👤" },
  { key: 2, label: "Pasaport durumu", icon: "🛂" },
  { key: 3, label: "CV hazır mı", icon: "📄" },
  { key: 4, label: "Belgeler", icon: "🧾" },
  { key: 5, label: "Sponsor/uygunluk", icon: "🧩" },
  { key: 6, label: "Başvuru metni", icon: "✉️" },
  { key: 7, label: "Son kontrol", icon: "✅" },
];

export function ProgressStepper({ currentStep }: { currentStep: number }) {
  const step = Math.max(1, Math.min(7, currentStep));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">İlerleme Durumu</h2>
      <p className="mt-1 text-xs text-slate-500">Başvuru adımı: {step}/7</p>
      <ul className="mt-3 space-y-2">
        {STEPS.map((s) => (
          <li
            key={s.key}
            className={`flex items-center gap-2 text-sm ${
              s.key <= step ? "text-slate-800 font-medium" : "text-slate-400"
            }`}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs">
              {s.key < step ? "✓" : s.icon}
            </span>
            <span>{s.label}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-slate-400">Otomatik güncellenir</p>
    </div>
  );
}
