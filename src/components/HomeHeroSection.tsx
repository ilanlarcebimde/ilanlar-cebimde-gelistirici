"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";

const HERO_SLIDES = [
  "https://ugvjqnhbkotvvljnseob.supabase.co/storage/v1/object/public/cv-photos/slayt1.png",
  "https://ugvjqnhbkotvvljnseob.supabase.co/storage/v1/object/public/cv-photos/slayt2.png",
  "https://ugvjqnhbkotvvljnseob.supabase.co/storage/v1/object/public/cv-photos/slayt3.png",
  "https://ugvjqnhbkotvvljnseob.supabase.co/storage/v1/object/public/cv-photos/slayt4.png",
  "https://ugvjqnhbkotvvljnseob.supabase.co/storage/v1/object/public/cv-photos/slayt5.png",
  "https://ugvjqnhbkotvvljnseob.supabase.co/storage/v1/object/public/cv-photos/slayt6.png",
  "https://ugvjqnhbkotvvljnseob.supabase.co/storage/v1/object/public/cv-photos/slayt7.png",
  "https://ugvjqnhbkotvvljnseob.supabase.co/storage/v1/object/public/cv-photos/slayt8.png",
  "https://ugvjqnhbkotvvljnseob.supabase.co/storage/v1/object/public/cv-photos/slayt9.png",
  "https://ugvjqnhbkotvvljnseob.supabase.co/storage/v1/object/public/cv-photos/slayt10.png",
  "https://ugvjqnhbkotvvljnseob.supabase.co/storage/v1/object/public/cv-photos/slayt11.png",
  "https://ugvjqnhbkotvvljnseob.supabase.co/storage/v1/object/public/cv-photos/slayt12.png",
  "https://ugvjqnhbkotvvljnseob.supabase.co/storage/v1/object/public/cv-photos/slayt13.png",
];

const BENEFITS = [
  "Güvenilir Kaynaklardan Yurtdışı İş İlanları",
  "İngilizce Özgeçmiş Oluşturma",
  "İş Başvuru Mektubu Oluşturma",
  "Vize Danışmanlık Hizmetleri",
];

const SLIDE_INTERVAL_MS = 3000;

export function HomeHeroSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(goNext, SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isPaused, goNext]);

  return (
    <section
      className="border-b border-slate-100 bg-gradient-to-b from-white to-slate-50/50 py-10 sm:py-14 lg:py-16"
      aria-label="Yurtdışında iş bulma platformu"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 lg:items-center">
          {/* Mobilde önce slider */}
          <div className="relative order-2 lg:order-1 aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-100 shadow-[0_10px_40px_rgba(15,23,42,0.08)] lg:aspect-[5/4]">
            <div
              className="absolute inset-0"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onFocus={() => setIsPaused(true)}
              onBlur={() => setIsPaused(false)}
            >
              {HERO_SLIDES.map((src, i) => (
                <div
                  key={src}
                  className="absolute inset-0 transition-opacity duration-500 ease-out"
                  style={{
                    opacity: i === currentIndex ? 1 : 0,
                    pointerEvents: i === currentIndex ? "auto" : "none",
                  }}
                  aria-hidden={i !== currentIndex}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                    loading={i < 3 ? "eager" : "lazy"}
                    priority={i === 0}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Sol: metin + liste + CTA */}
          <div className="order-1 flex flex-col justify-center lg:order-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              Yurtdışında iş bulmanız için etkin çözümler sunan platform
            </h1>
            <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
              Güvenilir iş ilanları, başvuru araçları ve profesyonel destek hizmetleri ile yurtdışı iş sürecinizi tek yerden yönetin.
            </p>

            <ul className="mt-6 space-y-3">
              {BENEFITS.map((item) => (
                <li key={item} className="flex items-center gap-3 text-slate-700">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </span>
                  <span className="text-sm font-medium sm:text-base">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/ilanlar"
                className="inline-flex justify-center rounded-xl bg-slate-900 px-6 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:bg-slate-800 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
              >
                İlanları Gör
              </Link>
              <Link
                href="/ucretsiz-vize-danismanligi"
                className="inline-flex justify-center rounded-xl border-2 border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
              >
                Ücretsiz Vize Danışmanlığı
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
