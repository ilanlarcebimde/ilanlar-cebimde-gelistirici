"use client";

import { useCallback, useRef } from "react";
import type {
  GuideReadingJson,
  ApplyGuideModule,
  DocumentsModule,
  WorkPermitVisaModule,
  SalaryLifeCalcModule,
  RiskAssessmentModule,
  FitAnalysisModule,
  OneWeekPlanModule,
} from "@/types/job-guide-reading";

const MODULE_TITLES: Record<keyof NonNullable<GuideReadingJson["modules"]>, string> = {
  apply_guide: "Adım adım başvuru rehberi",
  documents: "Gerekli belgeler listesi",
  work_permit_visa: "Çalışma izni ve vize süreci",
  salary_life_calc: "Net maaş ve yaşam gider hesabı",
  risk_assessment: "Risk değerlendirmesi",
  fit_analysis: "Sana özel uygunluk analizi",
  one_week_plan: "7 günlük başvuru planı",
};

/** Progressive disclosure: başlık + özet + "Detayı göster" ile tam metin. scale/zoom yok. */
function SectionCard({
  title,
  summary,
  children,
}: {
  title: string;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold leading-tight text-slate-900">{title}</h2>
      <p className="mt-3 leading-7 text-slate-700">{summary}</p>
      <details className="mt-4 group">
        <summary className="cursor-pointer list-none select-none text-sm font-medium text-brand-600 hover:text-brand-700 [&::-webkit-details-marker]:hidden">
          Detayı göster
        </summary>
        <div className="mt-3 border-t border-slate-100 pt-4 prose prose-lg max-w-none leading-7 text-slate-700">
          {children}
        </div>
      </details>
    </section>
  );
}

function RenderApplyGuide({ m }: { m: ApplyGuideModule }) {
  return (
    <SectionCard title={MODULE_TITLES.apply_guide} summary={m.summary}>
      {m.details_md ? (
        <div className="whitespace-pre-wrap">{m.details_md}</div>
      ) : (
        <ol className="list-decimal space-y-2 pl-5">
          {m.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      )}
    </SectionCard>
  );
}

function RenderDocuments({ m }: { m: DocumentsModule }) {
  return (
    <SectionCard
      title={MODULE_TITLES.documents}
      summary={
        m.required.length > 0
          ? `Zorunlu: ${m.required.length} belge. ${m.optional.length > 0 ? `Olası: ${m.optional.length} belge.` : ""}`
          : m.optional.length > 0
            ? `İlanda yazmıyorsa olası belgeler (sektör/pozisyon/ülkeye göre): ${m.optional.length} adet.`
            : "Belge listesi ilan/kurallara göre derlendi."
      }
    >
      {m.required.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Zorunlu (ilandan)</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {m.required.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}
      {m.optional.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-700">
            Olası (ilanda yazmıyorsa mantıklı ihtimal)
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {m.optional.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </div>
      )}
      {m.notes && m.notes.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-slate-600">
          {m.notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function RenderWorkPermitVisa({ m }: { m: WorkPermitVisaModule }) {
  return (
    <SectionCard title={MODULE_TITLES.work_permit_visa} summary={m.summary}>
      <ol className="list-decimal space-y-2 pl-5">
        {m.steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      {m.official_sources && m.official_sources.length > 0 && (
        <p className="mt-4 text-sm text-slate-600">
          <span className="font-medium">Resmi kaynaklar:</span> {m.official_sources.join(", ")}
        </p>
      )}
      {m.note_if_no_official && (
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {m.note_if_no_official}
        </p>
      )}
    </SectionCard>
  );
}

function RenderSalaryLife({ m }: { m: SalaryLifeCalcModule }) {
  return (
    <SectionCard title={MODULE_TITLES.salary_life_calc} summary={m.summary}>
      {m.assumptions && m.assumptions.length > 0 && (
        <ul className="list-disc space-y-1 pl-5">
          {m.assumptions.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      )}
      {m.ranges && m.ranges.length > 0 && (
        <ul className="mt-3 space-y-1">
          {m.ranges.map((r, i) => (
            <li key={i}>
              <span className="font-medium">{r.label}:</span> {r.range}
            </li>
          ))}
        </ul>
      )}
      {m.note_if_unknown && (
        <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          {m.note_if_unknown}
        </p>
      )}
    </SectionCard>
  );
}

function RenderRisk({ m }: { m: RiskAssessmentModule }) {
  return (
    <SectionCard
      title={MODULE_TITLES.risk_assessment}
      summary={`Risk seviyesi: ${m.level}. ${m.items.length} madde.`}
    >
      <p className="font-medium text-slate-700">{m.level}</p>
      <ul className="mt-3 space-y-4">
        {m.items.map((item, i) => (
          <li key={i} className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
            <span className="font-semibold text-slate-800">{item.title}</span>
            <p className="mt-1 text-sm text-slate-600">{item.why}</p>
            <p className="mt-1 text-sm font-medium text-slate-700">{item.what_to_do}</p>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

function RenderFitAnalysis({ m }: { m: FitAnalysisModule }) {
  return (
    <SectionCard
      title={MODULE_TITLES.fit_analysis}
      summary={
        m.score0_100 != null
          ? `Uygunluk skoru: %${m.score0_100}. Güçlü yönler: ${m.strengths.length}, Eksikler: ${m.gaps.length}.`
          : `Güçlü yönler: ${m.strengths.length}, Eksikler: ${m.gaps.length}, Sonraki adımlar: ${m.next_actions.length}.`
      }
    >
      {m.score0_100 != null && (
        <p className="text-lg font-bold text-brand-600">Skor: %{m.score0_100}</p>
      )}
      <div className="mt-3">
        <h3 className="text-sm font-semibold text-slate-600">Güçlü yönler</h3>
        <ul className="list-disc space-y-1 pl-5">{m.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
      </div>
      <div className="mt-3">
        <h3 className="text-sm font-semibold text-slate-600">Eksikler / dikkat</h3>
        <ul className="list-disc space-y-1 pl-5">{m.gaps.map((g, i) => <li key={i}>{g}</li>)}</ul>
      </div>
      <div className="mt-3">
        <h3 className="text-sm font-semibold text-slate-600">Sonraki adımlar</h3>
        <ul className="list-disc space-y-1 pl-5">{m.next_actions.map((a, i) => <li key={i}>{a}</li>)}</ul>
      </div>
    </SectionCard>
  );
}

function RenderOneWeekPlan({ m }: { m: OneWeekPlanModule }) {
  const days = Object.entries(m.days);
  const summary = `${days.length} günlük plan.`;
  return (
    <SectionCard title={MODULE_TITLES.one_week_plan} summary={summary}>
      <ul className="space-y-4">
        {days.map(([dayName, tasks]) => (
          <li key={dayName} className="rounded-lg border border-slate-100 p-3">
            <span className="font-semibold text-slate-800">{dayName}</span>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {tasks.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

export type JobGuideModalProps = {
  open: boolean;
  onClose: () => void;
  guideJson: GuideReadingJson | null;
  /** İlan sayfası URL (footer "İlanı Aç" için). */
  sourceUrl?: string | null;
};

export function JobGuideModal({ open, onClose, guideJson, sourceUrl }: JobGuideModalProps) {
  const bodyRef = useRef<HTMLDivElement>(null);

  const copyFullText = useCallback(() => {
    if (!bodyRef.current || !guideJson) return;
    const text = bodyRef.current.innerText;
    void navigator.clipboard.writeText(text).then(() => {
      // Opsiyonel: kısa bildirim
    });
  }, [guideJson]);

  if (!open) return null;

  const meta = guideJson?.meta;
  const modules = guideJson?.modules;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Rehber okuma"
    >
      <div
        className="w-full max-w-4xl rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header: başlık + konum + kaynak */}
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur px-6 py-4 shrink-0">
          <h1 className="text-xl font-bold leading-tight text-slate-900">
            {meta?.title ?? "Rehber"}
          </h1>
          {(meta?.location || meta?.country) && (
            <p className="mt-1 text-sm text-slate-600">
              {[meta.location, meta?.country].filter(Boolean).join(", ")}
            </p>
          )}
          {meta?.source_name && (
            <span className="mt-2 inline-block rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              {meta.source_name}
            </span>
          )}
        </header>

        {/* Body: okuma alanı, max-w-[72ch], scroll sadece burada */}
        <div
          ref={bodyRef}
          className="max-h-[78vh] overflow-y-auto px-6 py-6 shrink min-h-0"
        >
          <div className="mx-auto w-full max-w-[72ch] space-y-4">
            {!modules && (
              <p className="leading-7 text-slate-600">Rehber içeriği yüklenmedi.</p>
            )}
            {modules?.apply_guide && <RenderApplyGuide m={modules.apply_guide} />}
            {modules?.documents && <RenderDocuments m={modules.documents} />}
            {modules?.work_permit_visa && <RenderWorkPermitVisa m={modules.work_permit_visa} />}
            {modules?.salary_life_calc && <RenderSalaryLife m={modules.salary_life_calc} />}
            {modules?.risk_assessment && <RenderRisk m={modules.risk_assessment} />}
            {modules?.fit_analysis && <RenderFitAnalysis m={modules.fit_analysis} />}
            {modules?.one_week_plan && <RenderOneWeekPlan m={modules.one_week_plan} />}
          </div>
        </div>

        {/* Sticky footer */}
        <footer className="sticky bottom-0 z-10 border-t border-slate-200 bg-white/90 backdrop-blur px-6 py-4 flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={copyFullText}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Metni Kopyala
          </button>
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              İlanı Aç
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            Kapat
          </button>
        </footer>
      </div>
    </div>
  );
}
