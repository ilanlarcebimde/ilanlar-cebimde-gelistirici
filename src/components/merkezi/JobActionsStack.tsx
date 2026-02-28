"use client";

import Link from "next/link";

const BASE = "/yurtdisi-is-ilanlari";

interface JobActionsStackProps {
  postId: string;
  slug: string;
  isPaid: boolean;
  onContactClick: () => void;
  onLetterClick: () => void;
}

/** İlan kartında kompakt, içerik genişliğinde 4 buton. */
export function JobActionsStack({
  postId,
  slug,
  isPaid,
  onContactClick,
  onLetterClick,
}: JobActionsStackProps) {
  const btnClass =
    "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 w-fit whitespace-nowrap";
  return (
    <div className="flex flex-col gap-2 items-start">
      {isPaid && (
        <>
          <button type="button" onClick={onContactClick} className={btnClass}>
            İletişim Bilgileri
          </button>
          <button type="button" onClick={onLetterClick} className={btnClass}>
            Başvuru Mektubu
          </button>
        </>
      )}
      <Link href="/yurtdisi-cv-paketi" className={btnClass}>
        CV Paketi
      </Link>
      <Link href="/usta-basvuru-paketi" className={btnClass}>
        Usta Başvuru Paketi
      </Link>
    </div>
  );
}
