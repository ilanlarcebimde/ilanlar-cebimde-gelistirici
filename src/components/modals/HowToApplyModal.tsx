"use client";

import { X } from "lucide-react";

export type HowToApplyWebhookResponse = {
  step_by_step?: string[];
  required_documents?: string[];
  work_permit_and_visa?: string[];
  net_salary_and_costs?: {
    assumptions?: unknown;
    estimate_table?: unknown;
    notes?: string | string[];
  };
  risk_assessment?: {
    risks?: unknown;
    red_flags?: unknown;
  };
  personal_eligibility?: {
    questions?: unknown;
    rules_of_thumb?: unknown;
    next_best_actions?: unknown;
  };
  plan_30_days?: {
    week1?: unknown;
    week2?: unknown;
    week3?: unknown;
    week4?: unknown;
  };
  cta?: { label?: string; url?: string };
};

function renderBlock(value: unknown): React.ReactNode {
  if (value == null) return null;
  if (Array.isArray(value)) {
    return (
      <ul className="list-disc list-inside space-y-1 text-slate-600">
        {value.map((item, i) => (
          <li key={i}>{typeof item === "string" ? item : JSON.stringify(item)}</li>
        ))}
      </ul>
    );
  }
  if (typeof value === "object") {
    return (
      <pre className="overflow-x-auto rounded-lg bg-slate-50 p-3 text-sm text-slate-700 whitespace-pre-wrap">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }
  return <span className="text-slate-600">{String(value)}</span>;
}

const SECTION_TITLES: Record<string, string> = {
  step_by_step: "Adım adım başvuru",
  required_documents: "Gerekli belgeler",
  work_permit_and_visa: "Çalışma izni ve vize",
  net_salary_and_costs: "Net maaş ve maliyetler",
  risk_assessment: "Risk değerlendirmesi",
  personal_eligibility: "Kişisel uygunluk",
  plan_30_days: "30 günlük plan",
};

export function HowToApplyModal({
  open,
  onClose,
  loading,
  data,
  jobSourceUrl,
}: {
  open: boolean;
  onClose: () => void;
  loading?: boolean;
  data?: HowToApplyWebhookResponse | null;
  /** Fallback URL for "İlana Git" when cta.url is missing */
  jobSourceUrl?: string | null;
}) {
  if (!open) return null;

  const ctaLabel = data?.cta?.label ?? "İlana Git";
  const ctaUrl = data?.cta?.url ?? jobSourceUrl ?? null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        aria-hidden
        onClick={onClose}
      />
      <div
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-xl"
        role="dialog"
        aria-modal
        aria-labelledby="howto-title"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6">
          <h2 id="howto-title" className="text-lg font-bold text-slate-900">
            Nasıl Başvururum?
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
              <p className="mt-3 text-sm text-slate-600">Rehber hazırlanıyor…</p>
            </div>
          )}

          {!loading && data && (
            <div className="space-y-6">
              {data.step_by_step != null && data.step_by_step.length > 0 && (
                <section>
                  <h3 className="text-base font-bold text-slate-900">
                    {SECTION_TITLES.step_by_step}
                  </h3>
                  <div className="mt-2">{renderBlock(data.step_by_step)}</div>
                </section>
              )}

              {data.required_documents != null && data.required_documents.length > 0 && (
                <section>
                  <h3 className="text-base font-bold text-slate-900">
                    {SECTION_TITLES.required_documents}
                  </h3>
                  <div className="mt-2">{renderBlock(data.required_documents)}</div>
                </section>
              )}

              {data.work_permit_and_visa != null && data.work_permit_and_visa.length > 0 && (
                <section>
                  <h3 className="text-base font-bold text-slate-900">
                    {SECTION_TITLES.work_permit_and_visa}
                  </h3>
                  <div className="mt-2">{renderBlock(data.work_permit_and_visa)}</div>
                </section>
              )}

              {data.net_salary_and_costs != null && (
                <section>
                  <h3 className="text-base font-bold text-slate-900">
                    {SECTION_TITLES.net_salary_and_costs}
                  </h3>
                  <div className="mt-2 space-y-2">
                    {Object.entries(data.net_salary_and_costs).map(([k, v]) => (
                      <div key={k}>
                        <span className="text-sm font-medium text-slate-700 capitalize">
                          {k.replace(/_/g, " ")}:
                        </span>{" "}
                        <div className="mt-1">{renderBlock(v)}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {data.risk_assessment != null && (
                <section>
                  <h3 className="text-base font-bold text-slate-900">
                    {SECTION_TITLES.risk_assessment}
                  </h3>
                  <div className="mt-2 space-y-2">
                    {Object.entries(data.risk_assessment).map(([k, v]) => (
                      <div key={k}>
                        <span className="text-sm font-medium text-slate-700 capitalize">
                          {k.replace(/_/g, " ")}:
                        </span>{" "}
                        <div className="mt-1">{renderBlock(v)}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {data.personal_eligibility != null && (
                <section>
                  <h3 className="text-base font-bold text-slate-900">
                    {SECTION_TITLES.personal_eligibility}
                  </h3>
                  <div className="mt-2 space-y-2">
                    {Object.entries(data.personal_eligibility).map(([k, v]) => (
                      <div key={k}>
                        <span className="text-sm font-medium text-slate-700 capitalize">
                          {k.replace(/_/g, " ")}:
                        </span>{" "}
                        <div className="mt-1">{renderBlock(v)}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {data.plan_30_days != null && (
                <section>
                  <h3 className="text-base font-bold text-slate-900">
                    {SECTION_TITLES.plan_30_days}
                  </h3>
                  <div className="mt-2 space-y-2">
                    {Object.entries(data.plan_30_days).map(([k, v]) => (
                      <div key={k}>
                        <span className="text-sm font-medium text-slate-700 capitalize">
                          {k.replace(/_/g, " ")}:
                        </span>{" "}
                        <div className="mt-1">{renderBlock(v)}</div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {Object.keys(data).filter((k) => !["cta"].includes(k)).length === 0 && (
                <p className="text-slate-500">Rehber içeriği henüz dönmedi.</p>
              )}
            </div>
          )}

          {!loading && !data && (
            <p className="py-8 text-center text-slate-500">Veri yok.</p>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-200 px-4 py-3 sm:px-6">
          {ctaUrl ? (
            <a
              href={ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              {ctaLabel}
            </a>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Kapat
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
