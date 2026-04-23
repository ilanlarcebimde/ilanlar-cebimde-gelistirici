"use client";

import type { CSSProperties } from "react";

/** Emoji yığını; asıl sınıf: globals.css `.target-country-flag-emoji` (rlig/calt + masaüstü) */
export const TARGET_COUNTRY_FLAG_EMOJI_FONT =
  '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", system-ui, sans-serif';

type TargetCountryFlagSpanProps = {
  flagEmoji: string;
  /** Emoji görünmezse title; fallback’ta gösterilir */
  iso2: string;
  /** md: liste satırı, sm: seçili chip */
  size?: "md" | "sm";
};

export function TargetCountryFlagSpan({ flagEmoji, iso2, size = "md" }: TargetCountryFlagSpanProps) {
  const box =
    size === "sm"
      ? "mr-2 h-7 min-h-7 min-w-7 w-7 text-xl leading-none sm:mr-2.5"
      : "mr-2.5 h-8 min-h-8 min-w-8 w-8 text-2xl leading-none sm:mr-3";
  return (
    <span
      aria-hidden
      title={iso2}
      className={`target-country-flag-emoji inline-flex shrink-0 items-center justify-center overflow-visible rounded-full bg-white/10 ${box}`}
      style={{
        fontFamily: TARGET_COUNTRY_FLAG_EMOJI_FONT,
        fontFeatureSettings: "normal",
        fontVariantEmoji: "emoji",
        isolation: "isolate",
        opacity: 1,
      } satisfies CSSProperties}
    >
      {flagEmoji}
    </span>
  );
}

/** Emoji tek karakter görünmüyorsa ISO kodu (fallback) */
export function TargetCountryFlagOrIso({ flagEmoji, iso2, size = "md" }: TargetCountryFlagSpanProps) {
  const trimmed = flagEmoji.replace(/\uFE0F/g, "").trim();
  const emojiLooksEmpty = !trimmed || /^[\s]*$/.test(trimmed);
  if (emojiLooksEmpty) {
    const box =
      size === "sm"
        ? "mr-2 h-7 min-h-7 min-w-7 w-7 text-[10px] sm:mr-2.5"
        : "mr-2.5 h-8 min-h-8 min-w-8 w-8 text-[11px] sm:mr-3";
    return (
      <span
        aria-hidden
        className={`inline-flex shrink-0 items-center justify-center overflow-visible rounded-full border border-white/20 bg-white/5 font-semibold uppercase leading-none tracking-tight text-amber-100 ${box}`}
      >
        {iso2}
      </span>
    );
  }
  return <TargetCountryFlagSpan flagEmoji={flagEmoji} iso2={iso2} size={size} />;
}
