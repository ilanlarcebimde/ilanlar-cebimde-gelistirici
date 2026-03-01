"use client";

export interface StickyActionsProps {
  children: React.ReactNode;
  className?: string;
}

/** Mobile: sticky bottom. Desktop/tablet: normal flow. */
export function StickyActions({ children, className = "" }: StickyActionsProps) {
  return (
    <div
      className={`sticky bottom-0 z-10 mt-6 flex flex-col gap-2 border-t border-slate-100 bg-white pt-4 md:static md:border-0 md:bg-transparent md:pt-6 ${className}`}
    >
      {children}
    </div>
  );
}
