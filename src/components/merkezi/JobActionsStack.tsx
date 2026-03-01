"use client";

import Link from "next/link";

interface JobActionsStackProps {
  isPaid: boolean;
  onContactClick: () => void;
  onLetterClick: () => void;
}

const secondaryClass =
  "flex min-h-11 min-w-0 items-center justify-center rounded-2xl border border-slate-200 bg-white px-2 py-2.5 text-center text-sm font-medium leading-snug text-slate-900 transition hover:bg-slate-50 hover:border-slate-300";
const tertiaryClass =
  "flex min-h-11 min-w-0 items-center justify-center rounded-2xl border border-transparent bg-slate-50 px-2 py-2.5 text-center text-sm font-medium leading-snug text-slate-800 transition hover:bg-slate-100";

/** İlan kartı CTA: Hızlı Başvuru Araçları (2 kolon) + Hizmetlerimiz (2 kolon). Mobilde 2 kolon grid, premium his. */
export function JobActionsStack({
  isPaid,
  onContactClick,
  onLetterClick,
}: JobActionsStackProps) {
  return (
    <div className="flex w-full flex-col gap-4">
      {isPaid && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Hızlı Başvuru Araçları</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={onContactClick} className={secondaryClass}>
              İşe Hemen Başvur: Firma İletişim Bilgileri
            </button>
            <button type="button" onClick={onLetterClick} className={secondaryClass}>
              İş Başvuru Mektubu Oluştur
            </button>
          </div>
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
