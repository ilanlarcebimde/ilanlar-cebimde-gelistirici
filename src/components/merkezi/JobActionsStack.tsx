"use client";

import Link from "next/link";

interface JobActionsStackProps {
  isPaid: boolean;
  onContactClick: () => void;
  onLetterClick: () => void;
}

const secondaryClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 transition hover:bg-slate-50 hover:border-slate-300";
const ghostClass =
  "h-10 w-full rounded-xl border border-transparent bg-slate-50 text-sm font-medium text-slate-800 transition hover:bg-slate-100";

/** İlan kartı aksiyonları: premium (outline) + hizmetler (ghost). Tüm butonlar w-full, h-10, gap-2. */
export function JobActionsStack({
  isPaid,
  onContactClick,
  onLetterClick,
}: JobActionsStackProps) {
  return (
    <div className="flex w-full flex-col gap-2">
      {isPaid && (
        <>
          <button type="button" onClick={onContactClick} className={secondaryClass}>
            İletişim Bilgileri
          </button>
          <button type="button" onClick={onLetterClick} className={secondaryClass}>
            Başvuru Mektubu
          </button>
        </>
      )}
      <Link href="/yurtdisi-cv-paketi" className={ghostClass + " flex items-center justify-center"}>
        CV Paketi
      </Link>
      <Link href="/usta-basvuru-paketi" className={ghostClass + " flex items-center justify-center"}>
        Usta Başvuru Paketi
      </Link>
    </div>
  );
}
