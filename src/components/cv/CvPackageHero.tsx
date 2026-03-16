"use client";

import { useCallback } from "react";

const PRICE = 349;

export function CvPackageHero() {
  const scrollToWizard = useCallback(() => {
    if (typeof document === "undefined") return;
    document.getElementById("cv-wizard-start")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <section className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pb-10 pt-8 sm:pt-10 sm:pb-12 border-b border-slate-800">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
        <h1 className="text-[1.9rem] sm:text-[2.3rem] font-bold text-slate-50 tracking-tight">
          Yurtdışı Başvurularda Güçlü İlk İzlenim Paketi
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
          Bilgilerinizi adım adım paylaşın; ekibimiz teknik mesleklere uygun, profesyonel başvuru standardında Türkçe CV,
          İngilizce CV ve iş başvuru mektubunuzu hazırlasın. Daha düzenli, güven veren ve işverenlerin dikkatini çeken
          bir başvuru dosyasıyla sürecinizi güçlendirin.
        </p>

        <div className="mt-5 inline-flex flex-col sm:flex-row items-center gap-4 rounded-2xl bg-slate-900/70 backdrop-blur border border-slate-700/80 px-6 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.55)]">
          <div className="text-left">
            <p className="text-xs uppercase tracking-wide text-slate-400">Paket Fiyatı</p>
            <p className="text-3xl font-semibold text-slate-50">{PRICE} TL</p>
          </div>
          <ul className="text-left space-y-1.5 text-sm text-slate-200">
            <li>• Teknik mesleklere uygun Türkçe CV</li>
            <li>• Uluslararası formatta İngilizce CV</li>
            <li>• Pozisyona uyumlu iş başvuru mektubu</li>
            <li>• Başvurunuzu güçlendiren bütünlüklü dosya yapısı</li>
          </ul>
        </div>

        <div className="mt-3 text-xs sm:text-sm text-slate-400 space-y-1">
          <p>Bilgileriniz güvenle alınır ve başvuru dosyanız profesyonel görünüm odaklı hazırlanır.</p>
        </div>

        <button
          type="button"
          onClick={scrollToWizard}
          className="mt-5 inline-flex items-center justify-center rounded-xl bg-sky-500 px-6 py-3 text-sm sm:text-base font-semibold text-slate-950 shadow-[0_8px_24px_rgba(56,189,248,0.35)] hover:bg-sky-400 transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-950"
        >
          Profesyonel Başvurumu Oluşturmaya Başla
        </button>
      </div>
    </section>
  );
}

