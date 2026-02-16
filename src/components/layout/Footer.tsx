"use client";

import Image from "next/image";

const POLICIES = [
  "KVKK / Aydınlatma Metni",
  "Gizlilik Politikası",
  "Çerez Politikası",
  "Kullanım Koşulları",
  "Mesafeli Satış Sözleşmesi",
  "İade & Geri Ödeme",
  "Sorumluluk Reddi",
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200/70 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid gap-8 md:grid-cols-3 md:gap-6">
          {/* Sol blok — Brand */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="İlanlar Cebimde"
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
              />
              <span className="text-base font-bold tracking-tight text-slate-900">
                İlanlar Cebimde
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              ATS uyumlu TR CV + Uluslararası standart EN CV + Kişiselleştirilmiş başvuru mektubu.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Fotoğraf düzenleme ve 1 haftalık ilan eşleştirmesi hediyedir.
            </p>
            <p className="mt-6 text-xs text-slate-400">
              © 2026 İlanlar Cebimde
            </p>
          </div>

          {/* Orta blok — Politikalar (pasif) */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Politikalar</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {POLICIES.map((label) => (
                <span
                  key={label}
                  className="cursor-default rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 opacity-90 pointer-events-none"
                  aria-disabled
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Sağ blok — Güven */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Güvenli Ödeme</h3>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="inline-flex h-8 items-center rounded border border-slate-200 bg-slate-50/80 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                Visa
              </span>
              <span className="inline-flex h-8 items-center rounded border border-slate-200 bg-slate-50/80 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                Mastercard
              </span>
              <span className="inline-flex h-8 items-center rounded border border-slate-200 bg-slate-50/80 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                Troy
              </span>
              <span className="inline-flex h-8 items-center rounded border border-slate-200 bg-slate-50/80 px-2.5 text-[10px] font-semibold text-slate-600">
                PayTR
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Ödemeler PayTR altyapısı ile güvenle alınır.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
