"use client";

import { useCallback } from "react";

const PRICE = 469;

type CvPackageHeroProps = {
  /** Üst şerit vb. ek ofset (px), varsayılan: yalnızca header */
  scrollAnchorOffsetPx?: number;
};

export function CvPackageHero({ scrollAnchorOffsetPx = 72 }: CvPackageHeroProps) {
  const scrollToWizard = useCallback(() => {
    if (typeof document === "undefined") return;
    const target = document.getElementById("cv-wizard-start");
    if (!target) return;
    const headerOffset = scrollAnchorOffsetPx;
    const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top, behavior: "smooth" });
  }, [scrollAnchorOffsetPx]);

  return (
    <section className="relative mt-5 border-b border-slate-800/90 border-t border-white/[0.08] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pb-12 pt-14 sm:mt-6 sm:pb-14 sm:pt-16 md:pt-[4.5rem]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" aria-hidden />
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-400/95 sm:text-xs">
          Yurtdışı CV Paketi
        </p>
        <h1 className="mx-auto mt-4 max-w-[22rem] text-balance text-[1.7rem] font-bold leading-snug tracking-tight text-slate-50 min-[400px]:max-w-none min-[400px]:text-[1.85rem] sm:mt-5 sm:text-[2.35rem] sm:leading-[1.12] md:text-[2.45rem]">
          Yurtdışı Başvurularda Güçlü İlk İzlenim Paketi
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-pretty text-[15px] leading-relaxed text-slate-300 sm:mt-6 sm:text-base sm:leading-relaxed">
          Bilgilerinizi adım adım paylaşın; ekibimiz teknik mesleklere uygun, profesyonel başvuru standardında Türkçe CV,
          İngilizce CV ve iş başvuru mektubunuzu hazırlasın. Daha düzenli, güven veren ve işverenlerin dikkatini çeken
          bir başvuru dosyasıyla sürecinizi güçlendirin.
        </p>

        <div className="mt-8 inline-flex max-w-full flex-col items-stretch gap-5 rounded-2xl border border-slate-700/70 bg-slate-900/65 px-5 py-6 text-left shadow-[0_12px_40px_rgba(15,23,42,0.55)] backdrop-blur-sm sm:mt-9 sm:flex-row sm:items-center sm:gap-8 sm:px-8 sm:py-7">
          <div className="shrink-0 text-center sm:text-left">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Paket Fiyatı</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-slate-50 sm:text-[2rem]">{PRICE} TL</p>
          </div>
          <ul className="space-y-2 text-sm leading-relaxed text-slate-200 sm:text-[15px]">
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-sky-400/90" aria-hidden>
                ✓
              </span>
              <span>Teknik mesleklere uygun Türkçe CV</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-sky-400/90" aria-hidden>
                ✓
              </span>
              <span>Uluslararası formatta İngilizce CV</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-sky-400/90" aria-hidden>
                ✓
              </span>
              <span>Pozisyona uyumlu iş başvuru mektubu</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 shrink-0 text-sky-400/90" aria-hidden>
                ✓
              </span>
              <span>Başvurunuzu güçlendiren bütünlüklü dosya yapısı</span>
            </li>
          </ul>
        </div>

        <div className="mt-5 space-y-1 text-xs text-slate-400 sm:mt-6 sm:text-sm">
          <p>Bilgileriniz güvenle alınır ve başvuru dosyanız profesyonel görünüm odaklı hazırlanır.</p>
        </div>

        <button
          type="button"
          onClick={scrollToWizard}
          className="mt-7 inline-flex min-h-[48px] w-full max-w-md items-center justify-center rounded-xl bg-sky-500 px-6 py-3.5 text-[15px] font-semibold text-slate-950 shadow-[0_8px_28px_rgba(56,189,248,0.38)] transition-all hover:bg-sky-400 hover:shadow-[0_10px_32px_rgba(56,189,248,0.45)] focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-950 sm:mt-8 sm:min-h-0 sm:w-auto sm:py-3 sm:text-base"
        >
          Profesyonel Başvurumu Oluşturmaya Başla
        </button>
      </div>
    </section>
  );
}
