"use client";

import { useState } from "react";
import type { FormatterOutput } from "@/lib/job-guide/formatterSchema";

const MAX_VISIBLE_BULLETS = 5;

type FormattedJobGuideProps = {
  data: FormatterOutput;
  /** Uzun snippet için "Devamını göster" sınırı (madde sayısı). */
  collapseThreshold?: number;
};

export function FormattedJobGuide({ data, collapseThreshold = MAX_VISIBLE_BULLETS }: FormattedJobGuideProps) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

  const ui = data?.ui;
  const header = ui?.header ?? { title: "", meta: [] };
  const sections = Array.isArray(ui?.sections) ? ui.sections : [];
  const cta = ui?.cta;

  if (!ui) {
    return <p className="text-slate-600">Görüntülenecek veri yok.</p>;
  }

  const toggleSection = (index: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div
      className="mx-auto w-full max-w-[72ch] space-y-5 text-[16px] leading-[1.65] sm:text-[17px] sm:leading-[1.7]"
      style={{ maxWidth: "min(72ch, 760px)" }}
    >
      <header className="space-y-2 border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{header?.title ?? "İlan"}</h1>
        {Array.isArray(header?.meta) && header.meta.length > 0 && (
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-slate-600">
            {header.meta.map((m, i) => (
              <li key={i}>{String(m)}</li>
            ))}
          </ul>
        )}
      </header>

      <div className="space-y-5">
        {sections.map((section, idx) => {
          const bullets = Array.isArray(section?.bullets) ? section.bullets : [];
          const isLong = bullets.length > collapseThreshold;
          const isExpanded = expandedSections.has(idx);
          const visibleBullets = isLong && !isExpanded ? bullets.slice(0, collapseThreshold) : bullets;

          return (
            <section key={idx} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="text-lg font-semibold text-slate-900">{section?.title ?? ""}</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                {visibleBullets.map((b, i) => (
                  <li key={i} className="list-disc text-slate-700">
                    {String(b)}
                  </li>
                ))}
              </ul>
              {isLong && !isExpanded && (
                <button
                  type="button"
                  onClick={() => toggleSection(idx)}
                  className="mt-3 text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline"
                >
                  Devamını göster ({bullets.length - collapseThreshold} madde)
                </button>
              )}
              {isLong && isExpanded && (
                <button
                  type="button"
                  onClick={() => toggleSection(idx)}
                  className="mt-3 text-sm font-medium text-slate-500 hover:text-slate-700 hover:underline"
                >
                  Daha az göster
                </button>
              )}
              {section.note && (
                <p className="mt-3 text-sm text-slate-500">{section.note}</p>
              )}
            </section>
          );
        })}
      </div>

      {cta?.url && (
        <footer className="border-t border-slate-200 pt-4">
          <a
            href={cta.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            {cta.label}
          </a>
        </footer>
      )}
    </div>
  );
}
