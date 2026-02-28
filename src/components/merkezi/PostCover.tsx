"use client";

interface PostCoverProps {
  src: string | null;
  alt: string;
  badge?: "Premium" | null;
}

/**
 * Detay sayfası kapak görseli: object-contain, kırpma yok, letterbox arka plan.
 * 1200x630 yazılı OG kapaklar tam görünür.
 */
export function PostCover({ src, alt, badge }: PostCoverProps) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
      <div className="relative h-[220px] w-full sm:h-[280px] md:h-[360px] lg:h-[420px]">
        {src ? (
          <img
            src={src}
            alt={alt}
            loading="eager"
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200" aria-hidden>
            <span className="text-4xl text-slate-400">📄</span>
          </div>
        )}
      </div>
      {badge && (
        <span className="absolute right-3 top-3 rounded-full bg-amber-500 px-2 py-1 text-xs font-medium text-white shadow-sm">
          Premium
        </span>
      )}
    </div>
  );
}
