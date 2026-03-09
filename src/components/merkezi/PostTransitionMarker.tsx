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
  const hasTriggeredRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!ref.current || !onVisible || hasTriggeredRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        if (entry.isIntersecting && !hasTriggeredRef.current) {
          if (!timerRef.current) {
            timerRef.current = setTimeout(() => {
              hasTriggeredRef.current = true;
              timerRef.current = null;
              onVisible();
            }, 1500);
          }
          return;
        }

        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.9 }
    );
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [onVisible]);

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
