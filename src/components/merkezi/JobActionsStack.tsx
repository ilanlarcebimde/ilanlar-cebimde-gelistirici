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

/** İlan kartında alt alta, eşit genişlikte 4 buton. Ücretliyse iletişim + mektup; hep CV + Usta linkleri. */
export function JobActionsStack({
  postId,
  slug,
  isPaid,
  onContactClick,
  onLetterClick,
}: JobActionsStackProps) {
  return (
    <div className="mt-4 flex flex-col gap-2">
      {isPaid && (
        <>
          <button
            type="button"
            onClick={onContactClick}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
          >
            İlan Sahibi İletişim Bilgileri
          </button>
          <button
            type="button"
            onClick={onLetterClick}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
          >
            İş Başvuru Mektubu Oluştur
          </button>
        </>
      )}
      <Link
        href="/yurtdisi-cv-paketi"
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
      >
        Yurtdışı CV Paketi
      </Link>
      <Link
        href="/usta-basvuru-paketi"
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
      >
        Usta Başvuru Paketi
      </Link>
    </div>
  );
}
