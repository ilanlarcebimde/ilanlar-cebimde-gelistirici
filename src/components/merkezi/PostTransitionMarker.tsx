"use client";

import { useEffect, useRef } from "react";

interface PostTransitionMarkerProps {
  loading?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
}

export function PostTransitionMarker({
  loading = false,
  onVisibilityChange,
}: PostTransitionMarkerProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current || !onVisibilityChange) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        onVisibilityChange(entry.isIntersecting);
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.9 }
    );
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
      onVisibilityChange(false);
    };
  }, [onVisibilityChange]);

  return (
    <div ref={ref} className="my-8 flex items-center justify-center">
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span className="h-px w-10 bg-slate-200" />
        <span>{loading ? "Sıradaki ilan yükleniyor..." : "Bu ilanın sonuna geldiniz"}</span>
        <span className="h-px w-10 bg-slate-200" />
      </div>
    </div>
  );
}
