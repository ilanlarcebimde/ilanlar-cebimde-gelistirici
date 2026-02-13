"use client";

import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

const PACKAGE_ITEMS = [
  "Türkçe Profesyonel CV",
  "Uluslararası standartlara uygun İngilizceye çevrilmiş CV",
  "Verilen bilgilere göre kişiselleştirilmiş başvuru mektubu",
] as const;

const EXTRA_ITEMS = [
  "Seçilen ülke ve meslek için 1 haftalık iş ilanı eşleştirmesi",
  "Gelişmiş profil fotoğrafı düzenleme",
] as const;

const TRUST_BADGE = "Uluslararası standart / ATS uyumlu / PDF çıktısı";

const DEFAULT_IMAGE = { src: "/images/hero/hero-1.png", alt: "Kaynak ve metal işleri - sahada çalışan usta" };

export interface HomeHeroProps {
  titleLines?: string[];
  subtitle?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  imageSrc?: string;
  imageAlt?: string;
  /** Primary CTA click (e.g. scroll to start). If href is #hash, smooth scroll is used. */
  onCtaClick?: () => void;
}

function scrollToHash(hash: string) {
  const el = document.querySelector(hash);
  el?.scrollIntoView({ behavior: "smooth" });
}

export function Hero({
  titleLines = [
    "Profesyonel Başvuru Sistemi.",
    "Uluslararası Standart.",
    "Güçlü İlk İzlenim.",
  ],
  subtitle = "Türkçe profesyonel CV, uluslararası standartlara uygun İngilizce CV ve kişiselleştirilmiş başvuru mektubu — sistemli ve etkili bir başvuru altyapısı.",
  primaryCta = { label: "Usta Başvuru Paketini Başlat", href: "#yontem-secimi" },
  secondaryCta = { label: "Nasıl Çalışır?", href: "#how-it-works" },
  imageSrc = DEFAULT_IMAGE.src,
  imageAlt = DEFAULT_IMAGE.alt,
  onCtaClick,
}: HomeHeroProps) {
  const handlePrimary = () => {
    if (primaryCta.href.startsWith("#")) {
      scrollToHash(primaryCta.href);
    }
    onCtaClick?.();
  };

  const handleSecondary = () => {
    if (secondaryCta.href.startsWith("#")) {
      scrollToHash(secondaryCta.href);
    }
  };

  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-gradient-to-b from-slate-50/95 to-[#f1f5f9]/90 py-16 md:py-20"
      aria-labelledby="hero-title"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 lg:items-center">
          {/* Sol: metin + listeler + CTA */}
          <div className="order-2 lg:order-1">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              {TRUST_BADGE}
            </p>
            <h1
              id="hero-title"
              className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.5rem] leading-[1.2]"
            >
              {titleLines.map((line, i) => (
                <span key={i}>
                  {line}
                  {i < titleLines.length - 1 && <br />}
                </span>
              ))}
            </h1>
            <p className="mt-5 max-w-xl text-base text-slate-600 leading-relaxed">
              {subtitle}
            </p>

            {/* Paket İçeriği */}
            <div className="mt-8 rounded-xl border border-slate-200/90 bg-white/80 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)] sm:p-5">
              <h2 className="text-sm font-semibold text-slate-800">Paket İçeriği</h2>
              <ul className="mt-3 space-y-2.5">
                {PACKAGE_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pakete Dahil Ek Destekler */}
            <div className="mt-4 rounded-xl border border-slate-200/90 bg-white/80 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)] sm:p-5">
              <h2 className="text-sm font-semibold text-slate-800">Pakete Dahil Ek Destekler</h2>
              <ul className="mt-3 space-y-2.5">
                {EXTRA_ITEMS.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-slate-500">
                Ek ücret talep edilmeden sunulur.
              </p>
            </div>

            {/* CTA */}
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handlePrimary}
                className="rounded-xl bg-slate-900 px-6 py-3.5 text-base font-semibold text-white shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-all hover:bg-slate-800 hover:shadow-[0_4px_14px_rgba(0,0,0,0.15)] focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 active:bg-slate-950"
              >
                {primaryCta.label}
              </button>
              <button
                type="button"
                onClick={handleSecondary}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-base font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
              >
                {secondaryCta.label}
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-500 max-w-md">
              Bilgileriniz güvenle işlenir. Eksik alanlar sorun olmaz.
            </p>
          </div>

          {/* Sağ: görsel */}
          <div className="order-1 lg:order-2 relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
