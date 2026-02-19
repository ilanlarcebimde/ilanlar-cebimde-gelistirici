"use client";

import type { ReactNode } from "react";

export interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <article className="flex min-h-[220px] flex-col rounded-[16px] border border-slate-200/90 bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-all duration-[280ms] ease-out hover:-translate-y-1 hover:border-brand-300/80 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] sm:p-7">
      <div className="mb-5 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-700 shadow-sm">
        {icon}
      </div>
      <h3 className="mb-2 line-clamp-2 text-[17px] font-bold leading-snug text-slate-900">
        {title}
      </h3>
      <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">
        {description}
      </p>
    </article>
  );
}
