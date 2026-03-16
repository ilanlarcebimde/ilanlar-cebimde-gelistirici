"use client";

import Link from "next/link";

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
const serviceButtonBase =
  "flex w-full flex-col items-start gap-0.5 rounded-xl border p-3 text-left transition hover:bg-white hover:shadow-sm";
const serviceButtonDefault = `${serviceButtonBase} border-slate-200 bg-slate-50`;
const serviceButtonHighlighted = `${serviceButtonBase} border-orange-200 bg-orange-50`;

const premiumActiveClass =
  "relative overflow-visible flex min-h-11 min-w-0 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-medium leading-snug text-emerald-900 transition hover:bg-emerald-100";

/** Sol üst köşede rozet; buton sınırının dışında, içerik layout'unu etkilemez. */
function PremiumBadge() {
  return (
    <span
      className="absolute -left-2 -top-2 z-10 flex h-5 items-center justify-center rounded-full bg-slate-600/90 px-2 text-[11px] leading-5 font-medium text-white/95 shadow-sm whitespace-nowrap pointer-events-none"
      aria-hidden
    >
      Premium
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
                <span className="flex h-full w-full items-center justify-center text-center break-normal whitespace-normal">
                  İşe Hemen Başvur: Firma İletişim Bilgileri
                </span>
                <PremiumBadge />
              </button>
              <button type="button" onClick={onLetterClick} className={premiumActiveClass}>
                <span className="flex h-full w-full items-center justify-center text-center break-normal whitespace-normal">
                  İş Başvuru Mektubu Oluştur
                </span>
                <PremiumBadge />
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
        <div className="space-y-2">
          <Link href="/yurtdisi-cv-paketi" className={serviceButtonDefault}>
            <span className="text-sm font-semibold text-slate-900">Yurtdışı CV Paketi</span>
            <span className="text-xs text-slate-600">İngilizce CV oluştur</span>
          </Link>
          <Link href="/" className={serviceButtonHighlighted}>
            <span className="text-sm font-semibold text-slate-900">Ücretsiz Vize Danışmanlığı</span>
            <span className="text-xs text-slate-700">24 Saat İçinde Danışman Atanır</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
