"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SLIDE_COUNT = 9;

/** Supabase Storage — `merkezi-covers` public bucket (Adim 1.png … Adim 9.png) */
const SUPABASE_SLIDE_BASE =
  "https://ugvjqnhbkotvvljnseob.supabase.co/storage/v1/object/public/merkezi-covers";

const SLIDE_SRC = (step: number) =>
  `${SUPABASE_SLIDE_BASE}/Adim%20${step}.png`;

type SlideDef = { id: string; shortLabel: string; src: string };

const SLIDES: readonly SlideDef[] = Array.from({ length: SLIDE_COUNT }, (_, i) => {
  const step = i + 1;
  return {
    id: String(step),
    shortLabel: step === 9 ? "Adım 9 — Güven ve bilgilendirme" : `Adım ${step}`,
    src: SLIDE_SRC(step),
  };
});

function SlideImage({
  src,
  priority,
  onError,
}: {
  src: string;
  priority: boolean;
  onError: () => void;
}) {
  return (
    <img
      src={src}
      alt=""
      className="absolute inset-0 h-full w-full object-contain"
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "low"}
      referrerPolicy="no-referrer-when-downgrade"
      onError={onError}
    />
  );
}

type PremiumOnboardingProcessSliderProps = {
  className?: string;
};

/**
 * 9 adımlı premium süreç görselleri: Supabase `merkezi-covers` public URL’leri.
 * `<img>` ile doğrudan yükleme (CORS genelde public object için sorunsuz).
 */
export function PremiumOnboardingProcessSlider({ className = "" }: PremiumOnboardingProcessSliderProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);
  const [loadError, setLoadError] = useState<Set<number>>(() => new Set());
  const labelId = useId();

  const goTo = useCallback((next: number, behavior: ScrollBehavior = "smooth") => {
    const el = scrollerRef.current;
    if (!el) {
      setIndex(next);
      return;
    }
    const w = el.clientWidth || 1;
    const clamped = Math.max(0, Math.min(SLIDE_COUNT - 1, next));
    const left = clamped * w;
    el.scrollTo({ left, behavior });
    setIndex(clamped);
  }, []);

  const onScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const w = el.clientWidth || 1;
    const i = Math.round(el.scrollLeft / w);
    const next = Math.max(0, Math.min(SLIDE_COUNT - 1, i));
    setIndex((prev) => (prev === next ? prev : next));
  }, []);

  useEffect(() => {
    const onResize = () => {
      const el = scrollerRef.current;
      if (!el) return;
      const w = el.clientWidth;
      if (w < 1) return;
      const i = Math.round(el.scrollLeft / w);
      const safe = Math.max(0, Math.min(SLIDE_COUNT - 1, i));
      el.scrollTo({ left: safe * w, behavior: "auto" });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const markError = (i: number) => {
    setLoadError((prev) => {
      const n = new Set(prev);
      n.add(i);
      return n;
    });
  };

  return (
    <section className={className} id="premium-basvuru-sureci" aria-labelledby={labelId}>
      <div className="text-center sm:text-left">
        <h2
          id={labelId}
          className="font-serif text-2xl font-semibold tracking-tight text-[#0f1a2c] sm:text-3xl md:text-[2rem] md:leading-tight"
        >
          Profesyonel Başvuru Süreciniz Nasıl İlerler?
        </h2>
        <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-slate-600 sm:mt-3 sm:text-base">
          Tüm süreç kontrollü, şeffaf ve profesyonel şekilde adım adım ilerler.
        </p>
      </div>

      <div
        className={`mt-8 overflow-hidden rounded-2xl border border-[#0f1a2c]/[0.08] bg-[#FEFDFB] p-1 shadow-[0_20px_60px_-20px_rgba(15,26,44,0.12),0_0_0_1px_rgba(197,160,89,0.12)] sm:mt-10 sm:rounded-3xl ${
          index === 8
            ? "ring-1 ring-amber-400/35 ring-offset-2 ring-offset-[#F6F1E8] sm:ring-2"
            : ""
        }`}
      >
        <p className="sr-only">
          Dokuz adımlı süreç; ekran okuyucu için kısa etiketler. Ayrıntı görsellerin üzerindedir.
        </p>

        <div className="relative">
          <div
            ref={scrollerRef}
            onScroll={onScroll}
            className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            style={{ WebkitOverflowScrolling: "touch" }}
            role="region"
            aria-roledescription="carousel"
            aria-label="Başvuru süreci adımları"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                goTo(index - 1);
              }
              if (e.key === "ArrowRight") {
                e.preventDefault();
                goTo(index + 1);
              }
            }}
          >
            {SLIDES.map((s, i) => (
              <div
                key={s.id}
                className="w-full min-w-full shrink-0 snap-center border-b border-[#0f1a2c]/[0.06] sm:border-b-0"
              >
                <figure className="relative mx-auto w-full max-w-5xl px-0 py-1 sm:px-2 sm:py-2">
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl sm:rounded-2xl sm:bg-[#0a1120]">
                    {loadError.has(i) ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-[#122032] to-[#0a1120] px-4 text-center">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-200/80">
                          {s.shortLabel}
                        </span>
                        <p className="text-sm text-slate-200/90">Bu adımın görseli yüklenemedi.</p>
                        <p className="max-w-md break-all text-xs leading-relaxed text-slate-400">
                          Kaynak:{" "}
                          <a href={s.src} className="text-amber-200/90 underline underline-offset-2" target="_blank" rel="noreferrer">
                            {s.src}
                          </a>
                          . Bucket’ta dosya adının <code className="text-slate-300">Adim 1.png</code> …{" "}
                          <code className="text-slate-300">Adim 9.png</code> (boşluklu) olduğundan ve public erişimin
                          açık olduğundan emin olun.
                        </p>
                      </div>
                    ) : (
                      <SlideImage src={s.src} priority={i === 0} onError={() => markError(i)} />
                    )}
                  </div>
                  <figcaption className="sr-only">{s.shortLabel}</figcaption>
                </figure>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            className="absolute left-1 top-1/2 z-[2] -translate-y-1/2 rounded-full border border-[#0f1a2c]/10 bg-white/95 p-2.5 text-[#0f1a2c] shadow-sm backdrop-blur-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 sm:left-2 sm:p-3"
            aria-label="Önceki adım"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.8} />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            disabled={index === SLIDE_COUNT - 1}
            className="absolute right-1 top-1/2 z-[2] -translate-y-1/2 rounded-full border border-[#0f1a2c]/10 bg-white/95 p-2.5 text-[#0f1a2c] shadow-sm backdrop-blur-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 sm:right-2 sm:p-3"
            aria-label="Sonraki adım"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.8} />
          </button>
        </div>

        <div className="mt-2 flex items-center justify-center gap-1.5 px-2 pb-3 pt-1 sm:mt-0 sm:pb-4 sm:pt-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(i)}
              className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6F1E8]"
              aria-label={`${s.shortLabel} — slayt ${i + 1}`}
              aria-pressed={i === index}
            >
              <span
                className={
                  "block h-1.5 rounded-full transition-all duration-300 " +
                  (i === index
                    ? "w-7 bg-amber-600/90 sm:w-8"
                    : "w-1.5 bg-[#0f1a2c]/20 group-hover:bg-[#0f1a2c]/30")
                }
              />
            </button>
          ))}
        </div>

        <p className="px-2 pb-3 text-center text-[11px] text-slate-500 sm:pb-4 sm:text-xs">
          <span className="font-medium text-slate-600">{index + 1}</span> / {SLIDE_COUNT} — sürükleyerek veya noktalara
          dokunarak ilerleyin
        </p>
      </div>
    </section>
  );
}
