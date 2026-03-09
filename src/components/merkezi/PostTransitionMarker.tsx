"use client";

import { useEffect, useRef } from "react";

interface PostTransitionMarkerProps {
  loading?: boolean;
  onVisible?: () => void;
}

export function PostTransitionMarker({
  loading = false,
  onVisible,
}: PostTransitionMarkerProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current || !onVisible) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onVisible();
      },
      { rootMargin: "240px 0px 0px 0px", threshold: 0.1 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [onVisible]);

  return (
    <div ref={ref} className="my-8 flex items-center justify-center">
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span className="h-px w-10 bg-slate-200" />
        <span>{loading ? "Sıradaki ilan yükleniyor..." : "Sıradaki ilan hazırlanıyor"}</span>
        <span className="h-px w-10 bg-slate-200" />
      </div>
    </div>
  );
}
