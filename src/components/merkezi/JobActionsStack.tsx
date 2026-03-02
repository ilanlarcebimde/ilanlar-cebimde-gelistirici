"use client";

import Link from "next/link";
import { Check } from "lucide-react";

interface JobActionsStackProps {
  isPaid: boolean;
  isPremiumActive?: boolean;
  onContactClick: () => void;
  onLetterClick: () => void;
}

const secondaryClass =
  "flex min-h-11 min-w-0 items-center justify-center rounded-2xl border border-slate-200 bg-white px-2 py-2.5 text-center text-sm font-medium leading-snug text-slate-900 transition hover:bg-slate-50 hover:border-slate-300";
const tertiaryClass =
  "flex min-h-11 min-w-0 items-center justify-center rounded-2xl border border-transparent bg-slate-50 px-2 py-2.5 text-center text-sm font-medium leading-snug text-slate-800 transition hover:bg-slate-100";

const premiumActiveClass =
  "relative flex min-h-11 min-w-0 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 pl-2 pr-24 py-2.5 text-center text-sm font-medium leading-snug text-emerald-900 transition hover:bg-emerald-100";

/** Sağ üst köşede Premium · Etkin rozeti */
function PremiumEtkinBadge() {
  return (
    <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
      <Check className="h-2.5 w-2.5 shrink-0" strokeWidth={2.5} />
      Premium · Etkin
    </span>
  );
}

/** İlan kartı CTA: Hızlı Başvuru Araçları (2 kolon) + Hizmetlerimiz (2 kolon). Premium aktifse yeşil buton + sağ üstte rozet. */
export function JobActionsStack({
  isPaid,
  isPremiumActive = false,
  onContactClick,
  onLetterClick,
}: JobActionsStackProps) {
  return (
    <div className="flex w-full flex-col gap-4">
      {isPaid && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Hızlı Başvuru Araçları</p>
          {isPremiumActive ? (
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={onContactClick} className={premiumActiveClass}>
                <span className="min-w-0 px-1">İşe Hemen Başvur: Firma İletişim Bilgileri</span>
                <PremiumEtkinBadge />
              </button>
              <button type="button" onClick={onLetterClick} className={premiumActiveClass}>
                <span className="min-w-0 px-1">İş Başvuru Mektubu Oluştur</span>
                <PremiumEtkinBadge />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={onContactClick} className={secondaryClass}>
                İşe Hemen Başvur: Firma İletişim Bilgileri
              </button>
              <button type="button" onClick={onLetterClick} className={secondaryClass}>
                İş Başvuru Mektubu Oluştur
              </button>
            </div>
          )}
        </div>
      )}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Hizmetlerimiz</p>
        <div className="grid grid-cols-2 gap-2">
          <Link href="/yurtdisi-cv-paketi" className={tertiaryClass}>
            Yurtdışı CV Paketi (İngilizce)
          </Link>
          <Link href="/usta-basvuru-paketi" className={tertiaryClass}>
            Usta Başvuru Paketi
          </Link>
        </div>
      </div>
    </div>
  );
}
