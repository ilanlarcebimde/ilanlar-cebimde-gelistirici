"use client";

import Image from "next/image";

const FLAG_SRC = (iso2: string) => `https://flagcdn.com/w40/${iso2.trim().toLowerCase()}.png`;

type TargetCountryFlagOrIsoProps = {
  iso2: string;
  size?: "md" | "sm";
};

/**
 * Hedef ülke / bölge: flagcdn (emoji Windows masaüstünde güvenilir değil; site genelinde de aynı kaynak).
 */
export function TargetCountryFlagOrIso({ iso2, size = "md" }: TargetCountryFlagOrIsoProps) {
  const box =
    size === "sm"
      ? "mr-2 h-7 min-h-7 min-w-7 w-7 sm:mr-2.5"
      : "mr-2.5 h-8 min-h-8 min-w-8 w-8 sm:mr-3";
  return (
    <span aria-hidden title={iso2} className={`relative inline-block shrink-0 overflow-hidden rounded-full border border-white/15 bg-white/5 ${box}`}>
      <Image
        src={FLAG_SRC(iso2)}
        alt=""
        width={40}
        height={30}
        className="h-full w-full object-cover"
        sizes={size === "sm" ? "28px" : "32px"}
        loading="lazy"
      />
    </span>
  );
}
