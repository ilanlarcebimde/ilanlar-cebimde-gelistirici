"use client";

import Link from "next/link";
import Image from "next/image";

const COUNTRIES = [
  { slug: "katar", name: "Katar", flagCode: "qa" },
  { slug: "irlanda", name: "İrlanda", flagCode: "ie" },
  { slug: "alaska", name: "Alaska", flagCode: "us" },
  { slug: "belcika", name: "Belçika", flagCode: "be" },
] as const;

const FLAG_CDN = "https://flagcdn.com";

export function YurtdisiIlanlariSection() {
  return (
    <section className="border-t border-slate-100 bg-slate-50/50 py-12 sm:py-16" aria-labelledby="yurtdisi-ilanlari-baslik">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 id="yurtdisi-ilanlari-baslik" className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
          Yurtdışı İş İlanları
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-600 sm:text-base">
          Biz sizin için araştırıyor, doğruluyor ve tek merkezde sunuyoruz.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            href="/yurtdisi-is-ilanlari"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            Akışı Aç
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {COUNTRIES.map((c) => (
            <Link
              key={c.slug}
              href={`/yurtdisi-is-ilanlari?c=${c.slug}`}
              className="group flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-brand-200 hover:shadow-md"
            >
              <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={`${FLAG_CDN}/w160/${c.flagCode}.png`}
                  alt=""
                  width={56}
                  height={40}
                  className="object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <span className="mt-2 text-center text-sm font-medium text-slate-800 group-hover:text-brand-600">
                {c.name}
              </span>
              <span className="mt-0.5 text-xs text-slate-500">Kanala Göz At</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
