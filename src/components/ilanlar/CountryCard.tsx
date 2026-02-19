"use client";

import Link from "next/link";

const FLAG_CDN = "https://flagcdn.com";

export interface CountryCardProps {
  flagCode: string;
  name: string;
  description: string;
  countryId: string;
  subscribed: boolean;
  onSubscribe: (countryId: string) => void;
  /** Abone olunduğunda feed sayfası linki (örn. /kanal/katar) */
  feedHref: string;
  /** Abonelik isteği gönderiliyor (buton disabled) */
  isSubmitting?: boolean;
}

export function CountryCard({
  flagCode,
  name,
  description,
  countryId,
  subscribed,
  onSubscribe,
  feedHref,
  isSubmitting = false,
}: CountryCardProps) {
  const flagSrc = `${FLAG_CDN}/w80/${flagCode}.png`;
  const flagSrcSet = `${FLAG_CDN}/w160/${flagCode}.png 2x`;

  return (
    <article className="relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-hover hover:border-brand-200">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-7 h-24 w-24 select-none opacity-10"
      >
        <img
          src={flagSrc}
          srcSet={flagSrcSet}
          alt=""
          className="h-full w-full object-contain"
          loading="lazy"
        />
      </div>
      <div className="mb-4 h-12 w-auto shrink-0">
        <img
          src={flagSrc}
          srcSet={flagSrcSet}
          alt=""
          className="h-full w-auto rounded-md object-contain shadow-sm"
          loading="lazy"
        />
      </div>
      <h3 className="mb-2 text-xl font-bold text-slate-900">{name}</h3>
      <p className="mb-6 flex-1 text-sm leading-relaxed text-slate-600">
        {description}
      </p>
      <div className="mb-4 flex items-center justify-between">
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
          Günlük güncellenir
        </span>
      </div>
      {subscribed ? (
        <div className="flex flex-col gap-2">
          <div className="rounded-xl bg-emerald-500 py-3 text-center text-sm font-semibold text-white">
            Abone Olundu ✓
          </div>
          <Link
            href={feedHref}
            className="rounded-xl border border-brand-600 py-3 text-center text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            Akışı Aç
          </Link>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onSubscribe(countryId)}
          disabled={isSubmitting}
          className="w-full rounded-xl border border-brand-600 bg-white py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-600 hover:text-white hover:shadow-md hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-70"
        >
          {isSubmitting ? "Yönlendiriliyor…" : "Kanala Abone Ol"}
        </button>
      )}
    </article>
  );
}
