"use client";

export interface HintCardProps {
  children: React.ReactNode;
  /** sky-50 or amber-50 */
  variant?: "sky" | "amber";
  className?: string;
}

export function HintCard({ children, variant = "sky", className = "" }: HintCardProps) {
  const bg = variant === "amber" ? "bg-amber-50" : "bg-sky-50";
  return (
    <div className={`rounded-xl p-4 text-sm text-slate-700 ${bg} ${className}`}>
      {children}
    </div>
  );
}
