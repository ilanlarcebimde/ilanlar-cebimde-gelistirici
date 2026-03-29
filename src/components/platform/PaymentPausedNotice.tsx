"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const COPY = {
  badge: "Bilgilendirme",
  title: "Hizmet güncellemesi",
  body:
    "Sizlere daha iyi hizmet vermek için çalışmalarımız daha kapsamlı ve etkin bir şekilde ilerlemektedir. Takipte kalınız.",
};

type PaymentPausedNoticeProps = {
  variant: "inline" | "modal";
  /** Modal için */
  open?: boolean;
  onClose?: () => void;
  className?: string;
};

export function PaymentPausedNotice({
  variant,
  open = true,
  onClose,
  className = "",
}: PaymentPausedNoticeProps) {
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (variant !== "modal" || !open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });
    return () => {
      cancelAnimationFrame(t);
      document.body.style.overflow = originalOverflow;
    };
  }, [variant, open]);

  const card = (
    <div
      className={`relative z-[10000] w-full overflow-hidden shadow-2xl transition-all duration-300 ease-out
        rounded-t-3xl border-t border-x border-[#9fb0c7]/12
        md:w-full md:max-w-[580px] md:rounded-2xl md:border md:border-[#9fb0c7]/12
        ${variant === "modal" ? (entered ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 md:translate-y-12 md:opacity-0") : ""}
        ${className}`}
      style={{
        background:
          "linear-gradient(180deg, #0f172a 0%, #1b2b45 55%, #223554 100%)",
        boxShadow:
          "0 24px 80px rgba(8, 15, 28, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-slate-500/50 md:hidden" />

      <div
        className="p-4 pb-5 pt-4 md:p-6 md:pb-5 md:pt-5"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mb-3 flex items-start justify-between gap-3 md:mb-4">
          <div
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-100/35 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#1f2937] md:px-3 md:py-1.5 md:text-[11px]"
            style={{
              background:
                "linear-gradient(135deg, #fcd34d 0%, #f59e0b 58%, #d97706 100%)",
              boxShadow: "0 10px 24px rgba(245, 158, 11, 0.18)",
            }}
          >
            {COPY.badge}
          </div>
          {variant === "modal" && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/25"
              aria-label="Kapat"
            >
              <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <h2
          id="payment-paused-title"
          className="mb-2 text-[19px] font-extrabold leading-7 tracking-[-0.02em] text-slate-50 md:mb-2 md:text-[22px] md:leading-8"
        >
          {COPY.title}
        </h2>
        <p className="text-[13px] leading-6 text-[#dbe4f0] md:text-[14px] md:leading-7">{COPY.body}</p>
      </div>
    </div>
  );

  if (variant === "inline") {
    return (
      <div className="mx-auto w-full max-w-[580px] px-4 sm:px-6">
        {card}
      </div>
    );
  }

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center pb-0 md:items-center md:pb-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-paused-title"
    >
      <div
        className={`absolute inset-0 bg-[#07111f]/28 transition-opacity duration-300 md:bg-[#07111f]/18 ${entered ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
        aria-hidden
      />
      {card}
    </div>,
    document.body
  );
}
